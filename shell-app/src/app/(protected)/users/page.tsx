'use client';

import React from 'react';
import RemoteLoader from '../../../components/microfrontends/RemoteLoader';
import { UsersMock } from '../../../components/microfrontends/MockPreviews';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-indigo uppercase">
          Identity Console
        </h1>
        <p className="text-xs text-gray-500 mt-1">Configure and analyze secure identity nodes on network registry.</p>
      </div>

      {/* Dynamic Module Federation Remote Loader */}
      <RemoteLoader
        appName="users"
        moduleName="UsersPage"
        mockComponent={UsersMock}
        fallbackName="User Accounts Grid"
      />
    </div>
  );
}
