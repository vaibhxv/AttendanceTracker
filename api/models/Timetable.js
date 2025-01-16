const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
    className: { type: String, required: true },
    day: { type: String, required: true },
    time: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true } // Add user reference
});

module.exports = mongoose.model('Timetable', timetableSchema);