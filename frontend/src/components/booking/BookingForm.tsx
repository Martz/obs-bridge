import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TimeSlot } from '@/lib/mockData'
import { obsInstances } from '@/lib/mockData'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Video } from 'lucide-react'

interface BookingFormProps {
  selectedDate?: Date
  selectedSlot?: TimeSlot
}

export function BookingForm({ selectedDate, selectedSlot }: BookingFormProps) {
  const [selectedInstance, setSelectedInstance] = useState<string>('')
  const [selectedScene, setSelectedScene] = useState<string>('')

  // Reset selections when slot changes
  useEffect(() => {
    setSelectedInstance('')
    setSelectedScene('')
  }, [selectedSlot])

  const availableInstances = selectedSlot
    ? obsInstances.filter(instance =>
        selectedSlot.availableInstances.includes(instance.id)
      )
    : []

  const selectedInstanceData = availableInstances.find(
    instance => instance.id === selectedInstance
  )

  const canBook = selectedDate && selectedSlot && selectedInstance && selectedScene

  const handleBook = () => {
    if (!canBook) return

    // TODO: Implement booking logic
    alert(`Booking confirmed!\n\nDate: ${format(selectedDate, 'PPP')}\nTime: ${selectedSlot.startTime} - ${selectedSlot.endTime}\nInstance: ${selectedInstanceData?.name}\nScene: ${selectedScene}`)
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Book Recording</CardTitle>
        <CardDescription>
          Select an OBS instance and scene for your recording
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedDate && selectedSlot ? (
          <>
            <div className="space-y-4 pb-4 border-b">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
              </div>
            </div>

            {availableInstances.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No OBS instances available for this time slot
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">OBS Instance</label>
                  <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an OBS instance" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInstances.map(instance => (
                        <SelectItem key={instance.id} value={instance.id}>
                          <div className="flex items-center gap-2">
                            <span>{instance.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {instance.location}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedInstanceData && (
                  <>
                    <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Location:</span>
                        <span>{selectedInstanceData.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={selectedInstanceData.status === 'available' ? 'default' : 'secondary'}>
                          {selectedInstanceData.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Scene</label>
                      <Select value={selectedScene} onValueChange={setSelectedScene}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a scene" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedInstanceData.scenes.map(scene => (
                            <SelectItem key={scene} value={scene}>
                              {scene}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Select a date and time slot to begin booking
            </p>
          </div>
        )}
      </CardContent>
      {selectedDate && selectedSlot && availableInstances.length > 0 && (
        <CardFooter>
          <Button
            className="w-full"
            disabled={!canBook}
            onClick={handleBook}
          >
            Confirm Booking
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
