//
//  WebsiteWebSocketClient.swift
//  OBSBridge
//
//  WebSocket client for connecting to the control website

import Foundation
import Combine

enum WebsiteConnectionState: Equatable {
    case disconnected
    case connecting
    case connected
    case error(String)
}

class WebsiteWebSocketClient: NSObject, ObservableObject {
    @Published var connectionState: WebsiteConnectionState = .disconnected

    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession?
    private let settings: AppSettings

    var onMessageReceived: ((String, [String: Any]) -> Void)?

    init(settings: AppSettings) {
        self.settings = settings
        super.init()
        self.session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
    }

    func connect() {
        guard connectionState != .connecting && connectionState != .connected else {
            print("Website: Already connecting or connected")
            return
        }

        print("Website: Starting connection to \(settings.websiteURL)")
        connectionState = .connecting

        guard var urlComponents = URLComponents(string: settings.websiteURL) else {
            print("Website: Invalid URL: \(settings.websiteURL)")
            connectionState = .error("Invalid website URL")
            return
        }

        // Add auth token as query parameter
        var queryItems = urlComponents.queryItems ?? []
        queryItems.append(URLQueryItem(name: "token", value: settings.authToken))
        urlComponents.queryItems = queryItems

        guard let url = urlComponents.url else {
            print("Website: Failed to construct URL with token")
            connectionState = .error("Failed to construct URL with token")
            return
        }

        print("Website: Connecting with authentication")
        webSocketTask = session?.webSocketTask(with: url)
        webSocketTask?.resume()

        // Note: receiveMessage() will be called in didOpenWithProtocol delegate
        // after connection is fully established
    }

    func disconnect() {
        print("Website: Disconnecting...")
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        connectionState = .disconnected
    }

    private func register() {
        print("Website: Registering as client \(settings.clientID)")
        let message: [String: Any] = [
            "type": "register",
            "clientId": settings.clientID
        ]

        send(message: message)
    }

    func send(message: [String: Any]) {
        guard let task = webSocketTask else {
            print("Website: Cannot send - no WebSocket task")
            return
        }

        guard task.state == .running else {
            print("Website: Cannot send - WebSocket state is \(task.state.rawValue)")
            return
        }

        guard let jsonData = try? JSONSerialization.data(withJSONObject: message),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            print("Website: Failed to serialize message")
            return
        }

        print("Website: Sending message: \(jsonString.prefix(200))...")

        let wsMessage = URLSessionWebSocketTask.Message.string(jsonString)
        task.send(wsMessage) { [weak self] error in
            if let error = error {
                print("Website: Failed to send message: \(error.localizedDescription)")
                print("Website: Error details - Code: \((error as NSError).code), Domain: \((error as NSError).domain)")
                DispatchQueue.main.async {
                    self?.connectionState = .error(error.localizedDescription)
                }
            } else {
                print("Website: Message sent successfully")
            }
        }
    }

    func sendCommandResponse(command: String, success: Bool, data: [String: Any]?, error: String?) {
        var message: [String: Any] = [
            "type": "command_response",
            "clientId": settings.clientID,
            "command": command,
            "success": success
        ]

        if let data = data {
            message["data"] = data
        }

        if let error = error {
            message["error"] = error
        }

        send(message: message)
    }

    func sendEvent(event: String, data: [String: Any]) {
        let message: [String: Any] = [
            "type": "obs_event",
            "clientId": settings.clientID,
            "event": event,
            "data": data
        ]

        send(message: message)
    }

    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }

            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    self.handleMessage(text: text)
                case .data(let data):
                    if let text = String(data: data, encoding: .utf8) {
                        self.handleMessage(text: text)
                    }
                @unknown default:
                    break
                }

                // Continue receiving messages
                self.receiveMessage()

            case .failure(let error):
                print("Failed to receive message from website: \(error)")
                DispatchQueue.main.async {
                    self.connectionState = .error(error.localizedDescription)
                }
            }
        }
    }

    private func handleMessage(text: String) {
        print("Website: Received message: \(text.prefix(200))...")

        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = json["type"] as? String else {
            print("Website: Failed to parse message")
            return
        }

        print("Website: Message type: \(type)")

        // Handle different message types
        switch type {
        case "command":
            if let command = json["command"] as? String {
                print("Website: Received command: \(command)")
                let params = json["params"] as? [String: Any] ?? [:]
                onMessageReceived?(command, params)
            }
        case "ping":
            print("Website: Received ping, sending pong")
            // Respond with pong
            let pong: [String: Any] = [
                "type": "pong",
                "clientId": settings.clientID
            ]
            send(message: pong)
        default:
            print("Website: Unknown message type: \(type)")
            break
        }
    }
}

extension WebsiteWebSocketClient: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        print("Website: WebSocket connection established - starting message listener")
        DispatchQueue.main.async {
            self.connectionState = .connected
        }

        // Start receiving messages
        receiveMessage()

        // Send registration after connection is established
        register()
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        let reasonString = reason.flatMap { String(data: $0, encoding: .utf8) } ?? "No reason"
        print("Website: WebSocket connection closed (code: \(closeCode.rawValue), reason: \(reasonString))")
        DispatchQueue.main.async {
            self.connectionState = .disconnected
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            print("Website: Connection error: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.connectionState = .error(error.localizedDescription)
            }
        }
    }
}
