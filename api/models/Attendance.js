const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    className: { type: String, required: true },
    date: { type: Date, required: true },
    present: { type: Boolean, required: true, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true } // Add user reference
});

// Ensure unique attendance for each user, class, and date
attendanceSchema.index({ user: 1, className: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);