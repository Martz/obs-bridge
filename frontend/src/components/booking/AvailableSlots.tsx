import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { TimeSlot } from '@/lib/mockData'
import { format } from 'date-fns'

interface AvailableSlotsProps {
  date: Date
  slots: TimeSlot[]
  selectedSlot?: string
  onSlotSelect: (slotId: string) => void
}

export function AvailableSlots({ date, slots, selectedSlot, onSlotSelect }: AvailableSlotsProps) {
  const availableSlots = slots.filter(slot => slot.availableInstances.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Time Slots</CardTitle>
        <CardDescription>
          {format(date, 'EEEE, MMMM do, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availableSlots.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No available slots for this date
          </p>
        ) : (
          <div className="grid gap-2">
            {availableSlots.map(slot => (
              <Button
                key={slot.id}
                variant={selectedSlot === slot.id ? 'default' : 'outline'}
                className="justify-between"
                onClick={() => onSlotSelect(slot.id)}
              >
                <span>
                  {slot.startTime} - {slot.endTime}
                </span>
                <Badge variant="secondary">
                  {slot.availableInstances.length} available
                </Badge>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
