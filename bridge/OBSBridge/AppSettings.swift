//
//  AppSettings.swift
//  OBSBridge
//
//  Settings model and storage for OBS Bridge

import Foundation
import Combine

class AppSettings: ObservableObject {
    static let shared = AppSettings()

    // OBS Settings
    @Published var obsHost: String {
        didSet { UserDefaults.standard.set(obsHost, forKey: "obsHost") }
    }
    @Published var obsPort: String {
        didSet { UserDefaults.standard.set(obsPort, forKey: "obsPort") }
    }
    @Published var obsPassword: String {
        didSet { UserDefaults.standard.set(obsPassword, forKey: "obsPassword") }
    }

    // Website Settings
    @Published var websiteURL: String {
        didSet { UserDefaults.standard.set(websiteURL, forKey: "websiteURL") }
    }
    @Published var clientID: String {
        didSet { UserDefaults.standard.set(clientID, forKey: "clientID") }
    }

    // Auto-start
    @Published var autoConnect: Bool {
        didSet { UserDefaults.standard.set(autoConnect, forKey: "autoConnect") }
    }

    private init() {
        // Load from UserDefaults
        self.obsHost = UserDefaults.standard.string(forKey: "obsHost") ?? "localhost"
        self.obsPort = UserDefaults.standard.string(forKey: "obsPort") ?? "4455"
        self.obsPassword = UserDefaults.standard.string(forKey: "obsPassword") ?? ""
        self.websiteURL = UserDefaults.standard.string(forKey: "websiteURL") ?? "ws://localhost:8000/obs"
        self.clientID = UserDefaults.standard.string(forKey: "clientID") ?? "obs-client-\(UUID().uuidString.prefix(8))"
        self.autoConnect = UserDefaults.standard.bool(forKey: "autoConnect")
    }

    func validate() -> (isValid: Bool, errors: [String]) {
        var errors: [String] = []

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
}
