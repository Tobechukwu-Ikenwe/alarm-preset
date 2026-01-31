# Clock

A **Clock** app that imitates the modern Clock app on Android and iOS. It includes **Alarm**, **Timer**, and **Stopwatch** in one place, with a **time-of-day gradient** that changes the background based on the current time (night, sunrise, day, dusk).

<img width="1613" height="836" alt="Screenshot 2026-01-30 235525" src="https://github.com/user-attachments/assets/01ee23d2-2acf-4aa0-b197-a1146dde8395" />


**What it does:**

- **Alarm** — Set one alarm time and turn it on or off. The app asks for notification permission on first use and notifies you at the set time (daily).
- **Timer** — A circular countdown: choose minutes (1–120), tap **Start**, then **Pause** or **Reset**. The ring shows how much time is left.
- **Stopwatch** — A lap timer with milliseconds. Tap **Start** to run, **Lap** to record laps without stopping, **Stop** to stop. Elapsed time is based on the system clock so it stays accurate.
- **Time gradient** — The background updates by time of day: **Night** (10PM–5AM) is black to deep navy; **Sunrise** (6AM–9AM) is soft pink to light blue; **Day** (10AM–5PM) is sky blue to white; **Dusk** (6PM–9PM) is twilight purple to orange. Transitions are smooth (about 2 seconds).
- **Current time** — Shown at the top center in every tab (bold, monospaced).
- **Glass-style UI** — Buttons and panels use a semi-transparent, blurred look so the gradient shows through.

You can run it in a **web browser** (Windows or Mac) or as a **Swift/iOS app** (Mac + Xcode).

---

## How to run the code

### Web app (Windows or Mac)

**Step 1 — Start a local server**

- **If you have Node.js:**  
  Open a terminal (Command Prompt, PowerShell, or Terminal) and go to the **project folder** (the one that contains the `web` folder). Run:
  ```bash
  npx serve web
  ```
  Note the URL it prints (e.g. `http://localhost:3000`).

- **If you don’t have Node.js:**  
  [Download Node.js](https://nodejs.org/), then run the command above.  
  Or open your browser (Chrome, Edge, Firefox, or Safari), press **Ctrl+O** (Windows) or **⌘+O** (Mac) → go to the project folder → open the **`web`** folder → select **`index.html`** → click **Open**.

**Step 2 — Open the app in your browser**

- If you used `npx serve web`: open a browser and go to the URL from Step 1 (e.g. **http://localhost:3000**).
- If you used File → Open: the app should already be open in the tab you used.

You’ll see the **Clock** app with three tabs at the bottom (Alarm, Timer, Stopwatch), the current time at the top, and the time-of-day gradient behind the content.

---

### Swift app (Mac only)

**Step 1 — Install Xcode**  
Install **Xcode** from the Mac App Store if it’s not already installed.

**Step 2 — Create a new iOS app**  
Open Xcode → **File** → **New** → **Project** → select **App** (under iOS) → **Next** → enter a name (e.g. “Clock” or “AlarmPreset”) → **Next** → choose a folder → **Create**.

**Step 3 — Use this project’s code**  
In the left sidebar (project navigator), remove the default Swift file Xcode added. Drag **`IntelligentAlarmApp.swift`** from this repo into that same spot in the Xcode project (or create a new file, paste its contents, and keep the **`@main`** struct as the only app entry point).

**Step 4 — Run the app**  
At the top of Xcode, select a **simulator** (e.g. iPhone 15) or your **connected iPhone**. Click the **Run** button (▶) or press **⌘R**.

The app opens with the same three tabs (Alarm, Timer, Stopwatch), current time at the top, and the time-of-day gradient. Grant notification permission when prompted so the alarm can fire.

---

## File structure

```
AlarmPreset/
├── assets/
│   └── screenshot.png      # App screenshot (Timer at night)
├── web/                    # Cross-platform (Windows + Mac)
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
├── IntelligentAlarmApp.swift   # Mac / iOS (Xcode)
├── LICENSE
└── README.md
```

---

## Architecture

| Component        | Web (Windows + Mac)                         | Swift (Mac / iOS)                                      |
|-----------------|---------------------------------------------|--------------------------------------------------------|
| **Alarm**       | Single preset: `time`, `isEnabled`; `localStorage` | `AlarmPreset` struct; `UserDefaults`; `UNCalendarNotificationTrigger` |
| **Timer**       | Circular ring (SVG), `remainingSeconds`, 1s tick | Circular ring, `@State` remaining, `Timer.publish(every: 1)` |
| **Stopwatch**   | Lap list; elapsed from `Date()` difference (no drift); ms display | Lap list; elapsed from `Date()`; format `00:00.000` |
| **Theme**       | Time-of-day gradient (Night / Sunrise / Day / Dusk); CSS variables updated every minute | `ThemeManager` + `TimelineView(.periodic)`; `LinearGradient` by hour |
| **UI**          | Tab bar + panels; glass-style (`backdrop-filter` blur) | `TabView`; `.ultraThinMaterial` (glassmorphism) |

---

## License

Apache License 2.0 — see [LICENSE](LICENSE).
