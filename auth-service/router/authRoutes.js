const express = require('express');
const router = express.Router();
const passport = require('passport');
require('../config/passport');
const { auth } = require('../middleware/auth');

const { login, register, verifyOtp, refreshToken, logout, googleCallback, getProfile, verifyToken, forgotPassword, resetPassword } = require('../controller/authController');

const encodeBase64Url = (value) => Buffer.from(String(value), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const decodeBase64Url = (value) => {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(padded, 'base64').toString('utf8');
};

const primaryFrontendUrl = process.env.FRONTEND_URL;
const extraFrontendUrls = process.env.FRONTEND_URLS
  ? process.env.FRONTEND_URLS.split(',').map((url) => url.trim()).filter(Boolean)
  : [];
const allowedFrontendOrigins = new Set([primaryFrontendUrl, ...extraFrontendUrls].filter(Boolean));
const defaultFrontendUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3005';
const defaultBackendUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

const parseUrlOrigin = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const isLocalhostOrigin = (origin) => {
  const parsedOrigin = parseUrlOrigin(origin);
  if (!parsedOrigin) return false;

  const { hostname } = new URL(parsedOrigin);
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

const isVercelPreviewOrigin = (origin) => {
  const parsedOrigin = parseUrlOrigin(origin);
  if (!parsedOrigin) return false;

  const { protocol, hostname } = new URL(parsedOrigin);
  return protocol === 'https:' && hostname.endsWith('.vercel.app');
};

const isAllowedFrontendOrigin = (origin) => {
  const parsedOrigin = parseUrlOrigin(origin);
  if (!parsedOrigin) return false;

  return allowedFrontendOrigins.has(parsedOrigin) || isLocalhostOrigin(parsedOrigin) || isVercelPreviewOrigin(parsedOrigin);
};

const resolveBackendBaseUrl = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const protocol = (forwardedProto ? String(forwardedProto).split(',')[0] : req.protocol || 'http').trim();
  const host = req.get('host');

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.BACKEND_URL || defaultBackendUrl;
};

const resolveGoogleCallbackUrl = (req) => {
  const configuredCallbackUrl = (process.env.GOOGLE_CALLBACK_URL || '').trim();

  if (configuredCallbackUrl) {
    return configuredCallbackUrl;
  }

  return `${resolveBackendBaseUrl(req)}/auth/google/callback`;
};

const resolveFrontendUrl = (req) => {
  const requestedOrigin = req.query.origin;
  const stateOrigin = (() => {
    if (!req.query.state) return null;

    try {
      const decodedState = JSON.parse(decodeBase64Url(String(req.query.state)));
      return decodedState && typeof decodedState.frontendUrl === 'string' ? decodedState.frontendUrl : null;
    } catch {
      return null;
    }
  })();

  if (stateOrigin && isAllowedFrontendOrigin(stateOrigin)) {
    return parseUrlOrigin(stateOrigin);
  }

  if (requestedOrigin && isAllowedFrontendOrigin(String(requestedOrigin))) {
    return parseUrlOrigin(String(requestedOrigin));
  }

  return primaryFrontendUrl || extraFrontendUrls[0] || defaultFrontendUrl;
};

const resolveShellOrigin = (req) => {
  const queryShellOrigin = req.query.shellOrigin;
  const stateShellOrigin = (() => {
    if (!req.query.state) return null;

    try {
      const decodedState = JSON.parse(decodeBase64Url(String(req.query.state)));
      return decodedState && typeof decodedState.shellOrigin === 'string' ? decodedState.shellOrigin : null;
    } catch {
      return null;
    }
  })();

  const shellOrigin = stateShellOrigin || (typeof queryShellOrigin === 'string' ? queryShellOrigin : '');

  if (shellOrigin && isAllowedFrontendOrigin(shellOrigin)) {
    return parseUrlOrigin(shellOrigin);
  }

  return null;
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

router.get('/pending', async (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'email query required' });
  try {
    const PendingRegistration = require('../model/pendingRegistration');
    const doc = await PendingRegistration.findOne({ email }).lean();
    if (!doc) return res.status(404).json({ message: 'not found' });
    return res.json({ pending: doc });
  } catch (err) {
    console.error('GET /auth/pending error', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'server error' });
  }
});

router.get(
  '/google',
  (req, res, next) => {
    try {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('Google OAuth env missing:', {
          hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
          hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
        });

        return res.status(500).json({ message: 'Google OAuth is not configured on the server' });
      }

      const frontendUrl = resolveFrontendUrl(req);
      const shellOrigin = resolveShellOrigin(req);
      const callbackURL = resolveGoogleCallbackUrl(req);
      const state = encodeBase64Url(JSON.stringify({ frontendUrl, shellOrigin }));

      return passport.authenticate('google', {
        callbackURL,
        state,
        scope: ['profile', 'email'],
        session: false
      })(req, res, next);
    } catch (error) {
      console.error('GET /auth/google error', error && (error.stack || error.message || error));
      return res.status(500).json({ message: 'Google OAuth failed before redirect' });
    }
  }
);

router.get(
  '/google/callback',
  (req, res, next) => {
    const callbackURL = resolveGoogleCallbackUrl(req);

    passport.authenticate('google', { callbackURL, session: false }, (error, user) => {
      const frontendUrl = resolveFrontendUrl(req);

      if (error || !user) {
        return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
      }

      req.user = user;
      req.oauthFrontendUrl = frontendUrl;
      req.oauthShellOrigin = resolveShellOrigin(req);
      return next();
    })(req, res, next);
  },
  googleCallback
);

module.exports = router;
