# OBS Recording Scheduler - Frontend

A modern React application for scheduling OBS (Open Broadcaster Software) recording sessions. Users can browse available time slots, select OBS instances, and book recording sessions.

## Features

- **Calendar View**: Interactive calendar to select recording dates
- **Time Slot Selection**: Browse available time slots for each day
- **OBS Instance Management**: View and select from available OBS instances
- **Scene Selection**: Choose specific scenes for your recording
- **Responsive Design**: Clean, professional UI with shadcn/ui components
- **Left Sidebar Navigation**: Easy navigation between different sections

## Tech Stack

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **shadcn/ui** - UI component library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date manipulation

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173/`

## Project Structure

```
src/
├── components/
│   ├── booking/         # Booking related components
│   │   ├── AvailableSlots.tsx
│   │   └── BookingForm.tsx
│   ├── layout/          # Layout components
│   │   └── AppLayout.tsx
│   └── ui/              # shadcn/ui components
├── lib/                 # Utilities and data
│   ├── mockData.ts      # Mock data for OBS instances and availability
│   └── utils.ts         # Utility functions
├── pages/               # Page components
│   └── Dashboard.tsx
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind directives
```

## Current Features

### Dashboard
- Calendar view for date selection
- Available time slots display
- Real-time availability checking
- OBS instance selection with details (location, status, scenes)
- Scene selection for recordings
- Booking confirmation

### User Interface
- **Dark/Light Mode Toggle** - Persistent theme switching with smooth transitions
- **User Profile Dropdown** - Interactive profile menu with:
  - User avatar with initials fallback
  - Role badge (admin, moderator, user)
  - Quick access to profile, billing, settings, and support
  - Logout option
- **Responsive Design** - Adapts to different screen sizes
- **Collapsible Sidebar** - Toggle navigation menu

### Mock Data
The application currently uses mock data for:
- OBS instances (Studio A, Studio B, Home Studio, Conference Room)
- Availability slots (9 AM to 5 PM for the next 30 days)
- Scene configurations per instance
- User profiles (Alex Johnson - Admin, Sarah Williams - User, Michael Chen - Moderator)

## Future Enhancements

- User authentication
- Backend API integration
- Real-time availability updates
- Booking history and management
- Email notifications
- Multi-user support
- Advanced filtering options

## Development Notes

- Authentication is not yet implemented
- Currently using mock data for OBS instances and availability
- The booking confirmation is currently a placeholder alert
- Ready for backend integration
