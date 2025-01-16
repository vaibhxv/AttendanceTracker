const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    className: { type: String, required: true },
    date: { type: Date, required: true },
    present: { type: Boolean, required: true, default:false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true } // Add user reference
});

module.exports = mongoose.model('Attendance', attendanceSchema);