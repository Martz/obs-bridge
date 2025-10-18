using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;

namespace OBSBridge
{
    /// <summary>
    /// Manages the bridge between OBS and the website
    /// </summary>
    public class BridgeManager : INotifyPropertyChanged
    {
        private readonly AppSettings _settings;
        private readonly OBSWebSocketClient _obsClient;
        private readonly WebsiteWebSocketClient _websiteClient;

        private bool _isRunning = false;

        public ObservableCollection<LogEntry> Logs { get; } = new ObservableCollection<LogEntry>();

        public bool IsRunning
        {
            get => _isRunning;
            private set
            {
                _isRunning = value;
                OnPropertyChanged(nameof(IsRunning));
            }
        }

        public OBSConnectionState ObsConnectionState => _obsClient.ConnectionState;
        public WebsiteConnectionState WebsiteConnectionState => _websiteClient.ConnectionState;
        public string? ObsVersion => _obsClient.ObsVersion;

        public event PropertyChangedEventHandler? PropertyChanged;

        public BridgeManager(AppSettings settings)
        {
            _settings = settings;
            _obsClient = new OBSWebSocketClient(settings);
            _websiteClient = new WebsiteWebSocketClient(settings);

            SetupWebsiteMessageHandler();
            ObserveConnectionStates();
        }

        public async Task StartAsync()
        {
            if (IsRunning) return;

            var validation = _settings.Validate();
            if (!validation.IsValid)
            {
                AddLog($"Configuration errors: {string.Join(", ", validation.Errors)}", LogLevel.Error);
                return;
            }

            IsRunning = true;
            AddLog("Starting OBS Bridge...", LogLevel.Info);

            // Connect to OBS
            AddLog($"Connecting to OBS at {_settings.ObsHost}:{_settings.ObsPort}...", LogLevel.Info);
            await _obsClient.ConnectAsync();

            // Connect to website
            AddLog($"Connecting to website at {_settings.WebsiteUrl}...", LogLevel.Info);
            await _websiteClient.ConnectAsync();
        }

        public async Task StopAsync()
        {
            if (!IsRunning) return;

            IsRunning = false;
            AddLog("Stopping OBS Bridge...", LogLevel.Info);

            await _obsClient.DisconnectAsync();
            await _websiteClient.DisconnectAsync();

            AddLog("OBS Bridge stopped", LogLevel.Info);
        }

        public void ClearLogs()
        {
            Logs.Clear();
        }

        private void SetupWebsiteMessageHandler()
        {
            _websiteClient.OnMessageReceived = async (command, parameters) =>
            {
                await HandleCommandAsync(command, parameters);
            };
        }

        private void ObserveConnectionStates()
        {
            _obsClient.PropertyChanged += (s, e) =>
            {
                if (e.PropertyName == nameof(_obsClient.ConnectionState))
                {
                    OnPropertyChanged(nameof(ObsConnectionState));
                    var state = _obsClient.ConnectionState;
                    switch (state)
                    {
                        case OBSConnectionState.Connected:
                            AddLog("✓ Connected to OBS", LogLevel.Success);
                            break;
                        case OBSConnectionState.Disconnected:
                            AddLog("✗ Disconnected from OBS", LogLevel.Warning);
                            break;
                        case OBSConnectionState.Connecting:
                            AddLog("Connecting to OBS...", LogLevel.Info);
                            break;
                        case OBSConnectionState.Error:
                            AddLog($"OBS connection error", LogLevel.Error);
                            break;
                    }
                }
                else if (e.PropertyName == nameof(_obsClient.ObsVersion))
                {
                    OnPropertyChanged(nameof(ObsVersion));
                    if (_obsClient.ObsVersion != null)
                    {
                        AddLog($"OBS version: {_obsClient.ObsVersion}", LogLevel.Info);
                    }
                }
            };

            _websiteClient.PropertyChanged += (s, e) =>
            {
                if (e.PropertyName == nameof(_websiteClient.ConnectionState))
                {
                    OnPropertyChanged(nameof(WebsiteConnectionState));
                    var state = _websiteClient.ConnectionState;
                    switch (state)
                    {
                        case WebsiteConnectionState.Connected:
                            AddLog("✓ Connected to website", LogLevel.Success);
                            break;
                        case WebsiteConnectionState.Disconnected:
                            AddLog("✗ Disconnected from website", LogLevel.Warning);
                            break;
                        case WebsiteConnectionState.Connecting:
                            AddLog("Connecting to website...", LogLevel.Info);
                            break;
                        case WebsiteConnectionState.Error:
                            AddLog($"Website connection error", LogLevel.Error);
                            break;
                    }
                }
            };
        }

        private async Task HandleCommandAsync(string command, System.Collections.Generic.Dictionary<string, object> parameters)
        {
            AddLog($"← Received command from website: {command}", LogLevel.Info);

            if (_obsClient.ConnectionState != OBSConnectionState.Connected)
            {
                AddLog("Cannot execute command: OBS not connected", LogLevel.Error);
                await _websiteClient.SendCommandResponseAsync(command, false, null, "OBS not connected");
                return;
            }

            // Map command to OBS WebSocket v5 request types
            var mappedCommand = MapCommandToOBSRequest(command);
            var mappedParams = MapParamsToOBSFormat(command, parameters);

            AddLog($"→ Sending to OBS: {mappedCommand}", LogLevel.Info);
            var result = await _obsClient.ExecuteCommandAsync(mappedCommand, mappedParams);

            if (result.Success)
            {
                AddLog("✓ Command executed successfully", LogLevel.Success);
                await _websiteClient.SendCommandResponseAsync(command, true, result.Data, null);
            }
            else
            {
                AddLog($"✗ Command failed: {result.Error}", LogLevel.Error);
                await _websiteClient.SendCommandResponseAsync(command, false, null, result.Error);
            }
        }

        private string MapCommandToOBSRequest(string command)
        {
            var mapping = new System.Collections.Generic.Dictionary<string, string>
            {
                { "SetCurrentScene", "SetCurrentProgramScene" },
                { "StartStreaming", "StartStream" },
                { "StopStreaming", "StopStream" },
                { "StartRecording", "StartRecord" },
                { "StopRecording", "StopRecord" },
                { "GetSceneList", "GetSceneList" },
                { "GetStreamingStatus", "GetStreamStatus" }
            };

            return mapping.TryGetValue(command, out var mapped) ? mapped : command;
        }

        private System.Collections.Generic.Dictionary<string, object> MapParamsToOBSFormat(
            string command,
            System.Collections.Generic.Dictionary<string, object> parameters)
        {
            var mapped = new System.Collections.Generic.Dictionary<string, object>(parameters);

            if (command == "SetCurrentScene")
            {
                if (parameters.TryGetValue("sceneName", out var sceneName) ||
                    parameters.TryGetValue("scene-name", out sceneName))
                {
                    mapped.Clear();
                    mapped["sceneName"] = sceneName;
                }
            }

            return mapped;
        }

        private void AddLog(string message, LogLevel level)
        {
            System.Windows.Application.Current?.Dispatcher.Invoke(() =>
            {
                Logs.Add(new LogEntry(message, level, DateTime.Now));

                // Keep only last 100 logs
                while (Logs.Count > 100)
                {
                    Logs.RemoveAt(0);
                }
            });
        }

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }

    public class LogEntry
    {
        public string Message { get; }
        public LogLevel Level { get; }
        public DateTime Timestamp { get; }

        public LogEntry(string message, LogLevel level, DateTime timestamp)
        {
            Message = message;
            Level = level;
            Timestamp = timestamp;
        }

        public string FormattedTimestamp => Timestamp.ToString("HH:mm:ss");
        public string Color => Level switch
        {
            LogLevel.Info => "Blue",
            LogLevel.Success => "Green",
            LogLevel.Warning => "Orange",
            LogLevel.Error => "Red",
            _ => "Black"
        };
    }

    public enum LogLevel
    {
        Info,
        Success,
        Warning,
        Error
    }
}
