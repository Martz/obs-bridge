using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace OBSBridge
{
    /// <summary>
    /// WebSocket client for the control website
    /// </summary>
    public class WebsiteWebSocketClient : INotifyPropertyChanged
    {
        private readonly AppSettings _settings;
        private ClientWebSocket? _webSocket;
        private CancellationTokenSource? _cancellationTokenSource;

        private WebsiteConnectionState _connectionState = WebsiteConnectionState.Disconnected;

        public WebsiteConnectionState ConnectionState
        {
            get => _connectionState;
            private set
            {
                _connectionState = value;
                OnPropertyChanged(nameof(ConnectionState));
            }
        }

        public Action<string, Dictionary<string, object>>? OnMessageReceived { get; set; }

        public event PropertyChangedEventHandler? PropertyChanged;

        public WebsiteWebSocketClient(AppSettings settings)
        {
            _settings = settings;
        }

        public async Task ConnectAsync()
        {
            if (ConnectionState == WebsiteConnectionState.Connected || 
                ConnectionState == WebsiteConnectionState.Connecting)
                return;

            ConnectionState = WebsiteConnectionState.Connecting;

            try
            {
                _cancellationTokenSource = new CancellationTokenSource();
                _webSocket = new ClientWebSocket();

                var uri = new Uri(_settings.WebsiteUrl);
                await _webSocket.ConnectAsync(uri, _cancellationTokenSource.Token);

                ConnectionState = WebsiteConnectionState.Connected;

                // Send registration message
                await SendRegistrationAsync();

                // Start receiving messages
                _ = Task.Run(async () => await ReceiveMessagesAsync(_cancellationTokenSource.Token));
            }
            catch (Exception ex)
            {
                ConnectionState = WebsiteConnectionState.Error;
                System.Diagnostics.Debug.WriteLine($"Website connection error: {ex.Message}");
            }
        }

        public async Task DisconnectAsync()
        {
            if (_webSocket?.State == WebSocketState.Open)
            {
                _cancellationTokenSource?.Cancel();
                await _webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Disconnecting", CancellationToken.None);
            }

            _webSocket?.Dispose();
            _webSocket = null;
            _cancellationTokenSource?.Dispose();
            _cancellationTokenSource = null;

            ConnectionState = WebsiteConnectionState.Disconnected;
        }

        public async Task SendCommandResponseAsync(string command, bool success, Dictionary<string, object>? data, string? error)
        {
            if (_webSocket?.State != WebSocketState.Open)
                return;

            var response = new
            {
                type = "command_response",
                clientId = _settings.ClientId,
                command,
                success,
                data = data ?? new Dictionary<string, object>(),
                error
            };

            await SendMessageAsync(response);
        }

        private async Task SendRegistrationAsync()
        {
            var registration = new
            {
                type = "register",
                clientId = _settings.ClientId
            };

            await SendMessageAsync(registration);
        }

        private async Task SendMessageAsync(object message)
        {
            if (_webSocket?.State != WebSocketState.Open)
                return;

            try
            {
                var json = JsonSerializer.Serialize(message);
                var bytes = Encoding.UTF8.GetBytes(json);
                await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error sending to website: {ex.Message}");
            }
        }

        private async Task ReceiveMessagesAsync(CancellationToken cancellationToken)
        {
            var buffer = new byte[8192];

            try
            {
                while (_webSocket?.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
                {
                    var result = await _webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationToken);

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        ConnectionState = WebsiteConnectionState.Disconnected;
                        break;
                    }

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        await HandleMessageAsync(json);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Normal cancellation
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Website receive error: {ex.Message}");
                ConnectionState = WebsiteConnectionState.Error;
            }
        }

        private async Task HandleMessageAsync(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (!root.TryGetProperty("type", out var typeElement))
                    return;

                var type = typeElement.GetString();

                if (type == "command")
                {
                    var command = root.TryGetProperty("command", out var cmd) ? cmd.GetString() ?? "" : "";
                    var parameters = root.TryGetProperty("params", out var prms)
                        ? JsonSerializer.Deserialize<Dictionary<string, object>>(prms.GetRawText()) ?? new Dictionary<string, object>()
                        : new Dictionary<string, object>();

                    OnMessageReceived?.Invoke(command, parameters);
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error handling website message: {ex.Message}");
            }

            await Task.CompletedTask;
        }

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }

    public enum WebsiteConnectionState
    {
        Disconnected,
        Connecting,
        Connected,
        Error
    }
}
