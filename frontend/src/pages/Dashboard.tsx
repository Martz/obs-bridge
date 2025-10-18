import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookingForm } from '@/components/booking/BookingForm'
import { AvailableSlots } from '@/components/booking/AvailableSlots'
import { availability } from '@/lib/mockData'

export function Dashboard() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | undefined>()

  const dayAvailability = availability.find(
    day => day.date.toDateString() === selectedDate?.toDateString()
  )

  const handleSlotSelect = (slotId: string) => {
    setSelectedSlot(slotId)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select a Date</CardTitle>
            <CardDescription>Choose a date to view available time slots</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              disabled={(date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return date < today
              }}
            />
          </CardContent>
        </Card>

        {selectedDate && dayAvailability && (
          <AvailableSlots
            date={selectedDate}
            slots={dayAvailability.slots}
            selectedSlot={selectedSlot}
            onSlotSelect={handleSlotSelect}
          />
        )}
      </div>

      <div>
        <BookingForm
          selectedDate={selectedDate}
          selectedSlot={selectedSlot ? dayAvailability?.slots.find(s => s.id === selectedSlot) : undefined}
        />
      </div>
    </div>
  )
}
