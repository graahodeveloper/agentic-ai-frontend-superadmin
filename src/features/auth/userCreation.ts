// Updated helper function in userApi.ts or create new file: src/utils/userCreation.ts

import { fetchAuthSession } from 'aws-amplify/auth';

export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  sub_id: string;
  country?: string; // Add country field
}

// Helper function to create user after email verification - NOW WITH COUNTRY
export const createUserAfterVerification = async (
  email: string,
  name: string,
  country?: string,
  mobile?: string
) => {
  try {
    // Get Cognito user sub_id
    const session = await fetchAuthSession();
    const sub_id = session.tokens?.accessToken?.payload?.sub as string;

    // Split name into first and last name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const userData: CreateUserRequest = {
      first_name,
      last_name,
      email,
      mobile: mobile || '',
      sub_id,
      country: country || undefined, // Include country
    };

    return userData;
  } catch (error) {
    console.error('Error preparing user data:', error);
    throw error;
  }
};