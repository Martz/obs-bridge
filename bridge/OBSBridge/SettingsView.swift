//
//  SettingsView.swift
//  OBSBridge
//
//  Settings configuration interface

import SwiftUI

struct SettingsView: View {
    @ObservedObject var settings: AppSettings
    @Environment(\.dismiss) private var dismiss
    @State private var validationErrors: [String] = []
    @State private var showingSaveConfirmation = false

    var body: some View {
        Form {
            Section(header: Text("OBS Studio Configuration")) {
                HStack {
                    Text("Host:")
                        .frame(width: 100, alignment: .trailing)
                    TextField("localhost", text: $settings.obsHost)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }

                HStack {
                    Text("Port:")
                        .frame(width: 100, alignment: .trailing)
                    TextField("4455", text: $settings.obsPort)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }

                HStack {
                    Text("Password:")
                        .frame(width: 100, alignment: .trailing)
                    SecureField("OBS Password", text: $settings.obsPassword)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }

                Text("Configure these settings in OBS: Tools → WebSocket Server Settings")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }

            Section(header: Text("Website Configuration")) {
                HStack {
                    Text("URL:")
                        .frame(width: 100, alignment: .trailing)
                    TextField("ws://localhost:8000/obs", text: $settings.websiteURL)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }

                HStack {
                    Text("Client ID:")
                        .frame(width: 100, alignment: .trailing)
                    TextField("obs-client-1", text: $settings.clientID)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }

                Text("The WebSocket URL of your control website")
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .padding(.top, 4)
            }

            Section(header: Text("Options")) {
                Toggle("Auto-connect on startup", isOn: $settings.autoConnect)
            }

            if !validationErrors.isEmpty {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Label("Configuration Errors:", systemImage: "exclamationmark.triangle.fill")
                            .foregroundColor(.red)
                            .font(.headline)

                        ForEach(validationErrors, id: \.self) { error in
                            Text("• \(error)")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                    .padding()
                }
            }

            if showingSaveConfirmation {
                Section {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text("Settings saved successfully!")
                            .foregroundColor(.green)
                    }
                    .padding()
                }
            }
        }
        .padding()
        .frame(width: 600, height: 500)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    saveSettings()
                }
                .keyboardShortcut(.defaultAction)
            }

            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
                .keyboardShortcut(.cancelAction)
            }
        }
    }

    private func validateSettings() {
        let result = settings.validate()
        validationErrors = result.errors

        if result.isValid {
            validationErrors = []
            showingSaveConfirmation = true

            // Hide confirmation after 2 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                showingSaveConfirmation = false
            }
        } else {
            showingSaveConfirmation = false
        }
    }

    private func saveSettings() {
        validateSettings()

        if validationErrors.isEmpty {
            // Settings are automatically saved via @Published property observers
            // Just show confirmation
            showingSaveConfirmation = true

            // Close the settings window after a brief confirmation
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                showingSaveConfirmation = false
                dismiss()
            }
        }
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView(settings: AppSettings.shared)
    }
}
