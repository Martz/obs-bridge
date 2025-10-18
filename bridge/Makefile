.PHONY: setup build run clean install help

PROJECT = OBSBridge.xcodeproj
SCHEME = OBSBridge
BUILD_DIR = build
APP_NAME = OBSBridge.app

help: ## Show this help message
	@echo "OBS Bridge - Build Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Set up the project (run first)
	@./setup.sh

build: ## Build the app (Debug)
	@echo "🔨 Building OBS Bridge..."
	@xcodebuild -project $(PROJECT) \
		-scheme $(SCHEME) \
		-configuration Debug \
		-derivedDataPath $(BUILD_DIR) \
		build

release: ## Build release version
	@echo "🔨 Building OBS Bridge (Release)..."
	@xcodebuild -project $(PROJECT) \
		-scheme $(SCHEME) \
		-configuration Release \
		-derivedDataPath $(BUILD_DIR) \
		build

run: build ## Build and run the app
	@echo "🚀 Running OBS Bridge..."
	@open $(BUILD_DIR)/Build/Products/Debug/$(APP_NAME)

run-release: release ## Build release and run
	@echo "🚀 Running OBS Bridge (Release)..."
	@open $(BUILD_DIR)/Build/Products/Release/$(APP_NAME)

install: release ## Install to /Applications
	@echo "📦 Installing OBS Bridge to /Applications..."
	@cp -R $(BUILD_DIR)/Build/Products/Release/$(APP_NAME) /Applications/
	@echo "✅ Installed successfully!"

clean: ## Clean build artefacts
	@echo "🧹 Cleaning..."
	@rm -rf $(BUILD_DIR)
	@xcodebuild -project $(PROJECT) -scheme $(SCHEME) clean
	@echo "✅ Clean complete"

open: ## Open project in Xcode
	@open $(PROJECT)

test: ## Run tests
	@xcodebuild -project $(PROJECT) \
		-scheme $(SCHEME) \
		test

archive: ## Create an archive for distribution
	@echo "📦 Creating archive..."
	@xcodebuild -project $(PROJECT) \
		-scheme $(SCHEME) \
		-configuration Release \
		-derivedDataPath $(BUILD_DIR) \
		archive \
		-archivePath $(BUILD_DIR)/$(SCHEME).xcarchive
	@echo "✅ Archive created at $(BUILD_DIR)/$(SCHEME).xcarchive"

logs: ## Show app logs
	@log stream --predicate 'process == "OBSBridge"' --level debug

.DEFAULT_GOAL := help
