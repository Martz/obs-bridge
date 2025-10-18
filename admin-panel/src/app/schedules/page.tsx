'use client';

import * as React from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Repeat } from 'lucide-react';
import { format } from 'date-fns';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import type { Schedule } from '@/types';

export default function SchedulesPage() {
  // Mock data for demonstration - will be replaced with API calls
  const [schedules, setSchedules] = React.useState<Schedule[]>([
    {
      id: '1',
      obsInstanceId: 'obs-1',
      obsInstanceName: 'Studio A',
      title: 'Daily Recording Slot',
      description: 'Available recording time for students',
      startTime: new Date('2025-10-19T09:00:00'),
      endTime: new Date('2025-10-19T10:00:00'),
      recurring: {
        frequency: 'daily',
        interval: 1,
        endDate: new Date('2025-12-31'),
      },
      status: 'scheduled',
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [isCreatingSchedule, setIsCreatingSchedule] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    new Date()
  );

  // Form state for creating new schedule
  const [newSchedule, setNewSchedule] = React.useState({
    title: '',
    description: '',
    obsInstanceId: '',
    startTime: '09:00',
    endTime: '10:00',
    recurring: false,
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    interval: 1,
  });

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    const [startHour, startMinute] = newSchedule.startTime.split(':');
    const [endHour, endMinute] = newSchedule.endTime.split(':');

    const startTime = new Date(selectedDate);
    startTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

    const schedule: Schedule = {
      id: Date.now().toString(),
      obsInstanceId: newSchedule.obsInstanceId,
      obsInstanceName: `OBS Instance ${newSchedule.obsInstanceId}`,
      title: newSchedule.title,
      description: newSchedule.description,
      startTime,
      endTime,
      recurring: newSchedule.recurring
        ? {
            frequency: newSchedule.frequency,
            interval: newSchedule.interval,
            endDate: new Date('2025-12-31'),
          }
        : undefined,
      status: 'scheduled',
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSchedules([...schedules, schedule]);
    setIsCreatingSchedule(false);
    setNewSchedule({
      title: '',
      description: '',
      obsInstanceId: '',
      startTime: '09:00',
      endTime: '10:00',
      recurring: false,
      frequency: 'weekly',
      interval: 1,
    });
  };

  const handleDeleteSchedule = (id: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(schedules.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedules</h1>
          <p className="text-muted-foreground">
            Create and manage recording schedules for students to book
          </p>
        </div>
        <Dialog open={isCreatingSchedule} onOpenChange={setIsCreatingSchedule}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
              <DialogDescription>
                Set up a new recording schedule that students can book.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="title">Schedule Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Morning Recording Session"
                    value={newSchedule.title}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    placeholder="e.g. Available for all students"
                    value={newSchedule.description}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="obsInstance">OBS Instance</Label>
                  <Select
                    value={newSchedule.obsInstanceId}
                    onValueChange={(value) =>
                      setNewSchedule({ ...newSchedule, obsInstanceId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an OBS instance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="obs-1">Studio A</SelectItem>
                      <SelectItem value="obs-2">Studio B</SelectItem>
                      <SelectItem value="obs-3">Home Studio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Start Date</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, startTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) =>
                      setNewSchedule({ ...newSchedule, endTime: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={newSchedule.recurring}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          recurring: e.target.checked,
                        })
                      }
                    />
                    <Label htmlFor="recurring" className="cursor-pointer">
                      Recurring Schedule
                    </Label>
                  </div>
                </div>
                {newSchedule.recurring && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select
                        value={newSchedule.frequency}
                        onValueChange={(value) =>
                          setNewSchedule({
                            ...newSchedule,
                            frequency: value as 'daily' | 'weekly' | 'monthly',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interval">Interval</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={newSchedule.interval}
                        onChange={(e) =>
                          setNewSchedule({
                            ...newSchedule,
                            interval: parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Repeat every {newSchedule.interval}{' '}
                        {newSchedule.frequency === 'daily'
                          ? 'day(s)'
                          : newSchedule.frequency === 'weekly'
                          ? 'week(s)'
                          : 'month(s)'}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreatingSchedule(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Schedule</Button>
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
              Total Schedules
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter((s) => s.status === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recurring</CardTitle>
            <Repeat className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schedules.filter((s) => s.recurring).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedules Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Schedules</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No schedules created</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first schedule to allow students to book recording
                sessions.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>OBS Instance</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Recurring</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{schedule.title}</div>
                        {schedule.description && (
                          <div className="text-xs text-muted-foreground">
                            {schedule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{schedule.obsInstanceName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(schedule.startTime, 'PPP')}</div>
                        <div className="text-muted-foreground">
                          {format(schedule.startTime, 'p')} -{' '}
                          {format(schedule.endTime, 'p')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {schedule.recurring ? (
                        <Badge variant="secondary">
                          <Repeat className="mr-1 h-3 w-3" />
                          {schedule.recurring.frequency}
                        </Badge>
                      ) : (
                        <Badge variant="outline">One-time</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          schedule.status === 'scheduled'
                            ? 'default'
                            : schedule.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          Delete
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
