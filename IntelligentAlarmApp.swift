//
//  IntelligentAlarmApp.swift
//  Atmospheric Clock — Alarm, Timer, Stopwatch
//
//  Single-file SwiftUI app. Dynamic time-gradient theme, TabView, UNCalendarNotificationTrigger, glassmorphism.
//

import SwiftUI
import UserNotifications

// MARK: - Dynamic Theme Engine (ThemeManager)

final class ThemeManager: ObservableObject {
    static let shared = ThemeManager()

    /// LinearGradient based on current hour. Smooth 2s transitions when updated via TimelineView(.everyMinute).
    func gradient(for date: Date) -> LinearGradient {
        let hour = Double(Calendar.current.component(.hour, from: date)) + Double(Calendar.current.component(.minute, from: date)) / 60
        let (start, end) = colorsForHour(hour)
        return LinearGradient(colors: [start, end], startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    private func colorsForHour(_ hour: Double) -> (Color, Color) {
        if hour >= 22 || hour < 5 {
            return (Color.black, Color.deepNavy)
        }
        if hour >= 5 && hour < 9 {
            return (Color.softPink, Color(red: 0.68, green: 0.85, blue: 1))
        }
        if hour >= 9 && hour < 17 {
            return (Color.skyBlue, Color.white)
        }
        if hour >= 17 && hour < 22 {
            return (Color.twilightPurple, Color(red: 1, green: 0.5, blue: 0))
        }
        return (Color.black, Color.deepNavy)
    }
}

extension Color {
    static let deepNavy = Color(red: 0, green: 0, blue: 0.2)
    static let softPink = Color(red: 1, green: 0.71, blue: 0.76)
    static let skyBlue = Color(red: 0.53, green: 0.81, blue: 0.98)
    static let twilightPurple = Color(red: 0.29, green: 0, blue: 0.51)
}

// MARK: - Alarm (UNCalendarNotificationTrigger)

struct AlarmPreset: Codable, Equatable {
    var time: Date
    var isEnabled: Bool
}

final class AlarmManager: NSObject, ObservableObject {
    static let shared = AlarmManager()
    private let center = UNUserNotificationCenter.current()
    private let key = "AtmosphericClock.alarm"
    private let permissionKey = "AtmosphericClock.hasRequestedNotificationPermission"

    @Published var preset: AlarmPreset

    override init() {
        self.preset = AlarmPreset(
            time: Calendar.current.date(from: DateComponents(hour: 7, minute: 0)) ?? Date(),
            isEnabled: false
        )
        super.init()
        load()
    }

    private func load() {
        if let data = UserDefaults.standard.data(forKey: key),
           let decoded = try? JSONDecoder().decode(AlarmPreset.self, from: data) {
            preset = decoded
        }
    }

    private func save() {
        if let data = try? JSONEncoder().encode(preset) {
            UserDefaults.standard.set(data, forKey: key)
        }
    }

    func requestPermissionIfNeeded(completion: @escaping (Bool) -> Void) {
        guard !UserDefaults.standard.bool(forKey: permissionKey) else {
            center.getNotificationSettings { settings in
                DispatchQueue.main.async { completion(settings.authorizationStatus == .authorized) }
            }
            return
        }
        center.requestAuthorization(options: [.alert, .sound, .badge]) { [weak self] granted, _ in
            UserDefaults.standard.set(true, forKey: self?.permissionKey ?? "AtmosphericClock.hasRequestedNotificationPermission")
            DispatchQueue.main.async { completion(granted) }
        }
    }

    func scheduleAlarm() {
        center.removeAllPendingNotificationRequests()
        guard preset.isEnabled else { return }
        let cal = Calendar.current
        let comps = cal.dateComponents([.hour, .minute], from: preset.time)
        var triggerComps = DateComponents()
        triggerComps.hour = comps.hour
        triggerComps.minute = comps.minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: triggerComps, repeats: true)
        let content = UNMutableNotificationContent()
        content.title = "Alarm"
        content.body = "Time to get up!"
        content.sound = .default
        center.add(UNNotificationRequest(identifier: "alarm", content: content, trigger: trigger))
    }

    func update(time: Date, isEnabled: Bool) {
        preset.time = time
        preset.isEnabled = isEnabled
        save()
        scheduleAlarm()
    }
}

// MARK: - Glassmorphism modifier

struct GlassBackground: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding()
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }
}

extension View {
    func glass() -> some View { modifier(GlassBackground()) }
}

// MARK: - Current time header (shared)

struct CurrentTimeHeader: View {
    let date: Date

    var body: some View {
        Text(timeString(from: date))
            .font(.system(size: 44, weight: .bold, design: .monospaced))
            .foregroundStyle(.primary)
    }

    private func timeString(from d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f.string(from: d)
    }
}

// MARK: - Alarm Tab

struct AlarmTab: View {
    @StateObject private var manager = AlarmManager.shared
    @State private var permissionGranted: Bool?

    var body: some View {
        VStack(spacing: 24) {
            VStack(alignment: .leading, spacing: 12) {
                DatePicker("Time", selection: Binding(
                    get: { manager.preset.time },
                    set: { manager.update(time: $0, isEnabled: manager.preset.isEnabled) }
                ), displayedComponents: .hourAndMinute)
                .datePickerStyle(.wheel)
                .labelsHidden()

                Toggle("On", isOn: Binding(
                    get: { manager.preset.isEnabled },
                    set: { manager.update(time: manager.preset.time, isEnabled: $0) }
                ))
            }
            .padding()
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))

            if permissionGranted == false {
                Text("Enable notifications in Settings for alarms.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .onAppear {
            manager.requestPermissionIfNeeded { granted in
                permissionGranted = granted
                if granted { manager.scheduleAlarm() }
            }
        }
    }
}

// MARK: - Timer Tab (circular countdown ring)

struct TimerTab: View {
    @State private var totalSeconds: Int = 300
    @State private var remainingSeconds: Int = 300
    @State private var isRunning = false

    var body: some View {
        VStack(spacing: 32) {
            ZStack {
                Circle()
                    .stroke(Color.white.opacity(0.3), lineWidth: 12)
                    .frame(width: 220, height: 220)
                Circle()
                    .trim(from: 0, to: totalSeconds > 0 ? CGFloat(remainingSeconds) / CGFloat(totalSeconds) : 0)
                    .stroke(Color.white, style: StrokeStyle(lineWidth: 12, lineCap: .round))
                    .frame(width: 220, height: 220)
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.5), value: remainingSeconds)
                Text(secondsToTime(remainingSeconds))
                    .font(.system(size: 42, weight: .bold, design: .monospaced))
            }

            if !isRunning {
                Stepper("Minutes: \(totalSeconds / 60)", value: Binding(
                    get: { totalSeconds / 60 },
                    set: { totalSeconds = $0 * 60; remainingSeconds = totalSeconds }
                ), in: 1...120)
                .glass()
            }

            HStack(spacing: 16) {
                if isRunning {
                    Button("Pause") {
                        isRunning = false
                    }
                    .buttonStyle(.borderedProminent)
                    .glass()
                    Button("Reset") {
                        isRunning = false
                        remainingSeconds = totalSeconds
                    }
                    .buttonStyle(.bordered)
                    .glass()
                } else {
                    Button(remainingSeconds < totalSeconds ? "Resume" : "Start") {
                        isRunning = true
                    }
                    .buttonStyle(.borderedProminent)
                    .glass()
                    if remainingSeconds != totalSeconds {
                        Button("Reset") {
                            remainingSeconds = totalSeconds
                        }
                        .buttonStyle(.bordered)
                        .glass()
                    }
                }
            }
        }
        .padding()
        .onReceive(Timer.publish(every: 1, on: .main, in: .common).autoconnect()) { _ in
            guard isRunning, remainingSeconds > 0 else { return }
            withAnimation(.easeInOut(duration: 0.5)) {
                remainingSeconds -= 1
                if remainingSeconds == 0 { isRunning = false }
            }
        }
    }

    private func secondsToTime(_ s: Int) -> String {
        let m = s / 60
        let sec = s % 60
        return String(format: "%d:%02d", m, sec)
    }
}

// MARK: - Stopwatch Tab (lap timer, milliseconds, Date() difference)

struct StopwatchTab: View {
    @State private var startDate: Date?
    @State private var displayDate: Date = Date()
    @State private var laps: [(id: UUID, interval: TimeInterval)] = []
    @State private var lapStart: Date?

    private var elapsed: TimeInterval {
        guard let start = startDate else { return 0 }
        return displayDate.timeIntervalSince(start)
    }

    var body: some View {
        VStack(spacing: 28) {
            Text(elapsedString(elapsed))
                .font(.system(size: 56, weight: .bold, design: .monospaced))

            HStack(spacing: 16) {
                if startDate == nil {
                    Button("Start") {
                        startDate = Date()
                        lapStart = startDate
                        laps = []
                    }
                    .buttonStyle(.borderedProminent)
                    .glass()
                } else {
                    Button("Lap") {
                        guard let lapStart = lapStart else { return }
                        laps.insert((UUID(), displayDate.timeIntervalSince(lapStart)), at: 0)
                        self.lapStart = displayDate
                    }
                    .buttonStyle(.bordered)
                    .glass()
                    Button("Stop") {
                        startDate = nil
                        lapStart = nil
                    }
                    .buttonStyle(.borderedProminent)
                    .glass()
                }
            }

            if !laps.isEmpty {
                List {
                    ForEach(Array(laps.enumerated()), id: \.element.id) { index, lap in
                        Text("Lap \(laps.count - index) — \(elapsedString(lap.interval))")
                            .font(.system(.body, design: .monospaced))
                    }
                }
                .scrollContentBackground(.hidden)
                .frame(maxHeight: 220)
            }
        }
        .padding()
        .onReceive(Timer.publish(every: 0.02, on: .main, in: .common).autoconnect()) { _ in
            displayDate = Date()
        }
    }

    private func elapsedString(_ t: TimeInterval) -> String {
        let totalMs = Int(t * 1000)
        let ms = totalMs % 1000
        let s = (totalMs / 1000) % 60
        let m = totalMs / 60000
        return String(format: "%02d:%02d.%03d", m, s, ms)
    }
}

// MARK: - Tab content wrapper (current time + tab content)

struct TabContent<Content: View>: View {
    let date: Date
    @ViewBuilder let content: () -> Content

    var body: some View {
        VStack(spacing: 20) {
            CurrentTimeHeader(date: date)
            ScrollView {
                content()
            }
        }
    }
}

// MARK: - Main app (TabView + TimelineView gradient)

struct ContentView: View {
    @StateObject private var theme = ThemeManager.shared

    var body: some View {
        TimelineView(.periodic(from: .now, by: 60)) { context in
            let gradient = theme.gradient(for: context.date)
            TabView {
                TabContent(date: context.date) { AlarmTab() }
                    .tabItem { Label("Alarm", systemImage: "alarm.fill") }
                TabContent(date: context.date) { TimerTab() }
                    .tabItem { Label("Timer", systemImage: "timer") }
                TabContent(date: context.date) { StopwatchTab() }
                    .tabItem { Label("Stopwatch", systemImage: "stopwatch.fill") }
            }
            .background {
                gradient
                    .ignoresSafeArea()
                    .animation(.easeInOut(duration: 2), value: context.date.timeIntervalSince1970.rounded(.down) / 60)
            }
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
