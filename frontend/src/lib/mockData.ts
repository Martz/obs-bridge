export interface OBSInstance {
  id: string
  name: string
  location: string
  status: 'available' | 'busy' | 'offline'
  scenes: string[]
}

export interface TimeSlot {
  id: string
  startTime: string
  endTime: string
  availableInstances: string[]
}

export interface DayAvailability {
  date: Date
  slots: TimeSlot[]
}

export const obsInstances: OBSInstance[] = [
  {
    id: 'obs-1',
    name: 'Studio A',
    location: 'Main Building',
    status: 'available',
    scenes: ['Gaming', 'Podcast', 'Interview', 'Screen Share'],
  },
  {
    id: 'obs-2',
    name: 'Studio B',
    location: 'Main Building',
    status: 'available',
    scenes: ['Gaming', 'Tutorial', 'Presentation'],
  },
  {
    id: 'obs-3',
    name: 'Home Studio',
    location: 'Remote',
    status: 'available',
    scenes: ['Casual', 'Gaming', 'Chat'],
  },
  {
    id: 'obs-4',
    name: 'Conference Room',
    location: 'Office Building',
    status: 'offline',
    scenes: ['Meeting', 'Presentation', 'Workshop'],
  },
]

// Generate mock availability for the next 30 days
export function generateAvailability(): DayAvailability[] {
  const availability: DayAvailability[] = []
  const today = new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    const slots: TimeSlot[] = []

    // Generate slots for 9 AM to 5 PM
    for (let hour = 9; hour < 17; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`

      // Randomly assign available instances to each slot
      const availableInstances = obsInstances
        .filter(instance => instance.status === 'available')
        .filter(() => Math.random() > 0.3) // 70% chance an instance is available
        .map(instance => instance.id)

      slots.push({
        id: `slot-${i}-${hour}`,
        startTime,
        endTime,
        availableInstances,
      })
    }

    availability.push({
      date,
      slots,
    })
  }

  return availability
}

export const availability = generateAvailability()
