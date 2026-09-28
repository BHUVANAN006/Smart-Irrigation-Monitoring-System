import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth,
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  remove,
  query,
  orderByChild,
  startAt,
  endAt
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-database.js";
import { firebaseConfig, DEVICE_ID, GOOGLE_SHEET_URL } from "./firebase-config.js";

const plantProfiles = [
  { id: "rice", name: "Rice", min: 75, max: 90, need: "Very high", category: "Cereal" },
  { id: "banana", name: "Banana", min: 65, max: 80, need: "High", category: "Fruit" },
  { id: "sugarcane", name: "Sugarcane", min: 60, max: 75, need: "High", category: "Commercial crop" },
  { id: "taro", name: "Taro / Colocasia", min: 70, max: 85, need: "High", category: "Tuber" },
  { id: "tomato", name: "Tomato", min: 50, max: 65, need: "Medium-high", category: "Vegetable" },
  { id: "brinjal", name: "Brinjal / Eggplant", min: 50, max: 65, need: "Medium", category: "Vegetable" },
  { id: "chilli", name: "Chilli", min: 45, max: 60, need: "Medium", category: "Vegetable" },
  { id: "cucumber", name: "Cucumber", min: 55, max: 70, need: "Medium-high", category: "Vegetable" },
  { id: "okra", name: "Okra / Ladies Finger", min: 45, max: 60, need: "Medium", category: "Vegetable" },
  { id: "cabbage", name: "Cabbage", min: 55, max: 70, need: "Medium-high", category: "Leafy vegetable" },
  { id: "cauliflower", name: "Cauliflower", min: 55, max: 70, need: "Medium-high", category: "Vegetable" },
  { id: "potato", name: "Potato", min: 50, max: 65, need: "Medium", category: "Tuber" },
  { id: "onion", name: "Onion", min: 45, max: 60, need: "Medium", category: "Vegetable" },
  { id: "maize", name: "Maize / Corn", min: 40, max: 55, need: "Medium", category: "Cereal" },
  { id: "groundnut", name: "Groundnut / Peanut", min: 35, max: 50, need: "Medium-low", category: "Oilseed" },
  { id: "cotton", name: "Cotton", min: 30, max: 45, need: "Low", category: "Fibre crop" },
  { id: "sunflower", name: "Sunflower", min: 30, max: 45, need: "Low", category: "Oilseed" },
  { id: "pearl-millet", name: "Pearl Millet / Bajra", min: 25, max: 40, need: "Low", category: "Cereal" },
  { id: "green-gram", name: "Green Gram / Moong", min: 30, max: 45, need: "Low", category: "Pulse" },
  { id: "chickpea", name: "Chickpea / Bengal Gram", min: 25, max: 40, need: "Low", category: "Pulse" }
];

const soilProfiles = [
  { id: "sandy", name: "Sandy Soil", adjustment: 5, retention: "Very low", description: "Drains quickly, so the moisture target is increased." },
  { id: "sandy-loam", name: "Sandy-Loam Soil", adjustment: 3, retention: "Low", description: "Drains faster than loam and needs a slightly higher target." },
  { id: "loamy", name: "Loamy Soil", adjustment: 0, retention: "Balanced", description: "Balanced drainage and water retention; the plant base range is used." },
  { id: "silt-loam", name: "Silt-Loam Soil", adjustment: 1, retention: "Medium-high", description: "Retains moisture well while still allowing moderate drainage." },
  { id: "clay-loam", name: "Clay-Loam Soil", adjustment: -2, retention: "High", description: "Retains water longer, so the target range is reduced slightly." },
  { id: "clay", name: "Clay Soil", adjustment: -4, retention: "Very high", description: "Holds water for a long time; a lower target helps reduce overwatering." },
  { id: "red", name: "Red Soil", adjustment: 3, retention: "Low-medium", description: "Usually has lower water retention, so the target is increased." },
  { id: "black-cotton", name: "Black Cotton Soil", adjustment: -3, retention: "Very high", description: "Stores moisture well and therefore uses a reduced target." },
  { id: "alluvial", name: "Alluvial Soil", adjustment: 0, retention: "Balanced", description: "Generally suitable for irrigation; use the selected plant base range." }
];

const elements = {
  toast: document.getElementById("toast"),
  loginView: document.getElementById("loginView"),
  appView: document.getElementById("appView"),
  loginForm: document.getElementById("loginForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  togglePassword: document.getElementById("togglePassword"),
  loginButton: document.getElementById("loginButton"),
  loginError: document.getElementById("loginError"),
  logoutButton: document.getElementById("logoutButton"),
  userEmail: document.getElementById("userEmail"),
  pageTitle: document.getElementById("pageTitle"),
  navItems: [...document.querySelectorAll(".nav-item")],
  sections: [...document.querySelectorAll(".content-section")],
  jumpProfile: document.querySelector(".jump-profile"),
  soilMoistureValue: document.getElementById("soilMoistureValue"),
  moistureGauge: document.getElementById("moistureGauge"),
  temperatureValue: document.getElementById("temperatureValue"),
  humidityValue: document.getElementById("humidityValue"),
  temperatureState: document.getElementById("temperatureState"),
  humidityState: document.getElementById("humidityState"),
  targetRangeText: document.getElementById("targetRangeText"),
  lastUpdatedText: document.getElementById("lastUpdatedText"),
  pumpStatusDot: document.getElementById("pumpStatusDot"),
  pumpStatusText: document.getElementById("pumpStatusText"),
  pumpReasonText: document.getElementById("pumpReasonText"),
  sidebarStatusDot: document.getElementById("sidebarStatusDot"),
  sidebarDeviceStatus: document.getElementById("sidebarDeviceStatus"),
  sidebarLastSeen: document.getElementById("sidebarLastSeen"),
  topDevicePill: document.getElementById("topDevicePill"),
  topDeviceText: document.getElementById("topDeviceText"),
  activePlantText: document.getElementById("activePlantText"),
  activeSoilText: document.getElementById("activeSoilText"),
  activeMinText: document.getElementById("activeMinText"),
  activeMaxText: document.getElementById("activeMaxText"),
  plantSelect: document.getElementById("plantSelect"),
  soilSelect: document.getElementById("soilSelect"),
  profileForm: document.getElementById("profileForm"),
  confirmProfileButton: document.getElementById("confirmProfileButton"),
  calculatedRangeText: document.getElementById("calculatedRangeText"),
  rangeBarMin: document.getElementById("rangeBarMin"),
  rangeBarMax: document.getElementById("rangeBarMax"),
  profileExplanation: document.getElementById("profileExplanation"),
  plantProfileTableBody: document.getElementById("plantProfileTableBody"),
  historyRangeSelect: document.getElementById("historyRangeSelect"),
  historySearchInput: document.getElementById("historySearchInput"),
  historyTableBody: document.getElementById("historyTableBody"),
  historyCountText: document.getElementById("historyCountText"),
  downloadCsvButton: document.getElementById("downloadCsvButton"),
  downloadExcelButton: document.getElementById("downloadExcelButton"),
  openSheetButton: document.getElementById("openSheetButton"),
  liveChart: document.getElementById("liveChart"),
  chartEmpty: document.getElementById("chartEmpty")
};

const pageTitles = {
  dashboardSection: "Live Dashboard",
  historySection: "Seven-Day History",
  profileSection: "Plant & Soil Profile"
};

let app;
let auth;
let db;
let unsubscribeLive = null;
let unsubscribeConfig = null;
let unsubscribeHistory = null;
let allHistory = [];
let visibleHistory = [];
let liveChartPoints = [];
let latestLive = null;
let activeConfig = null;
let statusTimer = null;
let cleanupTimer = null;

function validateFirebaseConfig() {
  return !Object.values(firebaseConfig).some(value => String(value).includes("YOUR_"));
}

function initialiseFirebase() {
  if (!validateFirebaseConfig()) {
    elements.loginError.hidden = false;
    elements.loginError.textContent = "Firebase is not configured yet. Open firebase-config.js and replace the placeholder values.";
    elements.loginButton.disabled = true;
    return false;
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
  setPersistence(auth, browserLocalPersistence).catch(console.error);
  return true;
}

function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type === "error" ? "error" : ""}`;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    elements.toast.className = "toast";
  }, 3300);
}

function setLoginLoading(isLoading) {
  elements.loginButton.classList.toggle("loading", isLoading);
  elements.loginButton.disabled = isLoading;
}

function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code.includes("invalid-credential")) return "Incorrect email or password.";
  if (code.includes("too-many-requests")) return "Too many attempts. Please wait and try again.";
  if (code.includes("network-request-failed")) return "Network error. Check the internet connection.";
  return error?.message || "Unable to sign in.";
}

function showApp(user) {
  elements.loginView.hidden = true;
  elements.appView.hidden = false;
  elements.userEmail.textContent = user.email || "User";
  startRealtimeListeners();
  cleanupOldHistory();
  clearInterval(cleanupTimer);
  cleanupTimer = setInterval(cleanupOldHistory, 60 * 60 * 1000);
  requestAnimationFrame(() => drawLiveChart());
}

function showLogin() {
  elements.appView.hidden = true;
  elements.loginView.hidden = false;
  stopRealtimeListeners();
  clearInterval(cleanupTimer);
}

function stopRealtimeListeners() {
  if (unsubscribeLive) unsubscribeLive();
  if (unsubscribeConfig) unsubscribeConfig();
  if (unsubscribeHistory) unsubscribeHistory();
  unsubscribeLive = unsubscribeConfig = unsubscribeHistory = null;
  clearInterval(statusTimer);
}

function startRealtimeListeners() {
  stopRealtimeListeners();
  const deviceRoot = `devices/${DEVICE_ID}`;

  unsubscribeLive = onValue(ref(db, `${deviceRoot}/live`), snapshot => {
    const data = snapshot.val();
    latestLive = data;
    renderLiveData(data);
  }, error => showToast(`Live data error: ${error.message}`, "error"));

  unsubscribeConfig = onValue(ref(db, `${deviceRoot}/config`), snapshot => {
    activeConfig = snapshot.val();
    renderActiveConfig(activeConfig);
  }, error => showToast(`Configuration error: ${error.message}`, "error"));

  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const historyQuery = query(
    ref(db, `${deviceRoot}/history`),
    orderByChild("timestamp"),
    startAt(cutoff)
  );

  unsubscribeHistory = onValue(historyQuery, snapshot => {
    const value = snapshot.val() || {};
    allHistory = Object.entries(value)
      .map(([key, record]) => ({ key, ...record }))
      .filter(record => Number.isFinite(Number(record.timestamp)))
      .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    filterAndRenderHistory();
  }, error => showToast(`History error: ${error.message}`, "error"));

  statusTimer = setInterval(updateDeviceStatus, 5000);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function asNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDateTime(timestamp) {
  const time = asNumber(timestamp);
  if (!time) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium"
  }).format(new Date(time));
}

function formatShortTime(timestamp) {
  const time = asNumber(timestamp);
  if (!time) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(time));
}

function renderLiveData(data) {
  if (!data) {
    setMetricValues(null);
    updateDeviceStatus();
    return;
  }

  const moisture = asNumber(data.soilMoisture);
  const temperature = asNumber(data.temperature);
  const humidity = asNumber(data.humidity);
  const timestamp = asNumber(data.timestamp);

  elements.soilMoistureValue.textContent = moisture == null ? "--" : Math.round(moisture);
  elements.temperatureValue.textContent = temperature == null ? "--" : temperature.toFixed(1);
  elements.humidityValue.textContent = humidity == null ? "--" : humidity.toFixed(0);
  elements.lastUpdatedText.textContent = timestamp ? formatDateTime(timestamp) : "—";

  const circumference = 2 * Math.PI * 49;
  const offset = circumference - (clamp(moisture ?? 0, 0, 100) / 100) * circumference;
  elements.moistureGauge.style.strokeDasharray = String(circumference);
  elements.moistureGauge.style.strokeDashoffset = String(offset);

  elements.temperatureState.textContent = data.dhtOk === false ? "Sensor error" : "Live";
  elements.humidityState.textContent = data.dhtOk === false ? "Sensor error" : "Live";

  const pumpOn = Boolean(data.pumpOn);
  elements.pumpStatusDot.className = `pump-dot ${pumpOn ? "on" : "off"}`;
  elements.pumpStatusText.textContent = pumpOn ? "ON" : "OFF";
  elements.pumpReasonText.textContent = data.pumpReason || (pumpOn ? "Low moisture" : "Target reached");

  if (moisture != null && timestamp) {
    const lastPoint = liveChartPoints.at(-1);
    if (!lastPoint || lastPoint.timestamp !== timestamp) {
      liveChartPoints.push({ timestamp, value: moisture });
      if (liveChartPoints.length > 40) liveChartPoints.shift();
      drawLiveChart();
    }
  }

  updateDeviceStatus();
}

function setMetricValues() {
  elements.soilMoistureValue.textContent = "--";
  elements.temperatureValue.textContent = "--";
  elements.humidityValue.textContent = "--";
  elements.lastUpdatedText.textContent = "—";
  elements.moistureGauge.style.strokeDashoffset = "308";
  elements.temperatureState.textContent = "Waiting";
  elements.humidityState.textContent = "Waiting";
  elements.pumpStatusDot.className = "pump-dot off";
  elements.pumpStatusText.textContent = "OFF";
  elements.pumpReasonText.textContent = "No data";
}

function updateDeviceStatus() {
  const timestamp = asNumber(latestLive?.timestamp);
  const age = timestamp ? Date.now() - timestamp : Infinity;
  const online = age >= 0 && age < 30000;

  elements.sidebarStatusDot.className = `status-dot ${online ? "online" : "offline"}`;
  elements.sidebarDeviceStatus.textContent = online ? "Device online" : "Device offline";
  elements.sidebarLastSeen.textContent = timestamp ? `Last seen ${formatShortTime(timestamp)}` : "Waiting for ESP32";
  elements.topDevicePill.className = `device-pill ${online ? "online" : "offline"}`;
  elements.topDevicePill.querySelector(".status-dot").className = `status-dot ${online ? "online" : "offline"}`;
  elements.topDeviceText.textContent = online ? "ESP32 Online" : "ESP32 Offline";
}

function renderActiveConfig(config) {
  if (!config) {
    elements.activePlantText.textContent = "Not configured";
    elements.activeSoilText.textContent = "—";
    elements.activeMinText.textContent = "—";
    elements.activeMaxText.textContent = "—";
    elements.targetRangeText.textContent = "--% – --%";
    return;
  }

  elements.activePlantText.textContent = config.plantName || "Unknown plant";
  elements.activeSoilText.textContent = config.soilName || "Unknown soil";
  elements.activeMinText.textContent = `${config.minMoisture ?? "—"}%`;
  elements.activeMaxText.textContent = `${config.maxMoisture ?? "—"}%`;
  elements.targetRangeText.textContent = `${config.minMoisture ?? "--"}% – ${config.maxMoisture ?? "--"}%`;

  if (config.plantId) elements.plantSelect.value = config.plantId;
  if (config.soilId) elements.soilSelect.value = config.soilId;
  updateCalculatedProfile();
}

function calculateProfile() {
  const plant = plantProfiles.find(item => item.id === elements.plantSelect.value);
  const soil = soilProfiles.find(item => item.id === elements.soilSelect.value);
  if (!plant || !soil) return null;

  return {
    plant,
    soil,
    min: clamp(plant.min + soil.adjustment, 20, 90),
    max: clamp(plant.max + soil.adjustment, 30, 95)
  };
}

function updateCalculatedProfile() {
  const result = calculateProfile();
  if (!result) {
    elements.calculatedRangeText.textContent = "Select plant and soil";
    return;
  }

  elements.calculatedRangeText.textContent = `${result.min}% – ${result.max}% soil moisture`;
  elements.rangeBarMin.style.left = `${result.min}%`;
  elements.rangeBarMax.style.left = `${result.max}%`;
  elements.profileExplanation.innerHTML = `<strong>${escapeHtml(result.plant.name)} + ${escapeHtml(result.soil.name)}:</strong> Pump turns ON below <strong>${result.min}%</strong> and turns OFF at <strong>${result.max}%</strong>. ${escapeHtml(result.soil.description)}`;
}

async function saveProfile(event) {
  event.preventDefault();
  const result = calculateProfile();
  if (!result || !auth.currentUser) return;

  elements.confirmProfileButton.disabled = true;
  elements.confirmProfileButton.textContent = "Sending...";

  const payload = {
    plantId: result.plant.id,
    plantName: result.plant.name,
    soilId: result.soil.id,
    soilName: result.soil.name,
    waterNeed: result.plant.need,
    soilRetention: result.soil.retention,
    minMoisture: result.min,
    maxMoisture: result.max,
    controlMode: "automatic",
    updatedAt: Date.now(),
    updatedBy: auth.currentUser.email || auth.currentUser.uid,
    commandVersion: Date.now()
  };

  try {
    await set(ref(db, `devices/${DEVICE_ID}/config`), payload);
    showToast("Plant and soil profile sent to the ESP32.");
    navigateTo("dashboardSection");
  } catch (error) {
    console.error(error);
    showToast(`Unable to save profile: ${error.message}`, "error");
  } finally {
    elements.confirmProfileButton.disabled = false;
    elements.confirmProfileButton.textContent = "Confirm and Send to ESP32";
  }
}

async function cleanupOldHistory() {
  if (!db || !auth?.currentUser) return;
  const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
  try {
    const oldQuery = query(
      ref(db, `devices/${DEVICE_ID}/history`),
      orderByChild("timestamp"),
      endAt(cutoff - 1)
    );
    const snapshot = await get(oldQuery);
    if (!snapshot.exists()) return;
    const removals = [];
    snapshot.forEach(child => removals.push(remove(child.ref)));
    await Promise.all(removals);
  } catch (error) {
    console.warn("History cleanup skipped:", error);
  }
}

function filterAndRenderHistory() {
  const hours = Number(elements.historyRangeSelect.value || 168);
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const text = elements.historySearchInput.value.trim().toLowerCase();

  visibleHistory = allHistory.filter(record => {
    const inRange = Number(record.timestamp) >= cutoff;
    const searchable = `${record.plantName || ""} ${record.soilName || ""}`.toLowerCase();
    return inRange && (!text || searchable.includes(text));
  });

  if (!visibleHistory.length) {
    elements.historyTableBody.innerHTML = `<tr><td colspan="8" class="empty-cell">No matching records.</td></tr>`;
  } else {
    elements.historyTableBody.innerHTML = visibleHistory.map(record => `
      <tr>
        <td>${escapeHtml(formatDateTime(record.timestamp))}</td>
        <td>${formatNumber(record.temperature, 1, "°C")}</td>
        <td>${formatNumber(record.humidity, 0, "%")}</td>
        <td>${formatNumber(record.soilMoisture, 0, "%")}</td>
        <td><span class="status-badge ${record.pumpOn ? "on" : "off"}">${record.pumpOn ? "ON" : "OFF"}</span></td>
        <td>${escapeHtml(record.plantName || "—")}</td>
        <td>${escapeHtml(record.soilName || "—")}</td>
        <td>${record.minMoisture ?? "—"}% – ${record.maxMoisture ?? "—"}%</td>
      </tr>
    `).join("");
  }

  elements.historyCountText.textContent = `${visibleHistory.length} record${visibleHistory.length === 1 ? "" : "s"}`;
}

function formatNumber(value, decimals, suffix) {
  const number = asNumber(value);
  return number == null ? "—" : `${number.toFixed(decimals)}${suffix}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exportRows() {
  return visibleHistory.map(record => ({
    "Date & Time": formatDateTime(record.timestamp),
    "Temperature (°C)": asNumber(record.temperature, ""),
    "Humidity (%)": asNumber(record.humidity, ""),
    "Soil Moisture (%)": asNumber(record.soilMoisture, ""),
    "Pump Status": record.pumpOn ? "ON" : "OFF",
    "Plant": record.plantName || "",
    "Soil": record.soilName || "",
    "Minimum Moisture (%)": record.minMoisture ?? "",
    "Maximum Moisture (%)": record.maxMoisture ?? "",
    "Device Status": record.deviceOnline === false ? "Offline" : "Online"
  }));
}

function downloadCsv() {
  const rows = exportRows();
  if (!rows.length) return showToast("There is no history to download.", "error");
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.map(csvCell).join(","),
    ...rows.map(row => headers.map(header => csvCell(row[header])).join(","))
  ].join("\n");
  downloadBlob(`smart-irrigation-${dateFileStamp()}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function csvCell(value) {
  const text = String(value ?? "").replaceAll('"', '""');
  return `"${text}"`;
}

function downloadExcel() {
  const rows = exportRows();
  if (!rows.length) return showToast("There is no history to download.", "error");
  const headers = Object.keys(rows[0]);
  const tableRows = [
    `<tr>${headers.map(header => `<th>${escapeHtml(header)}</th>`).join("")}</tr>`,
    ...rows.map(row => `<tr>${headers.map(header => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`)
  ].join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table>${tableRows}</table></body></html>`;
  downloadBlob(`smart-irrigation-${dateFileStamp()}.xls`, `\uFEFF${html}`, "application/vnd.ms-excel;charset=utf-8");
}

function dateFileStamp() {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function drawLiveChart() {
  const canvas = elements.liveChart;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * ratio);
  canvas.height = Math.floor(rect.height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 18, right: 15, bottom: 32, left: 38 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  context.clearRect(0, 0, width, height);

  context.strokeStyle = "#e3eae6";
  context.fillStyle = "#7b8981";
  context.lineWidth = 1;
  context.font = "10px Inter, sans-serif";

  [0, 25, 50, 75, 100].forEach(value => {
    const y = padding.top + chartHeight - (value / 100) * chartHeight;
    context.beginPath();
    context.moveTo(padding.left, y);
    context.lineTo(width - padding.right, y);
    context.stroke();
    context.fillText(`${value}%`, 4, y + 3);
  });

  elements.chartEmpty.hidden = liveChartPoints.length > 1;
  if (liveChartPoints.length < 2) return;

  const stepX = chartWidth / Math.max(1, liveChartPoints.length - 1);
  const coordinates = liveChartPoints.map((point, index) => ({
    x: padding.left + index * stepX,
    y: padding.top + chartHeight - (clamp(point.value, 0, 100) / 100) * chartHeight,
    ...point
  }));

  const gradient = context.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
  gradient.addColorStop(0, "rgba(11, 143, 85, .28)");
  gradient.addColorStop(1, "rgba(11, 143, 85, 0)");

  context.beginPath();
  context.moveTo(coordinates[0].x, padding.top + chartHeight);
  coordinates.forEach(point => context.lineTo(point.x, point.y));
  context.lineTo(coordinates.at(-1).x, padding.top + chartHeight);
  context.closePath();
  context.fillStyle = gradient;
  context.fill();

  context.beginPath();
  coordinates.forEach((point, index) => index === 0 ? context.moveTo(point.x, point.y) : context.lineTo(point.x, point.y));
  context.strokeStyle = "#0b8f55";
  context.lineWidth = 2.5;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();

  const labelIndexes = [0, Math.floor((coordinates.length - 1) / 2), coordinates.length - 1];
  context.fillStyle = "#7b8981";
  context.textAlign = "center";
  [...new Set(labelIndexes)].forEach(index => {
    context.fillText(formatShortTime(coordinates[index].timestamp), coordinates[index].x, height - 8);
  });
  context.textAlign = "start";
}

function renderOptionsAndProfileTable() {
  elements.plantSelect.innerHTML = plantProfiles.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  elements.soilSelect.innerHTML = soilProfiles.map(item => `<option value="${item.id}">${escapeHtml(item.name)}</option>`).join("");
  elements.plantSelect.value = "tomato";
  elements.soilSelect.value = "loamy";

  elements.plantProfileTableBody.innerHTML = plantProfiles.map(item => `
    <tr>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td><span class="water-tag">${escapeHtml(item.need)}</span></td>
      <td>${item.min}% – ${item.max}%</td>
      <td>${escapeHtml(item.category)}</td>
    </tr>
  `).join("");
  updateCalculatedProfile();
}

function navigateTo(sectionId) {
  elements.navItems.forEach(item => item.classList.toggle("active", item.dataset.section === sectionId));
  elements.sections.forEach(section => section.classList.toggle("active-section", section.id === sectionId));
  elements.pageTitle.textContent = pageTitles[sectionId] || "Smart Irrigation";
  if (sectionId === "dashboardSection") requestAnimationFrame(drawLiveChart);
}

function bindEvents() {
  elements.loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    elements.loginError.hidden = true;
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    if (!email || !password) {
      elements.loginError.hidden = false;
      elements.loginError.textContent = "Enter both email and password.";
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      elements.loginError.hidden = false;
      elements.loginError.textContent = friendlyAuthError(error);
    } finally {
      setLoginLoading(false);
    }
  });

  elements.togglePassword.addEventListener("click", () => {
    const show = elements.passwordInput.type === "password";
    elements.passwordInput.type = show ? "text" : "password";
    elements.togglePassword.textContent = show ? "Hide" : "Show";
  });

  elements.logoutButton.addEventListener("click", () => signOut(auth));
  elements.navItems.forEach(item => item.addEventListener("click", () => navigateTo(item.dataset.section)));
  elements.jumpProfile.addEventListener("click", () => navigateTo("profileSection"));
  elements.plantSelect.addEventListener("change", updateCalculatedProfile);
  elements.soilSelect.addEventListener("change", updateCalculatedProfile);
  elements.profileForm.addEventListener("submit", saveProfile);
  elements.historyRangeSelect.addEventListener("change", filterAndRenderHistory);
  elements.historySearchInput.addEventListener("input", filterAndRenderHistory);
  elements.downloadCsvButton.addEventListener("click", downloadCsv);
  elements.downloadExcelButton.addEventListener("click", downloadExcel);
  elements.openSheetButton.addEventListener("click", () => {
    if (!GOOGLE_SHEET_URL) return showToast("Add your Google Sheet URL in firebase-config.js.", "error");
    window.open(GOOGLE_SHEET_URL, "_blank", "noopener,noreferrer");
  });
  window.addEventListener("resize", drawLiveChart);
}

renderOptionsAndProfileTable();
bindEvents();

if (initialiseFirebase()) {
  onAuthStateChanged(auth, user => user ? showApp(user) : showLogin());
}
