const express = require('express');
const Attendance = require('../models/Attendance');
const { authenticateToken } = require('./auth'); // Import the authentication middleware

const router = express.Router();

// Create attendance record
router.post('/', authenticateToken, async (req, res) => {
    const { className } = req.body;
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

    // Check if attendance for today already exists for the specific class
    const existingAttendance = await Attendance.findOne({ className, date: dateString, user: req.user.id });

    if (existingAttendance) {
        return res.status(400).json({ message: 'Attendance for today already recorded for this class' });
    }

    // Create a new attendance record with status set to 'pending' by default
    const attendance = new Attendance({ 
        className, 
        date: dateString, 
        user: req.user.id,
        status: 'pending' // status will default to 'pending' as defined in the model
    });
    await attendance.save();
    res.status(201).json(attendance);
});

// Update attendance record
router.put('/:className/:date', authenticateToken, async (req, res) => {
    const { className, date } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['present', 'absent', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
    }

    try {
        const attendance = await Attendance.findOneAndUpdate(
            { className, date, user: req.user.id }, // Ensure only the user's record is updated
            { status },
            { new: true, upsert: true } // Upsert to create if it doesn't exist
        );
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: "Error updating attendance" });
    }
});

// Get all attendance records for the current user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        const query = { user: req.user.id };
        
        // If date is provided, filter by date
        if (date) {
            query.date = date;
        }
        
        const records = await Attendance.find(query);
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Calculate total attendance for the current user
router.get('/count', authenticateToken, async (req, res) => {
    try {
        const totalCount = await Attendance.countDocuments({ user: req.user.id });
        const presentCount = await Attendance.countDocuments({ 
            user: req.user.id, 
            status: 'present' 
        });
        
        res.json({ 
            total: totalCount,
            present: presentCount,
            percentage: totalCount > 0 ? (presentCount / totalCount) * 100 : 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;