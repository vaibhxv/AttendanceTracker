import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import axios from 'axios'
import { useToast } from "@/hooks/use-toast"

interface MarkHolidayFormProps {
  onSuccess: () => void
}

export default function MarkHolidayForm({ onSuccess }: MarkHolidayFormProps) {
  const { toast } = useToast()
  const [holidayDate, setHolidayDate] = useState<Date | undefined>(new Date())
  const [holidayReason, setHolidayReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Create axios instance with authorization header
  const axiosAuth = axios.create({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!holidayDate) return
    
    setIsLoading(true)
    try {
      await axiosAuth.post('https://attendanceapi.everythingwithai.com/api/timetable/holiday', {
        date: holidayDate.toISOString(),
        reason: holidayReason,
      })
      toast({
        title: "Success",
        description: "Holiday marked successfully",
        variant: "default",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark holiday",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Select Date</label>
        <Calendar
          mode="single"
          selected={holidayDate}
          onSelect={setHolidayDate}
          className="border rounded-md"
        />
      </div>
      <Input
        placeholder="Reason for Holiday"
        value={holidayReason}
        onChange={(e) => setHolidayReason(e.target.value)}
        required
      />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Marking..." : "Mark as Holiday"}
      </Button>
    </form>
  )
}