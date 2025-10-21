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
        didSet { saveIfShared("obsHost", obsHost) }
    }
    @Published var obsPort: String {
        didSet { saveIfShared("obsPort", obsPort) }
    }
    @Published var obsPassword: String {
        didSet { saveIfShared("obsPassword", obsPassword) }
    }

    // Website Settings
    @Published var websiteURL: String {
        didSet { saveIfShared("websiteURL", websiteURL) }
    }
    @Published var clientID: String {
        didSet { saveIfShared("clientID", clientID) }
    }
    @Published var authToken: String {
        didSet { saveIfShared("authToken", authToken) }
    }

    // Auto-start
    @Published var autoConnect: Bool {
        didSet { saveIfShared("autoConnect", autoConnect) }
    }

    private let isSharedInstance: Bool

    private init() {
        self.isSharedInstance = true
        // Load from UserDefaults
        self.obsHost = UserDefaults.standard.string(forKey: "obsHost") ?? "localhost"
        self.obsPort = UserDefaults.standard.string(forKey: "obsPort") ?? "4455"
        self.obsPassword = UserDefaults.standard.string(forKey: "obsPassword") ?? ""
        self.websiteURL = UserDefaults.standard.string(forKey: "websiteURL") ?? "ws://localhost:8000/obs"
        self.clientID = UserDefaults.standard.string(forKey: "clientID") ?? "obs-client-\(UUID().uuidString.prefix(8))"
        self.authToken = UserDefaults.standard.string(forKey: "authToken") ?? ""
        self.autoConnect = UserDefaults.standard.bool(forKey: "autoConnect")
    }

    // Initialiser for profile-based instances (not shared, no persistence)
    init(obsHost: String, obsPort: String, obsPassword: String, websiteURL: String, clientID: String, authToken: String = "") {
        self.isSharedInstance = false
        self.obsHost = obsHost
        self.obsPort = obsPort
        self.obsPassword = obsPassword
        self.websiteURL = websiteURL
        self.clientID = clientID
        self.authToken = authToken
        self.autoConnect = false
    }

    private func saveIfShared(_ key: String, _ value: Any) {
        guard isSharedInstance else { return }
        UserDefaults.standard.set(value, forKey: key)
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

        if authToken.isEmpty {
            errors.append("Authentication token cannot be empty")
        }

        return (errors.isEmpty, errors)
    }
}
