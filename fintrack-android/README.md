# FinTrack Android — Pure Java Native App

Native Android application for FinTrack built in **100% Pure Java**, **Material Design 3**, **Retrofit 2**, and **AndroidX Biometrics**.

---

## 📱 Features

- **🔐 Dual Authentication:** Secure Email/Password JWT auth + Hardware Biometric Fingerprint / Face Unlock.
- **💰 Multi-Wallet & Net Worth Overview:** Real-time liquid balance, credit card liabilities, and total net worth calculations.
- **⚡ Add Money / Top-Up Dialog:** Instant deposit to any wallet with quick amount chips (`+₹500`, `+₹1k`, `+₹2k`, `+₹5k`, `+₹10k`, `+₹25k`), live balance preview, and reason tags.
- **💳 Expense Tracking & Wallet Linkage:** Add expenses with auto-deduction from selected wallet and category classification.
- **🔄 Pull-to-Refresh & Offline-ready:** Seamless swipe-to-refresh for real-time sync with backend.

---

## 🛠️ Tech Stack & Architecture

- **Language:** Pure Java (JDK 17/21/22 compatible)
- **UI Framework:** Android XML + Material Components 3 (`ConstraintLayout`, `MaterialCardView`, `RecyclerView`, `SwipeRefreshLayout`)
- **Networking:** `Retrofit 2.9.0` + `OkHttp 4.12.0` + `Gson 2.10.1`
- **Security:** `AndroidX Biometric 1.1.0` + `SharedPreferences` session token management

---

## 🚀 How to Run & Test on Real Android Phone (No Android Studio Needed)

### Step 1: Enable USB Debugging on Your Phone
1. Go to **Settings** ➔ **About Phone** on your Android device.
2. Tap **Build Number** 7 times continuously until it says *"You are now a developer!"*.
3. Go to **Settings** ➔ **Developer Options** and turn **ON "USB Debugging"**.
4. Connect phone via USB cable to PC and tap **"Always allow from this computer"**.

---

### Step 2: Test Connection from Terminal
Verify device connection:
```bash
adb devices
```

---

### Step 3: Connect Phone to Local FastAPI Backend (Magic Port Reverse)
Run this single command so your phone's `localhost:8000` talks directly to your PC's backend:
```bash
adb reverse tcp:8000 tcp:8000
```

---

### Step 4: Build & Install APK on Your Phone
Inside `fintrack-android/` directory:
```bash
gradlew installDebug
```
*The app will automatically compile and launch directly on your phone's screen!*

---

## 🌐 Switching to Live Production Cloud Backend

When your backend is deployed live (e.g. `https://fintrack-api.onrender.com`), open `app/src/main/java/com/fintrack/app/api/Constants.java` and set:
```java
public static String BASE_URL = PRODUCTION_BASE_URL;
```
Then compile the standalone APK:
```bash
gradlew assembleRelease
```
Output APK location:
`app/build/outputs/apk/release/app-release.apk`
