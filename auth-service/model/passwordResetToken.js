const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    emailStatus: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending',
        index: true
    },
    emailAttemptCount: { type: Number, default: 0 },
    lastEmailError: { type: String, default: null },
    emailSentAt: { type: Date, default: null }
}, {
    timestamps: true
});

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
