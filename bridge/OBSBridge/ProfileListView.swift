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
        .frame(width: 900, height: 650)
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
                .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                .listRowSeparator(.visible)
            }
            .onDelete { indexSet in
                profileManager.deleteProfiles(at: indexSet)
            }
        }
        .listStyle(.inset)
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
        HStack(spacing: 16) {
            // Status indicator
            Circle()
                .fill(statusColor)
                .frame(width: 12, height: 12)

            VStack(alignment: .leading, spacing: 6) {
                // Title row
                HStack(spacing: 8) {
                    Text(profile.name)
                        .font(.system(size: 15, weight: .semibold))

                    if !profile.isEnabled {
                        StatusBadge(text: "Disabled", color: .secondary)
                    }

                    if instance?.isRunning == true {
                        StatusBadge(text: "Running", color: .green)
                    }
                }

                // Connection info
                HStack(spacing: 6) {
                    Image(systemName: "desktopcomputer")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(profile.obsHost):\(profile.obsPort)")
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)

                    Text("•")
                        .foregroundColor(.secondary)
                        .font(.caption)

                    Image(systemName: "person.text.rectangle")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(profile.clientID)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }

                // Notes if present
                if !profile.notes.isEmpty {
                    Text(profile.notes)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                }

                // Connection status when running
                if let instance = instance, instance.isRunning {
                    HStack(spacing: 10) {
                        ConnectionBadge(
                            label: "OBS",
                            isConnected: instance.isOBSConnected
                        )
                        ConnectionBadge(
                            label: "Server",
                            isConnected: instance.isServerConnected
                        )
                        if let version = instance.obsVersion {
                            HStack(spacing: 4) {
                                Image(systemName: "info.circle")
                                    .font(.caption2)
                                Text("v\(version)")
                                    .font(.system(size: 11))
                            }
                            .foregroundColor(.secondary)
                        }
                    }
                }
            }

            Spacer()

            // Controls
            HStack(spacing: 10) {
                // Enable/Disable toggle
                VStack(spacing: 2) {
                    Toggle("", isOn: Binding(
                        get: { profile.isEnabled },
                        set: { _ in onToggleEnabled() }
                    ))
                    .labelsHidden()
                    .help("Enable/Disable Profile")

                    Text("Enable")
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                }

                Divider()
                    .frame(height: 40)

                // Start/Stop button
                if instance?.isRunning == true {
                    Button(action: onStop) {
                        VStack(spacing: 4) {
                            Image(systemName: "stop.fill")
                                .font(.system(size: 16))
                            Text("Stop")
                                .font(.system(size: 9))
                        }
                    }
                    .buttonStyle(.bordered)
                    .tint(.red)
                    .controlSize(.large)
                    .help("Stop Instance")
                } else if profile.isEnabled {
                    Button(action: onStart) {
                        VStack(spacing: 4) {
                            Image(systemName: "play.fill")
                                .font(.system(size: 16))
                            Text("Start")
                                .font(.system(size: 9))
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .help("Start Instance")
                } else {
                    Button(action: {}) {
                        VStack(spacing: 4) {
                            Image(systemName: "play.fill")
                                .font(.system(size: 16))
                            Text("Start")
                                .font(.system(size: 9))
                        }
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.large)
                    .disabled(true)
                }

                Button(action: onEdit) {
                    VStack(spacing: 4) {
                        Image(systemName: "pencil")
                            .font(.system(size: 16))
                        Text("Edit")
                            .font(.system(size: 9))
                    }
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
                .help("Edit Profile")

                Button(action: onDelete) {
                    VStack(spacing: 4) {
                        Image(systemName: "trash")
                            .font(.system(size: 16))
                        Text("Delete")
                            .font(.system(size: 9))
                    }
                }
                .buttonStyle(.bordered)
                .tint(.red)
                .controlSize(.large)
                .help("Delete Profile")
            }
        }
        .padding(.vertical, 12)
        .padding(.horizontal, 4)
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

struct StatusBadge: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .cornerRadius(6)
    }
}

struct ConnectionBadge: View {
    let label: String
    let isConnected: Bool

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(isConnected ? Color.green : Color.red)
                .frame(width: 7, height: 7)
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(isConnected ? .primary : .secondary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(
            RoundedRectangle(cornerRadius: 6)
                .fill(isConnected ? Color.green.opacity(0.1) : Color.secondary.opacity(0.08))
        )
    }
}

#Preview {
    ProfileListView()
}
