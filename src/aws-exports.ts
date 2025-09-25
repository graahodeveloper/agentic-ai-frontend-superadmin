// src/lib/aws-exports.ts
import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      // region: process.env.NEXT_PUBLIC_COGNITO_REGION!,
      // userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      // userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID!,
      region: 'us-east-1', // Default region, can be overridden
      userPoolId: 'us-east-1_XhJtfE9gB',
      userPoolClientId: '1kct777q254ahhu58oji5vc7nr',
      loginWith: {
        email: true,
      },
    },
  },
};

Amplify.configure(amplifyConfig);

export default amplifyConfig;