import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axios from 'axios'
import { useToast } from "@/hooks/use-toast"

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const TIME_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
]

interface AddTimetableFormProps {
  onSuccess: () => void
}

export default function AddTimetableForm({ onSuccess }: AddTimetableFormProps) {
  const { toast } = useToast()
  const [className, setClassName] = useState('')
  const [day, setDay] = useState('')
  const [time, setTime] = useState('')
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
    setIsLoading(true)
    
    try {
      await axiosAuth.post(`${import.meta.env.VITE_APP_BACKEND_URL}/api/timetable`, { className, day, time })
      toast({
        title: "Success",
        description: "Timetable added successfully",
        variant: "default",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add timetable",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Class Name"
        value={className}
        onChange={(e) => setClassName(e.target.value)}
        required
      />
      <Select value={day} onValueChange={setDay} required>
        <SelectTrigger>
          <SelectValue placeholder="Select Day" />
        </SelectTrigger>
        <SelectContent>
          {DAYS_OF_WEEK.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={time} onValueChange={setTime} required>
        <SelectTrigger>
          <SelectValue placeholder="Select Time" />
        </SelectTrigger>
        <SelectContent>
          {TIME_SLOTS.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add to Timetable"}
      </Button>
    </form>
  )
}