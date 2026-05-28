# Example Remote Apps — Module Federation Configuration

To load your independent microfrontends (`auth-app`, `dashboard-ui`, `user-ui`) dynamically inside the Shell Orchestrator, each application must be configured as a remote container using `@module-federation/nextjs-mf`.

Here are the complete production configurations and code structures for each remote application.

---

## 1. Auth Application (`auth-app` - Port 3001)

### `next.config.js`
This file configures the Webpack container name as `auth` and exposes the `Login` and `Register` components.

```javascript
const NextFederationPlugin = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    const { isServer } = options;
    
    config.plugins.push(
      new NextFederationPlugin({
        name: 'auth',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './Login': './src/components/Login.tsx',
          './Register': './src/components/Register.tsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          'react-dom': { singleton: true, requiredVersion: false },
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
```

---

## 2. Dashboard Application (`dashboard-ui` - Port 3002)

### `next.config.js`
This file configures the Webpack container name as `dashboard` and exposes the core `DashboardPage` component.

```javascript
const NextFederationPlugin = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    const { isServer } = options;
    
    config.plugins.push(
      new NextFederationPlugin({
        name: 'dashboard',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './DashboardPage': './src/app/dashboard/DashboardContent.tsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          'react-dom': { singleton: true, requiredVersion: false },
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
```

---

## 3. Users Application (`user-ui` - Port 3003)

### `next.config.js`
This file configures the Webpack container name as `users` and exposes the core `UsersPage` component.

```javascript
const NextFederationPlugin = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    const { isServer } = options;
    
    config.plugins.push(
      new NextFederationPlugin({
        name: 'users',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './UsersPage': './src/app/users/UsersContent.tsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: false },
          'react-dom': { singleton: true, requiredVersion: false },
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
```

---

## 📦 Exposing Components Best Practices

When exposing pages/components from a remote application:
1. **Isolated Routing**: Do not wrap exposed sub-components with root navigation engines (like Next's `BrowserRouter` or standard `Router` setups). Let the Host shell own the global browser layout.
2. **Dynamic Client Interactions**: Make sure all remote event communication triggers through standard custom event triggers so it bypasses shared package dependencies:
   ```javascript
   // Emitting notifications from dashboard-ui to the shell
   window.dispatchEvent(
     new CustomEvent("notification", {
       detail: { message: "SQS: Resize complete", type: "success" }
     })
   );
   ```
3. **Decoupled API Client**: Remotes should compile their own API triggers but can read standard session bearer headers from client-side stored browser cookies (`auth_access_token`).
