import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from "@/hooks/use-toast"
import { 
    Percent
  } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CalendarDays, CheckCircle2, School2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface Timetable {
  _id: string;
  className: string;
  day: string;
  time: string;
}

interface Holiday {
  _id: string;
  date: string;
  reason: string;
}

interface Attendance {
  _id: string;
  className: string;
  date: string;
  present: boolean;
}
interface AttendanceSummary {
    className: string;
    totalClasses: number;
    presentCount: number;
    percentage: number;
  }

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_SLOTS = [
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
];

export default function AttendanceTracker() {
  const { toast } = useToast()
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [className, setClassName] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDate, setHolidayDate] = useState<Date | undefined>(new Date());
  const [holidayReason, setHolidayReason] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, Attendance>>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  const fetchAttendanceSummary = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/attendance');
      const allRecords: Attendance[] = response.data;
      
      // Group records by class name
      const summaryMap = new Map<string, { present: number; total: number }>();
      
      allRecords.forEach(record => {
        const current = summaryMap.get(record.className) || { present: 0, total: 0 };
        summaryMap.set(record.className, {
          present: current.present + (record.present ? 1 : 0),
          total: current.total + 1
        });
      });
      
      // Convert map to array of summaries
      const summaries: AttendanceSummary[] = Array.from(summaryMap.entries()).map(([className, stats]) => ({
        className,
        totalClasses: stats.total,
        presentCount: stats.present,
        percentage: Math.round((stats.present / stats.total) * 100)
      }));
      
      setAttendanceSummary(summaries);
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error);
    }
  };

  const markAllAbsentForToday = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      // First, get current attendance records for today
      const attendanceResponse = await axios.get(`http://localhost:8080/api/attendance?date=${today}`);
      const existingRecords = attendanceResponse.data.reduce((acc: Record<string, Attendance>, record: Attendance) => {
        acc[record.className] = record;
        return acc;
      }, {});

      // Mark absent for all classes that don't have records
      const markAbsentPromises = timetables.map(async (timetable) => {
        if (!existingRecords[timetable.className]) {
          return axios.put(
            `http://localhost:8080/api/attendance/${encodeURIComponent(timetable.className)}/${today}`,
            { present: false }
          );
        }
      });

      await Promise.all(markAbsentPromises.filter(Boolean));
      
      // Refresh the data
      await fetchAttendance();
      await fetchAttendanceSummary();

    } catch (error) {
      console.error('Failed to mark all absent:', error);
      toast({
        title: "Error",
        description: "Failed to initialize attendance",
        variant: "destructive",
        duration: 3000,
      });
    }};
  const fetchTimetables = async () => {
    try {
      const today = new Date();
      const dayOfWeek = format(today, 'EEEE');
      const response = await axios.get(`http://localhost:8080/api/timetable/${dayOfWeek}`);
      setTimetables(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
      return [];
    }
  };

  const fetchHolidays = async () => {
    const response = await axios.get('http://localhost:8080/api/timetable/');
    console.log(response);
    setHolidays(response.data);
  };

  const fetchAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(`http://localhost:8080/api/attendance?date=${today}`);
      const records: Record<string, Record<string, Attendance>> = {};
      
      // Initialize the records for today's date
      if (!records[today]) {
        records[today] = {};
      }
      
      // Store each attendance record under the appropriate date
      response.data.forEach((record: Attendance) => {
        if (!records[record.date]) {
          records[record.date] = {};
        }
        records[record.date][record.className] = record;
      });
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    }
  };

  const handleTimetableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('http://localhost:8080/api/timetable', { className, day, time });
    fetchTimetables();
    setClassName('');
    setDay('');
    setTime('');
  };

  const handleHolidaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (holidayDate) {
      await axios.post('http://localhost:8080/api/timetable/holiday', {
        date: holidayDate.toISOString(),
        reason: holidayReason,
      });
      fetchHolidays();
      setHolidayDate(new Date());
      setHolidayReason('');
    }
  };

  const toggleAttendance = async (timetable: Timetable, present: boolean) => {
    try {
      const date = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.put(
        `http://localhost:8080/api/attendance/${encodeURIComponent(timetable.className)}/${date}`,
        { present }
      );
      setAttendanceRecords(prev => ({
        ...prev,
        [date]: {
          ...(prev[date] || {}),
          [timetable.className]: response.data,
        },
      }));

      fetchAttendanceSummary();
      toast({
        title: present ? "Present" : "Absent",
        description: present 
          ? `${timetable.className} marked present successfully` 
          : `${timetable.className} marked absent successfully`,
        className: present 
          ? "bg-green-50 border-green-200 text-green-800" 
          : "bg-red-50 border-red-200 text-red-800",
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to update attendance:', error);
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
        duration: 3000,
      })
    }
  };


  const getPercentageColorClass = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    const initializeData = async () => {
      if (!isInitialized) {
        // First, fetch timetables
        const fetchedTimetables = await fetchTimetables();
        
        // Only proceed if we have timetables
        if (fetchedTimetables && fetchedTimetables.length > 0) {
          await fetchHolidays();
          await fetchAttendance();
          // Mark all absent only after we have timetables
          await markAllAbsentForToday();
          await fetchAttendanceSummary();
          setIsInitialized(true);
        }
      }
    };

    initializeData();
  }, [isInitialized]);


  const getAttendanceButton = (timetable: Timetable) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const record = attendanceRecords[today]?.[timetable.className];
    
    // If we have a record and it's marked present
    if (record?.present) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="md:w-[100px] w-auto text-green-600"
            disabled
          >
            <Check className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Present</span>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => toggleAttendance(timetable, false)}
            className="md:w-[100px] w-auto"
          >
            <h2>A</h2>
            <span className="hidden md:inline">Mark Absent</span>
          </Button>
        </div>
      );
    }
    
    // If we have a record and it's marked absent
    if (record && !record.present) {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => toggleAttendance(timetable, true)}
            className="md:w-[100px] w-auto bg-green-600"
          >
            <h2>P</h2>
            <span className="hidden md:inline">Mark Present</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="md:w-[100px] w-auto text-red-600"
            disabled
          >
            <X className="h-4 w-4" />
            <span className="hidden md:inline ml-1">Absent</span>
          </Button>
        </div>
      );
    }
    
    // If we don't have a record yet
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => toggleAttendance(timetable, true)}
          className="md:w-[100px] w-auto"
        >
          <h2>P</h2>
          <span className="hidden md:inline">Mark Present</span>
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => toggleAttendance(timetable, false)}
          className="md:w-[100px] w-auto"
        >
          <h2>A</h2>
          <span className="hidden md:inline">Mark Absent</span>
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-1">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Attendance Tracker</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 sm:p-6 md:gap-4">
  {attendanceSummary.map((summary) => (
    <Card 
      key={summary.className}
      className="transition-all duration-200 hover:shadow-lg"
    >
      <CardHeader className="pb-2 space-y-1">
        <CardTitle className="text-base sm:text-lg font-semibold tracking-tight">
          {summary.className}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row items-center justify-between space-x-2">
          <div className="flex items-center gap-1.5">
            <Percent className="h-4 w-4 text-muted-foreground" />
            <span 
              className={`text-xl sm:text-2xl font-bold ${getPercentageColorClass(summary.percentage)}`}
            >
              {summary.percentage}%
            </span>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            {summary.presentCount}/{summary.totalClasses} classes
          </div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Add Timetable</CardTitle>
              <CardDescription>Schedule a new class in your timetable</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTimetableSubmit} className="space-y-4">
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
                <Button type="submit" className="w-full">
                  Add to Timetable
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mark Holiday</CardTitle>
              <CardDescription>Add a holiday to the calendar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHolidaySubmit} className="space-y-4">
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
                <Button type="submit" variant="secondary" className="w-full">
                  Mark as Holiday
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <CardTitle>Today's Classes</CardTitle>
        </div>
        <CardDescription>
          {format(new Date(), 'EEEE, MMMM do, yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-hidden"> {/* Remove overflow-x-auto */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Time</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timetables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No classes scheduled for today
                  </TableCell>
                </TableRow>
              ) : (
                timetables.map((timetable) => (
                  <TableRow key={timetable._id}>
                    <TableCell className="whitespace-nowrap text-sm">{timetable.time}</TableCell>
                    <TableCell>
                      <div className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                        {timetable.className}
                      </div>
                    </TableCell>
                    <TableCell className="p-1">{getAttendanceButton(timetable)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Holidays</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holidays.length === 0 ? (
                <p className="text-center text-muted-foreground">No upcoming holidays</p>
              ) : (
                holidays.map((holiday) => (
                  <div
                    key={holiday._id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">
                        {format(new Date(holiday.date), 'MMMM do, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">{holiday.reason}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}