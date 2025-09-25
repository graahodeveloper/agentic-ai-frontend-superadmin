// providers/amplify-provider.tsx
'use client';

import { useEffect } from 'react';
import { Amplify } from 'aws-amplify';
import amplifyConfig from '@/aws-exports';

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    Amplify.configure(amplifyConfig);
  }, []);

  return <>{children}</>;
}