/**
 * Smart Irrigation -> Google Sheets receiver
 *
 * Setup:
 * 1. Create a Google Sheet.
 * 2. Open Extensions -> Apps Script.
 * 3. Replace the default code with this file.
 * 4. Paste the Sheet ID and change the shared secret.
 * 5. Deploy as Web app: Execute as Me, access Anyone.
 * 6. Paste the /exec URL and same secret into the ESP32 code.
 */

const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Irrigation History';
const SHARED_SECRET = 'CHANGE_THIS_RANDOM_SECRET';

const HEADERS = [
  'Timestamp',
  'Device ID',
  'Temperature (°C)',
  'Humidity (%)',
  'Soil Moisture (%)',
  'Raw Soil ADC',
  'Pump Status',
  'Pump Reason',
  'Plant',
  'Soil Type',
  'Minimum Moisture (%)',
  'Maximum Moisture (%)',
  'Wi-Fi RSSI (dBm)'
];

function doGet() {
  return jsonResponse_({
    ok: true,
    service: 'Smart Irrigation Google Sheets Receiver'
  });
}

function doPost(e) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({ ok: false, error: 'Missing JSON request body.' });
    }

    const data = JSON.parse(e.postData.contents);

    if (SHARED_SECRET && data.secret !== SHARED_SECRET) {
      return jsonResponse_({ ok: false, error: 'Invalid shared secret.' });
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    const timestamp = Number(data.timestamp);
    const dateValue = Number.isFinite(timestamp) ? new Date(timestamp) : new Date();

    sheet.appendRow([
      dateValue,
      safeCell_(data.deviceId),
      safeNumber_(data.temperature),
      safeNumber_(data.humidity),
      safeNumber_(data.soilMoisture),
      safeNumber_(data.soilRaw),
      safeCell_(data.pumpStatus),
      safeCell_(data.pumpReason),
      safeCell_(data.plant),
      safeCell_(data.soil),
      safeNumber_(data.minimumMoisture),
      safeNumber_(data.maximumMoisture),
      safeNumber_(data.wifiRssi)
    ]);

    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setNumberFormat('dd-mmm-yyyy hh:mm:ss');

    return jsonResponse_({ ok: true, row: lastRow });
  } catch (error) {
    return jsonResponse_({ ok: false, error: String(error && error.message || error) });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {
      // Lock was not obtained; nothing to release.
    }
  }
}

function safeNumber_(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}

function safeCell_(value) {
  const text = String(value == null ? '' : value);
  // Prevent values beginning with formula operators from being interpreted as formulas.
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
