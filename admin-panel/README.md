# OBS Bridge Admin Panel

A comprehensive administrative panel for managing OBS (Open Broadcaster Software) instances, recording schedules, and student bookings. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Features

### Dashboard
- Real-time system statistics and monitoring
- Connected OBS instances overview
- Active recordings tracking
- Booking statistics
- Quick action links
- System health monitoring

### OBS Instance Management
- View all connected OBS Bridge instances
- Real-time connection status monitoring
- Register and configure new OBS instances
- Control OBS instances remotely (start/stop recording and streaming)
- Instance metadata management

### Schedule Management
- Create recording schedules for students to book
- Support for one-time and recurring schedules
- Flexible recurring patterns (daily, weekly, monthly)
- Time slot management
- OBS instance assignment
- Schedule status tracking

### Booking Management
- View all student bookings
- Filter and search bookings
- Booking status management (pending, confirmed, in progress, completed, cancelled)
- Student information display
- Booking cancellation and modification

### User Management
- User account creation and management
- Role-based access control (admin, staff, student)
- User search and filtering
- Profile management

### Settings
- Server API configuration
- Notification preferences
- Booking rules and limits
- System information

### Theme Support
- Dark mode, light mode, and system theme support
- Persistent theme preference across sessions
- Smooth theme transitions
- Theme toggle accessible from sidebar

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Theme**: next-themes (dark mode support)
- **Icons**: Lucide React
- **Date Management**: date-fns
- **Form Handling**: React Hook Form (ready to integrate)
- **Validation**: Zod (ready to integrate)

## Project Structure

```
admin-panel/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── page.tsx           # Dashboard
│   │   ├── obs-instances/     # OBS instance management
│   │   ├── schedules/         # Schedule management
│   │   ├── bookings/          # Booking management
│   │   ├── users/             # User management
│   │   ├── settings/          # Settings page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── layout/            # Layout components
│   │   │   └── AppLayout.tsx  # Main application layout with sidebar
│   │   ├── ui/                # shadcn/ui components
│   │   ├── obs/               # OBS-specific components (future)
│   │   ├── scheduling/        # Scheduling components (future)
│   │   └── bookings/          # Booking components (future)
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts      # API client for server communication
│   │   └── utils.ts           # Utility functions
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── hooks/                 # Custom React hooks (future)
│   └── contexts/              # React contexts (future)
├── public/                    # Static assets
└── README.md                  # This file
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm
- Running instance of the OBS Bridge server API

### Installation

1. Clone the repository and navigate to the admin panel directory:

```bash
cd /path/to/SchedulingApp/admin-panel
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file for environment configuration:

```bash
cp .env.example .env.local
```

4. Configure the API server URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

Build the application:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

### Linting

Run ESLint:

```bash
npm run lint
```

## API Integration

The admin panel communicates with the OBS Bridge server API at `http://localhost:8000` (configurable via environment variables).

### Current Endpoints Used

- `GET /health` - Server health check
- `GET /api/clients` - Get connected OBS clients
- `POST /api/command/:clientId` - Send command to specific OBS instance
- `POST /api/broadcast` - Broadcast command to all OBS instances
- `POST /api/action/:clientId/:action` - Quick action shortcuts

### Future Endpoints (To Be Implemented in Server API)

The following endpoints are needed for full functionality:

- `GET /api/admin/schedules` - List all schedules
- `POST /api/admin/schedules` - Create new schedule
- `PUT /api/admin/schedules/:id` - Update schedule
- `DELETE /api/admin/schedules/:id` - Delete schedule
- `GET /api/admin/bookings` - List all bookings
- `PUT /api/admin/bookings/:id` - Update booking
- `DELETE /api/admin/bookings/:id` - Cancel booking
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Features in Detail

### Dashboard

The dashboard provides an overview of the entire system:

- **Statistics Cards**: Show total OBS instances, active recordings, and booking counts
- **Real-Time Updates**: Polls the server API every 5 seconds for live data
- **Quick Actions**: Direct links to common administrative tasks
- **System Status**: Visual indicators for API server, WebSocket, and database health

### OBS Instance Management

Manage all OBS Bridge instances from a single interface:

- **Live Status**: See which instances are online and their connection times
- **Quick Actions**: Start/stop recording and streaming with one click
- **Instance Registration**: Add new OBS instances with client ID configuration
- **Automatic Discovery**: Instances appear automatically when they connect

### Schedule Management

Create and manage recording schedules:

- **Flexible Scheduling**: One-time or recurring schedules
- **Calendar Integration**: Visual calendar for date selection
- **Time Management**: Set start and end times for recording slots
- **Recurring Patterns**: Daily, weekly, or monthly repetition with custom intervals
- **OBS Assignment**: Assign schedules to specific OBS instances

### Booking Management

Monitor and control all student bookings:

- **Comprehensive View**: See all bookings across all instances
- **Advanced Filtering**: Search by student, instance, or status
- **Status Management**: Track pending, confirmed, in progress, completed, and cancelled bookings
- **Student Information**: View student details and booking notes
- **Quick Actions**: Approve, cancel, or modify bookings

### User Management

Administer user accounts:

- **Role-Based Access**: Admin, staff, and student roles
- **User Creation**: Add new users with appropriate permissions
- **Search and Filter**: Find users by name, email, or role
- **Profile Management**: Edit user information and roles

## Current Limitations

The admin panel is currently using mock data for:

- Schedules
- Bookings
- Users

These features will be fully functional once the corresponding backend API endpoints are implemented in the server-api application.

## Future Enhancements

1. **Authentication System**
   - User login/logout
   - Session management
   - Protected routes
   - JWT token handling

2. **Database Integration**
   - Persistent storage for schedules, bookings, and users
   - Migration system
   - Data validation

3. **Real-Time Updates**
   - WebSocket integration for live notifications
   - Real-time booking updates
   - Live OBS instance status

4. **Enhanced Features**
   - Email notifications
   - Calendar export (iCal)
   - Booking conflicts detection
   - Usage analytics and reporting
   - Audit logs
   - Bulk operations

5. **UI Improvements**
   - Accessibility enhancements
   - Mobile responsive design improvements
   - Loading states and error boundaries
   - Enhanced animations and transitions

## Development Notes

### Adding New Pages

1. Create a new directory in `src/app/`
2. Add a `page.tsx` file in that directory
3. Add the route to the navigation in `src/components/layout/AppLayout.tsx`

### Adding New Components

1. Create component files in the appropriate directory under `src/components/`
2. Use TypeScript for type safety
3. Follow the existing component patterns

### API Client Usage

The API client is available at `src/lib/api/client.ts`:

```typescript
import { apiClient } from '@/lib/api/client';

// Get connected clients
const clients = await apiClient.getConnectedClients();

// Send command to specific instance
await apiClient.sendCommand('client-id', {
  command: 'StartRecording',
});
```

## Contributing

This is part of the OBS Bridge Application project. Follow these guidelines:

- Use British English spelling in all code and documentation
- Follow Conventional Commits formatting for git commits
- Prefer TypeScript over JavaScript
- Avoid using the `any` type where possible
- Avoid excessive use of hyphens in comments and documentation

## Related Projects

- **server-api**: NestJS backend server for OBS Bridge communication
- **frontend**: React student-facing booking application
- **obs-bridge**: macOS native bridge for OBS Studio WebSocket integration

## Support

For issues, questions, or contributions, please refer to the main project repository.

## Licence

UNLICENSED - Private project
