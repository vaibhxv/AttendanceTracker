import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import { AuroraBackground } from './ui/aurora-background';
import { motion } from 'framer-motion'
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
import { CalendarDays, CheckCircle2, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { MultiStepLoader as Loader } from '../components/ui/multi-step-loader';

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
  status: 'present' | 'absent' | 'pending';
}

interface AttendanceSummary {
  className: string;
  totalClasses: number;
  presentCount: number;
  percentage: number;
}

// Define the loading states
const loadingStates = [
  { text: "Waking up the hamsters to power the servers" },
  { text: "Convincing the holidays to show up on time" },
  { text: "Brewing a fresh pot of digital coffee" },
  { text: "Teaching robots to count attendance" },
  { text: "Juggling timetables in the cloud" },
  { text: "Making sure no holidays are left behind" },
  { text: "Warming up the data engines" },
  { text: "Finalizing data..." },
];

export default function AttendanceTracker() {
  const { toast } = useToast()
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, Record<string, Attendance>>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
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
          present: current.present + (record.status === 'present' ? 1 : 0),
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
        window.location.href = '/login';
      }
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
      
      records[today] = {};
      
      response.data.forEach((record: Attendance) => {
        records[today][record.className] = record;
      });
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        window.location.href = '/login';
      }
    }
  };

  const toggleAttendance = async (timetable: Timetable, status: 'present' | 'absent') => {
    try {
      const date = format(new Date(), 'yyyy-MM-dd');
      const response = await axiosAuth.put(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/attendance/${encodeURIComponent(timetable.className)}/${date}`,
        { status }
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
        title: status === 'present' ? "Present" : "Absent",
        description: `${timetable.className} marked ${status} successfully`,
        className: status === 'present'
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
        setLoading(true);
        const fetchedTimetables = await fetchTimetables();
        if (fetchedTimetables && fetchedTimetables.length > 0) {
          console.log(token);
          await fetchAttendanceSummary();
          await fetchAttendance();
          await fetchHolidays();
          setIsInitialized(true);
        }
        setLoading(false);
      }
    };

    initializeData();
  }, [isInitialized]);

  const getAttendanceButton = (timetable: Timetable) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const record = attendanceRecords[today]?.[timetable.className];
    
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={record?.status === 'present' ? "ghost" : "default"}
          onClick={() => toggleAttendance(timetable, 'present')}
          disabled={record?.status === 'present'}
          className={`md:w-[100px] w-auto ${
            record?.status === 'present' ? "text-green-600 text-white cursor-not-allowed" : "bg-green-800 text-white"
          }`}
        >
          {record?.status === 'present' ? (
            <>
              <Check className="h-4 w-4" />
              <span className="hidden md:inline ml-1 text-white">Present</span>
            </>
          ) : (
            <>
              <h2>P</h2>
              <span className="hidden md:inline text-white">Mark Present</span>
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant={record?.status === 'absent' ? "ghost" : "destructive"}
          onClick={() => toggleAttendance(timetable, 'absent')}
          disabled={record?.status === 'absent'}
          className={`md:w-[100px] w-auto ${
            record?.status === 'absent' ? "text-red-600 text-white cursor-not-allowed" : ""
          }`}
        >
          {record?.status === 'absent' ? (
            <>
              <X className="h-4 w-4" />
              <span className="hidden md:inline ml-1 text-white">Absent</span>
            </>
          ) : (
            <>
              <h2>A</h2>
              <span className="hidden md:inline text-white">Mark Absent</span>
            </>
          )}
        </Button>
      </div>
    );
  };

  const splitTime = (timeString: string) => {
    const [startTime, endTime] = timeString.split('-').map(t => t.trim());
    return { startTime, endTime };
  };

  return (
    <>
    <Loader loadingStates={loadingStates} loading={loading} duration={1500} />
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
      </motion.div>
      <div className="min-h-screen bg-background w-full">
        <div className="max-w-7xl mx-auto space-y-8 py-8 px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl text-white font-bold">Attendance Tracker</h1>
          </div>
  
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {attendanceSummary.map((summary) => (
              <Card 
                key={summary.className}
                className="transition-all duration-200 hover:shadow-lg "
              >
                <CardHeader className="pb-2 space-y-1">
                  <CardTitle className="text-base sm:text-lg font-semibold tracking-tight z-50">
                    {summary.className}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-row items-center justify-between space-x-2">
                    <div className="flex items-center gap-1">
                      <span 
                        className={`text-xl sm:text-2xl font-bold z-30 ${getPercentageColorClass(summary.percentage)}`}
                      >
                        {summary.percentage}%
                      </span>
                    </div>
                    <div className="text-xs z-30 sm:text-sm text-muted-foreground whitespace-nowrap">
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
                    timetables.map((timetable) => {
                      const { startTime, endTime } = splitTime(timetable.time);
                      return (
                        <TableRow key={timetable._id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            <div className="hidden md:block">
                              {timetable.time}
                            </div>
                            <div className="md:hidden flex flex-col space-y-1">
                              <span className="font-medium">{startTime}</span>
                              <span className="text-muted-foreground">{endTime}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap text-sm">
                              {timetable.className}
                            </div>
                          </TableCell>
                          <TableCell className="p-1">{getAttendanceButton(timetable)}</TableCell>
                        </TableRow>
                      );
                    })
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
    </AuroraBackground>
    </>
  );
}