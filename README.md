# Intelligent Weekend/Weekday Alarm

Set different alarm times for **weekdays** (Mon–Fri) and **weekends** (Sat–Sun). Cross-platform: **web app** for Windows and Mac, **SwiftUI app** for Mac and iPhone.

## How to run the code

Follow the steps below to **display and run the app** on your machine.

---

### Web app (Windows or Mac) — app opens in your browser

1. **Open the project folder**  
   In File Explorer (Windows) or Finder (Mac), go to the folder where you downloaded or cloned this project.

2. **Open the `web` folder**  
   Double‑click the `web` folder to go inside it.

3. **Launch the app**  
   Double‑click **`index.html`**.  
   Your default browser will open and **the app will be displayed** (title: “Intelligent Alarm”, two cards for Weekday and Weekend).

4. **Allow notifications (optional)**  
   When the browser asks “Allow notifications?”, click **Allow** so alarms can fire. You can still use the app if you block them.

5. **Use the app**  
   Set a time for **Weekday** and one for **Weekend**, and switch the toggles on. The highlighted card shows which alarm is active today. Alarms will trigger at the set times on the correct days.

**Result:** The Intelligent Alarm interface is visible and running in your browser.

---

### Swift app (Mac only) — app runs on iPhone or simulator

1. **Install Xcode**  
   From the Mac App Store, install **Xcode** if you don’t have it.

2. **Create a new iOS app**  
   Open Xcode → **File** → **New** → **Project** → choose **App** (under iOS) → **Next** → name it (e.g. “AlarmPreset”) → **Next** → choose a folder → **Create**.

3. **Add the app code**  
   In the project navigator (left sidebar), delete the default Swift file Xcode created (e.g. `ContentView.swift` or `*App.swift`).  
   Drag **`IntelligentAlarmApp.swift`** from this project into the Xcode project (into the same group as the deleted file), or copy its contents into a new file and ensure the **`@main`** struct is the app’s single entry point.

4. **Run the app**  
   At the top of Xcode, pick a **simulator** (e.g. iPhone 15) or your **connected iPhone**.  
   Click the **Run** button (▶) or press **⌘R**.  
   **The app will build and then display** on the simulator or device (two cards: Weekday and Weekend).

5. **Allow notifications**  
   When the app asks for notification permission, tap **Allow** so alarms work.

**Result:** The Intelligent Alarm app is running and visible on the simulator or your iPhone.

## File structure

```
AlarmPreset/
├── web/                    # Cross-platform (Windows + Mac)
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
├── IntelligentAlarmApp.swift   # Mac / iOS (Xcode)
├── LICENSE
└── README.md
```

## Cross-platform: Web app (Windows + Mac)

Runs in any modern browser on **Windows** and **Mac**. No install required.

1. Open **`web/index.html`** in your browser (double-click or drag into Chrome, Edge, Firefox, Safari), **or**
2. Serve the `web` folder with a local server (e.g. `npx serve web` or your editor’s “Live Server”) so notifications work reliably.
3. Allow notifications when prompted.
4. Set weekday and weekend times; the card for “today” (weekday vs weekend) is highlighted (blue = weekday, orange = weekend). Alarms fire via browser notifications when the time matches.

**Tech:** HTML, CSS, JavaScript only. Web Notifications API, `localStorage` for persistence. No frameworks.

## Mac / iOS: Swift app

For **Xcode** (Mac simulator or iPhone):

1. Create a new **App** project (iOS) in Xcode.
2. Add **IntelligentAlarmApp.swift** (or replace default files and set the app’s entry point to the `@main` struct in it).
3. Build and run. Grant notification permission to get alarms.

**Tech:** SwiftUI, Foundation, UserNotifications. No third-party dependencies.

## Architecture

| Component        | Web (Windows + Mac)                         | Swift (Mac / iOS)                                      |
|-----------------|---------------------------------------------|--------------------------------------------------------|
| **Data model**  | Preset: `time`, `isEnabled`, type           | `AlarmPreset` struct, `AlarmType` enum                 |
| **Persistence** | `localStorage`                              | `UserDefaults`                                         |
| **Notifications** | Web Notifications API, timer check        | `UNUserNotificationCenter`, `DateComponents`           |
| **Active highlight** | `isDateInWeekend(new Date())` on cards  | `Calendar.current.isDateInWeekend(Date())`             |
| **Theme**       | Blue (weekday), Orange (weekend)            | Same                                                   |

## License

Apache License 2.0 — see [LICENSE](LICENSE).
