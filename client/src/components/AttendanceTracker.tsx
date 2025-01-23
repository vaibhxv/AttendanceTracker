import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
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

export default function AttendanceTracker() {
  const { toast } = useToast()
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, Attendance>>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Create axios instance with authorization header
  const axiosAuth = axios.create({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const fetchAttendanceSummary = async () => {
    try {
      const response = await axiosAuth.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/attendance`);
      const allRecords: Attendance[] = response.data;
      
      const summaryMap = new Map<string, { present: number; total: number }>();
      
      allRecords.forEach(record => {
        const current = summaryMap.get(record.className) || { present: 0, total: 0 };
        summaryMap.set(record.className, {
          present: current.present + (record.present ? 1 : 0),
          total: current.total + 1
        });
      });
      
      const summaries: AttendanceSummary[] = Array.from(summaryMap.entries()).map(([className, stats]) => ({
        className,
        totalClasses: stats.total,
        presentCount: stats.present,
        percentage: Math.round((stats.present / stats.total) * 100)
      }));
      
      setAttendanceSummary(summaries);
    } catch (error) {
      console.error('Failed to fetch attendance summary:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Handle unauthorized access
        window.location.href = '/login';
      }
    }
  };

  const markAllAbsentForToday = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    try {
      const attendanceResponse = await axiosAuth.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/attendance?date=${today}`);
      const existingRecords = attendanceResponse.data.reduce((acc: Record<string, Attendance>, record: Attendance) => {
        acc[record.className] = record;
        return acc;
      }, {});

      const markAbsentPromises = timetables.map(async (timetable) => {
        if (!existingRecords[timetable.className]) {
          return axiosAuth.put(
            `${import.meta.env.VITE_APP_BACKEND_URL}/api/attendance/${encodeURIComponent(timetable.className)}/${today}`,
            { present: false }
          );
        }
      });

      await Promise.all(markAbsentPromises.filter(Boolean));
      await fetchAttendance();
      await fetchAttendanceSummary();
    } catch (error) {
      console.error('Failed to mark all absent:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      toast({
        title: "Error",
        description: "Failed to initialize attendance",
        variant: "destructive",
      });
    }
  };

  const fetchTimetables = async () => {
    try {
      const today = new Date();
      const dayOfWeek = format(today, 'EEEE');
      const response = await axiosAuth.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/timetable/${dayOfWeek}`);
      setTimetables(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch timetables:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      return [];
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await axiosAuth.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/timetable/`);
      setHolidays(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  const fetchAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axiosAuth.get(`${import.meta.env.VITE_APP_BACKEND_URL}/api/attendance?date=${today}`);
      const records: Record<string, Record<string, Attendance>> = {};
      
      if (!records[today]) {
        records[today] = {};
      }
      
      response.data.forEach((record: Attendance) => {
        if (!records[record.date]) {
          records[record.date] = {};
        }
        records[record.date][record.className] = record;
      });
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  const toggleAttendance = async (timetable: Timetable, present: boolean) => {
    try {
      const date = format(new Date(), 'yyyy-MM-dd');
      const response = await axiosAuth.put(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/attendance/${encodeURIComponent(timetable.className)}/${date}`,
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
      })
    } catch (error) {
      console.error('Failed to update attendance:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
      toast({
        title: "Error",
        description: "Failed to update attendance",
        variant: "destructive",
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
        const fetchedTimetables = await fetchTimetables();
        if (fetchedTimetables && fetchedTimetables.length > 0) {
          await fetchAttendanceSummary();
          await fetchAttendance();
          await fetchHolidays();
          await markAllAbsentForToday();
          setIsInitialized(true);
        }
      }
    };

    initializeData();
  }, [isInitialized]);

  const getAttendanceButton = (timetable: Timetable) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const record = attendanceRecords[today]?.[timetable.className];
    
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8 py-8 px-1">
        <div className="flex items-center gap-2">
          <School2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Attendance Tracker</h1>
        </div>
  
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-4 sm:p-1 md:gap-4">
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
                  <div className="flex items-center gap-1">
                    
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
            <div className="w-full overflow-hidden">
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