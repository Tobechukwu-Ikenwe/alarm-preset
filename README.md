# Intelligent Weekend/Weekday Alarm

A single-file SwiftUI app that lets you set different alarm times for **weekdays** (Mon–Fri) and **weekends** (Sat–Sun), with native notifications and no external libraries.

## File structure

```
AlarmPreset/
├── IntelligentAlarmApp.swift   # Complete app (data model, AlarmManager, UI, @main)
└── README.md
```

Everything lives in **one Swift file**: data model, notification manager, UI, and app entry point.

## Architecture (what’s in the file)

| Component | Description |
|-----------|-------------|
| **AlarmPreset** | Struct with `time`, `isEnabled`, and `type` (Weekday/Weekend). Codable for UserDefaults. |
| **AlarmType** | Enum: `.weekday`, `.weekend`. |
| **AlarmManager** | Uses `UNUserNotificationCenter.current()`. Requests permission on start, `scheduleAlarms()` uses `DateComponents` to repeat: weekdays 2–6 (Mon–Fri), weekend 7 and 1 (Sat–Sun). |
| **Active highlight** | `Calendar.current.isDateInWeekend(Date())` decides which card is “active”: weekday card highlighted on weekdays (blue), weekend card on weekends (orange). |
| **UI** | `VStack` with two large `GroupBox` cards, `DatePicker` with `.datePickerStyle(.wheel)`, Blue theme for Weekday, Orange for Weekend. |

## On Mac (run on iPhone / simulator)

1. Open **Xcode** and create a new **App** project (iOS).
2. Replace or merge the default Swift files with the contents of **IntelligentAlarmApp.swift** (or add the file and set the app’s entry point to the `@main` struct in it).
3. Build and run on a simulator or a connected iPhone.
4. When the app starts, it will ask for notification permission; accept to get alarms.

You can copy this code into Xcode and ship it to your iPhone as usual.

## On Windows (logic and learning)

You can’t run SwiftUI or Xcode on Windows, but you can:

- **Read and edit** `IntelligentAlarmApp.swift` in your editor to understand the logic.
- **Study** the data model, `AlarmManager`, and how `DateComponents` + `UNUserNotificationCenter` schedule repeating alarms.
- **Reuse the ideas** (weekday vs weekend, permission flow, scheduling logic) in another platform or language.

## Native approach

- **SwiftUI** and **Foundation** only.
- **UserNotifications** for `UNUserNotificationCenter` (system framework).
- No third-party dependencies.

## Behavior summary

- **Permission**: Requested when the app starts via `AlarmManager.requestPermission`.
- **Scheduling**: `scheduleAlarms()` creates repeating calendar triggers: weekdays 2–6 for the weekday alarm, weekdays 1 and 7 for the weekend alarm.
- **Persistence**: Presets are saved with `UserDefaults` and restored on launch.
- **Active state**: The card that matches “today” (weekday vs weekend) is visually highlighted (blue for weekday, orange for weekend).
