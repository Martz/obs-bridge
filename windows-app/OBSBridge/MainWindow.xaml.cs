using System.ComponentModel;
using System.Windows;
using System.Windows.Media;

namespace OBSBridge
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private readonly BridgeManager _bridgeManager;

        public MainWindow()
        {
            InitializeComponent();

            _bridgeManager = new BridgeManager(AppSettings.Instance);
            LogItemsControl.ItemsSource = _bridgeManager.Logs;

            // Subscribe to property changes
            _bridgeManager.PropertyChanged += BridgeManager_PropertyChanged;

            // Load settings
            AutoConnectCheckBox.IsChecked = AppSettings.Instance.AutoConnect;

            // Auto-connect if enabled
            if (AppSettings.Instance.AutoConnect)
            {
                _ = StartBridgeAsync();
            }

            UpdateConnectionStatus();
        }

        private void BridgeManager_PropertyChanged(object? sender, PropertyChangedEventArgs e)
        {
            if (e.PropertyName == nameof(_bridgeManager.ObsConnectionState) ||
                e.PropertyName == nameof(_bridgeManager.WebsiteConnectionState) ||
                e.PropertyName == nameof(_bridgeManager.ObsVersion))
            {
                Dispatcher.Invoke(UpdateConnectionStatus);
            }
            else if (e.PropertyName == nameof(_bridgeManager.IsRunning))
            {
                Dispatcher.Invoke(UpdateButtons);
            }
        }

        private void UpdateConnectionStatus()
        {
            // Update OBS status
            switch (_bridgeManager.ObsConnectionState)
            {
                case OBSConnectionState.Connected:
                    ObsStatusIndicator.Fill = new SolidColorBrush(Colors.Green);
                    ObsStatusText.Text = "OBS Studio: Connected";
                    if (_bridgeManager.ObsVersion != null)
                    {
                        ObsVersionText.Text = $"Version: {_bridgeManager.ObsVersion}";
                    }
                    break;
                case OBSConnectionState.Connecting:
                    ObsStatusIndicator.Fill = new SolidColorBrush(Colors.Orange);
                    ObsStatusText.Text = "OBS Studio: Connecting...";
                    ObsVersionText.Text = "";
                    break;
                case OBSConnectionState.Error:
                    ObsStatusIndicator.Fill = new SolidColorBrush(Colors.Red);
                    ObsStatusText.Text = "OBS Studio: Error";
                    ObsVersionText.Text = "";
                    break;
                default:
                    ObsStatusIndicator.Fill = new SolidColorBrush(Colors.Gray);
                    ObsStatusText.Text = "OBS Studio: Disconnected";
                    ObsVersionText.Text = "";
                    break;
            }

            // Update Website status
            switch (_bridgeManager.WebsiteConnectionState)
            {
                case WebsiteConnectionState.Connected:
                    WebsiteStatusIndicator.Fill = new SolidColorBrush(Colors.Green);
                    WebsiteStatusText.Text = "Control Website: Connected";
                    break;
                case WebsiteConnectionState.Connecting:
                    WebsiteStatusIndicator.Fill = new SolidColorBrush(Colors.Orange);
                    WebsiteStatusText.Text = "Control Website: Connecting...";
                    break;
                case WebsiteConnectionState.Error:
                    WebsiteStatusIndicator.Fill = new SolidColorBrush(Colors.Red);
                    WebsiteStatusText.Text = "Control Website: Error";
                    break;
                default:
                    WebsiteStatusIndicator.Fill = new SolidColorBrush(Colors.Gray);
                    WebsiteStatusText.Text = "Control Website: Disconnected";
                    break;
            }
        }

        private void UpdateButtons()
        {
            StartButton.IsEnabled = !_bridgeManager.IsRunning;
            StopButton.IsEnabled = _bridgeManager.IsRunning;
        }

        private async void StartButton_Click(object sender, RoutedEventArgs e)
        {
            await StartBridgeAsync();
        }

        private async System.Threading.Tasks.Task StartBridgeAsync()
        {
            await _bridgeManager.StartAsync();
            UpdateButtons();
        }

        private async void StopButton_Click(object sender, RoutedEventArgs e)
        {
            await _bridgeManager.StopAsync();
            UpdateButtons();
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            var settingsWindow = new SettingsWindow
            {
                Owner = this
            };
            settingsWindow.ShowDialog();
        }

        private void ClearLogButton_Click(object sender, RoutedEventArgs e)
        {
            _bridgeManager.ClearLogs();
        }

        private void AutoConnectCheckBox_Changed(object sender, RoutedEventArgs e)
        {
            AppSettings.Instance.AutoConnect = AutoConnectCheckBox.IsChecked ?? false;
            AppSettings.Instance.Save();
        }

        protected override async void OnClosing(CancelEventArgs e)
        {
            if (_bridgeManager.IsRunning)
            {
                await _bridgeManager.StopAsync();
            }
            base.OnClosing(e);
        }
    }
}
