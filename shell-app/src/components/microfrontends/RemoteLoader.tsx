'use client';

import React, { useState, useEffect } from 'react';
import { RemoteErrorBoundary } from './RemoteErrorBoundary';
import { Cpu } from 'lucide-react';

interface RemoteLoaderProps {
  appName: 'auth' | 'dashboard' | 'users';
  moduleName: string; // e.g., 'Login', 'Register', 'DashboardPage', 'UsersPage'
  mockComponent: React.ComponentType<any>;
  fallbackName: string;
  props?: any;
}

const REMOTE_URLS = {
  auth: 'http://localhost:3001/_next/static/chunks/remoteEntry.js',
  dashboard: 'http://localhost:3002/_next/static/chunks/remoteEntry.js',
  users: 'http://localhost:3003/_next/static/chunks/remoteEntry.js',
};

// Global Webpack 5 Share Scopes Interfaces
interface WebpackShareScopes {
  default: any;
}
declare const __webpack_share_scopes__: WebpackShareScopes;
declare const __webpack_init_sharing__: (scope: string) => Promise<void>;

// Dynamic script injector helper
function loadRemoteScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();

    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.type = 'text/javascript';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

// Low-level Webpack container fetch hook
async function lookupFederatedModule(scope: string, modulePath: string) {
  // 1. Initialize sharing scope
  if (typeof __webpack_init_sharing__ !== 'undefined') {
    await __webpack_init_sharing__('default');
  }

  // 2. Retrieve container registered on global window object
  const container = (window as any)[scope];
  if (!container) {
    throw new Error(`Federated container "${scope}" is not active.`);
  }

  // 3. Initialize container with current share scope
  if (typeof __webpack_share_scopes__ !== 'undefined') {
    await container.init(__webpack_share_scopes__.default);
  }

  // 4. Retrieve module factory and compile
  const factory = await container.get(modulePath);
  const Module = factory();
  return Module;
}

export default function RemoteLoader({
  appName,
  moduleName,
  mockComponent: MockComponent,
  fallbackName,
  props = {},
}: RemoteLoaderProps) {
  const [useMock, setUseMock] = useState<boolean | null>(null);
  const [FederatedComponent, setFederatedComponent] = useState<React.ComponentType<any> | null>(null);
  const [loaderError, setLoaderError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read mock override from environmental configuration
  useEffect(() => {
    const isForcedMock = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
    if (isForcedMock) {
      setUseMock(true);
      setIsLoading(false);
    } else {
      setUseMock(false);
    }
  }, []);

  // Native dynamic client-side Module Federation loader
  useEffect(() => {
    if (useMock !== false) return;

    let active = true;
    setIsLoading(true);

    const loadRemote = async () => {
      try {
        const url = REMOTE_URLS[appName];
        const scriptId = `remote-script-${appName}`;
        const modulePath = `./${moduleName}`;

        // 1. Dynamically append Remote Script to Document Head
        await loadRemoteScript(url, scriptId);

        // 2. Perform Webpack 5 Runtime Container Resolution
        const Module = await lookupFederatedModule(appName, modulePath);

        if (active) {
          setFederatedComponent(() => Module.default || Module);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.warn(
          `Federation dynamic fetch failed for "${appName}/${moduleName}". Fallback simulator active.`,
          err
        );
        if (active) {
          setLoaderError(err.message || 'Federation container offline.');
          setUseMock(true);
          setIsLoading(false);
        }
      }
    };

    loadRemote();

    return () => {
      active = false;
    };
  }, [appName, moduleName, useMock]);

  if (useMock === null || (isLoading && !useMock)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-accent-cyan rounded-full animate-spin" />
        <p className="text-xs text-gray-500 animate-pulse font-mono">Syncing Quantum Link to {fallbackName}...</p>
      </div>
    );
  }

  if (useMock) {
    return (
      <div className="relative">
        {/* Glowing Indicator Banner showing that App is running in offline simulation mode */}
        <div className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 text-xs text-accent-cyan shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="animate-pulse" />
            <span className="font-mono tracking-wider font-semibold">
              SIMULATION MODE ACTIVE — Remote app ({appName}) offline.
            </span>
          </div>
          <button
            onClick={() => {
              setUseMock(false);
              setFederatedComponent(null);
            }}
            className="px-2 py-0.5 rounded border border-cyan-500/30 hover:bg-cyan-500/10 text-[10px] tracking-wider uppercase font-semibold transition-all cursor-pointer"
          >
            Reconnect Remote
          </button>
        </div>

        {/* Render fallback mock preview directly */}
        <MockComponent {...props} />
      </div>
    );
  }

  return (
    <RemoteErrorBoundary
      fallbackName={fallbackName}
      onUseMock={() => setUseMock(true)}
    >
      {FederatedComponent && <FederatedComponent {...props} />}
    </RemoteErrorBoundary>
  );
}
