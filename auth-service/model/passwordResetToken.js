const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('PasswordResetToken', PasswordResetTokenSchema);