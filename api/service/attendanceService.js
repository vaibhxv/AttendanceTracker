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

// Create pending attendance records for a specific date
async function createPendingAttendance(date) {
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
            console.log(`${dateString} is a holiday. Skipping attendance creation.`);
            return;
        }

        // Get all timetable entries for this specific day
        const timetableEntries = await Timetable.find({ day: dayOfWeek });

        // Create pending attendance records for each entry
        for (const entry of timetableEntries) {
            try {
                const existingAttendance = await Attendance.findOne({
                    className: entry.className,
                    date: dateString,
                    user: entry.user
                });

                if (!existingAttendance) {
                    await Attendance.create({
                        className: entry.className,
                        date: dateString,
                        user: entry.user,
                        status: 'pending'
                    });
                    console.log(`Created pending attendance record for ${entry.className} - User: ${entry.user} - Date: ${dateString}`);
                }
            } catch (error) {
                console.error(`Error processing individual attendance: ${error.message}`);
            }
        }
        console.log(`Pending attendance records created for ${dateString}`);
    } catch (error) {
        console.error(`Error in attendance processing for ${formatDate(date)}:`, error);
    }
}

// Mark absent for previous day's pending attendance
async function markAbsentForPreviousDay() {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const { start, end } = getDayBounds(yesterday);

        // Find all pending attendance records from yesterday
        const pendingRecords = await Attendance.find({
            date: {
                $gte: start,
                $lte: end
            },
            status: 'pending'
        });

        // Update all pending records to absent
        for (const record of pendingRecords) {
            await Attendance.findByIdAndUpdate(record._id, {
                status: 'absent'
            });
            console.log(`Marked absent for user ${record.user} in class ${record.className} for ${formatDate(yesterday)}`);
        }

        console.log(`Completed marking absent for ${formatDate(yesterday)}`);
    } catch (error) {
        console.error('Error marking absent for previous day:', error);
    }
}

// Mark user as present
async function markPresent(userId, className, date) {
    try {
        const attendance = await Attendance.findOne({
            user: userId,
            className: className,
            date: date
        });

        if (attendance) {
            attendance.status = 'present';
            await attendance.save();
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error marking present:', error);
        return false;
    }
}

// Schedule attendance tasks
function scheduleAttendanceCheck() {
    // Create pending attendance records for the current day at the start of each day
    cron.schedule('0 0 * * *', async () => {
        console.log('Creating pending attendance records for new day...');
        const today = new Date();
        await createPendingAttendance(today);
    });

    // Mark absent for previous day's pending records at the start of each day
    cron.schedule('0 0 * * *', async () => {
        console.log('Marking absent for previous day...');
        await markAbsentForPreviousDay();
    });

    // Run immediately when service starts
    const today = new Date();
    createPendingAttendance(today);
}

module.exports = { 
    scheduleAttendanceCheck,
    markPresent
};