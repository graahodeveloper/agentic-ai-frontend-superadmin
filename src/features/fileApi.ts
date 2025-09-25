// src/features/files/fileApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { fetchAuthSession } from 'aws-amplify/auth';

export interface FileExtractResponse {
  text: string;
  file_type: string;
  filename: string;
  file_size: number;
  success: boolean;
}

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
};

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  prepareHeaders: async (headers) => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    } catch (error) {
      console.error('Error preparing headers:', error);
      return headers;
    }
  },
});

export const fileApi = createApi({
  reducerPath: 'fileApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['File'],
  endpoints: (builder) => ({
    extractFile: builder.mutation<FileExtractResponse, FormData>({
      query: (formData) => ({
        url: `files/extract-text/`, // always call this
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const { useExtractFileMutation } = fileApi;
