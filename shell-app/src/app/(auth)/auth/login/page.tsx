'use client';

import React from 'react';
import RemoteLoader from '../../../../components/microfrontends/RemoteLoader';
import { AuthMock } from '../../../../components/microfrontends/MockPreviews';

export default function LoginPage() {
  return (
    <RemoteLoader
      appName="auth"
      moduleName="Login"
      mockComponent={AuthMock}
      fallbackName="Authentication Login Panel"
      props={{ initialRegister: false }}
    />
  );
}
