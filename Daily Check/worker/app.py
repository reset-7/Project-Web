"""
Windows Flask backend for Cloudinary-hosted Word templates.

Expected Cloudinary layout:
  <CLOUDINARY_ROOT_FOLDER>/<Building A>/*.doc
  <CLOUDINARY_ROOT_FOLDER>/<Building B>/*.doc
  <CLOUDINARY_ROOT_FOLDER>/<Building C>/*.doc

Use the Cloudinary *folder prefix* (asset_folder/public_id prefix), not a URL.
This backend expects legacy .doc files because the original automation uses Word
COM and .doc templates. It downloads each asset temporarily, processes it with
Microsoft Word, exports PDFs, merges PDFs per building, then uploads outputs back
to Cloudinary under CLOUDINARY_OUTPUT_FOLDER/<building>/<year-month>/.
"""
import calendar
import io
import os
import re
import shutil
import tempfile
import traceback
from pathlib import Path

import cloudinary
import cloudinary.api
import cloudinary.uploader
import pythoncom
import win32com.client as win32
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template
from flask import request
from functools import wraps
import hmac
from pypdf import PdfWriter

load_dotenv()
app = Flask(__name__)

THAI_MONTHS = {
    1: "มกราคม", 2: "กุมภาพันธ์", 3: "มีนาคม", 4: "เมษายน",
    5: "พฤษภาคม", 6: "มิถุนายน", 7: "กรกฎาคม", 8: "สิงหาคม",
    9: "กันยายน", 10: "ตุลาคม", 11: "พฤศจิกายน", 12: "ธันวาคม",
}
ROOT_FOLDER = os.getenv("CLOUDINARY_ROOT_FOLDER", "").strip().strip("/")
OUTPUT_FOLDER = os.getenv("CLOUDINARY_OUTPUT_FOLDER", "pump-checkup-output").strip().strip("/")
CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
API_KEY = os.getenv("CLOUDINARY_API_KEY", "").strip()
API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "").strip()
MAX_DOCS_PER_BUILDING = int(os.getenv("MAX_DOCS_PER_BUILDING", "30"))
WORKER_TOKEN = os.getenv("REPORT_WORKER_TOKEN", "").strip()

if CLOUD_NAME and API_KEY and API_SECRET:
    cloudinary.config(cloud_name=CLOUD_NAME, api_key=API_KEY, api_secret=API_SECRET, secure=True)


def config_ready():
    return bool(CLOUD_NAME and API_KEY and API_SECRET and ROOT_FOLDER)


def safe_name(value):
    value = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", str(value))
    return value.strip(" .") or "building"


def resource_folder(resource):
    # Cloudinary Admin API may expose asset_folder (newer accounts) or derive
    # a folder prefix from public_id (older folder organization).
    if resource.get("asset_folder"):
        return resource["asset_folder"].strip("/")
    public_id = resource.get("public_id", "")
    return public_id.rsplit("/", 1)[0] if "/" in public_id else ""


def list_all_raw_resources():
    """List raw assets using the Cloudinary Admin API, paginating safely."""
    resources = []
    next_cursor = None
    while True:
        kwargs = {"resource_type": "raw", "type": "upload", "max_results": 500}
        if next_cursor:
            kwargs["next_cursor"] = next_cursor
        result = cloudinary.api.resources(**kwargs)
        resources.extend(result.get("resources", []))
        next_cursor = result.get("next_cursor")
        if not next_cursor:
            break
    return resources


def discover_buildings():
    if not config_ready():
        raise RuntimeError("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, API key, API secret, and CLOUDINARY_ROOT_FOLDER in .env.")
    assets = list_all_raw_resources()
    # A folder is a direct child of the configured root and contains .doc files.
    by_building = {}
    root_prefix = ROOT_FOLDER + "/"
    for asset in assets:
        public_id = asset.get("public_id", "")
        fmt = (asset.get("format") or Path(public_id).suffix.lstrip(".")).lower()
        if fmt != "doc" and not public_id.lower().endswith(".doc"):
            continue
        folder = resource_folder(asset)
        if not folder.startswith(root_prefix):
            continue
        remainder = folder[len(root_prefix):]
        if not remainder or "/" in remainder:
            continue
        building_id = remainder
        by_building.setdefault(building_id, []).append(asset)
    return [
        {"id": name, "name": name, "template_count": len(items)}
        for name, items in sorted(by_building.items(), key=lambda item: item[0].lower())
    ]


def replace_all(word, old, new):
    # Word Find.ReplaceAll can search main story only. Search all story ranges too,
    # including headers and footers, to better match templates.
    doc = word.ActiveDocument
    for story in doc.StoryRanges:
        current = story
        while current is not None:
            find = current.Find
            find.ClearFormatting()
            find.Replacement.ClearFormatting()
            find.Text = old
            find.Replacement.Text = new
            find.Forward = True
            find.Wrap = 1  # wdFindContinue
            find.Execute(Replace=2)  # wdReplaceAll
            try:
                current = current.NextStoryRange
            except Exception:
                current = None


def cell_text(cell):
    return cell.Range.Text.replace("\r", "").replace("\x07", "").strip()


def remove_extra_day_columns(doc, days_in_month, logs):
    if days_in_month >= 31:
        return
    word = doc.Application
    # The template is expected to have day numbers in a header row. Search tables
    # from rightmost invalid day down, then delete the corresponding table column.
    for day in range(31, days_in_month, -1):
        deleted = False
        for table in doc.Tables:
            try:
                for cell in table.Range.Cells:
                    if cell_text(cell) != str(day):
                        continue
                    cell.Select()
                    word.Selection.Columns.Delete()
                    logs.append(f"Removed day {day} column.")
                    deleted = True
                    break
            except Exception:
                continue
            if deleted:
                break
        if not deleted:
            logs.append(f"Warning: could not find header cell for day {day}.")


def download_asset(asset, destination):
    url = asset.get("secure_url") or asset.get("url")
    if not url:
        raise RuntimeError(f"No download URL for Cloudinary asset {asset.get('public_id')}")
    # requests follows the signed/authenticated URL returned by Cloudinary Admin API.
    import requests
    response = requests.get(url, timeout=90)
    response.raise_for_status()
    destination.write_bytes(response.content)


def upload_output(path, public_id):
    # Outputs are stored as raw files. Cloudinary public IDs should not include
    # local filesystem paths; use stable foldered IDs.
    return cloudinary.uploader.upload(
        str(path),
        resource_type="raw",
        type="upload",
        public_id=public_id,
        overwrite=True,
        use_filename=False,
        unique_filename=False,
        folder=None,
    )


def process_building(word, building, year, month, temp_root, logs):
    month_name = THAI_MONTHS[month]
    thai_year = year + 543
    days_in_month = calendar.monthrange(year, month)[1]
    sundays = {
        day for day in range(1, days_in_month + 1)
        if calendar.weekday(year, month, day) == 6
    }

    # Match assets by folder. Use Admin API results so asset_folder and public_id
    # differences are handled consistently.
    root_prefix = ROOT_FOLDER + "/" + building + "/"
    assets = [
        asset for asset in list_all_raw_resources()
        if resource_folder(asset).startswith(root_prefix)
        and (asset.get("format", "").lower() == "doc" or asset.get("public_id", "").lower().endswith(".doc"))
    ]
    assets.sort(key=lambda a: a.get("public_id", "").lower())
    if not assets:
        logs.append(f"{building}: no .doc templates found.")
        return {"building": building, "documents_processed": 0, "pdf_file": None, "uploaded": []}
    if len(assets) > MAX_DOCS_PER_BUILDING:
        raise RuntimeError(f"{building} contains {len(assets)} .doc files, exceeding MAX_DOCS_PER_BUILDING={MAX_DOCS_PER_BUILDING}.")

    work_dir = Path(temp_root) / safe_name(building)
    word_dir = work_dir / "word"
    pdf_dir = work_dir / "pdf"
    word_dir.mkdir(parents=True, exist_ok=True)
    pdf_dir.mkdir(parents=True, exist_ok=True)
    generated_docs, generated_pdfs, uploaded = [], [], []
    logs.append(f"{building}: found {len(assets)} Word template(s).")

    for index, asset in enumerate(assets, start=1):
        original_name = asset.get("original_filename") or asset.get("public_id", "").split("/")[-1]
        original_name = Path(original_name).name
        if not original_name.lower().endswith(".doc"):
            original_name += ".doc"
        local_input = work_dir / f"source_{index}_{safe_name(original_name)}"
        download_asset(asset, local_input)
        local_output = word_dir / original_name
        shutil.copy2(local_input, local_output)
        logs.append(f"{building}: processing {original_name} ({index}/{len(assets)}).")

        doc = None
        try:
            doc = word.Documents.Open(str(local_output.resolve()), ReadOnly=False, AddToRecentFiles=False)
            doc.Activate()
            replace_all(word, "{month}", month_name)
            replace_all(word, "{year}", str(thai_year))
            remove_extra_day_columns(doc, days_in_month, logs)
            for day in range(1, days_in_month + 1):
                replace_all(word, f"{{{day}}}", "-" if day in sundays else "")
            doc.Save()
            pdf_path = pdf_dir / f"{Path(original_name).stem}.pdf"
            doc.SaveAs(str(pdf_path.resolve()), FileFormat=17)  # wdFormatPDF
            generated_docs.append(local_output)
            generated_pdfs.append(pdf_path)
        finally:
            if doc is not None:
                doc.Close(False)

    # Merge this building's PDFs into one final PDF.
    final_pdf = pdf_dir / f"{safe_name(building)}_{year}_{month:02d}.pdf"
    writer = PdfWriter()
    for pdf in generated_pdfs:
        writer.append(str(pdf))
    with final_pdf.open("wb") as handle:
        writer.write(handle)
    writer.close()

    cloudinary_month_folder = f"{OUTPUT_FOLDER}/{safe_name(building)}/{year}-{month:02d}"
    for doc_path in generated_docs:
        public_id = f"{cloudinary_month_folder}/word/{doc_path.name}"
        upload_output(doc_path, public_id)
        uploaded.append(public_id)
    final_public_id = f"{cloudinary_month_folder}/{final_pdf.name}"
    upload_output(final_pdf, final_public_id)
    uploaded.append(final_public_id)
    logs.append(f"{building}: uploaded {len(generated_docs)} processed DOC file(s) and merged PDF.")
    return {
        "building": building,
        "documents_processed": len(generated_docs),
        "pdf_file": final_public_id,
        "uploaded": uploaded,
    }


def require_worker_token(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not WORKER_TOKEN:
            return jsonify({"error": "REPORT_WORKER_TOKEN is not configured on the Windows worker."}), 503
        supplied = request.headers.get("Authorization", "")
        expected = "Bearer " + WORKER_TOKEN
        if not hmac.compare_digest(supplied, expected):
            return jsonify({"error": "Unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapped


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/api/health")
def health():
    return jsonify({"ok": True, "cloudinary_configured": config_ready()})


@app.get("/api/buildings")
@require_worker_token
def api_buildings():
    try:
        buildings = discover_buildings()
        return jsonify({"buildings": buildings, "root_folder": ROOT_FOLDER})
    except Exception as exc:
        app.logger.exception("Could not list Cloudinary building folders")
        return jsonify({"error": str(exc)}), 500


@app.post("/api/generate")
@require_worker_token
def api_generate():
    body = request.get_json(silent=True) or {}
    try:
        year = int(body.get("year"))
        month = int(body.get("month"))
        selected = body.get("building_ids") or []
        if year < 2000 or year > 2100:
            return jsonify({"error": "Year must be between 2000 and 2100."}), 400
        if month < 1 or month > 12:
            return jsonify({"error": "Month must be between 1 and 12."}), 400
        if not isinstance(selected, list) or not selected:
            return jsonify({"error": "Select at least one building."}), 400
        known = {item["id"] for item in discover_buildings()}
        if any(not isinstance(item, str) or item not in known for item in selected):
            return jsonify({"error": "One or more selected building folders are invalid. Refresh and try again."}), 400

        logs, results = [], []
        pythoncom.CoInitialize()
        word = None
        try:
            word = win32.DispatchEx("Word.Application")
            word.Visible = False
            word.DisplayAlerts = 0
            with tempfile.TemporaryDirectory(prefix="pump_report_") as temp_root:
                for building in selected:
                    logs.append(f"Starting building: {building}")
                    results.append(process_building(word, building, year, month, temp_root, logs))
        finally:
            if word is not None:
                word.Quit()
            pythoncom.CoUninitialize()
        return jsonify({
            "message": f"Finished processing {len(results)} building folder(s).",
            "logs": logs,
            "results": results,
        })
    except Exception as exc:
        app.logger.exception("Report generation failed")
        return jsonify({"error": str(exc), "trace": traceback.format_exc() if app.debug else None}), 500


if __name__ == "__main__":
    # Run on localhost by default; do not expose this Word automation server publicly.
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5000")), debug=False)
