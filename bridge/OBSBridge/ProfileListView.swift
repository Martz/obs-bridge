//
//  ProfileListView.swift
//  OBSBridge
//
//  List view for managing OBS profiles
//

import SwiftUI

struct ProfileListView: View {
    @Environment(\.dismiss) var dismiss
    @ObservedObject var profileManager = ProfileManager.shared
    @ObservedObject var instanceManager = InstanceManager.shared

    @State private var showingAddProfile = false
    @State private var editingProfile: OBSProfile?
    @State private var showDeleteConfirmation = false
    @State private var profileToDelete: OBSProfile?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header with statistics
                statisticsHeader

                Divider()

                // Profile list
                if profileManager.profiles.isEmpty {
                    emptyState
                } else {
                    profileList
                }
            }
            .navigationTitle("OBS Profiles")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button(action: { showingAddProfile = true }) {
                        Label("Add Profile", systemImage: "plus")
                    }
                }
                ToolbarItem(placement: .automatic) {
                    Button(action: { dismiss() }) {
                        Text("Done")
                    }
                }
            }
        }
        .frame(width: 700, height: 500)
        .sheet(isPresented: $showingAddProfile) {
            ProfileFormView { profile in
                profileManager.addProfile(profile)
            }
        }
        .sheet(item: $editingProfile) { profile in
            ProfileFormView(profile: profile) { updatedProfile in
                profileManager.updateProfile(updatedProfile)
            }
        }
        .alert("Delete Profile", isPresented: $showDeleteConfirmation) {
            Button("Cancel", role: .cancel) { }
            Button("Delete", role: .destructive) {
                if let profile = profileToDelete {
                    deleteProfile(profile)
                }
            }
        } message: {
            if let profile = profileToDelete {
                Text("Are you sure you want to delete '\(profile.name)'? This action cannot be undone.")
            }
        }
    }

    private var statisticsHeader: some View {
        VStack(spacing: 8) {
            HStack(spacing: 20) {
                StatisticView(
                    title: "Total",
                    value: "\(profileManager.profiles.count)",
                    icon: "rectangle.stack",
                    color: .blue
                )

                StatisticView(
                    title: "Enabled",
                    value: "\(profileManager.enabledProfiles.count)",
                    icon: "checkmark.circle",
                    color: .green
                )

                StatisticView(
                    title: "Running",
                    value: "\(instanceManager.runningCount)",
                    icon: "play.circle",
                    color: .orange
                )

                StatisticView(
                    title: "Connected",
                    value: "\(instanceManager.statistics.connectedToOBS)",
                    icon: "link.circle",
                    color: .purple
                )
            }
            .padding()
        }
        .background(Color(NSColor.controlBackgroundColor))
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "rectangle.stack.badge.plus")
                .font(.system(size: 48))
                .foregroundColor(.secondary)

            Text("No Profiles")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Create your first OBS profile to get started")
                .foregroundColor(.secondary)

            Button(action: { showingAddProfile = true }) {
                Label("Add Profile", systemImage: "plus")
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var profileList: some View {
        List {
            ForEach(profileManager.profiles) { profile in
                ProfileRow(
                    profile: profile,
                    instance: instanceManager.getInstance(for: profile.id),
                    onToggleEnabled: {
                        profileManager.toggleProfileEnabled(profile)
                    },
                    onEdit: {
                        editingProfile = profile
                    },
                    onDelete: {
                        profileToDelete = profile
                        showDeleteConfirmation = true
                    },
                    onStart: {
                        instanceManager.startInstance(profile.id)
                    },
                    onStop: {
                        instanceManager.stopInstance(profile.id)
                    }
                )
            }
            .onDelete { indexSet in
                profileManager.deleteProfiles(at: indexSet)
            }
        }
    }

    private func deleteProfile(_ profile: OBSProfile) {
        // Stop instance if running
        if let instance = instanceManager.getInstance(for: profile.id), instance.isRunning {
            instanceManager.stopInstance(profile.id)
        }
        profileManager.deleteProfile(profile)
    }
}

// MARK: - Profile Row

struct ProfileRow: View {
    let profile: OBSProfile
    let instance: BridgeInstance?
    let onToggleEnabled: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void
    let onStart: () -> Void
    let onStop: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Status indicator
            Circle()
                .fill(statusColor)
                .frame(width: 10, height: 10)

            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(profile.name)
                        .font(.headline)

                    if !profile.isEnabled {
                        Text("Disabled")
                            .font(.caption)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.secondary.opacity(0.2))
                            .cornerRadius(4)
                    }

                    if instance?.isRunning == true {
                        Text("Running")
                            .font(.caption)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.green.opacity(0.2))
                            .foregroundColor(.green)
                            .cornerRadius(4)
                    }
                }

                Text("\(profile.obsHost):\(profile.obsPort)")
                    .font(.caption)
                    .foregroundColor(.secondary)

                if !profile.notes.isEmpty {
                    Text(profile.notes)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                // Connection status
                if let instance = instance, instance.isRunning {
                    HStack(spacing: 8) {
                        ConnectionBadge(
                            label: "OBS",
                            isConnected: instance.isOBSConnected
                        )
                        ConnectionBadge(
                            label: "Server",
                            isConnected: instance.isServerConnected
                        )
                        if let version = instance.obsVersion {
                            Text("v\(version)")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }

            Spacer()

            // Controls
            HStack(spacing: 8) {
                Toggle("", isOn: Binding(
                    get: { profile.isEnabled },
                    set: { _ in onToggleEnabled() }
                ))
                .labelsHidden()
                .help("Enable/Disable Profile")

                if instance?.isRunning == true {
                    Button(action: onStop) {
                        Image(systemName: "stop.fill")
                    }
                    .buttonStyle(.bordered)
                    .help("Stop Instance")
                } else if profile.isEnabled {
                    Button(action: onStart) {
                        Image(systemName: "play.fill")
                    }
                    .buttonStyle(.bordered)
                    .help("Start Instance")
                }

                Button(action: onEdit) {
                    Image(systemName: "pencil")
                }
                .buttonStyle(.bordered)
                .help("Edit Profile")

                Button(action: onDelete) {
                    Image(systemName: "trash")
                }
                .buttonStyle(.bordered)
                .foregroundColor(.red)
                .help("Delete Profile")
            }
        }
        .padding(.vertical, 8)
    }

    private var statusColor: Color {
        guard profile.isEnabled else { return .gray }
        guard let instance = instance, instance.isRunning else { return .secondary }

        if instance.isOBSConnected && instance.isServerConnected {
            return .green
        } else if instance.isOBSConnected || instance.isServerConnected {
            return .orange
        } else {
            return .red
        }
    }
}

// MARK: - Supporting Views

struct StatisticView: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)

            VStack(alignment: .leading, spacing: 2) {
                Text(value)
                    .font(.title2)
                    .fontWeight(.bold)
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct ConnectionBadge: View {
    let label: String
    let isConnected: Bool

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(isConnected ? Color.green : Color.red)
                .frame(width: 6, height: 6)
            Text(label)
                .font(.caption2)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 2)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(4)
    }
}

#Preview {
    ProfileListView()
}
