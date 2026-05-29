const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true, expires: 0 },
    emailStatus: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending',
        index: true
    },
    emailAttemptCount: { type: Number, default: 0 },
    lastEmailError: { type: String, default: null },
    otpSentAt: { type: Date, default: null }
}, {
    timestamps: true
});

module.exports = mongoose.model('PendingRegistration', PendingRegistrationSchema);