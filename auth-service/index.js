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

app.use(cookieParser());

app.use(cors({
    origin: 'http://localhost:3000',
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