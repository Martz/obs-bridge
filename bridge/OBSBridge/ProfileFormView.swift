//
//  ProfileFormView.swift
//  OBSBridge
//
//  Form for creating and editing OBS profiles
//

import SwiftUI

struct ProfileFormView: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var profileManager = ProfileManager.shared

    let editingProfile: OBSProfile?
    let onSave: (OBSProfile) -> Void

    @State private var name: String
    @State private var isEnabled: Bool
    @State private var obsHost: String
    @State private var obsPort: String
    @State private var obsPassword: String
    @State private var websiteURL: String
    @State private var clientID: String
    @State private var notes: String

    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showSuccess = false

    init(profile: OBSProfile? = nil, onSave: @escaping (OBSProfile) -> Void) {
        self.editingProfile = profile
        self.onSave = onSave

        // Initialise state from profile or defaults
        _name = State(initialValue: profile?.name ?? "")
        _isEnabled = State(initialValue: profile?.isEnabled ?? true)
        _obsHost = State(initialValue: profile?.obsHost ?? "localhost")
        _obsPort = State(initialValue: profile?.obsPort ?? "4455")
        _obsPassword = State(initialValue: profile?.obsPassword ?? "")
        _websiteURL = State(initialValue: profile?.websiteURL ?? "ws://localhost:8000/obs")
        _clientID = State(initialValue: profile?.clientID ?? "")
        _notes = State(initialValue: profile?.notes ?? "")
    }

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text(editingProfile == nil ? "New Profile" : "Edit Profile")
                    .font(.title2)
                    .fontWeight(.semibold)
                Spacer()
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))

            Divider()

            // Form content
            Form {
                Section(header: Text("Profile Information")) {
                    TextField("Profile Name", text: $name)
                        .textFieldStyle(.roundedBorder)

                    Toggle("Enabled", isOn: $isEnabled)

                    TextField("Notes (Optional)", text: $notes, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(3...6)
                }

                Section(header: Text("OBS Studio Connection")) {
                    TextField("Host", text: $obsHost)
                        .textFieldStyle(.roundedBorder)

                    TextField("Port", text: $obsPort)
                        .textFieldStyle(.roundedBorder)

                    SecureField("Password", text: $obsPassword)
                        .textFieldStyle(.roundedBorder)
                }

                Section(header: Text("Server Connection")) {
                    TextField("WebSocket URL", text: $websiteURL)
                        .textFieldStyle(.roundedBorder)
                        .disableAutocorrection(true)

                    HStack {
                        TextField("Client ID", text: $clientID)
                            .textFieldStyle(.roundedBorder)
                            .disableAutocorrection(true)

                        Button("Generate") {
                            generateClientID()
                        }
                        .buttonStyle(.bordered)
                    }

                    Text("Client ID must be unique across all profiles")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Section {
                    HStack {
                        Spacer()
                        Button("Cancel") {
                            dismiss()
                        }
                        .buttonStyle(.bordered)

                        Button(editingProfile == nil ? "Create Profile" : "Save Changes") {
                            saveProfile()
                        }
                        .buttonStyle(.borderedProminent)
                        Spacer()
                    }
                }
            }
            .formStyle(.grouped)
        }
        .frame(width: 500, height: 600)
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage)
        }
        .alert("Success", isPresented: $showSuccess) {
            Button("OK", role: .cancel) {
                dismiss()
            }
        } message: {
            Text(editingProfile == nil ? "Profile created successfully" : "Profile updated successfully")
        }
        .onAppear {
            // Generate client ID if creating new profile
            if editingProfile == nil && clientID.isEmpty {
                generateClientID()
            }
        }
    }

    private func generateClientID() {
        let baseName = name.isEmpty ? "obs" : name.lowercased().replacingOccurrences(of: " ", with: "-")
        clientID = "obs-\(baseName)-\(UUID().uuidString.prefix(8))"
    }

    private func saveProfile() {
        // Create profile object
        let profile: OBSProfile
        if let existing = editingProfile {
            profile = OBSProfile(
                id: existing.id,
                name: name,
                isEnabled: isEnabled,
                obsHost: obsHost,
                obsPort: obsPort,
                obsPassword: obsPassword,
                websiteURL: websiteURL,
                clientID: clientID,
                notes: notes,
                createdAt: existing.createdAt,
                lastModified: Date()
            )
        } else {
            profile = OBSProfile(
                name: name,
                isEnabled: isEnabled,
                obsHost: obsHost,
                obsPort: obsPort,
                obsPassword: obsPassword,
                websiteURL: websiteURL,
                clientID: clientID,
                notes: notes
            )
        }

        // Validate
        let validation = profile.validate()
        guard validation.isValid else {
            errorMessage = validation.errors.joined(separator: "\n")
            showError = true
            return
        }

        // Check unique client ID
        if !profileManager.validateUniqueClientID(clientID, excludingProfile: editingProfile?.id) {
            errorMessage = "Client ID '\(clientID)' is already in use by another profile"
            showError = true
            return
        }

        // Check unique name
        if !profileManager.validateUniqueName(name, excludingProfile: editingProfile?.id) {
            errorMessage = "Profile name '\(name)' is already in use"
            showError = true
            return
        }

        // Save
        onSave(profile)
        showSuccess = true
    }
}

#Preview {
    ProfileFormView { profile in
        print("Saved profile: \(profile.name)")
    }
}

#Preview("Edit Profile") {
    ProfileFormView(profile: OBSProfile.sampleProfiles[0]) { profile in
        print("Updated profile: \(profile.name)")
    }
}
