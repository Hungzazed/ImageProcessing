const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../config/passport');
const { auth } = require('../middleware/auth');

const { login, register, verifyOtp, refreshToken, logout, googleCallback, getProfile, verifyToken, forgotPassword, resetPassword } = require('../controller/authController');

const primaryFrontendUrl = process.env.FRONTEND_URL;
const extraFrontendUrls = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map((url) => url.trim()).filter(Boolean)
  : [];
const allowedFrontendOrigins = new Set([primaryFrontendUrl, ...extraFrontendUrls].filter(Boolean));

const resolveBackendBaseUrl = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = (forwardedProto ? String(forwardedProto).split(',')[0] : req.protocol || 'http').trim();
  const host = req.get('host');

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.BACKEND_URL || 'http://localhost:3000';
};

const resolveFrontendUrl = (req) => {
  const requestedOrigin = req.query.origin;
  const stateOrigin = (() => {
    if (!req.query.state) return null;

    try {
      const decodedState = JSON.parse(Buffer.from(String(req.query.state), 'base64url').toString('utf8'));
      return decodedState && typeof decodedState.frontendUrl === 'string' ? decodedState.frontendUrl : null;
    } catch {
      return null;
    }
  })();

  // First priority: Check if requested origin is in allowed list
  if (stateOrigin && allowedFrontendOrigins.has(stateOrigin)) {
    return stateOrigin;
  }

  if (requestedOrigin && allowedFrontendOrigins.has(requestedOrigin)) {
    return requestedOrigin;
  }

  // Fallback: Use requested origin if it looks like localhost (for dev purposes)
  if (requestedOrigin && (requestedOrigin.includes('localhost') || requestedOrigin.includes('127.0.0.1'))) {
    console.log(`[OAUTH] Fallback: Using requested origin (localhost dev): ${requestedOrigin}`);
    return requestedOrigin;
  }

  // Final fallback: Use primary frontend URL
  return primaryFrontendUrl || extraFrontendUrls[0] || 'http://localhost:3001';
};

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify', auth, verifyToken);
router.get('/profile', auth, getProfile);

// Google OAuth routes
router.get(
  '/google',
  (req, res, next) => {
    const frontendUrl = resolveFrontendUrl(req);
    const callbackURL = `${resolveBackendBaseUrl(req)}/auth/google/callback`;
    const state = Buffer.from(JSON.stringify({ frontendUrl })).toString('base64url');

    return passport.authenticate('google', {
      callbackURL,
      state,
      scope: ['profile', 'email'],
      session: false
    })(req, res, next);
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    const callbackURL = `${resolveBackendBaseUrl(req)}/auth/google/callback`;

    passport.authenticate('google', { callbackURL, session: false }, (error, user) => {
      const frontendUrl = resolveFrontendUrl(req);

      if (error || !user) {
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      req.user = user;
      req.oauthFrontendUrl = frontendUrl;
      return next();
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;