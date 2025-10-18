//
//  ContentView.swift
//  OBSBridge
//
//  Main application interface

import SwiftUI

struct ContentView: View {
    @ObservedObject var instanceManager = InstanceManager.shared
    @ObservedObject var profileManager = ProfileManager.shared
    @State private var showingProfiles = false
    @State private var selectedTab = 0

    var body: some View {
        VStack(spacing: 0) {
            // Header
            header

            Divider()

            // Main content
            TabView(selection: $selectedTab) {
                dashboardView
                    .tabItem {
                        Label("Dashboard", systemImage: "square.grid.2x2")
                    }
                    .tag(0)

                activityLogView
                    .tabItem {
                        Label("Activity Log", systemImage: "list.bullet.rectangle")
                    }
                    .tag(1)
            }
        }
        .frame(width: 800, height: 700)
        .sheet(isPresented: $showingProfiles) {
            ProfileListView()
        }
    }

    private var header: some View {
        HStack {
            Image(systemName: "antenna.radiowaves.left.and.right")
                .font(.system(size: 32))
                .foregroundColor(.blue)

            VStack(alignment: .leading, spacing: 2) {
                Text("OBS Bridge")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("\(profileManager.profiles.count) profiles • \(instanceManager.runningCount) running")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Quick stats
            HStack(spacing: 16) {
                QuickStat(
                    icon: "checkmark.circle.fill",
                    value: instanceManager.statistics.connectedToOBS,
                    total: instanceManager.runningCount,
                    color: .green,
                    label: "OBS"
                )

                QuickStat(
                    icon: "link.circle.fill",
                    value: instanceManager.statistics.connectedToServer,
                    total: instanceManager.runningCount,
                    color: .purple,
                    label: "Server"
                )
            }

            Divider()
                .frame(height: 30)
                .padding(.horizontal, 8)

            // Control buttons
            HStack(spacing: 8) {
                Button(action: { instanceManager.startAllEnabled() }) {
                    Label("Start All", systemImage: "play.fill")
                }
                .buttonStyle(.bordered)
                .disabled(!profileManager.hasEnabledProfiles)

                Button(action: { instanceManager.stopAll() }) {
                    Label("Stop All", systemImage: "stop.fill")
                }
                .buttonStyle(.bordered)
                .disabled(instanceManager.runningCount == 0)

                Button(action: { showingProfiles = true }) {
                    Label("Manage Profiles", systemImage: "rectangle.stack")
                }
                .buttonStyle(.borderedProminent)
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
    }

    private var dashboardView: some View {
        ScrollView {
            VStack(spacing: 16) {
                if profileManager.profiles.isEmpty {
                    emptyState
                } else {
                    instanceGrid
                }
            }
            .padding()
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "rectangle.stack.badge.plus")
                .font(.system(size: 64))
                .foregroundColor(.secondary)

            Text("No Profiles Configured")
                .font(.title)
                .fontWeight(.semibold)

            Text("Create OBS profiles to connect to multiple OBS Studio instances")
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 400)

            Button(action: { showingProfiles = true }) {
                Label("Create Profile", systemImage: "plus")
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var instanceGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            ForEach(profileManager.profiles) { profile in
                if let instance = instanceManager.getInstance(for: profile.id) {
                    InstanceCard(
                        instance: instance,
                        onStart: {
                            instanceManager.startInstance(profile.id)
                        },
                        onStop: {
                            instanceManager.stopInstance(profile.id)
                        },
                        onRestart: {
                            instanceManager.restartInstance(profile.id)
                        }
                    )
                }
            }
        }
    }

    private var activityLogView: some View {
        VStack(spacing: 8) {
            HStack {
                Text("Combined Activity Log")
                    .font(.headline)

                Spacer()

                Text("\(instanceManager.allLogs.count) entries")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Button("Clear All") {
                    instanceManager.clearAllLogs()
                }
                .buttonStyle(.bordered)
                .controlSize(.small)
            }
            .padding(.horizontal)
            .padding(.top)

            if instanceManager.allLogs.isEmpty {
                VStack(spacing: 12) {
                    Spacer()
                    Image(systemName: "tray")
                        .font(.system(size: 48))
                        .foregroundColor(.secondary)
                    Text("No Activity")
                        .font(.title3)
                        .foregroundColor(.secondary)
                    Spacer()
                }
            } else {
                ScrollView {
                    ScrollViewReader { proxy in
                        LazyVStack(alignment: .leading, spacing: 4) {
                            ForEach(instanceManager.allLogs) { log in
                                LogRow(entry: log)
                                    .id(log.id)
                            }
                        }
                        .onChange(of: instanceManager.allLogs.count) { _ in
                            if let lastLog = instanceManager.allLogs.first {
                                withAnimation {
                                    proxy.scrollTo(lastLog.id, anchor: .top)
                                }
                            }
                        }
                    }
                }
                .background(Color(NSColor.textBackgroundColor))
            }
        }
    }
}

struct StatusCard: View {
    let title: String
    let state: Any
    var version: String? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)

            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 12, height: 12)

                Text(statusText)
                    .font(.subheadline)
            }

            if let version = version {
                Text("Version \(version)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
    }

    private var statusColor: Color {
        if let obsState = state as? OBSConnectionState {
            switch obsState {
            case .connected: return .green
            case .connecting: return .yellow
            case .disconnected: return .gray
            case .error: return .red
            }
        } else if let websiteState = state as? WebsiteConnectionState {
            switch websiteState {
            case .connected: return .green
            case .connecting: return .yellow
            case .disconnected: return .gray
            case .error: return .red
            }
        }
        return .gray
    }

    private var statusText: String {
        if let obsState = state as? OBSConnectionState {
            switch obsState {
            case .connected: return "Connected"
            case .connecting: return "Connecting..."
            case .disconnected: return "Disconnected"
            case .error(let msg): return "Error: \(msg)"
            }
        } else if let websiteState = state as? WebsiteConnectionState {
            switch websiteState {
            case .connected: return "Connected"
            case .connecting: return "Connecting..."
            case .disconnected: return "Disconnected"
            case .error(let msg): return "Error: \(msg)"
            }
        }
        return "Unknown"
    }
}

struct LogRow: View {
    let entry: LogEntry

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: entry.level.icon)
                .foregroundColor(iconColor)
                .frame(width: 20)

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.message)
                    .font(.system(.caption, design: .monospaced))

                Text(timeString)
                    .font(.system(.caption2, design: .monospaced))
                    .foregroundColor(.secondary)
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
    }

    private var iconColor: Color {
        switch entry.level {
        case .info: return .blue
        case .success: return .green
        case .warning: return .orange
        case .error: return .red
        }
    }

    private var timeString: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .medium
        return formatter.string(from: entry.timestamp)
    }
}

// MARK: - Supporting Views

struct QuickStat: View {
    let icon: String
    let value: Int
    let total: Int
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundColor(color)
                .font(.title3)

            VStack(alignment: .leading, spacing: 0) {
                Text("\(value)/\(total)")
                    .font(.system(.body, design: .rounded))
                    .fontWeight(.semibold)
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct InstanceCard: View {
    @ObservedObject var instance: BridgeInstance
    let onStart: () -> Void
    let onStop: () -> Void
    let onRestart: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Circle()
                    .fill(statusColor)
                    .frame(width: 12, height: 12)

                VStack(alignment: .leading, spacing: 2) {
                    Text(instance.profile.name)
                        .font(.headline)

                    Text("\(instance.profile.obsHost):\(instance.profile.obsPort)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                if !instance.profile.isEnabled {
                    Image(systemName: "pause.circle")
                        .foregroundColor(.secondary)
                        .help("Profile Disabled")
                }
            }

            // Connection status
            if instance.isRunning {
                HStack(spacing: 12) {
                    ConnectionStatus(
                        label: "OBS",
                        icon: "desktopcomputer",
                        isConnected: instance.isOBSConnected
                    )

                    ConnectionStatus(
                        label: "Server",
                        icon: "server.rack",
                        isConnected: instance.isServerConnected
                    )
                }

                if let version = instance.obsVersion {
                    Text("OBS v\(version)")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            } else {
                Text(instance.profile.isEnabled ? "Stopped" : "Disabled")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Divider()

            // Controls
            HStack(spacing: 8) {
                if instance.isRunning {
                    Button(action: onStop) {
                        Label("Stop", systemImage: "stop.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .tint(.red)
                    .controlSize(.small)

                    Button(action: onRestart) {
                        Image(systemName: "arrow.clockwise")
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .help("Restart")
                } else if instance.profile.isEnabled {
                    Button(action: onStart) {
                        Label("Start", systemImage: "play.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                } else {
                    Button(action: {}) {
                        Label("Disabled", systemImage: "pause.circle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                    .disabled(true)
                }
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
    }

    private var statusColor: Color {
        guard instance.profile.isEnabled else { return .gray }
        guard instance.isRunning else { return .secondary }

        if instance.isOBSConnected && instance.isServerConnected {
            return .green
        } else if instance.isOBSConnected || instance.isServerConnected {
            return .orange
        } else {
            return .red
        }
    }
}

struct ConnectionStatus: View {
    let label: String
    let icon: String
    let isConnected: Bool

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .foregroundColor(isConnected ? .green : .secondary)
                .font(.caption)

            VStack(alignment: .leading, spacing: 0) {
                Text(label)
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text(isConnected ? "Connected" : "Disconnected")
                    .font(.caption)
                    .foregroundColor(isConnected ? .green : .secondary)
            }
        }
    }
}

#Preview {
    ContentView()
}
