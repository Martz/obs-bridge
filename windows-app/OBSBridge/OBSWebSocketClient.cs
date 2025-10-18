using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Net.WebSockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace OBSBridge
{
    /// <summary>
    /// OBS WebSocket v5 protocol client
    /// </summary>
    public class OBSWebSocketClient : INotifyPropertyChanged
    {
        private readonly AppSettings _settings;
        private ClientWebSocket? _webSocket;
        private CancellationTokenSource? _cancellationTokenSource;
        private readonly Dictionary<string, TaskCompletionSource<OBSResponse>> _pendingRequests = new();

        private OBSConnectionState _connectionState = OBSConnectionState.Disconnected;
        private string? _obsVersion;

        public OBSConnectionState ConnectionState
        {
            get => _connectionState;
            private set
            {
                _connectionState = value;
                OnPropertyChanged(nameof(ConnectionState));
            }
        }

        public string? ObsVersion
        {
            get => _obsVersion;
            private set
            {
                _obsVersion = value;
                OnPropertyChanged(nameof(ObsVersion));
            }
        }

        public event PropertyChangedEventHandler? PropertyChanged;

        public OBSWebSocketClient(AppSettings settings)
        {
            _settings = settings;
        }

        public async Task ConnectAsync()
        {
            if (ConnectionState == OBSConnectionState.Connected || 
                ConnectionState == OBSConnectionState.Connecting)
                return;

            ConnectionState = OBSConnectionState.Connecting;

            try
            {
                _cancellationTokenSource = new CancellationTokenSource();
                _webSocket = new ClientWebSocket();

                var uri = new Uri($"ws://{_settings.ObsHost}:{_settings.ObsPort}");
                await _webSocket.ConnectAsync(uri, _cancellationTokenSource.Token);

                ConnectionState = OBSConnectionState.Connected;

                // Start receiving messages
                _ = Task.Run(async () => await ReceiveMessagesAsync(_cancellationTokenSource.Token));

                // Wait for Hello message and authenticate
                await Task.Delay(100); // Give time for Hello message
            }
            catch (Exception ex)
            {
                ConnectionState = OBSConnectionState.Error;
                System.Diagnostics.Debug.WriteLine($"OBS connection error: {ex.Message}");
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

            ConnectionState = OBSConnectionState.Disconnected;
        }

        public async Task<OBSResponse> ExecuteCommandAsync(string requestType, Dictionary<string, object>? requestData = null)
        {
            if (_webSocket?.State != WebSocketState.Open)
            {
                return new OBSResponse { Success = false, Error = "Not connected to OBS" };
            }

            var requestId = Guid.NewGuid().ToString();
            var tcs = new TaskCompletionSource<OBSResponse>();
            _pendingRequests[requestId] = tcs;

            var request = new
            {
                op = 6, // Request
                d = new
                {
                    requestType,
                    requestId,
                    requestData = requestData ?? new Dictionary<string, object>()
                }
            };

            try
            {
                var json = JsonSerializer.Serialize(request);
                var bytes = Encoding.UTF8.GetBytes(json);
                await _webSocket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);

                // Wait for response with timeout
                var timeoutTask = Task.Delay(5000);
                var completedTask = await Task.WhenAny(tcs.Task, timeoutTask);

                if (completedTask == timeoutTask)
                {
                    _pendingRequests.Remove(requestId);
                    return new OBSResponse { Success = false, Error = "Request timeout" };
                }

                return await tcs.Task;
            }
            catch (Exception ex)
            {
                _pendingRequests.Remove(requestId);
                return new OBSResponse { Success = false, Error = ex.Message };
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
                        ConnectionState = OBSConnectionState.Disconnected;
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
                System.Diagnostics.Debug.WriteLine($"OBS receive error: {ex.Message}");
                ConnectionState = OBSConnectionState.Error;
            }
        }

        private async Task HandleMessageAsync(string json)
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;

                if (!root.TryGetProperty("op", out var opCode))
                    return;

                var op = opCode.GetInt32();

                switch (op)
                {
                    case 0: // Hello
                        await HandleHelloAsync(root);
                        break;

                    case 2: // Identified
                        HandleIdentified(root);
                        break;

                    case 7: // RequestResponse
                        HandleRequestResponse(root);
                        break;

                    case 5: // Event
                        // Handle OBS events if needed
                        break;
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error handling OBS message: {ex.Message}");
            }
        }

        private async Task HandleHelloAsync(JsonElement root)
        {
            if (!root.TryGetProperty("d", out var data))
                return;

            // Get OBS version
            if (data.TryGetProperty("obsWebSocketVersion", out var version))
            {
                ObsVersion = version.GetString();
            }

            // Authenticate
            if (data.TryGetProperty("authentication", out var auth))
            {
                var challenge = auth.GetProperty("challenge").GetString() ?? "";
                var salt = auth.GetProperty("salt").GetString() ?? "";

                var secret = ComputeHash(_settings.ObsPassword + salt);
                var authResponse = ComputeHash(secret + challenge);

                var identify = new
                {
                    op = 1, // Identify
                    d = new
                    {
                        rpcVersion = 1,
                        authentication = authResponse
                    }
                };

                var identifyJson = JsonSerializer.Serialize(identify);
                var bytes = Encoding.UTF8.GetBytes(identifyJson);
                await _webSocket!.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
            else
            {
                // No authentication required
                var identify = new
                {
                    op = 1, // Identify
                    d = new
                    {
                        rpcVersion = 1
                    }
                };

                var identifyJson = JsonSerializer.Serialize(identify);
                var bytes = Encoding.UTF8.GetBytes(identifyJson);
                await _webSocket!.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }

        private void HandleIdentified(JsonElement root)
        {
            System.Diagnostics.Debug.WriteLine("Successfully identified with OBS");
        }

        private void HandleRequestResponse(JsonElement root)
        {
            if (!root.TryGetProperty("d", out var data))
                return;

            if (!data.TryGetProperty("requestId", out var requestIdElement))
                return;

            var requestId = requestIdElement.GetString();
            if (requestId == null || !_pendingRequests.TryGetValue(requestId, out var tcs))
                return;

            _pendingRequests.Remove(requestId);

            var success = data.TryGetProperty("requestStatus", out var status) &&
                          status.TryGetProperty("result", out var result) &&
                          result.GetBoolean();

            var responseData = data.TryGetProperty("responseData", out var respData)
                ? JsonSerializer.Deserialize<Dictionary<string, object>>(respData.GetRawText())
                : null;

            var error = !success && status.TryGetProperty("comment", out var comment)
                ? comment.GetString()
                : null;

            tcs.SetResult(new OBSResponse
            {
                Success = success,
                Data = responseData,
                Error = error
            });
        }

        private static string ComputeHash(string input)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(input);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }

        protected virtual void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }

    public enum OBSConnectionState
    {
        Disconnected,
        Connecting,
        Connected,
        Error
    }

    public class OBSResponse
    {
        public bool Success { get; set; }
        public Dictionary<string, object>? Data { get; set; }
        public string? Error { get; set; }
    }
}
