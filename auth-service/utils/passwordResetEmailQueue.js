const PasswordResetToken = require('../model/passwordResetToken');
const sendEmail = require('./sendEmail');

const RETRY_DELAY_MS = Number(process.env.RESET_EMAIL_RETRY_DELAY_MS || 2000);
const MAX_ATTEMPTS = Number(process.env.RESET_EMAIL_MAX_ATTEMPTS || 3);

const queue = [];
let processing = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildResetEmailHtml = (resetUrl, expiresInMinutes) => `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Khoi phuc mat khau</h2>
        <p>Ban da yeu cau dat lai mat khau. Nhan vao nut ben duoi de tiep tuc:</p>
        <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
                Dat lai mat khau
            </a>
        </p>
        <p>Neu nut khong hoat dong, hay sao chep lien ket sau:</p>
        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
        <p style="margin-top: 16px;">Lien ket se het han sau ${expiresInMinutes} phut.</p>
    </div>
`;

const processQueue = async () => {
    if (processing) return;

    processing = true;

    while (queue.length > 0) {
        const job = queue.shift();

        if (!job) continue;

        const { passwordResetTokenId, email, resetUrl, expiresInMinutes } = job;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
            try {
                await sendEmail(
                    email,
                    'Khoi phuc mat khau',
                    buildResetEmailHtml(resetUrl, expiresInMinutes)
                );

                await PasswordResetToken.updateOne(
                    { _id: passwordResetTokenId },
                    {
                        $set: {
                            emailStatus: 'sent',
                            emailSentAt: new Date(),
                            lastEmailError: null,
                            emailAttemptCount: attempt,
                        },
                    }
                );

                break;
            } catch (error) {
                const serializedError = error && (error.message || String(error));

                await PasswordResetToken.updateOne(
                    { _id: passwordResetTokenId },
                    {
                        $set: {
                            emailStatus: 'failed',
                            lastEmailError: serializedError,
                            emailAttemptCount: attempt,
                        },
                    }
                );

                if (attempt >= MAX_ATTEMPTS) {
                    console.error('password reset queue: giving up after max attempts', {
                        passwordResetTokenId,
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

const enqueuePasswordResetEmail = async ({ passwordResetTokenId, email, resetUrl, expiresInMinutes }) => {
    if (!passwordResetTokenId || !email || !resetUrl) {
        throw new Error('passwordResetTokenId, email and resetUrl are required');
    }

    queue.push({ passwordResetTokenId, email, resetUrl, expiresInMinutes });
    void processQueue();
};

const markStalePasswordResetEmails = async () => {
    const now = new Date();

    await PasswordResetToken.updateMany(
        {
            emailStatus: 'pending',
            expiresAt: { $lt: now },
        },
        {
            $set: {
                emailStatus: 'failed',
                lastEmailError: 'Reset token expired before email delivery completed',
            },
        }
    );
};

module.exports = {
    enqueuePasswordResetEmail,
    markStalePasswordResetEmails,
};
