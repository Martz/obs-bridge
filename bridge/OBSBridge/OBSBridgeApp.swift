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

        // Profile management window (accessible via ⌘,)
        Window("Manage Profiles", id: "profiles") {
            ProfileListView()
        }
        .keyboardShortcut(",", modifiers: .command)
    }
}
