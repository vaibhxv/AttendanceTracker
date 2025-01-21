const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    className: { type: String, required: true },
    date: { type: Date, required: true },
    status: { 
        type: String, 
        enum: ['present', 'absent', 'pending'],
        default: 'pending',
        required: true 
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Ensure unique attendance for each user, class, and date
attendanceSchema.index({ user: 1, className: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);