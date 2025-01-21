import { useState } from 'react'
import axios from 'axios'
import { useToast } from "@/hooks/use-toast"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"

const formSchema = z.object({
  date: z.date({
    required_error: "Please select a date",
  }),
  reason: z.string().min(1, "Reason is required"),
})

interface MarkHolidayFormProps {
  onSuccess: () => void
}

export default function MarkHolidayForm({ onSuccess }: MarkHolidayFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const token = localStorage.getItem('token')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      reason: "",
    },
  })

  const axiosAuth = axios.create({
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await axiosAuth.post(`${import.meta.env.VITE_APP_BACKEND_URL}/api/timetable/holiday`, {
        date: values.date.toISOString(),
        reason: values.reason,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  initialFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Input placeholder="Enter holiday reason" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Marking..." : "Mark as Holiday"}
        </Button>
      </form>
    </Form>
  )
}