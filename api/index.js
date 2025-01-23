const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const attendanceRoutes = require('./routes/attendance');
const timetableRoutes = require('./routes/timetable');
const { router: authRoutes, authenticateToken } = require('./routes/auth');
const { scheduleAttendanceCheck } = require('./service/attendanceService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

scheduleAttendanceCheck();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Routes
app.use('/api/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/timetable', authenticateToken, timetableRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});