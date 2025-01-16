const express = require('express');
const Timetable = require('../models/Timetable');
const Holiday = require('../models/Holiday')
const { authenticateToken } = require('./auth'); // Import the authentication middleware

const router = express.Router();


// Create timetable entry
router.post('/', authenticateToken, async (req, res) => {
    const { className, day, time } = req.body;
    const timetable = new Timetable({ className, day, time, user: req.user.id }); // Associate with user
    await timetable.save();
    res.status(201).json(timetable);
});

// Get timetable for a specific day for the current user
router.get('/:day', authenticateToken, async (req, res) => {
    const { day } = req.params;
    const timetables = await Timetable.find({ day, user: req.user.id }); // Filter by user
    res.json(timetables);
});

// Mark a day as holiday
router.post('/holiday', authenticateToken, async (req, res) => {
    const { date, reason } = req.body;
    const holiday = new Holiday({ date, reason });
    await holiday.save();
    res.status(201).json(holiday);
});

// Get holidays
router.get('/', authenticateToken, async (req, res) => {
    try {
        const holidays = await Holiday.find(); // Fetch all holidays
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;