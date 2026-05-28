'use client';

import React from 'react';
import RemoteLoader from '../../../components/microfrontends/RemoteLoader';
import { DashboardMock } from '../../../components/microfrontends/MockPreviews';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-indigo uppercase">
          Operations Center
        </h1>
        <p className="text-xs text-gray-500 mt-1">Global orchestrator dashboard and active serverless tasks.</p>
      </div>

      {/* Dynamic Module Federation Remote Loader */}
      <RemoteLoader
        appName="dashboard"
        moduleName="DashboardPage"
        mockComponent={DashboardMock}
        fallbackName="Dashboard Operations Panel"
      />
    </div>
  );
}
