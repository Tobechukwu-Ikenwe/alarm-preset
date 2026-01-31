# Intelligent Weekend/Weekday Alarm

Set different alarm times for **weekdays** (Mon–Fri) and **weekends** (Sat–Sun). Cross-platform: **web app** for Windows and Mac, **SwiftUI app** for Mac and iPhone.

## How to run the code

Do these steps **in order** to see the app and interact with it.

---

### Web app (Windows or Mac)

**Step 1 — Start a local server (so the app loads correctly)**  
Opening `index.html` by double‑clicking often fails (wrong program, or the app won’t work properly). Use a local server instead.

- **If you have Node.js:**  
  Open a terminal (Command Prompt, PowerShell, or Terminal) and go to the **project folder** (the one that contains the `web` folder). Run:
  ```bash
  npx serve web
  ```
  Note the URL it prints (e.g. `http://localhost:3000`).

- **If you don’t have Node.js:**  
  Open your browser (Chrome, Edge, Firefox, or Safari). Press **Ctrl+O** (Windows) or **⌘+O** (Mac) → go to the project folder → open the **`web`** folder → select **`index.html`** → click **Open**.

**Step 2 — Open the app in your browser**  
- If you used `npx serve web`: open a browser and go to the URL from Step 1 (e.g. **http://localhost:3000**).  
- If you used File → Open: the app should already be open in the tab you used.

**Step 3 — What you should see**  
You should see the **Intelligent Alarm** page: a title “Intelligent Alarm”, then two large cards:

- **Weekday (Mon–Fri)** — blue label, with a time box and an “Enabled” toggle.
- **Weekend (Sat–Sun)** — orange label, with a time box and an “Enabled” toggle.

One of the two cards will be **highlighted** (stronger border/background): the weekday card on Mon–Fri, the weekend card on Sat–Sun.

**Step 4 — Interact with the app**  
- **Set alarm times:** Click the **time box** on each card (e.g. “07:00”) and choose an hour and minute.  
- **Turn alarms on/off:** Use the **Enabled** toggle on each card (on = alarm will fire on those days).  
- When the browser asks **“Allow notifications?”**, click **Allow** so you get alarm notifications at the set times.

After that, the app is running: it will show notifications at the times you set, on weekdays or weekends depending on which card you configured.

---

### Swift app (Mac only)

**Step 1 — Install Xcode**  
Install **Xcode** from the Mac App Store if it’s not already installed.

**Step 2 — Create a new iOS app**  
Open Xcode → **File** → **New** → **Project** → select **App** (under iOS) → **Next** → enter a name (e.g. “AlarmPreset”) → **Next** → choose a folder → **Create**.

**Step 3 — Use this project’s code**  
In the left sidebar (project navigator), remove the default Swift file Xcode added. Drag **`IntelligentAlarmApp.swift`** from this repo into that same spot in the Xcode project (or create a new file, paste its contents, and keep the **`@main`** struct as the only app entry point).

**Step 4 — Run the app**  
At the top of Xcode, select a **simulator** (e.g. iPhone 15) or your **connected iPhone**. Click the **Run** button (▶) or press **⌘R**.

**Step 5 — What you should see**  
The app opens on the simulator or device: **Intelligent Alarm** with two cards (Weekday and Weekend), each with a time picker and an Enabled switch. One card is highlighted based on whether today is a weekday or weekend.

**Step 6 — Interact with the app**  
Use the **time picker** on each card to set the alarm time. Use the **Enabled** switch to turn each alarm on or off. When the app asks for notification permission, tap **Allow**.

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
