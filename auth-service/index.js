require('dotenv').config();

const connectDB = require('./db')
const express = require('express')
const session = require('express-session');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

const authRouter = require('./router/authRoutes');
const userRouter = require('./router/userRoutes');

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

connectDB();

app.use('/auth', authRouter);
app.use('/users', userRouter);

app.listen(3000, () => console.log("Server running on port 3000"))