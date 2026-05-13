const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../config/passport');
const {auth} = require('../middleware/auth');

const {login, register, verifyEmail, refreshToken, logout, googleCallback, getProfile} = require('../controller/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/verify/:token', verifyEmail);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.get('/profile', auth, getProfile);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false
  }),
  googleCallback
);

module.exports = router;