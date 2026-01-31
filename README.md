# Intelligent Weekend/Weekday Alarm

Set different alarm times for **weekdays** (Mon–Fri) and **weekends** (Sat–Sun). Cross-platform: **web app** for Windows and Mac, **SwiftUI app** for Mac and iPhone.

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
