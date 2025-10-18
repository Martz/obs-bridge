//
//  ProfileManager.swift
//  OBSBridge
//
//  Manages OBS profiles with persistence
//

import Foundation
import Combine

class ProfileManager: ObservableObject {
    static let shared = ProfileManager()

    @Published private(set) var profiles: [OBSProfile] = []

    private let userDefaultsKey = "obsProfiles"
    private let migrationKey = "hasmigratedFromLegacySettings"

    private init() {
        loadProfiles()
        migrateLegacySettingsIfNeeded()
    }

    // MARK: - CRUD Operations

    func addProfile(_ profile: OBSProfile) {
        profiles.append(profile)
        saveProfiles()
    }

    func updateProfile(_ profile: OBSProfile) {
        if let index = profiles.firstIndex(where: { $0.id == profile.id }) {
            profiles[index] = profile.updated()
            saveProfiles()
        }
    }

    func deleteProfile(_ profile: OBSProfile) {
        profiles.removeAll { $0.id == profile.id }
        saveProfiles()
    }

    func deleteProfiles(at offsets: IndexSet) {
        profiles.remove(atOffsets: offsets)
        saveProfiles()
    }

    func toggleProfileEnabled(_ profile: OBSProfile) {
        if let index = profiles.firstIndex(where: { $0.id == profile.id }) {
            profiles[index].isEnabled.toggle()
            profiles[index].lastModified = Date()
            saveProfiles()
        }
    }

    func getProfile(byId id: UUID) -> OBSProfile? {
        profiles.first { $0.id == id }
    }

    func getProfile(byClientId clientId: String) -> OBSProfile? {
        profiles.first { $0.clientID == clientId }
    }

    // MARK: - Computed Properties

    var enabledProfiles: [OBSProfile] {
        profiles.filter { $0.isEnabled }
    }

    var hasProfiles: Bool {
        !profiles.isEmpty
    }

    var hasEnabledProfiles: Bool {
        !enabledProfiles.isEmpty
    }

    // MARK: - Persistence

    private func saveProfiles() {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(profiles)
            UserDefaults.standard.set(data, forKey: userDefaultsKey)
        } catch {
            print("ProfileManager: Failed to save profiles: \(error)")
        }
    }

    private func loadProfiles() {
        guard let data = UserDefaults.standard.data(forKey: userDefaultsKey) else {
            print("ProfileManager: No saved profiles found")
            return
        }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            profiles = try decoder.decode([OBSProfile].self, from: data)
            print("ProfileManager: Loaded \(profiles.count) profile(s)")
        } catch {
            print("ProfileManager: Failed to load profiles: \(error)")
        }
    }

    // MARK: - Migration from Legacy Settings

    private func migrateLegacySettingsIfNeeded() {
        // Check if migration has already been done
        if UserDefaults.standard.bool(forKey: migrationKey) {
            return
        }

        // Check if legacy settings exist
        let legacyHost = UserDefaults.standard.string(forKey: "obsHost")
        let legacyPort = UserDefaults.standard.string(forKey: "obsPort")
        let legacyPassword = UserDefaults.standard.string(forKey: "obsPassword")
        let legacyWebsiteURL = UserDefaults.standard.string(forKey: "websiteURL")
        let legacyClientID = UserDefaults.standard.string(forKey: "clientID")

        // Only migrate if we have at least some legacy data and no profiles
        if legacyHost != nil && profiles.isEmpty {
            let migratedProfile = OBSProfile(
                name: "Migrated Profile",
                isEnabled: true,
                obsHost: legacyHost ?? "localhost",
                obsPort: legacyPort ?? "4455",
                obsPassword: legacyPassword ?? "",
                websiteURL: legacyWebsiteURL ?? "ws://localhost:8000/obs",
                clientID: legacyClientID,
                notes: "Automatically migrated from previous version"
            )

            profiles.append(migratedProfile)
            saveProfiles()

            print("ProfileManager: Migrated legacy settings to profile: \(migratedProfile.name)")
        }

        // Mark migration as complete
        UserDefaults.standard.set(true, forKey: migrationKey)
    }

    // MARK: - Validation

    func validateUniqueClientID(_ clientID: String, excludingProfile profileID: UUID? = nil) -> Bool {
        let conflictingProfiles = profiles.filter { profile in
            profile.clientID == clientID && profile.id != profileID
        }
        return conflictingProfiles.isEmpty
    }

    func validateUniqueName(_ name: String, excludingProfile profileID: UUID? = nil) -> Bool {
        let conflictingProfiles = profiles.filter { profile in
            profile.name == name && profile.id != profileID
        }
        return conflictingProfiles.isEmpty
    }

    // MARK: - Bulk Operations

    func enableAllProfiles() {
        for index in profiles.indices {
            profiles[index].isEnabled = true
            profiles[index].lastModified = Date()
        }
        saveProfiles()
    }

    func disableAllProfiles() {
        for index in profiles.indices {
            profiles[index].isEnabled = false
            profiles[index].lastModified = Date()
        }
        saveProfiles()
    }

    func deleteAllProfiles() {
        profiles.removeAll()
        saveProfiles()
    }

    // MARK: - Import/Export (Future Enhancement)

    func exportProfiles() -> Data? {
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            encoder.outputFormatting = .prettyPrinted
            return try encoder.encode(profiles)
        } catch {
            print("ProfileManager: Failed to export profiles: \(error)")
            return nil
        }
    }

    func importProfiles(from data: Data, replaceExisting: Bool = false) -> Bool {
        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let importedProfiles = try decoder.decode([OBSProfile].self, from: data)

            if replaceExisting {
                profiles = importedProfiles
            } else {
                // Merge, avoiding duplicates by clientID
                for imported in importedProfiles {
                    if !profiles.contains(where: { $0.clientID == imported.clientID }) {
                        profiles.append(imported)
                    }
                }
            }

            saveProfiles()
            return true
        } catch {
            print("ProfileManager: Failed to import profiles: \(error)")
            return false
        }
    }
}
