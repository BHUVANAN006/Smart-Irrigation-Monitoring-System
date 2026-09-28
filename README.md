# Smart Irrigation Website + ESP32

A complete student-project starter package for one ESP32 irrigation device.

## Included features

- Email/password user login with Firebase Authentication
- Live ESP32 sensor readings
- DHT11 temperature and humidity
- Resistive soil-moisture percentage
- Automatic pump status display — no manual pump button
- 20 plant profiles and 9 soil types
- Plant + soil selection sent back to ESP32
- Automatic pump ON/OFF thresholds
- Seven-day Firebase history
- CSV and Excel-compatible `.xls` download
- Automatic one-minute Google Sheets logging
- Device online/offline indication
- Pump maximum-run safety timeout
- Saved plant/soil profile after ESP32 power failure
- Responsive layout for phone, tablet and computer

## Project folders

```text
smart-irrigation-website/
├── index.html
├── styles.css
├── app.js
├── firebase-config.js
├── database.rules.json
├── firebase.json
├── .firebaserc.example
├── esp32/
│   └── Smart_Irrigation_ESP32.ino
└── google-apps-script/
    └── Code.gs
```

---

# 1. Hardware connection

| Part | ESP32 connection |
|---|---|
| DHT11 data | GPIO 4 |
| Soil sensor analog output | GPIO 34 |
| Relay input | GPIO 26 |
| DHT11 VCC | 3.3 V |
| DHT11 GND | GND |
| Soil sensor VCC | Follow the module rating; use 3.3 V when supported |
| Soil sensor GND | GND |
| Relay VCC/GND | Follow your relay module rating |

**Pump power must not be taken directly from an ESP32 pin.** Use a correctly rated relay/MOSFET circuit and a separate suitable pump supply. Keep all grounds common where required by the selected driver circuit.

Many relay modules are active LOW. The ESP32 file contains:

```cpp
const bool RELAY_ACTIVE_LOW = true;
```

Change it to `false` if your relay uses HIGH for ON.

---

# 2. Create the Firebase project

1. Open Firebase Console and create a project.
2. Add a **Web app**.
3. Open **Build → Authentication → Sign-in method**.
4. Enable **Email/Password**.
5. Open **Authentication → Users** and create the one user account.
6. Open **Build → Realtime Database** and create the database.
7. Choose a nearby database location where available.
8. Copy the web-app Firebase configuration.

Open `firebase-config.js` and replace every placeholder:

```js
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

Keep this device ID unchanged in both the website and ESP32, or replace both with the same value:

```js
export const DEVICE_ID = "smart-irrigation-01";
```

## Apply the Realtime Database rules

Copy the content of `database.rules.json` into:

**Realtime Database → Rules → Publish**

The provided rules require a signed-in Firebase user for all reads and writes.

## Expected database structure

```text
devices/
  smart-irrigation-01/
    live/
      temperature
      humidity
      soilMoisture
      pumpOn
      timestamp
    config/
      plantId
      soilId
      minMoisture
      maxMoisture
    history/
      1785400000000/
        temperature
        humidity
        soilMoisture
        pumpOn
        timestamp
```

---

# 3. Google Sheets automatic storage

1. Create a new Google Sheet.
2. Copy the spreadsheet ID from the URL. It is the text between `/d/` and `/edit`.
3. In the Sheet, open **Extensions → Apps Script**.
4. Delete the sample function and paste `google-apps-script/Code.gs`.
5. Replace:

```js
const SPREADSHEET_ID = 'PASTE_GOOGLE_SHEET_ID_HERE';
const SHARED_SECRET = 'CHANGE_THIS_RANDOM_SECRET';
```

6. Select **Deploy → New deployment → Web app**.
7. Set **Execute as: Me**.
8. Set access so the ESP32 can call the web app, then deploy.
9. Copy the deployment URL ending in `/exec`.
10. In the ESP32 code, replace:

```cpp
const char* GOOGLE_APPS_SCRIPT_URL = "YOUR_DEPLOYMENT_URL";
const char* GOOGLE_SHEET_SECRET = "THE_SAME_SECRET";
```

11. In `firebase-config.js`, add the normal Google Sheet view URL:

```js
export const GOOGLE_SHEET_URL = "YOUR_GOOGLE_SHEET_VIEW_URL";
```

The ESP32 sends one record per minute to both Firebase history and Google Sheets.

---

# 4. Prepare Arduino IDE

Install the ESP32 board package and these libraries:

- **DHT sensor library** by Adafruit
- **Adafruit Unified Sensor**
- **ArduinoJson 7.x**

Open:

```text
esp32/Smart_Irrigation_ESP32.ino
```

Replace:

```cpp
WIFI_SSID
WIFI_PASSWORD
FIREBASE_API_KEY
FIREBASE_DATABASE_URL
FIREBASE_EMAIL
FIREBASE_PASSWORD
GOOGLE_APPS_SCRIPT_URL
GOOGLE_SHEET_SECRET
```

Use the same Firebase email/password account created for the project prototype. Do not upload a file containing real credentials to a public GitHub repository.

---

# 5. Calibrate the soil-moisture sensor

The website percentage is a **normalized sensor percentage**, not laboratory volumetric water content.

1. Keep the probe dry and note the raw value in Arduino Serial Monitor.
2. Place it in fully wet soil/water as appropriate for your probe and note the raw value.
3. Update:

```cpp
int SOIL_DRY_RAW = 3200;
int SOIL_WET_RAW = 1200;
```

Different sensors produce different ADC readings. Calibration is required before testing the plant ranges.

---

# 6. Initial plant moisture ranges

These are prototype starting thresholds after calibration. Practical values must be adjusted using the actual soil, crop stage, pot size, weather and sensor position.

| Plant | Base normalized moisture range |
|---|---:|
| Rice | 75–90% |
| Banana | 65–80% |
| Sugarcane | 60–75% |
| Taro / Colocasia | 70–85% |
| Tomato | 50–65% |
| Brinjal / Eggplant | 50–65% |
| Chilli | 45–60% |
| Cucumber | 55–70% |
| Okra | 45–60% |
| Cabbage | 55–70% |
| Cauliflower | 55–70% |
| Potato | 50–65% |
| Onion | 45–60% |
| Maize | 40–55% |
| Groundnut | 35–50% |
| Cotton | 30–45% |
| Sunflower | 30–45% |
| Pearl Millet | 25–40% |
| Green Gram | 30–45% |
| Chickpea | 25–40% |

## Soil adjustment used by the website

| Soil type | Adjustment applied to both limits |
|---|---:|
| Sandy | +5% |
| Sandy-loam | +3% |
| Loamy | 0% |
| Silt-loam | +1% |
| Clay-loam | −2% |
| Clay | −4% |
| Red soil | +3% |
| Black cotton soil | −3% |
| Alluvial soil | 0% |

Example:

```text
Tomato base range: 50–65%
Sandy soil adjustment: +5%
Final ESP32 range: 55–70%

Pump ON below 55%
Pump OFF at 70%
```

This difference between the ON and OFF limits is hysteresis. It prevents the relay from rapidly switching near one value.

---

# 7. Host the website

## Netlify Drop

1. Configure `firebase-config.js` first.
2. Upload the contents of this project folder to Netlify Drop.
3. Open the generated HTTPS website.
4. Log in with the Firebase user account.

## Firebase Hosting

Install Firebase CLI, sign in and run from the project folder:

```bash
firebase login
firebase init hosting database
firebase deploy
```

During setup, use the current folder as the public folder and do not overwrite the provided `index.html`.

---

# 8. System operation

```text
ESP32 reads sensors every few seconds
        ↓
ESP32 uploads live values to Firebase
        ↓
Website receives and displays live values
        ↓
User selects plant + soil and confirms
        ↓
Website writes min/max limits to Firebase config
        ↓
ESP32 reads and saves the new limits
        ↓
Moisture below minimum → pump ON
Moisture reaches maximum → pump OFF
        ↓
One-minute record → Firebase history + Google Sheet
```

The website intentionally contains no manual pump ON/OFF button.

---

# 9. Troubleshooting

### Website says Firebase is not configured
Replace all placeholders in `firebase-config.js`.

### Login fails
Confirm Email/Password is enabled and the user was created in Firebase Authentication.

### Permission denied
Publish `database.rules.json` and ensure the ESP32/website is authenticated.

### Website shows ESP32 offline
Check Wi-Fi, Firebase credentials, database URL and Serial Monitor errors. The dashboard marks the device offline when no new live timestamp is received for about 30 seconds.

### Moisture percentage moves in the wrong direction
Swap or correct `SOIL_DRY_RAW` and `SOIL_WET_RAW` after calibration.

### Relay works in reverse
Change `RELAY_ACTIVE_LOW`.

### Google Sheet receives no row
Open the Apps Script `/exec` URL in a browser, confirm the deployment permission, confirm the spreadsheet ID, and ensure the same shared secret is used in both files.
