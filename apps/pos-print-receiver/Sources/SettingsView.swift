// Settings sheet — user pastes their PWA's bundle ID once so the
// "Return to Cashier" button can switch back to the right app.
// Localized to match the cashier's language.

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var state: AppState
    @Environment(\.dismiss) var dismiss
    @State private var draft: String = ""

    var body: some View {
        NavigationView {
            Form {
                Section {
                    TextField("com.apple.webapp.managed", text: $draft)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .font(.system(.body, design: .monospaced))
                } header: {
                    Text(t(.settingsBundleIdLabel, state.locale))
                } footer: {
                    Text(t(.settingsBundleIdFooter, state.locale))
                        .font(.caption)
                }

                Section {
                    Button(t(.settingsSave, state.locale)) {
                        state.manualReturnBundleID = draft.trimmingCharacters(in: .whitespacesAndNewlines)
                        dismiss()
                    }
                    .disabled(draft == state.manualReturnBundleID)

                    Button(t(.settingsClear, state.locale)) {
                        draft = ""
                        state.manualReturnBundleID = ""
                    }
                    .foregroundColor(.red)
                }

                if !state.manualReturnBundleID.isEmpty {
                    Section(t(.settingsCurrent, state.locale)) {
                        Text(state.manualReturnBundleID)
                            .font(.system(.caption, design: .monospaced))
                            .foregroundColor(.secondary)
                            .textSelection(.enabled)
                    }
                }
            }
            .navigationTitle(t(.settings, state.locale))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(t(.settingsDone, state.locale)) { dismiss() }
                }
            }
            .onAppear { draft = state.manualReturnBundleID }
        }
    }
}
