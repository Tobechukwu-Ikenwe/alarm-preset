//
//  IntelligentAlarmApp.swift
//  Intelligent Weekend/Weekday Alarm
//
//  Single-file SwiftUI app. No external libraries — pure SwiftUI, Foundation, UserNotifications.
//  On Mac: Open in Xcode and run on simulator or device. On Windows: Use for logic reference.
//

import SwiftUI
import UserNotifications

// MARK: - Data Model

enum AlarmType: String, CaseIterable, Codable {
    case weekday = "Weekday"
    case weekend = "Weekend"
}

struct AlarmPreset: Identifiable, Codable, Equatable {
    var id: AlarmType { type }
    var time: Date
    var isEnabled: Bool
    var type: AlarmType
}

// MARK: - Notification Manager

final class AlarmManager: NSObject, ObservableObject {
    static let shared = AlarmManager()
    private let center = UNUserNotificationCenter.current()

    @Published var weekdayPreset: AlarmPreset
    @Published var weekendPreset: AlarmPreset

    private let weekdayKey = "AlarmPreset.weekday"
    private let weekendKey = "AlarmPreset.weekend"

    override init() {
        self.weekdayPreset = AlarmPreset(
            time: Calendar.current.date(from: DateComponents(hour: 7, minute: 0)) ?? Date(),
            isEnabled: true,
            type: .weekday
        )
        self.weekendPreset = AlarmPreset(
            time: Calendar.current.date(from: DateComponents(hour: 9, minute: 0)) ?? Date(),
            isEnabled: true,
            type: .weekend
        )
        super.init()
        loadPresets()
    }

    private func loadPresets() {
        if let data = UserDefaults.standard.data(forKey: weekdayKey),
           let decoded = try? JSONDecoder().decode(AlarmPreset.self, from: data) {
            weekdayPreset = decoded
        }
        if let data = UserDefaults.standard.data(forKey: weekendKey),
           let decoded = try? JSONDecoder().decode(AlarmPreset.self, from: data) {
            weekendPreset = decoded
        }
    }

    private func savePresets() {
        if let data = try? JSONEncoder().encode(weekdayPreset) {
            UserDefaults.standard.set(data, forKey: weekdayKey)
        }
        if let data = try? JSONEncoder().encode(weekendPreset) {
            UserDefaults.standard.set(data, forKey: weekendKey)
        }
    }

    /// Request notification permission when the app starts.
    func requestPermission(completion: @escaping (Bool) -> Void) {
        center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            DispatchQueue.main.async { completion(granted) }
        }
    }

    /// Weekday = Monday(2) through Friday(6). Weekend = Saturday(7), Sunday(1).
    func scheduleAlarms() {
        center.removeAllPendingNotificationRequests()

        let calendar = Calendar.current

        // Weekday alarm: repeat on weekdays 2–6 (Mon–Fri)
        if weekdayPreset.isEnabled {
            let components = calendar.dateComponents([.hour, .minute], from: weekdayPreset.time)
            for weekday in 2...6 {
                var triggerComponents = DateComponents()
                triggerComponents.weekday = weekday
                triggerComponents.hour = components.hour
                triggerComponents.minute = components.minute
                let trigger = UNCalendarNotificationTrigger(dateMatching: triggerComponents, repeats: true)
                let content = UNMutableNotificationContent()
                content.title = "Weekday Alarm"
                content.body = "Time to get up!"
                content.sound = .default
                let request = UNNotificationRequest(
                    identifier: "weekday-\(weekday)",
                    content: content,
                    trigger: trigger
                )
                center.add(request)
            }
        }

        // Weekend alarm: repeat on 7 (Sat) and 1 (Sun)
        if weekendPreset.isEnabled {
            let components = calendar.dateComponents([.hour, .minute], from: weekendPreset.time)
            for weekday in [1, 7] {
                var triggerComponents = DateComponents()
                triggerComponents.weekday = weekday
                triggerComponents.hour = components.hour
                triggerComponents.minute = components.minute
                let trigger = UNCalendarNotificationTrigger(dateMatching: triggerComponents, repeats: true)
                let content = UNMutableNotificationContent()
                content.title = "Weekend Alarm"
                content.body = "Good morning!"
                content.sound = .default
                let request = UNNotificationRequest(
                    identifier: "weekend-\(weekday)",
                    content: content,
                    trigger: trigger
                )
                center.add(request)
            }
        }
    }

    func updateWeekday(time: Date, isEnabled: Bool) {
        weekdayPreset.time = time
        weekdayPreset.isEnabled = isEnabled
        savePresets()
        scheduleAlarms()
    }

    func updateWeekend(time: Date, isEnabled: Bool) {
        weekendPreset.time = time
        weekendPreset.isEnabled = isEnabled
        savePresets()
        scheduleAlarms()
    }
}

// MARK: - UI

struct ContentView: View {
    @StateObject private var manager = AlarmManager.shared
    @State private var permissionGranted: Bool?

    /// Which alarm is currently 'active' based on the system clock.
    private var isWeekendNow: Bool {
        Calendar.current.isDateInWeekend(Date())
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                // Weekday card — Blue theme; highlight when today is weekday
                GroupBox {
                    VStack(alignment: .leading, spacing: 12) {
                        DatePicker(
                            "Time",
                            selection: Binding(
                                get: { manager.weekdayPreset.time },
                                set: { manager.updateWeekday(time: $0, isEnabled: manager.weekdayPreset.isEnabled) }
                            ),
                            displayedComponents: .hourAndMinute
                        )
                        .datePickerStyle(.wheel)
                        .labelsHidden()

                        Toggle("Enabled", isOn: Binding(
                            get: { manager.weekdayPreset.isEnabled },
                            set: { manager.updateWeekday(time: manager.weekdayPreset.time, isEnabled: $0) }
                        ))
                    }
                    .padding(.vertical, 8)
                } label: {
                    Label("Weekday (Mon–Fri)", systemImage: "briefcase.fill")
                        .font(.headline)
                        .foregroundStyle(Color.blue)
                }
                .groupBoxStyle(.automatic)
                .padding(.horizontal)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isWeekendNow ? Color.clear : Color.blue.opacity(0.15))
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(isWeekendNow ? Color.blue.opacity(0.3) : Color.blue, lineWidth: isWeekendNow ? 1 : 2)
                        )
                )
                .padding(.horizontal, 8)

                // Weekend card — Orange theme; highlight when today is weekend
                GroupBox {
                    VStack(alignment: .leading, spacing: 12) {
                        DatePicker(
                            "Time",
                            selection: Binding(
                                get: { manager.weekendPreset.time },
                                set: { manager.updateWeekend(time: $0, isEnabled: manager.weekendPreset.isEnabled) }
                            ),
                            displayedComponents: .hourAndMinute
                        )
                        .datePickerStyle(.wheel)
                        .labelsHidden()

                        Toggle("Enabled", isOn: Binding(
                            get: { manager.weekendPreset.isEnabled },
                            set: { manager.updateWeekend(time: manager.weekendPreset.time, isEnabled: $0) }
                        ))
                    }
                    .padding(.vertical, 8)
                } label: {
                    Label("Weekend (Sat–Sun)", systemImage: "bed.double.fill")
                        .font(.headline)
                        .foregroundStyle(Color.orange)
                }
                .groupBoxStyle(.automatic)
                .padding(.horizontal)
                .background(
                    RoundedRectangle(cornerRadius: 16)
                        .fill(isWeekendNow ? Color.orange.opacity(0.15) : Color.clear)
                        .overlay(
                            RoundedRectangle(cornerRadius: 16)
                                .stroke(Color.orange, lineWidth: isWeekendNow ? 2 : 1)
                                .opacity(isWeekendNow ? 1 : 0.3)
                        )
                )
                .padding(.horizontal, 8)

                if permissionGranted == false {
                    Text("Enable notifications in Settings to get alarms.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(.vertical, 20)
            .navigationTitle("Intelligent Alarm")
            .onAppear {
                manager.requestPermission { granted in
                    permissionGranted = granted
                    if granted { manager.scheduleAlarms() }
                }
            }
            .onChange(of: manager.weekdayPreset.time) { _, _ in manager.scheduleAlarms() }
            .onChange(of: manager.weekdayPreset.isEnabled) { _, _ in manager.scheduleAlarms() }
            .onChange(of: manager.weekendPreset.time) { _, _ in manager.scheduleAlarms() }
            .onChange(of: manager.weekendPreset.isEnabled) { _, _ in manager.scheduleAlarms() }
        }
    }
}

// MARK: - App Entry

@main
struct IntelligentAlarmApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
