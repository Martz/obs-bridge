using System;
using System.ComponentModel;
using System.IO;
using System.Text.Json;

namespace OBSBridge
{
    /// <summary>
    /// Application settings with persistence to JSON file
    /// </summary>
    public class AppSettings : INotifyPropertyChanged
    {
        private static AppSettings? _instance;
        private static readonly string SettingsFilePath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "OBSBridge",
            "settings.json"
        );

        public static AppSettings Instance => _instance ?? throw new InvalidOperationException("Settings not initialized");

        // OBS Settings
        private string _obsHost = "localhost";
        private string _obsPort = "4455";
        private string _obsPassword = "";

        // Website Settings
        private string _websiteUrl = "ws://localhost:8000/obs";
        private string _clientId = $"obs-client-{Guid.NewGuid().ToString().Substring(0, 8)}";

        // Auto-connect
        private bool _autoConnect = false;

        public string ObsHost
        {
            get => _obsHost;
            set { _obsHost = value; OnPropertyChanged(nameof(ObsHost)); }
        }

        public string ObsPort
        {
            get => _obsPort;
            set { _obsPort = value; OnPropertyChanged(nameof(ObsPort)); }
        }

        public string ObsPassword
        {
            get => _obsPassword;
            set { _obsPassword = value; OnPropertyChanged(nameof(ObsPassword)); }
        }

        public string WebsiteUrl
        {
            get => _websiteUrl;
            set { _websiteUrl = value; OnPropertyChanged(nameof(WebsiteUrl)); }
        }

        public string ClientId
        {
            get => _clientId;
            set { _clientId = value; OnPropertyChanged(nameof(ClientId)); }
        }

        public bool AutoConnect
        {
            get => _autoConnect;
            set { _autoConnect = value; OnPropertyChanged(nameof(AutoConnect)); }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        public static void Initialize()
        {
            _instance = Load();
        }

        private static AppSettings Load()
        {
            try
            {
                if (File.Exists(SettingsFilePath))
                {
                    var json = File.ReadAllText(SettingsFilePath);
                    var settings = JsonSerializer.Deserialize<AppSettings>(json);
                    return settings ?? new AppSettings();
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error loading settings: {ex.Message}");
            }

            return new AppSettings();
        }

        public void Save()
        {
            try
            {
                var directory = Path.GetDirectoryName(SettingsFilePath);
                if (directory != null && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                var json = JsonSerializer.Serialize(this, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(SettingsFilePath, json);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error saving settings: {ex.Message}");
            }
        }

        public (bool IsValid, string[] Errors) Validate()
        {
            var errors = new System.Collections.Generic.List<string>();

            if (string.IsNullOrWhiteSpace(ObsHost))
                errors.Add("OBS host cannot be empty");

            if (string.IsNullOrWhiteSpace(ObsPort))
                errors.Add("OBS port cannot be empty");
            else if (!int.TryParse(ObsPort, out _))
                errors.Add("OBS port must be a valid number");

            if (string.IsNullOrWhiteSpace(WebsiteUrl))
                errors.Add("Website URL cannot be empty");
            else if (!WebsiteUrl.StartsWith("ws://") && !WebsiteUrl.StartsWith("wss://"))
                errors.Add("Website URL must start with ws:// or wss://");

            if (string.IsNullOrWhiteSpace(ClientId))
                errors.Add("Client ID cannot be empty");

            return (errors.Count == 0, errors.ToArray());
        }
    }
}
