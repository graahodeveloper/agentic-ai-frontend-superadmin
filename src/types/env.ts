// src/types/env.ts
export interface EnvironmentVariables {
  NEXT_PUBLIC_COGNITO_REGION: string;
  NEXT_PUBLIC_COGNITO_USER_POOL_ID: string;
  NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID: string;
  NEXT_PUBLIC_COGNITO_AUTHENTICATION_FLOW_TYPE: string;
  NEXT_PUBLIC_API_BASE_URL: string;
  
  // Environment selector
  NEXT_PUBLIC_ENV: string;
  
  // AI Base URLs for different environments
  NEXT_PUBLIC_DEV_AI_BASE_URL: string;
  NEXT_PUBLIC_DEMO_AI_BASE_URL: string;
  NEXT_PUBLIC_PROD_AI_BASE_URL: string;
}

// Type-safe environment variable access
export const getEnvVar = (key: keyof EnvironmentVariables): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};