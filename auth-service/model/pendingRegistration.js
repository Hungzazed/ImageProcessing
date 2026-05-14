const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true, expires: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('PendingRegistration', PendingRegistrationSchema);