'use client';

import * as React from 'react';
import { Search, Filter, Calendar as CalendarIcon, User } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Booking } from '@/types';

export default function BookingsPage() {
  // Mock data for demonstration - will be replaced with API calls
  const [bookings] = React.useState<Booking[]>([
    {
      id: '1',
      scheduleId: 'schedule-1',
      userId: 'user-1',
      userName: 'Alice Johnson',
      userEmail: 'alice@example.com',
      obsInstanceId: 'obs-1',
      obsInstanceName: 'Studio A',
      startTime: new Date('2025-10-19T09:00:00'),
      endTime: new Date('2025-10-19T10:00:00'),
      status: 'confirmed',
      notes: 'Need to record a presentation',
      createdAt: new Date('2025-10-15T14:30:00'),
      updatedAt: new Date('2025-10-15T14:30:00'),
    },
    {
      id: '2',
      scheduleId: 'schedule-2',
      userId: 'user-2',
      userName: 'Bob Smith',
      userEmail: 'bob@example.com',
      obsInstanceId: 'obs-2',
      obsInstanceName: 'Studio B',
      startTime: new Date('2025-10-20T14:00:00'),
      endTime: new Date('2025-10-20T15:00:00'),
      status: 'pending',
      notes: 'Recording a tutorial',
      createdAt: new Date('2025-10-16T10:15:00'),
      updatedAt: new Date('2025-10-16T10:15:00'),
    },
    {
      id: '3',
      scheduleId: 'schedule-3',
      userId: 'user-3',
      userName: 'Carol Williams',
      userEmail: 'carol@example.com',
      obsInstanceId: 'obs-1',
      obsInstanceName: 'Studio A',
      startTime: new Date('2025-10-18T11:00:00'),
      endTime: new Date('2025-10-18T12:00:00'),
      status: 'completed',
      notes: 'Lecture recording',
      createdAt: new Date('2025-10-10T09:00:00'),
      updatedAt: new Date('2025-10-18T12:05:00'),
    },
  ]);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.obsInstanceName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  };

  const handleCancelBooking = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      // In a real implementation, this would call the API
      alert(`Booking ${id} would be cancelled`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
        <p className="text-muted-foreground">
          View and manage all student recording bookings
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bookings
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CalendarIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <CalendarIcon className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CalendarIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, email, or instance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Bookings ({filteredBookings.length} results)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No bookings found</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Bookings will appear here once students start making reservations'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>OBS Instance</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{booking.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {booking.userEmail}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {booking.obsInstanceName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(booking.startTime, 'PPP')}</div>
                        <div className="text-muted-foreground">
                          {format(booking.startTime, 'p')} -{' '}
                          {format(booking.endTime, 'p')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(booking.status)}
                        variant="secondary"
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {booking.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        {booking.status !== 'completed' &&
                          booking.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelBooking(booking.id)}
                            >
                              Cancel
                            </Button>
                          )}
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
