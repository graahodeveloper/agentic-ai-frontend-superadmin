'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from 'aws-amplify/auth';
// import { log } from 'console';

const AuthChecker = () => {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if user is authenticated
        const user = await getCurrentUser();
        if (user) {
          // User is authenticated, redirect to dashboard
          // log('User is authenticated:', user);
          router.replace('/dashboard');
        } else {
          // User is not authenticated, redirect to auth
          router.replace('/auth');
        }
      } catch (error) {
        // User is not authenticated (error thrown), redirect to auth
        console.log('Authentication check failed:', error);
        router.replace('/auth');
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthStatus();
  }, [router]);

  // Show loading spinner while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return null; // Component will redirect, so no UI needed
};

export default AuthChecker;