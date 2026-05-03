// POS Print Receiver — Option A iOS app, with Option 2 polish.
// Single-purpose: receive ESC/POS bytes via custom URL scheme, forward to LAN
// printer over TCP, then offer a clear "Return to Cashier" button or auto-return.

import SwiftUI
import UIKit

/// Captures the launching app's bundle ID so the "Return to Cashier" button
/// can switch back to the right caller (Safari, a PWA / Web Clip, etc.).
/// SwiftUI's `.onOpenURL` doesn't surface the launch options — only this
/// AppDelegate hook does.
final class AppDelegate: NSObject, UIApplicationDelegate {
    static let shared = AppDelegate()

    /// Bundle ID of the app that fired the most recent pos-print:// URL.
    /// Updated on every URL open so it stays current even if the user
    /// switches contexts between prints.
    var sourceBundleID: String?

    func application(
        _ application: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    ) -> Bool {
        let src = options[.sourceApplication] as? String
        AppDelegate.shared.sourceBundleID = src
        return true
    }
}

@main
struct PosPrintReceiverApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var state = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(state)
                .onOpenURL { url in
                    // AppDelegate.application(_:open:options:) fired just
                    // before this and captured sourceApplication. Hand it off
                    // to AppState so the Return button can use it.
                    state.sourceBundleID = AppDelegate.shared.sourceBundleID
                    Task {
                        await PrintService.handleURL(url, state: state)
                    }
                }
        }
    }
}

@MainActor
final class AppState: ObservableObject {
    // Latest event status
    @Published var lastEvent: String = "Ready — awaiting print job"
    @Published var lastEventColor: EventColor = .neutral
    @Published var lastPrintAt: Date?
    @Published var lastBytes: Int = 0
    @Published var lastDurationMs: Int = 0

    // Latest print metadata (from URL params)
    @Published var label: String = ""           // e.g. "CS-260503-0001 · MOP 25.50"
    @Published var returnUrl: URL?               // Where the cashier was; tap "Return" to go back
    @Published var lastHost: String = ""
    @Published var lastPort: Int = 0

    /// Bundle ID of the app that launched us (Safari, a Web Clip / PWA, etc.).
    /// Captured by AppDelegate.application(_:open:options:); used by the
    /// "Return to Cashier" button to switch back to the actual caller.
    @Published var sourceBundleID: String?

    /// User-configured override. iOS doesn't expose the launching app's
    /// bundle ID for PWAs (Web Clips), and LSApplicationWorkspace's
    /// allInstalledApplications is sandboxed. Workaround: user manually
    /// finds their PWA's bundle ID once (via sysdiagnose / Console.app)
    /// and pastes it in Settings. Persists to UserDefaults.
    @Published var manualReturnBundleID: String = "" {
        didSet { UserDefaults.standard.set(manualReturnBundleID, forKey: "manualReturnBundleID") }
    }

    /// Current locale — driven by the cashier's `&locale=...` URL param so
    /// the print app speaks the same language the cashier was running in.
    /// Defaults to English; persists to UserDefaults so the idle/ready
    /// screen between prints stays in the right language.
    @Published var locale: AppLocale = .en {
        didSet { UserDefaults.standard.set(locale.rawValue, forKey: "appLocale") }
    }

    init() {
        manualReturnBundleID = UserDefaults.standard.string(forKey: "manualReturnBundleID") ?? ""
        if let raw = UserDefaults.standard.string(forKey: "appLocale") {
            locale = AppLocale.from(raw)
        }
    }

    // Auto-return countdown (nil = not active)
    @Published var autoReturnSecondsRemaining: Int?
    @Published var autoReturnEnabled: Bool = true

    // Print history (last 10)
    struct HistoryEntry: Identifiable {
        let id = UUID()
        let timestamp: Date
        let label: String
        let bytes: Int
        let durationMs: Int
        let success: Bool
        let errorText: String?
    }
    @Published var history: [HistoryEntry] = []

    enum EventColor { case neutral, success, error }

    func appendHistory(_ entry: HistoryEntry) {
        history.insert(entry, at: 0)
        if history.count > 10 { history.removeLast(history.count - 10) }
    }
}
