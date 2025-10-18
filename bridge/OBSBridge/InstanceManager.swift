//
//  InstanceManager.swift
//  OBSBridge
//
//  Coordinates multiple BridgeManager instances for multi-OBS support
//

import Foundation
import Combine

class InstanceManager: ObservableObject {
    static let shared = InstanceManager()

    @Published private(set) var instances: [BridgeInstance] = []
    @Published private(set) var allLogs: [LogEntry] = []

    private let profileManager = ProfileManager.shared
    private var cancellables = Set<AnyCancellable>()

    private init() {
        // Observe profile changes
        profileManager.$profiles
            .sink { [weak self] profiles in
                self?.syncInstances(with: profiles)
            }
            .store(in: &cancellables)
    }

    // MARK: - Instance Management

    private func syncInstances(with profiles: [OBSProfile]) {
        // Remove instances for deleted profiles
        instances.removeAll { instance in
            !profiles.contains { $0.id == instance.profile.id }
        }

        // Add instances for new profiles
        for profile in profiles {
            if !instances.contains(where: { $0.profile.id == profile.id }) {
                createInstance(for: profile)
            }
        }

        // Update instances for modified profiles
        for index in instances.indices {
            if let updatedProfile = profiles.first(where: { $0.id == instances[index].profile.id }),
               updatedProfile != instances[index].profile {
                // Profile has been updated
                let wasRunning = instances[index].isRunning

                // Stop the instance if it's running
                if wasRunning {
                    stopInstance(instances[index].profile.id)
                }

                // Update the profile
                instances[index].profile = updatedProfile
                instances[index].updateSettings()

                // Restart if it was running and still enabled
                if wasRunning && updatedProfile.isEnabled {
                    startInstance(updatedProfile.id)
                }
            }
        }
    }

    private func createInstance(for profile: OBSProfile) {
        let settings = ProfileAppSettings(profile: profile)
        let bridgeManager = BridgeManager(settings: settings, instanceName: profile.name)
        let instance = BridgeInstance(
            profile: profile,
            bridgeManager: bridgeManager,
            settings: settings
        )

        // Subscribe to bridge manager logs
        bridgeManager.$logs
            .sink { [weak self] logs in
                self?.updateCombinedLogs()
            }
            .store(in: &cancellables)

        instances.append(instance)
        print("InstanceManager: Created instance for profile '\(profile.name)'")
    }

    // MARK: - Instance Control

    func startInstance(_ profileId: UUID) {
        guard let instance = instances.first(where: { $0.profile.id == profileId }) else {
            print("InstanceManager: Instance not found for profile \(profileId)")
            return
        }

        guard instance.profile.isEnabled else {
            print("InstanceManager: Cannot start disabled profile '\(instance.profile.name)'")
            return
        }

        instance.bridgeManager.start()
    }

    func stopInstance(_ profileId: UUID) {
        guard let instance = instances.first(where: { $0.profile.id == profileId }) else {
            print("InstanceManager: Instance not found for profile \(profileId)")
            return
        }

        instance.bridgeManager.stop()
    }

    func restartInstance(_ profileId: UUID) {
        stopInstance(profileId)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.startInstance(profileId)
        }
    }

    func startAllEnabled() {
        for instance in instances where instance.profile.isEnabled && !instance.isRunning {
            startInstance(instance.profile.id)
        }
    }

    func stopAll() {
        for instance in instances where instance.isRunning {
            stopInstance(instance.profile.id)
        }
    }

    // MARK: - Instance Queries

    func getInstance(for profileId: UUID) -> BridgeInstance? {
        instances.first { $0.profile.id == profileId }
    }

    func getRunningInstances() -> [BridgeInstance] {
        instances.filter { $0.isRunning }
    }

    func getEnabledInstances() -> [BridgeInstance] {
        instances.filter { $0.profile.isEnabled }
    }

    var runningCount: Int {
        instances.filter { $0.isRunning }.count
    }

    var enabledCount: Int {
        instances.filter { $0.profile.isEnabled }.count
    }

    // MARK: - Logging

    private func updateCombinedLogs() {
        var combined: [LogEntry] = []

        for instance in instances {
            combined.append(contentsOf: instance.bridgeManager.logs)
        }

        // Sort by timestamp, newest first
        allLogs = combined.sorted { $0.timestamp > $1.timestamp }

        // Keep only last 500 logs total
        if allLogs.count > 500 {
            allLogs = Array(allLogs.prefix(500))
        }
    }

    func clearAllLogs() {
        for instance in instances {
            instance.bridgeManager.clearLogs()
        }
        allLogs.removeAll()
    }

    func clearLogs(for profileId: UUID) {
        getInstance(for: profileId)?.bridgeManager.clearLogs()
        updateCombinedLogs()
    }

    // MARK: - Statistics

    var statistics: InstanceStatistics {
        InstanceStatistics(
            totalInstances: instances.count,
            enabledInstances: enabledCount,
            runningInstances: runningCount,
            connectedToOBS: instances.filter { $0.isOBSConnected }.count,
            connectedToServer: instances.filter { $0.isServerConnected }.count
        )
    }
}

// MARK: - BridgeInstance Model

class BridgeInstance: ObservableObject, Identifiable {
    let id: UUID
    @Published var profile: OBSProfile
    let bridgeManager: BridgeManager
    var settings: ProfileAppSettings

    init(profile: OBSProfile, bridgeManager: BridgeManager, settings: ProfileAppSettings) {
        self.id = profile.id
        self.profile = profile
        self.bridgeManager = bridgeManager
        self.settings = settings
    }

    var isRunning: Bool {
        bridgeManager.isRunning
    }

    var isOBSConnected: Bool {
        if case .connected = bridgeManager.obsConnectionState {
            return true
        }
        return false
    }

    var isServerConnected: Bool {
        if case .connected = bridgeManager.websiteConnectionState {
            return true
        }
        return false
    }

    var obsConnectionState: OBSConnectionState {
        bridgeManager.obsConnectionState
    }

    var websiteConnectionState: WebsiteConnectionState {
        bridgeManager.websiteConnectionState
    }

    var obsVersion: String? {
        bridgeManager.obsVersion
    }

    func updateSettings() {
        settings.updateFromProfile(profile)
    }
}

// MARK: - ProfileAppSettings

class ProfileAppSettings: AppSettings {
    private var profile: OBSProfile

    init(profile: OBSProfile) {
        self.profile = profile
        super.init(
            obsHost: profile.obsHost,
            obsPort: profile.obsPort,
            obsPassword: profile.obsPassword,
            websiteURL: profile.websiteURL,
            clientID: profile.clientID
        )
    }

    func updateFromProfile(_ profile: OBSProfile) {
        self.profile = profile
        self.obsHost = profile.obsHost
        self.obsPort = profile.obsPort
        self.obsPassword = profile.obsPassword
        self.websiteURL = profile.websiteURL
        self.clientID = profile.clientID
    }
}

// MARK: - Statistics Model

struct InstanceStatistics {
    let totalInstances: Int
    let enabledInstances: Int
    let runningInstances: Int
    let connectedToOBS: Int
    let connectedToServer: Int

    var allConnected: Bool {
        runningInstances > 0 && connectedToOBS == runningInstances && connectedToServer == runningInstances
    }

    var hasIssues: Bool {
        runningInstances > 0 && (connectedToOBS < runningInstances || connectedToServer < runningInstances)
    }
}
