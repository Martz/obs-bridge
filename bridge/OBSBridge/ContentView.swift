//
//  ContentView.swift
//  OBSBridge
//
//  Main application interface

import SwiftUI

struct ContentView: View {
    @StateObject private var bridgeManager = BridgeManager(settings: AppSettings.shared)
    @State private var showingSettings = false

    var body: some View {
        VStack(spacing: 20) {
            // Header
            HStack {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .font(.system(size: 36))
                    .foregroundColor(.blue)

                VStack(alignment: .leading) {
                    Text("OBS Bridge")
                        .font(.title)
                        .fontWeight(.bold)

                    Text("Remote Control for OBS Studio")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Button(action: { showingSettings.toggle() }) {
                    Image(systemName: "gearshape.fill")
                        .font(.title2)
                }
                .buttonStyle(.plain)
            }
            .padding()

            Divider()

            // Status Cards
            HStack(spacing: 16) {
                StatusCard(
                    title: "OBS Studio",
                    state: bridgeManager.obsConnectionState,
                    version: bridgeManager.obsVersion
                )

                StatusCard(
                    title: "Control Website",
                    state: bridgeManager.websiteConnectionState
                )
            }
            .padding(.horizontal)

            // Control Buttons
            HStack(spacing: 12) {
                if bridgeManager.isRunning {
                    Button(action: { bridgeManager.stop() }) {
                        Label("Stop", systemImage: "stop.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .controlSize(.large)
                    .buttonStyle(.borderedProminent)
                    .tint(.red)
                } else {
                    Button(action: { bridgeManager.start() }) {
                        Label("Start Bridge", systemImage: "play.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .controlSize(.large)
                    .buttonStyle(.borderedProminent)
                    .tint(.green)
                }
            }
            .padding(.horizontal)

            // Activity Log
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Activity Log")
                        .font(.headline)
                    Spacer()
                    Button("Clear") {
                        bridgeManager.logs.removeAll()
                    }
                    .buttonStyle(.plain)
                    .font(.caption)
                }
                .padding(.horizontal)

                ScrollView {
                    ScrollViewReader { proxy in
                        LazyVStack(alignment: .leading, spacing: 4) {
                            ForEach(bridgeManager.logs) { log in
                                LogRow(entry: log)
                                    .id(log.id)
                            }
                        }
                        .onChange(of: bridgeManager.logs.count) { _ in
                            if let lastLog = bridgeManager.logs.last {
                                withAnimation {
                                    proxy.scrollTo(lastLog.id, anchor: .bottom)
                                }
                            }
                        }
                    }
                }
                .frame(height: 200)
                .background(Color(NSColor.textBackgroundColor))
                .cornerRadius(8)
                .padding(.horizontal)
            }

            Spacer()
        }
        .frame(width: 600, height: 600)
        .sheet(isPresented: $showingSettings) {
            SettingsView(settings: AppSettings.shared)
        }
        .onAppear {
            if AppSettings.shared.autoConnect {
                bridgeManager.start()
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

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
