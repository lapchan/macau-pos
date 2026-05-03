// POS Print Receiver — Option A iOS app, with Option 2 polish.
// Single-purpose: receive ESC/POS bytes via custom URL scheme, forward to LAN
// printer over TCP, then offer a clear "Return to Cashier" button or auto-return.

import SwiftUI

@main
struct PosPrintReceiverApp: App {
    @StateObject private var state = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(state)
                .onOpenURL { url in
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
