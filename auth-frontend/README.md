# Auth Frontend

React + Tailwind frontend for the auth-service.

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Create a local env file:

```bash
copy .env.example .env
```

3. Start the app:

```bash
npm run dev
```

## Environment

- `VITE_AUTH_API_URL`: backend auth-service base URL, for example `http://localhost:3000`

## Flows

- Login with email/password
- Register with OTP email verification
- Google OAuth callback handling
- Forgot password and reset password via email link
- Protected dashboard showing the current auth session
