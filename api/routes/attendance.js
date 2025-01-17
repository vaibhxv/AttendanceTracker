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

    // Create a new attendance record with present set to false by default
    const attendance = new Attendance({ className, date: dateString, user: req.user.id }); // present defaults to false
    await attendance.save();
    res.status(201).json(attendance);
});

// Update attendance record
router.put('/:className/:date', authenticateToken, async (req, res) => {
    const { className, date } = req.params;
    const { present } = req.body;

    try {
        const attendance = await Attendance.findOneAndUpdate(
            { className, date, user: req.user.id }, // Ensure only the user's record is updated
            { present },
            { new: true, upsert: true } // Upsert to create if it doesn't exist
        );
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: "Error updating attendance" });
    }
});

// Get all attendance records for the current user
router.get('/', authenticateToken, async (req, res) => {
    const date = new Date();
    const records = await Attendance.find({ user: req.user.id }); // Filter by user
    res.json(records);
});

// Calculate total attendance for the current user
router.get('/count', authenticateToken, async (req, res) => {
    try {
        const count = await Attendance.countDocuments({ user: req.user.id, present: true }); // Count present days
        res.json({ totalPresent: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;