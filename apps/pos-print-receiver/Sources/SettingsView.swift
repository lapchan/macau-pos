// Settings sheet — user pastes their PWA's bundle ID once so the
// "Return to Cashier" button can switch back to the right app.
// iOS doesn't expose this for Web Clips programmatically (private
// allInstalledApplications API is sandboxed), so manual config is
// the only reliable path short of Universal Links + Apple Dev Program.

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss
    @State private var draft: String = ""

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("e.g. com.apple.webapp.0DA3...", text: $draft)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .font(.system(.body, design: .monospaced))
                } header: {
                    Text("PWA bundle ID")
                } footer: {
                    Text("Find via Console.app on Mac (filter by 'webapp' or 'WebClip' while launching the cashier from home screen), or via sysdiagnose. Leave blank to fall back to Safari.")
                        .font(.caption)
                }

                Section {
                    Button("Save") {
                        state.manualReturnBundleID = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                        dismiss()
                    }
                    .disabled(draft == state.manualReturnBundleID)

                    Button("Clear") {
                        draft = ""
                        state.manualReturnBundleID = ""
                    }
                    .foregroundColor(.red)
                }

                if !state.manualReturnBundleID.isEmpty {
                    Section("Currently saved") {
                        Text(state.manualReturnBundleID)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.secondary)
                            .textSelection(.enabled)
                    }
                }

                Section("How to find it") {
                    Text("1. Mac: open Console.app, click your iPad in the sidebar.")
                        .font(.caption)
                    Text("2. Filter by 'webapp' or 'WebClip'.")
                        .font(.caption)
                    Text("3. Click Start, then on the iPad close the cashier PWA and re-tap its home-screen icon.")
                        .font(.caption)
                    Text("4. Look for a log line containing the bundle id (com.apple.webapp.UUID or com.apple.WebClip-UUID).")
                        .font(.caption)
                    Text("5. Paste it above and Save.")
                        .font(.caption)
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .onAppear { draft = state.manualReturnBundleID }
        }
    }
}
