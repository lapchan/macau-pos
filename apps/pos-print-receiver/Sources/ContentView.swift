// Status UI with print details + return-to-cashier button + auto-return countdown.

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var state: AppState
    @State private var showSettings = false

    private var statusColor: Color {
        switch state.lastEventColor {
        case .neutral: return .secondary
        case .success: return .green
        case .error: return .red
        }
    }

    private var statusIcon: String {
        switch state.lastEventColor {
        case .neutral: return "printer"
        case .success: return "checkmark.circle.fill"
        case .error: return "xmark.circle.fill"
        }
    }

    /// Idle/ready headline — when no print has happened yet, show a friendly
    /// "Ready" instead of an empty event string.
    private var headlineText: String {
        if state.lastEvent.isEmpty || state.lastEventColor == .neutral {
            return t(.ready, state.locale)
        }
        return state.lastEvent
    }

    var body: some View {
        VStack(spacing: 24) {
            // Top header — app title localized; gear opens settings.
            HStack {
                Text(t(.appTitle, state.locale))
                    .font(.headline)
                    .foregroundColor(.secondary)
                Spacer()
                Button(action: { showSettings = true }) {
                    Image(systemName: "gear")
                        .font(.title3)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)

            Spacer(minLength: 0)

            // Big status icon
            Image(systemName: statusIcon)
                .font(.system(size: 84, weight: .light))
                .foregroundColor(statusColor)

            // Headline — localized status (Ready / Receipt printed / error)
            Text(headlineText)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(statusColor)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            // Order label (e.g. "CS-260503-0001 · MOP 25.50") — passed through
            // from the cashier; user-meaningful, kept verbatim.
            if !state.label.isEmpty {
                Text(state.label)
                    .font(.title3)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            // Idle subtitle when no print has happened yet
            if state.lastEventColor == .neutral {
                Text(t(.awaitingPrintJob, state.locale))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            // Last-print timestamp only — no host/port, no byte counts, no ms.
            if state.lastEventColor == .success, let last = state.lastPrintAt {
                Text(formattedTime(last))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer(minLength: 0)

            // "Return to Cashier" — sequence-fires generic Web Clip bundles
            // via private LSApplicationWorkspace; aborts on background.
            Button(action: { returnToCashier() }) {
                HStack {
                    Image(systemName: "arrow.uturn.backward")
                    Text(t(.returnToCashier, state.locale))
                }
                .font(.title3)
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(14)
            }
            .padding(.horizontal, 32)

            // Hint pointing to the iOS pill — works as backup if the button
            // ever fails (e.g., new iOS restrictions on private APIs).
            HStack(spacing: 6) {
                Image(systemName: "info.circle")
                    .font(.caption2)
                Text(t(.pillHint, state.locale))
                    .font(.caption2)
            }
            .foregroundColor(.secondary)
            .padding(.horizontal, 16)
            .multilineTextAlignment(.center)

            // History — last 5 prints, just timestamp + label, no debug numbers.
            if !state.history.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text(t(.recentPrints, state.locale))
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                    ForEach(state.history.prefix(5)) { entry in
                        HStack(spacing: 8) {
                            Image(systemName: entry.success ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundColor(entry.success ? .green : .red)
                                .font(.caption)
                            Text(formattedTime(entry.timestamp))
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .frame(width: 60, alignment: .leading)
                            Text(entry.label)
                                .font(.caption)
                                .lineLimit(1)
                            Spacer()
                            if !entry.success, let e = entry.errorText {
                                Text(e)
                                    .font(.caption2)
                                    .foregroundColor(.red)
                                    .lineLimit(1)
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 16)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemBackground))
        .sheet(isPresented: $showSettings) {
            SettingsView().environmentObject(state)
        }
    }

    private func formattedTime(_ date: Date?) -> String {
        guard let date else { return "—" }
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f.string(from: date)
    }

    /// Try to open the named bundle via private LSApplicationWorkspace.
    /// Returns true if the call was made, false if the workspace API isn't
    /// available. (We can't tell whether the open SUCCEEDED — iOS doesn't
    /// give us a callback — only that we attempted.)
    @discardableResult
    private func openSourceApp(bundleID: String) -> Bool {
        guard let workspaceObj = lsWorkspace() else { return false }
        let openSelector = NSSelectorFromString("openApplicationWithBundleID:")
        guard workspaceObj.responds(to: openSelector) else { return false }
        _ = workspaceObj.perform(openSelector, with: bundleID)
        return true
    }

    /// Sequence of bundle IDs to try when returning to the cashier:
    ///   1. User's manual override (if set in Settings)
    ///   2. Source bundle ID iOS reported (Safari mode, non-PWA)
    ///   3. com.apple.webapp.managed — the bundle ID for profile-installed
    ///      Web Clips per Apple's MDM docs. Our Cashier.mobileconfig profile
    ///      installs under this bundle.
    ///   4. com.apple.webapp — generic Web Clip bundle; iPad has only one
    ///      Web Clip (the cashier) so this should work too.
    ///   5. com.apple.webclip — older alias, worth trying.
    ///   6. com.apple.mobilesafari — last-resort fallback.
    /// Each is fired in turn with a small delay; if our app has been
    /// backgrounded (= a previous one succeeded), we abort the chain so we
    /// don't accidentally also open Safari on top of the PWA.
    private func returnToCashier() {
        var sequence: [String] = []
        if !state.manualReturnBundleID.isEmpty {
            sequence.append(state.manualReturnBundleID)
        }
        if let src = state.sourceBundleID, !src.isEmpty {
            sequence.append(src)
        }
        sequence.append(contentsOf: [
            "com.apple.webapp.managed",
            "com.apple.webapp",
            "com.apple.webclip",
            "com.apple.mobilesafari",
        ])

        for (idx, bundle) in sequence.enumerated() {
            DispatchQueue.main.asyncAfter(deadline: .now() + Double(idx) * 0.3) {
                // Abort if we've already been backgrounded (= a previous
                // candidate successfully foregrounded another app and iOS
                // suspended us with a small grace window).
                if UIApplication.shared.applicationState != .active {
                    return
                }
                openSourceApp(bundleID: bundle)
            }
        }
    }

    /// Get a handle to LSApplicationWorkspace.defaultWorkspace (private).
    private func lsWorkspace() -> NSObject? {
        guard let workspaceClass = NSClassFromString("LSApplicationWorkspace") as? NSObject.Type else { return nil }
        let selector = NSSelectorFromString("defaultWorkspace")
        guard workspaceClass.responds(to: selector) else { return nil }
        return workspaceClass.perform(selector)?.takeUnretainedValue() as? NSObject
    }
}

#Preview {
    let s = AppState()
    s.lastEvent = "Receipt printed"
    s.lastEventColor = .success
    s.label = "CS-260503-0042 · MOP 25.50"
    s.lastBytes = 1847
    s.lastHost = "192.168.123.100"
    s.lastPort = 9100
    s.lastDurationMs = 142
    s.lastPrintAt = Date()
    s.returnUrl = URL(string: "https://pos.hkretailai.com/")
    return ContentView().environmentObject(s)
}
