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

const port = process.env.PORT || 3001;

const parseOrigin = (value) => {
    if (!value || typeof value !== 'string') return null;

    try {
        return new URL(value).origin;
    } catch {
        return null;
    }
};

const frontendUrl = parseOrigin(process.env.FRONTEND_URL);
const frontendUrls = process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(',').map((url) => parseOrigin(url.trim())).filter(Boolean)
    : [];
const allowedOrigins = [...new Set([frontendUrl, ...frontendUrls].filter(Boolean))];

const isLocalhostOrigin = (origin) => {
    const parsedOrigin = parseOrigin(origin);
    if (!parsedOrigin) return false;

    const { hostname } = new URL(parsedOrigin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
};

const isVercelPreviewOrigin = (origin) => {
    const parsedOrigin = parseOrigin(origin);
    if (!parsedOrigin) return false;

    const { protocol, hostname } = new URL(parsedOrigin);
    return protocol === 'https:' && hostname.endsWith('.vercel.app');
};

const isAllowedOrigin = (origin) => {
    const parsedOrigin = parseOrigin(origin);
    if (!parsedOrigin) return false;

    return allowedOrigins.includes(parsedOrigin) || isLocalhostOrigin(parsedOrigin) || isVercelPreviewOrigin(parsedOrigin);
};

app.use(cookieParser());

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (curl/Postman/server-to-server) without Origin header.
        if (!origin) return callback(null, true);

        if (isAllowedOrigin(origin)) {
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

    app.listen(port, () => console.log(`Server running on port ${port}`));
};

startServer();
