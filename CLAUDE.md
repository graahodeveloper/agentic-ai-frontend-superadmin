# CLAUDE.md

## Project
Next.js 15 super-admin dashboard with React 19, Redux Toolkit, Tailwind CSS 4, AWS Amplify/Cognito auth.

## Commands
```bash
npm run dev      # Dev server (Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

## Structure
```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Login, signup pages
│   └── dashboard/         # Protected dashboard pages
│       ├── performance-analytics/  # Analytics pages (overview, agents, orgs, etc.)
│       └── layout.tsx     # Dashboard layout with sidebar
├── components/            # Shared UI components
│   └── performance-analytics/  # Analytics charts, tables, shared components
├── features/              # Redux slices + RTK Query APIs
│   ├── auth/             # authSlice, authApi
│   └── performanceAnalytics/  # performanceAnalyticsApi (RTK Query)
├── lib/
│   └── api/              # baseQueryWithAuth (RTK Query base)
├── store.ts              # Redux store config
└── types/                # TypeScript types
```

## RTK Query Pattern
```typescript
// features/example/exampleApi.ts
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "@/lib/api/baseQueryWithAuth";

export const exampleApi = createApi({
  reducerPath: "exampleApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Example"],
  endpoints: (builder) => ({
    getItems: builder.query<Response, Params>({
      query: (params) => ({ url: "endpoint/", params }),
      providesTags: ["Example"],
    }),
  }),
});

export const { useGetItemsQuery } = exampleApi;
```

## Add New API to Store
```typescript
// store.ts - add reducer and middleware
[exampleApi.reducerPath]: exampleApi.reducer,
.concat(exampleApi.middleware)
```

## Key APIs
- `performanceAnalyticsApi` - Performance metrics, charts, filtering
- `authApi` - Cognito authentication

## Conventions
- Feature-based Redux slices in `src/features/`
- RTK Query for all API calls
- AWS Cognito auth via Amplify
- Tailwind CSS (no CSS modules)
- "use client" for client components

## Backend API
- Base URL: Configured in environment
- Auth: Bearer token (Cognito JWT)
- Endpoints: `/api/v1/...`

## Branches
- `main` - production
- `super-dev` - development
