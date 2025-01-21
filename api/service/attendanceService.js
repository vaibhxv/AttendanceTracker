const cron = require('node-cron');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const Holiday = require('../models/Holiday');

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// Helper function to get day name
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Helper function to get start and end of day
function getDayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

// Process attendance for a specific date
async function processAttendanceForDate(date) {
  try {
    const dayOfWeek = getDayName(date);
    const dateString = formatDate(date);
    const { start, end } = getDayBounds(date);

    // Check if this date is a holiday
    const isHoliday = await Holiday.findOne({ 
      date: {
        $gte: start,
        $lte: end
      }
    });

    if (isHoliday) {
      console.log(`${dateString} is a holiday. Skipping attendance check.`);
      return;
    }

    // Get all timetable entries for this specific day only
    const timetableEntries = await Timetable.find({ day: dayOfWeek });

    // Process each timetable entry
    for (const entry of timetableEntries) {
      try {
        // First check if attendance already exists for this class and date
        const existingAttendance = await Attendance.findOne({
          className: entry.className,
          date: dateString,
          user: entry.user
        });

        // Only create a new attendance record if one doesn't exist
        if (!existingAttendance) {
          await Attendance.create({
            className: entry.className,
            date: dateString,
            user: entry.user,
            present: false
          });
          console.log(`Created new attendance record for ${entry.className} - User: ${entry.user} - Date: ${dateString}`);
        } else {
          console.log(`Attendance record already exists for ${entry.className} - User: ${entry.user} - Date: ${dateString}`);
        }
      } catch (error) {
        console.error(`Error processing individual attendance: ${error.message}`);
      }
    }
    console.log(`Attendance check completed for ${dateString}`);
  } catch (error) {
    console.error(`Error in attendance processing for ${formatDate(date)}:`, error);
  }
}

// Check for any missing attendance records
async function checkMissingAttendance() {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  // Get the date 7 days ago to limit the check range
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Process each day from 7 days ago until yesterday
  for (let date = new Date(sevenDaysAgo); date < today; date.setDate(date.getDate() + 1)) {
    await processAttendanceForDate(new Date(date));
  }
}

let currentDate = new Date().getDate();

// Schedule regular checks
const scheduleAttendanceCheck = () => {
  // Run every hour to catch up on any missing attendance records
  const hourlyCheck = cron.schedule('0 * * * *', async () => {
    console.log('Running hourly attendance check...');
    await checkMissingAttendance();
    
    // Check if day has changed
    const newDate = new Date().getDate();
    if (newDate !== currentDate) {
      console.log('New day detected, restarting attendance service...');
      // Stop current cron jobs
      hourlyCheck.stop();
      dailyCheck.stop();
      // Restart the scheduling
      currentDate = newDate;
      scheduleAttendanceCheck();
    }
  });

  // Additional check at midnight for the new day
  const dailyCheck = cron.schedule('0 0 * * *', () => {
    console.log('Midnight reached, restarting attendance service...');
    // Stop current cron jobs
    hourlyCheck.stop();
    dailyCheck.stop();
    // Update current date and restart
    currentDate = new Date().getDate();
    scheduleAttendanceCheck();
  });

  // Also run immediately when the server starts or service restarts
  checkMissingAttendance();
}

module.exports = { scheduleAttendanceCheck };