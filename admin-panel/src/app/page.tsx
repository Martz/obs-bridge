'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Monitor, Calendar, BookOpen, Activity } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { DashboardStats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats>({
    totalOBSInstances: 0,
    onlineInstances: 0,
    activeRecordings: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch real data from the API
        const clients = await apiClient.getConnectedClients();
        const health = await apiClient.getHealth();

        setStats({
          totalOBSInstances: health.clients,
          onlineInstances: clients.clients.length,
          activeRecordings: 0, // Will be updated when we track recording status
          todayBookings: 0, // Placeholder until booking API is implemented
          upcomingBookings: 0, // Placeholder
          totalBookings: 0, // Placeholder
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Total OBS Instances',
      value: stats.totalOBSInstances,
      icon: Monitor,
      description: `${stats.onlineInstances} online`,
      color: 'text-blue-600',
    },
    {
      title: 'Active Recordings',
      value: stats.activeRecordings,
      icon: Activity,
      description: 'Currently recording',
      color: 'text-red-600',
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: Calendar,
      description: `${stats.upcomingBookings} upcoming`,
      color: 'text-green-600',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: BookOpen,
      description: 'All time',
      color: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the OBS Bridge Admin Panel
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the OBS Bridge Admin Panel
          </p>
        </div>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          System Online
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Common administrative tasks
            </p>
            <div className="space-y-2">
              <a
                href="/obs-instances"
                className="block text-sm font-medium text-primary hover:underline"
              >
                Manage OBS Instances →
              </a>
              <a
                href="/schedules"
                className="block text-sm font-medium text-primary hover:underline"
              >
                Create New Schedule →
              </a>
              <a
                href="/bookings"
                className="block text-sm font-medium text-primary hover:underline"
              >
                View All Bookings →
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity tracking will be displayed here once the booking system
              is integrated.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">API Server</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Healthy
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">WebSocket</span>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Connected
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Database</span>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Pending
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
