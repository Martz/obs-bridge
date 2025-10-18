//
//  OBSBridgeApp.swift
//  OBSBridge
//
//  Main application entry point

import SwiftUI

@main
struct OBSBridgeApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .commands {
            CommandGroup(replacing: .appSettings) {
                Button("Preferences...") {
                    // Open settings window
                }
                .keyboardShortcut(",", modifiers: .command)
            }
        }

        Settings {
            SettingsView(settings: AppSettings.shared)
        }
    }
}
