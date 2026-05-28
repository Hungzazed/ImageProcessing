'use client';

import React from 'react';
import RemoteLoader from '../../../../components/microfrontends/RemoteLoader';
import { AuthMock } from '../../../../components/microfrontends/MockPreviews';

export default function RegisterPage() {
  return (
    <RemoteLoader
      appName="auth"
      moduleName="Register"
      mockComponent={AuthMock}
      fallbackName="Authentication Register Panel"
      props={{ initialRegister: true }}
    />
  );
}
