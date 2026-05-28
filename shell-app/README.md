# Quantum Micro Frontend Shell Application

A production-ready enterprise Micro Frontend Orchestrator constructed using **Next.js 15 (App Router)**, **React 18**, **TypeScript**, **Zustand**, and **Module Federation** (`@module-federation/nextjs-mf`).

This application serves as the central brain and routing orchestrator for three isolated remote microfrontends:
1. `auth-app` (Authentication & Security Access)
2. `dashboard-ui` (Serverless Image Pipeline controls)
3. `user-ui` (Grid identity profile lists)

---

## 🛰️ Architecture & Core Orchestration Features

```
                   +---------------------------------------+
                   |          Quantum Shell App            |
                   |   (Host Orchestrator - Port 3000)     |
                   +---------------------------------------+
                                       |
        +------------------------------+------------------------------+
        |                              |                              |
        ▼                              ▼                              ▼
+---------------+              +----------------+             +---------------+
|   auth-app    |              |  dashboard-ui  |             |    user-ui    |
| (Port 3001)   |              |  (Port 3002)   |             |  (Port 3003)  |
+---------------+              +----------------+             +---------------+
```

### 1. Unified Protected Routing (`middleware.ts`)
Secures all dashboard endpoints at the Edge runtime using server-side cookies:
- **Guests**: Blocked from protected paths (`/dashboard*`, `/users*`). Requests redirect automatically to `/auth/login`.
- **Authenticated Users**: Blocked from accessing guest credentials panels (`/auth/*`). Requests redirect instantly to `/dashboard`.
- **RBAC Extension**: Out-of-the-box support for checking user roles from stringified cookies and redirecting unauthorized profiles away from restricted routes.

### 2. Dual-Sync Zustand Auth Store (`src/stores/authStore.ts`)
Implements high-fidelity authentication storage:
- Automatically synchronizes tokens with secure cookies (`auth_access_token`, `auth_refresh_token`) to allow Next.js server-side middleware to instantly authorize route access.
- Falls back gracefully to client-side `localStorage` to guarantee cross-tab sessions are preserved.
- Offers a central `.hydrate()` execution routine that syncs server-side renders and client-side mounts, eliminating hydration mismatch flags.

### 3. Queue-Locked Axios Auto-Refresh Interceptor (`src/services/api.ts`)
Configures a centralized Axios client with request and response hook listeners:
- **Injection**: Automatically appends `Authorization: Bearer <token>` to all outgoing backend network calls.
- **Refresh Pipeline**: On receiving a `401 Unauthorized` flag, it freezes subsequent requests, places them in a resolution promise queue, and runs a single refresh token endpoint. On success, it hydrates the credentials store, flushes all queued requests with the updated token, and retries the original request.
- **Failover**: If refresh fails, logs the session out, clears credentials, and triggers redirect triggers.

### 4. Decoupled CustomEvent Navigation Orchestrator (`src/providers/RootProvider.tsx`)
Prevents remote microfrontends from directly manipulating global routing parameters:
- Remotes trigger transitions by dispatching clean CustomEvents on the global `window` object:
  ```javascript
  window.dispatchEvent(
    new CustomEvent("navigate", {
      detail: { path: "/dashboard" }
    })
  );
  ```
- The shell's central `RootProvider` listens to the `"navigate"` event and triggers client-side App Router transitions (`router.push`) dynamically.

### 5. Resilient Module Federation Loader & Simulator (`src/components/microfrontends/`)
Combats dynamic load failures and offline resources using a dual-mode strategy:
- **Dynamic Loader**: Safely loads dynamic federated modules with SSR disabled to prevent hydration errors.
- **Error Boundary**: Intercepts `ChunkLoadErrors` and broken federated networks gracefully, presenting an elegant recovery panel.
- **High-Fidelity Mocks**: When remote ports are offline (or if `NEXT_PUBLIC_MOCK_MODE=true` is set), the loader transparently swaps live federation remotes with stunning, fully interactive styled simulator previews (Auth Login panels, pipeline logs triggers, user tables). Mocks interact natively with the shell's Zustand store, Axios client, and Event Bus.

---

## 🛠️ Technology Stack
* **Framework**: Next.js 15.1.7 (App Router Architecture)
* **Libraries**: React 18.3.1, Zustand 4.5.5, Axios 1.7.9, Framer Motion 11.15.0
* **Aesthetics**: Tailwind CSS v3, Lucide React Icons
* **Federation Engine**: `@module-federation/nextjs-mf` v8.7.4

---

## 🚀 Setting Up & Launching the Shell

### 1. Setup Environment
Initialize your local variables:
```bash
cp .env.example .env.local
```

### 2. Install Dependencies
Run npm install using compatible legacy options if needed to align React 18 dependencies:
```bash
npm install --legacy-peer-deps
```

### 3. Spin Up Development Console
Start the Shell Orchestrator:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 💡 Developer Experience: Interactive Simulators
By default, if the remote app servers are offline on ports 3001, 3002, or 3003, the shell **auto-swaps the offline components with fully functional simulations**:
- **Auth Page**: Try logging in with **`admin@grid.io`** and password **`password123`**. Clicking Login updates the central auth cookies, triggers success alert notifications, and performs client router push redirection.
- **Dashboard Page**: Clicking `"Simulate SQS Image pipeline"` triggers a multi-stage background timer simulating active image processing states, showing dynamic JSON console outputs as processes flow from AWS Resize, Filters, Watermarks, and final S3 compression.
- **Users Page**: Adding or removing agents updates local arrays and throws reactive system toast notifications.
