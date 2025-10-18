'use client';

import * as React from 'react';
import { Save, Server, Bell, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  const [settings, setSettings] = React.useState({
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    emailNotifications: true,
    bookingAutoConfirm: false,
    maxBookingsPerStudent: 5,
    minBookingNotice: 24,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would save to the backend
    alert('Settings would be saved to the backend');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Server Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>Server Configuration</CardTitle>
            </div>
            <CardDescription>
              Configure connection to the OBS Bridge server API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiUrl">API Server URL</Label>
              <Input
                id="apiUrl"
                type="url"
                value={settings.apiUrl}
                onChange={(e) =>
                  setSettings({ ...settings, apiUrl: e.target.value })
                }
                placeholder="http://localhost:8000"
              />
              <p className="text-xs text-muted-foreground">
                The URL of your OBS Bridge server API. Restart the application
                after changing this setting.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Configure notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailNotifications">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send email notifications for new bookings and cancellations
                </p>
              </div>
              <input
                type="checkbox"
                id="emailNotifications"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailNotifications: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="bookingAutoConfirm">
                  Auto-Confirm Bookings
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically confirm student bookings without manual review
                </p>
              </div>
              <input
                type="checkbox"
                id="bookingAutoConfirm"
                checked={settings.bookingAutoConfirm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bookingAutoConfirm: e.target.checked,
                  })
                }
                className="h-4 w-4"
              />
            </div>
          </CardContent>
        </Card>

        {/* Booking Rules */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>Booking Rules</CardTitle>
            </div>
            <CardDescription>
              Set limits and rules for student bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxBookings">
                Maximum Bookings Per Student
              </Label>
              <Input
                id="maxBookings"
                type="number"
                min="1"
                max="50"
                value={settings.maxBookingsPerStudent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxBookingsPerStudent: parseInt(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of active bookings a student can have
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="minNotice">Minimum Booking Notice (hours)</Label>
              <Input
                id="minNotice"
                type="number"
                min="1"
                max="168"
                value={settings.minBookingNotice}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minBookingNotice: parseInt(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Minimum hours in advance students must book (24 hours = 1 day)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg">
            <Save className="mr-2 h-4 w-4" />
            Save Settings
          </Button>
        </div>
      </form>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="font-mono">1.0.0</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Environment</span>
            <span className="font-mono">
              {process.env.NODE_ENV || 'development'}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">API Connection</span>
            <span className="font-mono text-xs">{settings.apiUrl}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
