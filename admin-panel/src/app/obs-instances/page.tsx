'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Plus, Monitor, Circle, Video, VideoOff, Pencil, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { OBSInstance } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function OBSInstancesPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [deleteInstanceId, setDeleteInstanceId] = React.useState<string | null>(null);
  const [editingInstance, setEditingInstance] = React.useState<OBSInstance | null>(null);

  // Fetch instances with SWR (auto-refresh every 3 seconds)
  const { data, error, isLoading, mutate } = useSWR(
    'instances',
    () => apiClient.getInstances(),
    { refreshInterval: 3000 }
  );

  // Fetch stats
  const { data: stats } = useSWR(
    'instance-stats',
    () => apiClient.getInstanceStats(),
    { refreshInterval: 3000 }
  );

  const instances = data?.instances || [];

  // Form state for new instance
  const [newInstance, setNewInstance] = React.useState({
    clientId: '',
    name: '',
    location: '',
    description: '',
    capacity: 1,
  });

  const handleCreateInstance = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.createInstance(newInstance);
      toast({
        title: 'Success',
        description: 'Instance registered successfully',
      });
      setIsAddDialogOpen(false);
      setNewInstance({ clientId: '', name: '', location: '', description: '', capacity: 1 });
      mutate(); // Refresh data
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register instance',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateInstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInstance) return;

    try {
      await apiClient.updateInstance(editingInstance.id, {
        name: editingInstance.name,
        location: editingInstance.location,
        description: editingInstance.description,
        capacity: editingInstance.capacity,
      });
      toast({
        title: 'Success',
        description: 'Instance updated successfully',
      });
      setIsEditDialogOpen(false);
      setEditingInstance(null);
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update instance',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteInstance = async () => {
    if (!deleteInstanceId) return;

    try {
      await apiClient.deleteInstance(deleteInstanceId);
      toast({
        title: 'Success',
        description: 'Instance deleted successfully',
      });
      setDeleteInstanceId(null);
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete instance',
        variant: 'destructive',
      });
    }
  };

  const handleCommand = async (instance: OBSInstance, action: string) => {
    try {
      await apiClient.sendAction(
        instance.clientId,
        action as 'start-stream' | 'stop-stream' | 'start-recording' | 'stop-recording'
      );
      toast({
        title: 'Success',
        description: `Command sent to ${instance.name}`,
      });

      // Optimistic update
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send command',
        variant: 'destructive',
      });
    }
  };

  const handleSceneChange = async (instance: OBSInstance, sceneName: string) => {
    try {
      await apiClient.setScene(instance.clientId, sceneName);
      toast({
        title: 'Success',
        description: `Scene changed to "${sceneName}" on ${instance.name}`,
      });

      // Optimistic update
      mutate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change scene',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
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

  if (error) {
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
            <div className="text-center text-destructive">
              Failed to load instances. Please try again later.
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
          <h1 className="text-3xl font-bold tracking-tight">OBS Connections</h1>
          <p className="text-muted-foreground">
            Monitor and control connected OBS profiles. Each profile appears as an independent row.
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Instance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New OBS Profile</DialogTitle>
              <DialogDescription>
                Register a new OBS profile/connection. Note: Profiles are automatically registered when they first connect, so this is only needed for pre-registration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInstance} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID (Profile ID) *</Label>
                <Input
                  id="clientId"
                  placeholder="e.g. obs-studio-a-abc123"
                  value={newInstance.clientId}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, clientId: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must match the client ID in the OBS Bridge profile configuration. Each profile uses a unique client ID.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Profile Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Studio A - Main Stream"
                  value={newInstance.name}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, name: e.target.value })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Friendly name to identify this profile/connection
                </p>
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about this instance"
                  value={newInstance.description}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={newInstance.capacity}
                  onChange={(e) =>
                    setNewInstance({ ...newInstance, capacity: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Instances</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Circle className="h-4 w-4 fill-green-600 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.online || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recording</CardTitle>
            <Circle className="h-4 w-4 fill-red-600 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recording || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streaming</CardTitle>
            <Circle className="h-4 w-4 fill-blue-600 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.streaming || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Instances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {instances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Monitor className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No profiles connected</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Start profiles in the OBS Bridge app to see them here. Each profile will appear as a separate row.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Profile ID (Client ID)</TableHead>
                  <TableHead>Connection</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Current Scene</TableHead>
                  <TableHead>Connected At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell className="font-medium">{instance.name}</TableCell>
                    <TableCell>{instance.location || 'N/A'}</TableCell>
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
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                            : ''
                        }
                      >
                        <Circle className="mr-1 h-2 w-2 fill-current" />
                        {instance.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {instance.isRecording && (
                          <Badge variant="destructive" className="text-xs">
                            Recording
                          </Badge>
                        )}
                        {instance.isStreaming && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            Streaming
                          </Badge>
                        )}
                        {!instance.isRecording && !instance.isStreaming && (
                          <span className="text-sm text-muted-foreground">Idle</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {instance.status === 'online' && instance.scenes && instance.scenes.length > 0 ? (
                        <Select
                          value={instance.currentScene || ''}
                          onValueChange={(sceneName) => handleSceneChange(instance, sceneName)}
                          disabled={instance.status !== 'online'}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select scene" />
                          </SelectTrigger>
                          <SelectContent>
                            {instance.scenes.map((scene) => (
                              <SelectItem key={scene} value={scene}>
                                {scene}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-muted-foreground">
                          {instance.currentScene || 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {instance.connectedAt
                        ? new Date(instance.connectedAt).toLocaleString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCommand(instance, 'start-recording')}
                          disabled={instance.status !== 'online' || instance.isRecording}
                          title="Start Recording"
                        >
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCommand(instance, 'stop-recording')}
                          disabled={instance.status !== 'online' || !instance.isRecording}
                          title="Stop Recording"
                        >
                          <VideoOff className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingInstance(instance);
                            setIsEditDialogOpen(true);
                          }}
                          title="Edit Profile"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteInstanceId(instance.id)}
                          title="Delete Profile"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      {editingInstance && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit OBS Profile</DialogTitle>
              <DialogDescription>
                Update profile metadata and configuration.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateInstance} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Profile Name *</Label>
                <Input
                  id="edit-name"
                  value={editingInstance.name}
                  onChange={(e) =>
                    setEditingInstance({ ...editingInstance, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingInstance.location || ''}
                  onChange={(e) =>
                    setEditingInstance({ ...editingInstance, location: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingInstance.description || ''}
                  onChange={(e) =>
                    setEditingInstance({ ...editingInstance, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  value={editingInstance.capacity}
                  onChange={(e) =>
                    setEditingInstance({ ...editingInstance, capacity: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Profile</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteInstanceId}
        onOpenChange={() => setDeleteInstanceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this profile from the database. The profile can reconnect and will be auto-registered again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInstance}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
