// Status UI with print details + return-to-cashier button + auto-return countdown.

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var state: AppState

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

    var body: some View {
        VStack(spacing: 24) {
            // Top header
            HStack {
                Text("POS Print")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Spacer()
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)

            Spacer(minLength: 0)

            // Big status icon
            Image(systemName: statusIcon)
                .font(.system(size: 84, weight: .light))
                .foregroundColor(statusColor)

            // Headline
            Text(state.lastEvent)
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(statusColor)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            // Order label (e.g. "CS-260503-0001 · MOP 25.50")
            if !state.label.isEmpty {
                Text(state.label)
                    .font(.title3)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }

            // Print details
            if state.lastEventColor == .success {
                VStack(spacing: 4) {
                    Text("\(state.lastBytes) bytes → \(state.lastHost):\(state.lastPort)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("Took \(state.lastDurationMs) ms · \(formattedTime(state.lastPrintAt))")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer(minLength: 0)

            // "Return to Cashier" — replicates the iOS "← Safari" pill via
            // private LSApplicationWorkspace.openApplicationWithBundleID:,
            // which is equivalent to tapping Safari's home-screen icon and
            // resumes Safari from its in-memory state (no URL reload).
            //
            // Caveat: LSApplicationWorkspace is a private framework. Safe for
            // personal-team / TestFlight / ad-hoc; flagged by App Store
            // static analysis. For App Store distribution, swap for the iOS
            // back-link pill (visible 5s after URL launch).
            Button(action: {
                openSourceApp(bundleID: "com.apple.mobilesafari")
            }) {
                HStack {
                    Image(systemName: "arrow.uturn.backward")
                    Text("Return to Cashier")
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

            // History (last 5)
            if !state.history.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Recent prints")
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
                            Text(entry.label.isEmpty ? "(no label)" : entry.label)
                                .font(.caption)
                                .lineLimit(1)
                            Spacer()
                            if entry.success {
                                Text("\(entry.bytes)B · \(entry.durationMs)ms")
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                            } else if let e = entry.errorText {
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
    }

    private func formattedTime(_ date: Date?) -> String {
        guard let date else { return "—" }
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f.string(from: date)
    }

    /// Replicates the iOS "← Safari" pill: switches to the named bundle as if
    /// the user had tapped its icon on the home screen. Safari (or whatever
    /// bundle) resumes from its in-memory state — no URL reload, no cold start.
    /// Uses private LSApplicationWorkspace.
    private func openSourceApp(bundleID: String) {
        guard let workspaceClass = NSClassFromString("LSApplicationWorkspace") as? NSObject.Type else {
            // Framework not found; fall back to UIApplication.open with the
            // last-known returnUrl so user at least gets back to Safari.
            if let url = state.returnUrl { UIApplication.shared.open(url) }
            return
        }
        let workspaceSelector = NSSelectorFromString("defaultWorkspace")
        guard
            workspaceClass.responds(to: workspaceSelector),
            let workspaceObj = workspaceClass.perform(workspaceSelector)?.takeUnretainedValue() as? NSObject
        else {
            if let url = state.returnUrl { UIApplication.shared.open(url) }
            return
        }
        let openSelector = NSSelectorFromString("openApplicationWithBundleID:")
        if workspaceObj.responds(to: openSelector) {
            _ = workspaceObj.perform(openSelector, with: bundleID)
        } else if let url = state.returnUrl {
            UIApplication.shared.open(url)
        }
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
