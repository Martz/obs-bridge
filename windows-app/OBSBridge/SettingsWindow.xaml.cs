using System.Windows;

namespace OBSBridge
{
    /// <summary>
    /// Interaction logic for SettingsWindow.xaml
    /// </summary>
    public partial class SettingsWindow : Window
    {
        public SettingsWindow()
        {
            InitializeComponent();
            LoadSettings();
        }

        private void LoadSettings()
        {
            var settings = AppSettings.Instance;
            
            ObsHostTextBox.Text = settings.ObsHost;
            ObsPortTextBox.Text = settings.ObsPort;
            ObsPasswordBox.Password = settings.ObsPassword;
            WebsiteUrlTextBox.Text = settings.WebsiteUrl;
            ClientIdTextBox.Text = settings.ClientId;
        }

        private void SaveButton_Click(object sender, RoutedEventArgs e)
        {
            var settings = AppSettings.Instance;
            
            // Update settings
            settings.ObsHost = ObsHostTextBox.Text.Trim();
            settings.ObsPort = ObsPortTextBox.Text.Trim();
            settings.ObsPassword = ObsPasswordBox.Password;
            settings.WebsiteUrl = WebsiteUrlTextBox.Text.Trim();
            settings.ClientId = ClientIdTextBox.Text.Trim();

            // Validate
            var validation = settings.Validate();
            if (!validation.IsValid)
            {
                ErrorTextBlock.Text = string.Join("\n", validation.Errors);
                ErrorTextBlock.Visibility = Visibility.Visible;
                return;
            }

            // Save
            settings.Save();
            
            MessageBox.Show("Settings saved successfully!", "Success", 
                          MessageBoxButton.OK, MessageBoxImage.Information);
            
            DialogResult = true;
            Close();
        }

        private void CancelButton_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
