# Cloudflare Pages + GitHub + Cloudinary + Windows Word worker

## Deployment design

- `public/`: static website deployed to Cloudflare Pages from GitHub.
- `functions/api/`: Cloudflare Pages Functions proxy requests to your Windows report worker.
- `worker/app.py`: runs on the Windows PC where Microsoft Word is installed; downloads `.doc` templates from Cloudinary, updates them, converts to PDFs, merges PDFs per building, and uploads results to Cloudinary.

**Cloudflare cannot run Windows COM or Microsoft Word.** The Windows worker must stay online whenever you want to generate reports. It must be reachable from Cloudflare through a secure HTTPS tunnel or a secure hosting/network setup. Do not expose Flask's port directly to the public internet.

## 1. Push this project to GitHub

Extract this ZIP. Create a new GitHub repository, then from PowerShell in the extracted folder run:

```powershell
git init
git add .
git commit -m "Initial Cloudflare Pages report website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Do not add real Cloudinary credentials or a real `.env` file to GitHub. `.env.example` contains placeholders only.

## 2. Deploy the website to Cloudflare Pages

1. Open Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
2. Choose the GitHub repository and branch `main`.
3. Build settings:
   - Framework preset: None
   - Build command: leave blank (or `exit 0` if the dashboard requires one)
   - Build output directory: `public`
   - Root directory: `/`
4. Deploy. Cloudflare Pages will host the frontend and `functions/api/*` routes. Git pushes to the production branch trigger deployments. Official docs: https://developers.cloudflare.com/pages/configuration/git-integration/

## 3. Configure Cloudflare Pages variables/secrets

In your Pages project, open Settings → Variables and Secrets (wording may vary), and add:

- `REPORT_WORKER_URL`: base HTTPS URL of the secure tunnel to the Windows worker, with no trailing slash. Example format: `https://your-private-worker-host.example.com`
- `REPORT_WORKER_TOKEN`: a long random secret string. Use the same value in the Windows worker `.env`.

Mark `REPORT_WORKER_TOKEN` as a secret. Never put this token in `public/static/script.js` or HTML.

## 4. Configure the Windows worker

On the Windows PC with Microsoft Word installed:

1. Copy `worker/.env.example` to `worker/.env`.
2. Enter Cloudinary credentials and the parent folder that directly contains your three building folders.
3. Set `REPORT_WORKER_TOKEN` to the same long random secret configured in Cloudflare.
4. Install Python 3.11/3.12 64-bit.
5. Open PowerShell in the `worker` directory and run:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

The Flask worker binds to `127.0.0.1:5000` by default. That is intentional. To connect Cloudflare to it, use a secure tunnel (for example, Cloudflare Tunnel) configured to route only to `http://127.0.0.1:5000`. Configure access/network restrictions appropriate for your environment. Do not create an unrestricted public tunnel to an unauthenticated worker. The bearer token is checked by the worker's `/api/buildings` and `/api/generate` endpoints.

Keep the Windows PC awake and the worker running when reports need to be generated. For a stable deployment, configure the worker to start as a Windows service and set up tunnel startup.

## 5. Cloudinary folder layout

Expected structure:

```text
<root-folder>/
  Building-A/
    report-1.doc
    report-2.doc
  Building-B/
    report-1.doc
    report-2.doc
  Building-C/
    report-1.doc
    report-2.doc
```

Building names are discovered from the immediate child folders under `CLOUDINARY_ROOT_FOLDER`. The code currently lists Cloudinary `raw` assets and expects legacy `.doc` files. If files are uploaded under a different Cloudinary resource type or are `.docx`, the listing/processing code must be adjusted.

Generated Word files and merged PDFs are uploaded under:
`CLOUDINARY_OUTPUT_FOLDER/<building>/<YYYY-MM>/`

## 6. Test safely

- First run with one building and a month you can validate.
- Compare generated DOC/PDF against a known-good manual report.
- The day-column deletion assumes the template has exact day-number header cells; merged cells or different table layouts may require adjustments.
- The current endpoint runs synchronously and is designed for a small set of 3–4 docs per building. A production version should use background jobs and status polling if Word conversion can exceed Cloudflare request time limits.
- The Cloudflare Pages frontend and proxy do not contain Cloudinary credentials.
