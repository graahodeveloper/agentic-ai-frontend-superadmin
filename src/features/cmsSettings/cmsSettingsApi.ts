// src/features/cmsSettings/cmsSettingsApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FloatingElement {
  url: string;
  position?: string;
  alt?: string;
}

export interface HeroImage {
  url: string;
  alt?: string;
}

export interface CMSPageContent {
  id: string;
  page_type: 'login' | 'dashboard' | 'landing';
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image_url: string;
  hero_images: HeroImage[];
  logo_url: string;
  floating_elements: FloatingElement[];
  background_gradient: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CMSPageContentPublic {
  hero_title: string;
  hero_subtitle: string;
  hero_description: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image_url: string;
  hero_images: HeroImage[];
  logo_url: string;
  floating_elements: FloatingElement[];
  background_gradient: string;
}

export interface CMSPageContentCreateRequest {
  page_type: 'login' | 'dashboard' | 'landing';
  hero_title?: string;
  hero_subtitle?: string;
  hero_description?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  hero_image_url?: string;
  hero_images?: HeroImage[];
  logo_url?: string;
  floating_elements?: FloatingElement[];
  background_gradient?: string;
  is_active?: boolean;
}

export interface CMSPageContentUpdateRequest {
  hero_title?: string;
  hero_subtitle?: string;
  hero_description?: string;
  hero_cta_text?: string;
  hero_cta_link?: string;
  hero_image_url?: string;
  hero_images?: HeroImage[];
  logo_url?: string;
  floating_elements?: FloatingElement[];
  background_gradient?: string;
  is_active?: boolean;
}

export interface ImageUploadResponse {
  image_url: string;
  message: string;
}

export interface CMSSettingsListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: CMSPageContent[];
}

export interface ByPageTypeResponse {
  exists: boolean;
  content?: CMSPageContent;
  message?: string;
}

// ─── API Configuration ───────────────────────────────────────────────────────

const getBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/v1/';
};

const baseQueryWithAuth = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  mode: 'cors',
  credentials: 'include',
  prepareHeaders: async (headers, { endpoint }) => {
    if (endpoint !== 'uploadCMSImage') {
      headers.set('Content-Type', 'application/json');
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

// ─── API Definition ──────────────────────────────────────────────────────────

export const cmsSettingsApi = createApi({
  reducerPath: 'cmsSettingsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['CMSSettings'],
  endpoints: (builder) => ({
    // Get all CMS settings
    getCMSSettings: builder.query<CMSSettingsListResponse, void>({
      query: () => 'cms-settings/',
      providesTags: ['CMSSettings'],
    }),

    // Get CMS settings by ID
    getCMSSettingsById: builder.query<CMSPageContent, string>({
      query: (id) => `cms-settings/${id}/`,
      providesTags: (result, error, id) => [{ type: 'CMSSettings', id }],
    }),

    // Get CMS content by page type
    getCMSByPageType: builder.query<ByPageTypeResponse, string>({
      query: (pageType) => `cms-settings/by-page-type/${pageType}/`,
      providesTags: (result, error, pageType) => [{ type: 'CMSSettings', id: pageType }],
    }),

    // Get login page content (public endpoint)
    getLoginPageContent: builder.query<CMSPageContentPublic, void>({
      query: () => 'cms-settings/login-page/',
      providesTags: [{ type: 'CMSSettings', id: 'login' }],
    }),

    // Create new CMS settings
    createCMSSettings: builder.mutation<CMSPageContent, CMSPageContentCreateRequest>({
      query: (data) => ({
        url: 'cms-settings/',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['CMSSettings'],
    }),

    // Update CMS settings (full update)
    updateCMSSettings: builder.mutation<CMSPageContent, { id: string; data: CMSPageContentUpdateRequest }>({
      query: ({ id, data }) => ({
        url: `cms-settings/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CMSSettings', id }, 'CMSSettings'],
    }),

    // Partial update CMS settings
    patchCMSSettings: builder.mutation<CMSPageContent, { id: string; data: Partial<CMSPageContentUpdateRequest> }>({
      query: ({ id, data }) => ({
        url: `cms-settings/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'CMSSettings', id }, 'CMSSettings'],
    }),

    // Delete CMS settings
    deleteCMSSettings: builder.mutation<void, string>({
      query: (id) => ({
        url: `cms-settings/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CMSSettings'],
    }),

    // Upload image to S3
    uploadCMSImage: builder.mutation<ImageUploadResponse, FormData>({
      query: (formData) => ({
        url: 'cms-settings/upload-image/',
        method: 'POST',
        body: formData,
      }),
      // Don't set Content-Type header for FormData - browser will set it automatically with boundary
    }),
  }),
});

// ─── Exports ─────────────────────────────────────────────────────────────────

export const {
  useGetCMSSettingsQuery,
  useGetCMSSettingsByIdQuery,
  useGetCMSByPageTypeQuery,
  useGetLoginPageContentQuery,
  useCreateCMSSettingsMutation,
  useUpdateCMSSettingsMutation,
  usePatchCMSSettingsMutation,
  useDeleteCMSSettingsMutation,
  useUploadCMSImageMutation,
} = cmsSettingsApi;
