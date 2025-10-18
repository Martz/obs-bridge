//
//  OBSWebSocketClient.swift
//  OBSBridge
//
//  WebSocket client for connecting to OBS Studio

import Foundation
import Combine

enum OBSConnectionState: Equatable {
    case disconnected
    case connecting
    case connected
    case error(String)
}

class OBSWebSocketClient: NSObject, ObservableObject {
    @Published var connectionState: OBSConnectionState = .disconnected
    @Published var obsVersion: String?

    private var webSocketTask: URLSessionWebSocketTask?
    private var session: URLSession?
    private let settings: AppSettings

    init(settings: AppSettings) {
        self.settings = settings
        super.init()
        self.session = URLSession(configuration: .default, delegate: self, delegateQueue: nil)
    }

    func connect() {
        guard connectionState != .connecting && connectionState != .connected else {
            print("OBS: Already connecting or connected")
            return
        }

        print("OBS: Starting connection to \(settings.obsHost):\(settings.obsPort)")
        connectionState = .connecting

        guard let url = URL(string: "ws://\(settings.obsHost):\(settings.obsPort)") else {
            connectionState = .error("Invalid OBS URL")
            return
        }

        webSocketTask = session?.webSocketTask(with: url)
        webSocketTask?.resume()

        // Note: receiveMessage() will be called in didOpenWithProtocol delegate
        // after connection is fully established
    }

    func disconnect() {
        print("OBS: Disconnecting...")
        webSocketTask?.cancel(with: .goingAway, reason: nil)
        webSocketTask = nil
        connectionState = .disconnected
    }

    func send(message: [String: Any]) {
        guard let task = webSocketTask else {
            print("OBS: Cannot send - no WebSocket task")
            return
        }

        guard task.state == .running else {
            print("OBS: Cannot send - WebSocket state is \(task.state.rawValue)")
            return
        }

        guard let jsonData = try? JSONSerialization.data(withJSONObject: message),
              let jsonString = String(data: jsonData, encoding: .utf8) else {
            print("OBS: Failed to serialize message")
            return
        }

        print("OBS: Sending message: \(jsonString.prefix(200))...")

        let wsMessage = URLSessionWebSocketTask.Message.string(jsonString)
        task.send(wsMessage) { [weak self] error in
            if let error = error {
                print("OBS: Failed to send message: \(error.localizedDescription)")
                print("OBS: Error details - Code: \((error as NSError).code), Domain: \((error as NSError).domain)")
                DispatchQueue.main.async {
                    self?.connectionState = .error(error.localizedDescription)
                }
            } else {
                print("OBS: Message sent successfully")
            }
        }
    }

    func executeCommand(command: String, params: [String: Any] = [:], requestId: String) {
        let message: [String: Any] = [
            "op": 6, // Request
            "d": [
                "requestType": command,
                "requestId": requestId,
                "requestData": params
            ]
        ]

        send(message: message)
    }

    private func receiveMessage() {
        guard let task = webSocketTask, task.state == .running else {
            print("OBS: Cannot receive - WebSocket not running")
            return
        }

        task.receive { [weak self] result in
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
                print("OBS: Failed to receive message: \(error.localizedDescription)")
                print("OBS: Receive error - Code: \((error as NSError).code), Domain: \((error as NSError).domain)")

                // Only set error state if we're not already disconnected
                if self.connectionState != .disconnected {
                    DispatchQueue.main.async {
                        self.connectionState = .error(error.localizedDescription)
                    }
                }
            }
        }
    }

    private func handleMessage(text: String) {
        print("OBS: Received message: \(text.prefix(200))...")

        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let op = json["op"] as? Int else {
            print("OBS: Failed to parse message")
            return
        }

        print("OBS: Received op code: \(op)")

        // Op codes: 0=Hello, 2=Identified, 5=Event, 7=RequestResponse
        switch op {
        case 0: // Hello
            print("OBS: Received Hello, sending Identify...")
            handleHello(json: json)
        case 2: // Identified
            print("OBS: Successfully identified!")
            handleIdentified()
        case 5: // Event
            print("OBS: Received event")
            // Events from OBS - could be forwarded to website
            break
        case 7: // RequestResponse
            print("OBS: Received request response")
            handleRequestResponse(json: json)
        default:
            print("OBS: Unknown op code: \(op)")
            break
        }
    }

    private func handleHello(json: [String: Any]) {
        print("OBS: Processing Hello message")

        // OBS sends Hello message on connection
        // We need to identify ourselves
        guard let d = json["d"] as? [String: Any] else {
            print("OBS: Hello message missing 'd' field")
            identify(withAuth: nil)
            return
        }

        if let authentication = d["authentication"] as? [String: Any] {
            // Authentication required
            print("OBS: Authentication required")
            let challenge = authentication["challenge"] as? String ?? ""
            let salt = authentication["salt"] as? String ?? ""

            if settings.obsPassword.isEmpty {
                print("OBS: ERROR - Password required but not provided")
                DispatchQueue.main.async {
                    self.connectionState = .error("Password required")
                }
                return
            }

            // Generate authentication string
            let auth = generateAuth(password: settings.obsPassword, challenge: challenge, salt: salt)
            identify(withAuth: auth)
        } else {
            // No authentication required
            print("OBS: No authentication required")
            identify(withAuth: nil)
        }
    }

    private func identify(withAuth auth: String?) {
        print("OBS: Sending Identify message (auth: \(auth != nil))")

        var message: [String: Any] = [
            "op": 1, // Identify
            "d": [
                "rpcVersion": 1
            ]
        ]

        if let auth = auth, !auth.isEmpty {
            var d = message["d"] as! [String: Any]
            d["authentication"] = auth
            message["d"] = d
        }

        send(message: message)
    }

    private func handleIdentified() {
        DispatchQueue.main.async {
            self.connectionState = .connected
        }

        // Get OBS version
        let versionRequest: [String: Any] = [
            "op": 6,
            "d": [
                "requestType": "GetVersion",
                "requestId": "version-check"
            ]
        ]
        send(message: versionRequest)
    }

    private func handleRequestResponse(json: [String: Any]) {
        guard let d = json["d"] as? [String: Any],
              let requestId = d["requestId"] as? String else {
            return
        }

        if requestId == "version-check" {
            if let responseData = d["responseData"] as? [String: Any],
               let obsVersion = responseData["obsVersion"] as? String {
                DispatchQueue.main.async {
                    self.obsVersion = obsVersion
                }
            }
        }
    }

    private func generateAuth(password: String, challenge: String, salt: String) -> String {
        // OBS WebSocket v5 authentication protocol:
        // 1. secret = Base64(SHA256(password + salt))
        // 2. auth = Base64(SHA256(secret + challenge))

        guard !password.isEmpty else {
            print("OBS Auth: Password is empty!")
            return ""
        }

        print("OBS Auth: Starting authentication with salt length: \(salt.count), challenge length: \(challenge.count)")

        // Step 1: password + salt (salt is base64 encoded, decode it first)
        guard let saltData = Data(base64Encoded: salt) else {
            print("OBS Auth: ERROR - Failed to decode salt from base64")
            return ""
        }

        guard let passwordData = password.data(using: .utf8) else {
            print("OBS Auth: ERROR - Failed to encode password")
            return ""
        }

        // Concatenate password + salt
        var passwordSaltData = Data()
        passwordSaltData.append(passwordData)
        passwordSaltData.append(saltData)

        // SHA256(password + salt)
        let passwordSaltHash = passwordSaltData.sha256Data()

        // Base64(SHA256(password + salt))
        let secret = passwordSaltHash.base64EncodedString()
        print("OBS Auth: Secret generated (length: \(secret.count))")

        // Step 2: secret + challenge (challenge is base64 encoded, decode it first)
        guard let challengeData = Data(base64Encoded: challenge) else {
            print("OBS Auth: ERROR - Failed to decode challenge from base64")
            return ""
        }

        guard let secretData = secret.data(using: .utf8) else {
            print("OBS Auth: ERROR - Failed to encode secret")
            return ""
        }

        // Concatenate secret + challenge
        var secretChallengeData = Data()
        secretChallengeData.append(secretData)
        secretChallengeData.append(challengeData)

        // SHA256(secret + challenge)
        let authHash = secretChallengeData.sha256Data()

        // Base64(SHA256(secret + challenge))
        let auth = authHash.base64EncodedString()
        print("OBS Auth: Authentication string generated (length: \(auth.count))")

        return auth
    }
}

extension OBSWebSocketClient: URLSessionWebSocketDelegate {
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol `protocol`: String?) {
        print("OBS: WebSocket connection established")
        print("OBS: Socket state: \(webSocketTask.state.rawValue)")
        print("OBS: Protocol: \(`protocol` ?? "none")")

        // Give the socket a moment to fully stabilize before starting communication
        // This prevents race conditions with the underlying network layer
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            guard let self = self else { return }
            guard let task = self.webSocketTask, task.state == .running else {
                print("OBS: Socket no longer running after delay")
                return
            }

            print("OBS: Starting message listener")
            self.receiveMessage()
        }
    }

    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        let reasonString = reason.flatMap { String(data: $0, encoding: .utf8) } ?? "No reason"
        print("OBS: WebSocket connection closed (code: \(closeCode.rawValue), reason: \(reasonString))")
        DispatchQueue.main.async {
            self.connectionState = .disconnected
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            print("OBS: Connection error: \(error.localizedDescription)")
            DispatchQueue.main.async {
                self.connectionState = .error(error.localizedDescription)
            }
        }
    }
}

// SHA256 helper that returns Data (for proper base64 encoding)
extension Data {
    func sha256Data() -> Data {
        var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        self.withUnsafeBytes {
            _ = CC_SHA256($0.baseAddress, CC_LONG(self.count), &hash)
        }
        return Data(hash)
    }
}

// Need to import CommonCrypto
import CommonCrypto
