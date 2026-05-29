const bcrypt = require('bcrypt');
const PendingRegistration = require('../model/pendingRegistration');
const sendEmail = require('./sendEmail');

const RETRY_DELAY_MS = Number(process.env.OTP_EMAIL_RETRY_DELAY_MS || 2000);
const MAX_ATTEMPTS = Number(process.env.OTP_EMAIL_MAX_ATTEMPTS || 3);

const queue = [];
let processing = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildOtpEmailHtml = (otp, expiresInMinutes) => `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Xac thuc dang ky</h2>
        <p>Ma OTP cua ban la:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; padding: 12px 16px; background: #f3f4f6; display: inline-block; border-radius: 8px;">
            ${otp}
        </div>
        <p style="margin-top: 16px;">Ma se het han sau ${expiresInMinutes} phut.</p>
    </div>
`;

const processQueue = async () => {
    if (processing) return;

    processing = true;

    while (queue.length > 0) {
        const job = queue.shift();

        if (!job) continue;

        const { pendingRegistrationId, email, otp, otpExpiresInMinutes } = job;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                await sendEmail(
                    email,
                    'Xac thuc dang ky bang OTP',
                    buildOtpEmailHtml(otp, otpExpiresInMinutes)
                );

                await PendingRegistration.updateOne(
                    { _id: pendingRegistrationId },
                    {
                        $set: {
                            emailStatus: 'sent',
                            otpSentAt: new Date(),
                            lastEmailError: null,
                            emailAttemptCount: attempt,
                        },
                    }
                );

                break;
            } catch (error) {
                const serializedError = error && (error.message || String(error));

                await PendingRegistration.updateOne(
                    { _id: pendingRegistrationId },
                    {
                        $set: {
                            emailStatus: 'failed',
                            lastEmailError: serializedError,
                            emailAttemptCount: attempt,
                        },
                    }
                );

                if (attempt >= MAX_ATTEMPTS) {
                    console.error('otp queue: giving up after max attempts', {
                        pendingRegistrationId,
                        email,
                        attempts: attempt,
                        error: serializedError,
                    });
                    break;
                }

                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    processing = false;
};

const enqueueOtpEmail = async ({ pendingRegistrationId, email, otp, otpExpiresInMinutes }) => {
    if (!pendingRegistrationId || !email || !otp) {
        throw new Error('pendingRegistrationId, email and otp are required');
    }

    queue.push({ pendingRegistrationId, email, otp, otpExpiresInMinutes });
    void processQueue();
};

const markStalePendingEmails = async () => {
    const now = new Date();

    await PendingRegistration.updateMany(
        {
            emailStatus: 'pending',
            otpExpiresAt: { $lt: now },
        },
        {
            $set: {
                emailStatus: 'failed',
                lastEmailError: 'OTP expired before email delivery completed',
            },
        }
    );
};

module.exports = {
    enqueueOtpEmail,
    markStalePendingEmails,
};
