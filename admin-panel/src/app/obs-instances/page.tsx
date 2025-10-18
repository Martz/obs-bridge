'use client';

import * as React from 'react';
import { Plus, Monitor, Circle, Video, VideoOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api/client';
import type { OBSInstance, OBSClient } from '@/types';

export default function OBSInstancesPage() {
  const [instances, setInstances] = React.useState<OBSInstance[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isAddingInstance, setIsAddingInstance] = React.useState(false);

  // Form state for adding new instance
  const [newInstance, setNewInstance] = React.useState({
    name: '',
    location: '',
    clientId: '',
  });

  React.useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await apiClient.getConnectedClients();

        // Transform API response to OBSInstance format
        const transformedInstances: OBSInstance[] = response.clients.map(
          (client: OBSClient) => ({
            id: client.clientId,
            clientId: client.clientId,
            name: `OBS Instance ${client.clientId}`,
            location: 'Unknown',
            status: 'online' as const,
            connectedAt: new Date(client.connected),
            lastSeen: new Date(client.connected),
          })
        );

        setInstances(transformedInstances);
      } catch (error) {
        console.error('Failed to fetch OBS instances:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInstances();

    // Poll for updates every 3 seconds
    const interval = setInterval(fetchInstances, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleAddInstance = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real implementation, this would:
    // 1. Save to database
    // 2. Send configuration to the OBS Bridge client
    // For now, we'll just show a message
    alert(
      `Instance "${newInstance.name}" will be registered when the OBS Bridge client with ID "${newInstance.clientId}" connects.`
    );

    setIsAddingInstance(false);
    setNewInstance({ name: '', location: '', clientId: '' });
  };

  const handleCommand = async (clientId: string, action: string) => {
    try {
      await apiClient.sendAction(
        clientId,
        action as 'start-stream' | 'stop-stream' | 'start-recording' | 'stop-recording'
      );
    } catch (error) {
      console.error(`Failed to send ${action} command:`, error);
      alert(`Failed to send command. Error: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OBS Instances</h1>
            <p className="text-muted-foreground">
              Manage and monitor OBS recording instances
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded bg-muted" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OBS Instances</h1>
          <p className="text-muted-foreground">
            Manage and monitor OBS recording instances
          </p>
        </div>
        <Dialog open={isAddingInstance} onOpenChange={setIsAddingInstance}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Instance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New OBS Instance</DialogTitle>
              <DialogDescription>
                Configure a new OBS instance that students can book for recordings.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddInstance} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Instance Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Studio A"
                  value={newInstance.name}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Building 3, Room 201"
                  value={newInstance.location}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, location: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  placeholder="e.g. studio-a-obs"
                  value={newInstance.clientId}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, clientId: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  This must match the client ID configured in the OBS Bridge
                  application.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingInstance(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Register Instance</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Instances
            </CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{instances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Circle className="h-4 w-4 fill-green-600 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === 'online').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <Circle className="h-4 w-4 fill-gray-400 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {instances.filter((i) => i.status === 'offline').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Instances</CardTitle>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Monitor className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No instances connected</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Start an OBS Bridge client to see it appear here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {instance.clientId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          instance.status === 'online' ? 'default' : 'secondary'
                        }
                        className={
                          instance.status === 'online'
                            ? 'bg-green-100 text-green-800'
                            : ''
                        }
                      >
                        <Circle
                          className={`mr-1 h-2 w-2 fill-current`}
                        />
                        {instance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {instance.connectedAt
                        ? new Date(instance.connectedAt).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCommand(instance.clientId, 'start-recording')
                          }
                          disabled={instance.status !== 'online'}
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleCommand(instance.clientId, 'stop-recording')
                          }
                          disabled={instance.status !== 'online'}
                        >
                          <VideoOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
