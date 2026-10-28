const form = document.getElementById("report-form");
const yearInput = document.getElementById("year");
const monthInput = document.getElementById("month");
const generateButton = document.getElementById("generate-btn");
const activityLog = document.getElementById("activity-log");
const activityCaption = document.getElementById("activity-caption");
const buildingList = document.getElementById("building-list");
let buildings = [];

function updateMonthSummary() {
  const year = Number(yearInput.value), month = Number(monthInput.value);
  if (!year || !month || month < 1 || month > 12) return;
  const days = new Date(year, month, 0).getDate();
  const name = new Intl.DateTimeFormat("en", { month: "long" }).format(new Date(year, month - 1, 1));
  document.getElementById("month-summary").textContent = `${name} ${year} · ${days} days`;
}
function addLog(message, type = "") {
  const empty = activityLog.querySelector(".empty-state");
  if (empty) empty.remove();
  const line = document.createElement("div"); line.className = `log-line ${type}`;
  const time = document.createElement("span"); time.className = "log-time"; time.textContent = new Date().toLocaleTimeString();
  const text = document.createElement("span"); text.textContent = message;
  line.append(time, text); activityLog.appendChild(line); activityLog.scrollTop = activityLog.scrollHeight;
}
function renderBuildings(items) {
  buildings = items;
  document.getElementById("building-count").textContent = `${items.length} folder${items.length === 1 ? "" : "s"} found`;
  if (!items.length) {
    buildingList.innerHTML = '<div class="loading-card">No building folders found. Check CLOUDINARY_ROOT_FOLDER in your .env file.</div>';
    return;
  }
  buildingList.replaceChildren();
  items.forEach((item, index) => {
    const label = document.createElement("label"); label.className = "building-card";
    const input = document.createElement("input"); input.type = "checkbox"; input.name = "building"; input.value = item.id; input.checked = true;
    const copy = document.createElement("div");
    const strong = document.createElement("strong"); strong.textContent = item.name;
    const small = document.createElement("small"); small.textContent = `${item.template_count} Word template(s)`;
    copy.append(strong, small); label.append(input, copy); buildingList.append(label);
  });
}
async function loadBuildings() {
  try {
    const response = await fetch("/api/buildings");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    renderBuildings(data.buildings || []);
    document.getElementById("connection-status").textContent = "Backend connected";
    if (data.root_folder) addLog(`Loaded Cloudinary folders from "${data.root_folder}".`);
  } catch (error) {
    document.getElementById("connection-status").textContent = "Backend unavailable";
    buildingList.innerHTML = '<div class="loading-card">Cannot load folders. Start the Python backend and check your Cloudinary configuration.</div>';
    addLog(error.message, "error");
  }
}
yearInput.addEventListener("input", updateMonthSummary);
monthInput.addEventListener("change", updateMonthSummary);
document.getElementById("select-all").addEventListener("click", () => buildingList.querySelectorAll('input[name="building"]').forEach(el => el.checked = true));
document.getElementById("select-none").addEventListener("click", () => buildingList.querySelectorAll('input[name="building"]').forEach(el => el.checked = false));
document.getElementById("clear-log").addEventListener("click", () => {
  activityLog.innerHTML = '<div class="empty-state"><div class="empty-icon">⌁</div><strong>Waiting for your first run</strong><p>Backend health and report generation messages will appear here.</p></div>';
  activityCaption.textContent = "No run started yet.";
});
form.addEventListener("submit", async event => {
  event.preventDefault();
  const year = Number(yearInput.value), month = Number(monthInput.value);
  const selected = [...buildingList.querySelectorAll('input[name="building"]:checked')].map(el => el.value);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return addLog("Enter a year between 2000 and 2100.", "error");
  if (!selected.length) return addLog("Select at least one building folder.", "error");
  generateButton.disabled = true; generateButton.innerHTML = "<span>…</span> Processing";
  activityCaption.textContent = "Report generation running…";
  addLog(`Started ${year}-${String(month).padStart(2, "0")} for ${selected.length} building folder(s).`);
  try {
    const response = await fetch("/api/generate", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({year,month,building_ids:selected})});
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Server returned HTTP ${response.status}`);
    (data.logs || []).forEach(line => addLog(line));
    addLog(data.message || "Report generation finished.", "success");
    activityCaption.textContent = `Completed: ${data.results?.length ?? 0} building folder(s)`;
    if (Array.isArray(data.results)) data.results.forEach(result => addLog(`${result.building}: ${result.pdf_file || "No merged PDF"} (${result.documents_processed} documents)`, "success"));
  } catch (error) {
    addLog(error.message, "error"); activityCaption.textContent = "Generation failed.";
  } finally {
    generateButton.disabled = false; generateButton.innerHTML = "<span>▶</span> Generate reports";
    await loadBuildings();
  }
});
updateMonthSummary();
loadBuildings();
