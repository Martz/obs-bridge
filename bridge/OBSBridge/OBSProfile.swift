//
//  OBSProfile.swift
//  OBSBridge
//
//  Profile model for managing multiple OBS instances
//

import Foundation

struct OBSProfile: Codable, Identifiable, Equatable {
    let id: UUID
    var name: String
    var isEnabled: Bool

    // OBS Connection Settings
    var obsHost: String
    var obsPort: String
    var obsPassword: String

    // Server Connection Settings
    var websiteURL: String
    var clientID: String

    // Optional metadata
    var notes: String
    var createdAt: Date
    var lastModified: Date

    init(
        id: UUID = UUID(),
        name: String,
        isEnabled: Bool = true,
        obsHost: String = "localhost",
        obsPort: String = "4455",
        obsPassword: String = "",
        websiteURL: String = "ws://localhost:8000/obs",
        clientID: String? = nil,
        notes: String = "",
        createdAt: Date = Date(),
        lastModified: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.isEnabled = isEnabled
        self.obsHost = obsHost
        self.obsPort = obsPort
        self.obsPassword = obsPassword
        self.websiteURL = websiteURL
        self.clientID = clientID ?? "obs-\(name.lowercased().replacingOccurrences(of: " ", with: "-"))-\(UUID().uuidString.prefix(8))"
        self.notes = notes
        self.createdAt = createdAt
        self.lastModified = lastModified
    }

    // Validation
    func validate() -> (isValid: Bool, errors: [String]) {
        var errors: [String] = []

        if name.trimmingCharacters(in: .whitespaces).isEmpty {
            errors.append("Profile name cannot be empty")
        }

        if obsHost.isEmpty {
            errors.append("OBS host cannot be empty")
        }

        if obsPort.isEmpty {
            errors.append("OBS port cannot be empty")
        } else if Int(obsPort) == nil {
            errors.append("OBS port must be a valid number")
        }

        if websiteURL.isEmpty {
            errors.append("Website URL cannot be empty")
        } else if !websiteURL.starts(with: "ws://") && !websiteURL.starts(with: "wss://") {
            errors.append("Website URL must start with ws:// or wss://")
        }

        if clientID.isEmpty {
            errors.append("Client ID cannot be empty")
        }

        return (errors.isEmpty, errors)
    }

    // Create a copy with updated lastModified timestamp
    func updated() -> OBSProfile {
        var copy = self
        copy.lastModified = Date()
        return copy
    }

    // Display name for UI (includes enabled status)
    var displayName: String {
        isEnabled ? name : "\(name) (Disabled)"
    }
}

// MARK: - Sample Profiles for Preview
extension OBSProfile {
    static let sampleProfiles: [OBSProfile] = [
        OBSProfile(
            name: "Main Studio",
            obsHost: "localhost",
            obsPort: "4455",
            websiteURL: "ws://localhost:8000/obs",
            notes: "Primary OBS instance for main recordings"
        ),
        OBSProfile(
            name: "Backup Studio",
            isEnabled: false,
            obsHost: "192.168.1.100",
            obsPort: "4456",
            websiteURL: "ws://localhost:8000/obs",
            notes: "Backup instance for redundancy"
        ),
        OBSProfile(
            name: "Stream PC",
            obsHost: "192.168.1.101",
            obsPort: "4455",
            websiteURL: "ws://production.example.com/obs",
            notes: "Dedicated streaming computer"
        )
    ]
}
