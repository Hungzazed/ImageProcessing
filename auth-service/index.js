require('dotenv').config();

const connectDB = require('./db')
const express = require('express')
const session = require('express-session');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRouter = require('./router/authRoutes');
const userRouter = require('./router/userRoutes');
const { markStalePendingEmails } = require('./utils/otpEmailQueue');
const { markStalePasswordResetEmails } = require('./utils/passwordResetEmailQueue');

const app = express();
const cookieParser = require('cookie-parser');
const cors = require('cors');

const frontendUrl = process.env.FRONTEND_URL;
const frontendUrls = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map((url) => url.trim()).filter(Boolean)
    : [];
const allowedOrigins = [...new Set([frontendUrl, ...frontendUrls].filter(Boolean))];

app.use(cookieParser());

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (curl/Postman/server-to-server) without Origin header.
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/users', userRouter);

const startServer = async () => {
    await connectDB();

    try {
        await markStalePendingEmails();
        await markStalePasswordResetEmails();
    } catch (error) {
        console.error('Failed to reconcile stale pending emails', error && (error.message || error));
    }

    app.listen(3001, () => console.log("Server running on port 3001"));
};

startServer();
