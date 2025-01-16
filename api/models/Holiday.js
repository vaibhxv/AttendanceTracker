const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    date: { type: Date, required: true },
    reason: { type: String, required: true },
});


module.exports = mongoose.model('Holiday', holidaySchema);