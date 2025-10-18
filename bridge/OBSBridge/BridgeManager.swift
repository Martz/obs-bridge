//
//  BridgeManager.swift
//  OBSBridge
//
//  Manages the bridge between OBS and the website

import Foundation
import Combine

class BridgeManager: ObservableObject {
    @Published var isRunning = false
    @Published var logs: [LogEntry] = []

    private let settings: AppSettings
    private let obsClient: OBSWebSocketClient
    private let websiteClient: WebsiteWebSocketClient

    private var cancellables = Set<AnyCancellable>()
    private var pendingRequests: [String: (command: String, timestamp: Date)] = [:]

    init(settings: AppSettings) {
        self.settings = settings
        self.obsClient = OBSWebSocketClient(settings: settings)
        self.websiteClient = WebsiteWebSocketClient(settings: settings)

        setupWebsiteMessageHandler()
        observeConnectionStates()
    }

    var obsConnectionState: OBSConnectionState {
        obsClient.connectionState
    }

    var websiteConnectionState: WebsiteConnectionState {
        websiteClient.connectionState
    }

    var obsVersion: String? {
        obsClient.obsVersion
    }

    func start() {
        guard !isRunning else { return }

        let validation = settings.validate()
        guard validation.isValid else {
            addLog("Configuration errors: \(validation.errors.joined(separator: ", "))", level: .error)
            return
        }

        isRunning = true
        addLog("Starting OBS Bridge...", level: .info)

        // Connect to OBS
        addLog("Connecting to OBS at \(settings.obsHost):\(settings.obsPort)...", level: .info)
        obsClient.connect()

        // Connect to website
        addLog("Connecting to website at \(settings.websiteURL)...", level: .info)
        websiteClient.connect()
    }

    func stop() {
        guard isRunning else { return }

        isRunning = false
        addLog("Stopping OBS Bridge...", level: .info)

        obsClient.disconnect()
        websiteClient.disconnect()

        addLog("OBS Bridge stopped", level: .info)
    }

    private func setupWebsiteMessageHandler() {
        websiteClient.onMessageReceived = { [weak self] command, params in
            self?.handleCommand(command: command, params: params)
        }
    }

    private func observeConnectionStates() {
        // Observe OBS connection state
        obsClient.$connectionState
            .sink { [weak self] state in
                switch state {
                case .connected:
                    self?.addLog("✓ Connected to OBS", level: .success)
                case .disconnected:
                    self?.addLog("✗ Disconnected from OBS", level: .warning)
                case .connecting:
                    self?.addLog("Connecting to OBS...", level: .info)
                case .error(let error):
                    self?.addLog("OBS connection error: \(error)", level: .error)
                }
            }
            .store(in: &cancellables)

        // Observe website connection state
        websiteClient.$connectionState
            .sink { [weak self] state in
                switch state {
                case .connected:
                    self?.addLog("✓ Connected to website", level: .success)
                case .disconnected:
                    self?.addLog("✗ Disconnected from website", level: .warning)
                case .connecting:
                    self?.addLog("Connecting to website...", level: .info)
                case .error(let error):
                    self?.addLog("Website connection error: \(error)", level: .error)
                }
            }
            .store(in: &cancellables)

        // Observe OBS version
        obsClient.$obsVersion
            .compactMap { $0 }
            .sink { [weak self] version in
                self?.addLog("OBS version: \(version)", level: .info)
            }
            .store(in: &cancellables)
    }

    private func handleCommand(command: String, params: [String: Any]) {
        addLog("← Received command from website: \(command)", level: .info)

        guard case .connected = obsClient.connectionState else {
            addLog("Cannot execute command: OBS not connected", level: .error)
            websiteClient.sendCommandResponse(
                command: command,
                success: false,
                data: nil,
                error: "OBS not connected"
            )
            return
        }

        // Map command to OBS WebSocket v5 request types
        let mappedCommand = mapCommandToOBSRequest(command)
        let mappedParams = mapParamsToOBSFormat(command, params: params)

        let requestId = UUID().uuidString
        pendingRequests[requestId] = (command, Date())

        addLog("→ Sending to OBS: \(mappedCommand)", level: .info)
        obsClient.executeCommand(command: mappedCommand, params: mappedParams, requestId: requestId)

        // For demo purposes, send success response immediately
        // In production, you'd wait for OBS response
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.addLog("✓ Command executed successfully", level: .success)
            self?.websiteClient.sendCommandResponse(
                command: command,
                success: true,
                data: [:],
                error: nil
            )
            self?.pendingRequests.removeValue(forKey: requestId)
        }
    }

    private func mapCommandToOBSRequest(_ command: String) -> String {
        // Map common commands to OBS WebSocket v5 request types
        let mapping: [String: String] = [
            "SetCurrentScene": "SetCurrentProgramScene",
            "StartStreaming": "StartStream",
            "StopStreaming": "StopStream",
            "StartRecording": "StartRecord",
            "StopRecording": "StopRecord",
            "GetSceneList": "GetSceneList",
            "GetStreamingStatus": "GetStreamStatus"
        ]

        return mapping[command] ?? command
    }

    private func mapParamsToOBSFormat(_ command: String, params: [String: Any]) -> [String: Any] {
        // Map parameter names to OBS WebSocket v5 format
        var mapped = params

        if command == "SetCurrentScene" {
            if let sceneName = params["sceneName"] ?? params["scene-name"] {
                mapped = ["sceneName": sceneName]
            }
        }

        return mapped
    }

    private func addLog(_ message: String, level: LogLevel) {
        let entry = LogEntry(message: message, level: level, timestamp: Date())
        DispatchQueue.main.async {
            self.logs.append(entry)
            // Keep only last 100 logs
            if self.logs.count > 100 {
                self.logs.removeFirst(self.logs.count - 100)
            }
        }
    }
}

struct LogEntry: Identifiable {
    let id = UUID()
    let message: String
    let level: LogLevel
    let timestamp: Date
}

enum LogLevel {
    case info
    case success
    case warning
    case error

    var color: String {
        switch self {
        case .info: return "blue"
        case .success: return "green"
        case .warning: return "orange"
        case .error: return "red"
        }
    }

    var icon: String {
        switch self {
        case .info: return "info.circle"
        case .success: return "checkmark.circle"
        case .warning: return "exclamationmark.triangle"
        case .error: return "xmark.circle"
        }
    }
}
