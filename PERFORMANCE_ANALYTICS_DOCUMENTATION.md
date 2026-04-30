# Performance Analytics - Complete Documentation

## Overview

Performance Analytics is a comprehensive monitoring system that tracks API performance, response times, error rates, database query performance, and organization/agent-wise breakdown. It works as part of the super admin dashboard.

---

## Table of Contents

1. [Frontend Architecture](#frontend-architecture)
2. [API Layer](#api-layer-performanceanalyticsapits)
3. [TypeScript Interfaces](#typescript-interfaces)
4. [API Endpoints](#api-endpoints-rtk-query-hooks)
5. [UI Components](#ui-components)
6. [Backend API Requirements](#backend-api-requirements)
7. [Expected Response Formats](#expected-response-formats)
8. [Database Schema](#database-schema-requirements)
9. [Middleware Implementation](#middleware-for-request-logging)
10. [Aggregation Queries](#aggregation-queries)
11. [Technologies Used](#technologies-used)

---

## Frontend Architecture

### File Structure

```
src/
├── app/dashboard/performance-analytics/
│   └── page.tsx                          # Main page component
├── components/performance-analytics/
│   ├── index.ts                          # Barrel exports
│   ├── PerformanceAnalyticsDashboard.tsx # Main dashboard container
│   ├── StatsCards.tsx                    # Overview stats cards
│   ├── ResponseTimeChart.tsx             # Response time trend chart
│   ├── StatusDistributionChart.tsx       # HTTP status pie chart
│   ├── EndpointPerformanceTable.tsx      # Endpoint performance table
│   ├── SlowRequestsTable.tsx             # Slow requests table
│   ├── QueryPerformanceChart.tsx         # Database query metrics
│   ├── OrganizationBreakdownChart.tsx    # Org/Agent breakdown
│   └── RealtimeMetrics.tsx               # Real-time monitoring bar
└── features/performanceAnalytics/
    └── performanceAnalyticsApi.ts        # RTK Query API definitions
```

---

## API Layer (`performanceAnalyticsApi.ts`)

The API layer uses **RTK Query** for data fetching with automatic caching, polling, and cache invalidation.

### Key Features:
- Uses `baseQueryWithAuth` for authenticated requests
- Tag-based cache invalidation with `"PerformanceAnalytics"` tag
- All endpoints support date range filtering

---

## TypeScript Interfaces

### PerformanceOverview
Overview statistics for the selected time period.

```typescript
interface PerformanceOverview {
  total_requests: number;           // Total number of API requests
  total_requests_change: number;    // Percentage change vs previous period
  avg_response_time_ms: number;     // Average response time in milliseconds
  avg_response_time_change: number; // Percentage change vs previous period
  max_response_time_ms: number;     // Maximum response time
  min_response_time_ms: number;     // Minimum response time
  error_rate: number;               // Error rate as percentage (0-100)
  error_rate_change: number;        // Percentage change vs previous period
  total_errors: number;             // Total number of error responses
  total_queries: number;            // Total database queries executed
  avg_query_time_ms: number;        // Average database query time
  slow_requests: number;            // Count of requests exceeding threshold
  period: string;                   // Selected period (e.g., "7d")
  start_date: string;               // Period start date (ISO format)
  end_date: string;                 // Period end date (ISO format)
}
```

### ResponseTimeTrendPoint
Data point for response time trend charts.

```typescript
interface ResponseTimeTrendPoint {
  timestamp: string;          // ISO timestamp for the data point
  avg_response_time: number;  // Average response time for this period
  max_response_time: number;  // Maximum response time for this period
  min_response_time: number;  // Minimum response time for this period
  request_count: number;      // Number of requests in this period
  error_count: number;        // Number of errors in this period
  avg_query_count: number;    // Average DB queries per request
}
```

### EndpointPerformance
Performance breakdown by API endpoint.

```typescript
interface EndpointPerformance {
  endpoint: string;           // Full endpoint (e.g., "GET /api/agents/")
  method: string;             // HTTP method (GET, POST, PUT, DELETE, PATCH)
  path: string;               // URL path
  request_count: number;      // Total requests to this endpoint
  avg_response_time: number;  // Average response time
  max_response_time: number;  // Maximum response time
  error_rate: number;         // Error rate percentage
  avg_query_count: number;    // Average DB queries per request
}
```

### StatusDistribution
HTTP status code distribution.

```typescript
interface StatusDistribution {
  categories: {
    "2xx": number;  // Success responses count
    "3xx": number;  // Redirect responses count
    "4xx": number;  // Client error responses count
    "5xx": number;  // Server error responses count
  };
  detailed: Array<{
    status_code: number;  // Specific status code (200, 201, 400, etc.)
    count: number;        // Count for this status code
  }>;
}
```

### SlowRequest
Individual slow request record.

```typescript
interface SlowRequest {
  id: string;                       // Unique request ID
  timestamp: string;                // When the request occurred
  endpoint: string;                 // API endpoint
  response_time_ms: number;         // Response time in milliseconds
  query_count: number;              // Number of DB queries
  query_time_ms: number;            // Total DB query time
  status_code: number;              // HTTP status code
  user_id: string | null;           // Associated user ID (if any)
  organization_id: string | null;   // Associated organization ID
  agent_id: string | null;          // Associated agent ID
}
```

### OrganizationBreakdown
Performance metrics per organization.

```typescript
interface OrganizationBreakdown {
  organization_id: string;      // Organization unique ID
  organization_name: string;    // Organization display name
  request_count: number;        // Total requests from this org
  avg_response_time: number;    // Average response time
  error_rate: number;           // Error rate percentage
}
```

### AgentBreakdown
Performance metrics per agent.

```typescript
interface AgentBreakdown {
  agent_id: string;           // Agent unique ID
  agent_name: string;         // Agent display name
  request_count: number;      // Total requests from this agent
  avg_response_time: number;  // Average response time
  error_rate: number;         // Error rate percentage
}
```

### QueryPerformancePoint
Database query performance data point.

```typescript
interface QueryPerformancePoint {
  timestamp: string;        // ISO timestamp
  avg_query_count: number;  // Average queries per request
  max_query_count: number;  // Maximum queries in single request
  avg_query_time: number;   // Average query execution time
  total_queries: number;    // Total queries in this period
}
```

### PerformanceSummary
Aggregated performance summary.

```typescript
interface PerformanceSummary {
  id: string;
  period_start: string;
  period_end: string | null;
  total_requests: number;
  total_errors: number;
  avg_response_time_ms: number;
  max_response_time_ms: number;
  min_response_time_ms: number;
  avg_query_count: number;
  total_queries: number;
  user_id: string | null;
  organization_id: string | null;
  agent_id: string | null;
}
```

### RealtimeMetrics
Real-time monitoring data (last 5 minutes).

```typescript
interface RealtimeMetrics {
  stats: {
    request_count: number;        // Requests in last 5 minutes
    avg_response_time_ms: number; // Average response time
    error_count: number;          // Errors in last 5 minutes
    requests_per_minute: number;  // Current request rate
  };
  recent_requests: Array<{
    timestamp: string;        // Request timestamp
    endpoint: string;         // API endpoint
    response_time_ms: number; // Response time
    status_code: number;      // HTTP status code
  }>;
  timestamp: string;  // When this data was generated
}
```

### DateRangeParams
Common query parameters for date filtering.

```typescript
interface DateRangeParams {
  period?: "24h" | "7d" | "30d" | "90d";  // Predefined time periods
  start_date?: string;                     // Custom start date (ISO)
  end_date?: string;                       // Custom end date (ISO)
}
```

---

## API Endpoints (RTK Query Hooks)

| Hook | Endpoint | Parameters | Response |
|------|----------|------------|----------|
| `useGetPerformanceOverviewQuery` | `GET /performance-analytics/overview/` | `DateRangeParams` | `PerformanceOverview` |
| `useGetResponseTimeTrendQuery` | `GET /performance-analytics/response-time-trend/` | `DateRangeParams` | `{data: ResponseTimeTrendPoint[], period: string}` |
| `useGetEndpointPerformanceQuery` | `GET /performance-analytics/endpoint-performance/` | `DateRangeParams & {limit?, sort_by?}` | `{data: EndpointPerformance[]}` |
| `useGetStatusDistributionQuery` | `GET /performance-analytics/status-distribution/` | `DateRangeParams` | `StatusDistribution` |
| `useGetSlowRequestsQuery` | `GET /performance-analytics/slow-requests/` | `DateRangeParams & {threshold?, limit?}` | `{data: SlowRequest[], threshold_ms: number}` |
| `useGetOrganizationBreakdownQuery` | `GET /performance-analytics/organization-breakdown/` | `DateRangeParams & {limit?}` | `{data: OrganizationBreakdown[]}` |
| `useGetAgentBreakdownQuery` | `GET /performance-analytics/agent-breakdown/` | `DateRangeParams & {limit?}` | `{data: AgentBreakdown[]}` |
| `useGetQueryPerformanceQuery` | `GET /performance-analytics/query-performance/` | `DateRangeParams` | `{data: QueryPerformancePoint[]}` |
| `useGetPerformanceSummariesQuery` | `GET /performance-analytics/summaries/` | `{period_type?, limit?}` | `{data: PerformanceSummary[], period_type: string}` |
| `useGetRealtimeMetricsQuery` | `GET /performance-analytics/realtime/` | `void` | `RealtimeMetrics` |

### Usage Example

```typescript
import { useGetPerformanceOverviewQuery } from "@/features/performanceAnalytics/performanceAnalyticsApi";

function MyComponent() {
  const { data, isLoading, error } = useGetPerformanceOverviewQuery({
    period: "7d"
  });

  if (isLoading) return <Loading />;
  if (error) return <Error />;

  return <div>Total Requests: {data.total_requests}</div>;
}
```

---

## UI Components

### 1. PerformanceAnalyticsDashboard.tsx
**Main container component**

**Features:**
- Period selector (24h, 7d, 30d, 90d)
- Tab navigation (Overview, Endpoints, Slow Requests, Breakdown)
- Fetches all data using RTK Query hooks
- Real-time metrics polling (30 second interval)

**State Management:**
```typescript
const [period, setPeriod] = useState<Period>("7d");
const [activeTab, setActiveTab] = useState<"overview" | "endpoints" | "slow" | "breakdown">("overview");
```

---

### 2. StatsCards.tsx
**Overview statistics cards (6 cards)**

| Card | Value | Additional Info |
|------|-------|-----------------|
| Total Requests | `total_requests` | % change indicator |
| Avg Response Time | `avg_response_time_ms` | ms suffix, % change |
| Error Rate | `error_rate` | % suffix, % change |
| Total Queries | `total_queries` | - |
| Avg Query Time | `avg_query_time_ms` | ms suffix |
| Slow Requests | `slow_requests` | - |

**Color Scheme:**
- Blue: Total Requests
- Green: Avg Response Time
- Red: Error Rate
- Purple: Total Queries
- Teal: Avg Query Time
- Orange: Slow Requests

---

### 3. ResponseTimeChart.tsx
**Response time trend visualization using Recharts**

**Chart Type:** AreaChart + LineChart combined

**Data Series:**
- Average response time (filled area, blue)
- Max response time (dashed line, red)
- Min response time (dashed line, green)

**Additional Features:**
- Request volume mini-chart below main chart
- Dynamic timestamp formatting based on period
- Gradient fill for visual appeal

---

### 4. StatusDistributionChart.tsx
**HTTP status code distribution visualization**

**Chart Type:** Donut PieChart

**Color Mapping:**
- 2xx (Success): `#10B981` (green)
- 3xx (Redirect): `#3B82F6` (blue)
- 4xx (Client Error): `#F59E0B` (amber)
- 5xx (Server Error): `#EF4444` (red)

**Additional Features:**
- Detailed breakdown section showing individual status codes
- Percentage calculations
- Interactive tooltips

---

### 5. EndpointPerformanceTable.tsx
**Sortable endpoint performance table**

**Columns:**
| Column | Sortable | Description |
|--------|----------|-------------|
| Endpoint | No | Method badge + path |
| Requests | Yes | Total request count |
| Avg Response | Yes | Color-coded by speed |
| Max Response | Yes | Color-coded by speed |
| Error Rate | Yes | Color-coded by severity |
| Avg Queries | No | Queries per request |

**Method Badge Colors:**
- GET: Green
- POST: Blue
- PUT: Amber
- PATCH: Purple
- DELETE: Red

**Response Time Color Coding:**
- < 100ms: Green
- 100-500ms: Amber
- > 500ms: Red

---

### 6. SlowRequestsTable.tsx
**Table showing requests exceeding threshold**

**Columns:**
- Timestamp (formatted)
- Endpoint (monospace font)
- Response Time (with visual progress bar)
- Status (color-coded badge)
- Queries (count)
- Query Time (ms)
- Context (User/Org/Agent tags)

**Visual Progress Bar Colors:**
- `> threshold`: Amber
- `> threshold * 1.5`: Orange
- `> threshold * 2`: Red

**Default Threshold:** 1000ms

---

### 7. QueryPerformanceChart.tsx
**Database query performance visualization**

**Chart Type:** ComposedChart (Bar + Line)

**Data Series:**
- Bar: Average queries per request (purple)
- Line: Average query time (teal)

**Summary Stats (top-right):**
- Total Queries
- Avg Count/Request
- Avg Query Time

---

### 8. OrganizationBreakdownChart.tsx
**Horizontal bar chart with detailed breakdown**

**Usage:**
- Organization breakdown
- Agent breakdown (reused with mapped data)

**Features:**
- Horizontal bar chart showing request distribution
- Detailed list below with:
  - Request count
  - Avg response time
  - Error rate (color-coded)

**Colors:** 10-color palette cycling through organizations

---

### 9. RealtimeMetrics.tsx
**Real-time monitoring header bar**

**Features:**
- Live indicator (pulsing green dot)
- Last updated timestamp
- Key metrics:
  - Request count (last 5 min)
  - Avg response time
  - Error count
  - Requests per minute
- Recent request status indicators (visual bars)

**Polling Interval:** 30 seconds

**Styling:** Gradient purple background

---

## Backend API Requirements

### Required Endpoints

```
GET /api/performance-analytics/overview/
GET /api/performance-analytics/response-time-trend/
GET /api/performance-analytics/endpoint-performance/
GET /api/performance-analytics/status-distribution/
GET /api/performance-analytics/slow-requests/
GET /api/performance-analytics/organization-breakdown/
GET /api/performance-analytics/agent-breakdown/
GET /api/performance-analytics/query-performance/
GET /api/performance-analytics/summaries/
GET /api/performance-analytics/realtime/
```

### Query Parameters (Common)

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `period` | `"24h" \| "7d" \| "30d" \| "90d"` | Predefined time period | `"7d"` |
| `start_date` | `string (ISO date)` | Custom start date | - |
| `end_date` | `string (ISO date)` | Custom end date | - |
| `limit` | `number` | Max results to return | `10` |
| `threshold` | `number` | For slow requests (ms) | `1000` |
| `sort_by` | `string` | Sort field | `"request_count"` |
| `period_type` | `"daily" \| "weekly" \| "monthly"` | For summaries | `"daily"` |

---

## Expected Response Formats

### 1. GET /performance-analytics/overview/

```json
{
  "total_requests": 125000,
  "total_requests_change": 12.5,
  "avg_response_time_ms": 145.3,
  "avg_response_time_change": -5.2,
  "max_response_time_ms": 3500,
  "min_response_time_ms": 12,
  "error_rate": 2.3,
  "error_rate_change": -0.8,
  "total_errors": 2875,
  "total_queries": 450000,
  "avg_query_time_ms": 25.4,
  "slow_requests": 156,
  "period": "7d",
  "start_date": "2026-04-21",
  "end_date": "2026-04-28"
}
```

### 2. GET /performance-analytics/response-time-trend/

```json
{
  "data": [
    {
      "timestamp": "2026-04-21T00:00:00Z",
      "avg_response_time": 142.5,
      "max_response_time": 2500,
      "min_response_time": 15,
      "request_count": 15000,
      "error_count": 45,
      "avg_query_count": 3.2
    },
    {
      "timestamp": "2026-04-22T00:00:00Z",
      "avg_response_time": 138.2,
      "max_response_time": 2100,
      "min_response_time": 12,
      "request_count": 16500,
      "error_count": 52,
      "avg_query_count": 3.4
    }
  ],
  "period": "7d"
}
```

### 3. GET /performance-analytics/endpoint-performance/

```json
{
  "data": [
    {
      "endpoint": "GET /api/agents/",
      "method": "GET",
      "path": "/api/agents/",
      "request_count": 25000,
      "avg_response_time": 125.4,
      "max_response_time": 2000,
      "error_rate": 1.2,
      "avg_query_count": 4.5
    },
    {
      "endpoint": "POST /api/conversations/",
      "method": "POST",
      "path": "/api/conversations/",
      "request_count": 18000,
      "avg_response_time": 245.8,
      "max_response_time": 3500,
      "error_rate": 2.8,
      "avg_query_count": 8.2
    }
  ]
}
```

### 4. GET /performance-analytics/status-distribution/

```json
{
  "categories": {
    "2xx": 120000,
    "3xx": 2500,
    "4xx": 1800,
    "5xx": 700
  },
  "detailed": [
    {"status_code": 200, "count": 115000},
    {"status_code": 201, "count": 5000},
    {"status_code": 301, "count": 1500},
    {"status_code": 302, "count": 1000},
    {"status_code": 400, "count": 1200},
    {"status_code": 401, "count": 400},
    {"status_code": 404, "count": 200},
    {"status_code": 500, "count": 500},
    {"status_code": 503, "count": 200}
  ]
}
```

### 5. GET /performance-analytics/slow-requests/

```json
{
  "data": [
    {
      "id": "req_123abc",
      "timestamp": "2026-04-28T10:30:00Z",
      "endpoint": "POST /api/conversations/",
      "response_time_ms": 2500,
      "query_count": 25,
      "query_time_ms": 1800,
      "status_code": 200,
      "user_id": "user_456",
      "organization_id": "org_789",
      "agent_id": "agent_012"
    },
    {
      "id": "req_456def",
      "timestamp": "2026-04-28T09:15:00Z",
      "endpoint": "GET /api/reports/export/",
      "response_time_ms": 4200,
      "query_count": 45,
      "query_time_ms": 3500,
      "status_code": 200,
      "user_id": "user_789",
      "organization_id": "org_456",
      "agent_id": null
    }
  ],
  "threshold_ms": 1000
}
```

### 6. GET /performance-analytics/organization-breakdown/

```json
{
  "data": [
    {
      "organization_id": "org_123",
      "organization_name": "Acme Corporation",
      "request_count": 45000,
      "avg_response_time": 132.5,
      "error_rate": 1.8
    },
    {
      "organization_id": "org_456",
      "organization_name": "TechStart Inc",
      "request_count": 32000,
      "avg_response_time": 148.2,
      "error_rate": 2.4
    },
    {
      "organization_id": "org_789",
      "organization_name": "Global Services Ltd",
      "request_count": 28000,
      "avg_response_time": 155.8,
      "error_rate": 3.1
    }
  ]
}
```

### 7. GET /performance-analytics/agent-breakdown/

```json
{
  "data": [
    {
      "agent_id": "agent_123",
      "agent_name": "Customer Support Bot",
      "request_count": 12000,
      "avg_response_time": 145.2,
      "error_rate": 2.1
    },
    {
      "agent_id": "agent_456",
      "agent_name": "Sales Assistant",
      "request_count": 8500,
      "avg_response_time": 128.5,
      "error_rate": 1.5
    },
    {
      "agent_id": "agent_789",
      "agent_name": "Technical Helper",
      "request_count": 6200,
      "avg_response_time": 168.4,
      "error_rate": 2.8
    }
  ]
}
```

### 8. GET /performance-analytics/query-performance/

```json
{
  "data": [
    {
      "timestamp": "2026-04-21T00:00:00Z",
      "avg_query_count": 3.5,
      "max_query_count": 45,
      "avg_query_time": 22.5,
      "total_queries": 52500
    },
    {
      "timestamp": "2026-04-22T00:00:00Z",
      "avg_query_count": 3.8,
      "max_query_count": 52,
      "avg_query_time": 24.2,
      "total_queries": 62700
    }
  ]
}
```

### 9. GET /performance-analytics/summaries/

```json
{
  "data": [
    {
      "id": "summary_123",
      "period_start": "2026-04-21T00:00:00Z",
      "period_end": "2026-04-22T00:00:00Z",
      "total_requests": 18500,
      "total_errors": 425,
      "avg_response_time_ms": 142.5,
      "max_response_time_ms": 2500,
      "min_response_time_ms": 12,
      "avg_query_count": 3.5,
      "total_queries": 64750,
      "user_id": null,
      "organization_id": null,
      "agent_id": null
    }
  ],
  "period_type": "daily"
}
```

### 10. GET /performance-analytics/realtime/

```json
{
  "stats": {
    "request_count": 250,
    "avg_response_time_ms": 138.5,
    "error_count": 3,
    "requests_per_minute": 50.0
  },
  "recent_requests": [
    {
      "timestamp": "2026-04-28T14:30:15Z",
      "endpoint": "GET /api/agents/",
      "response_time_ms": 125,
      "status_code": 200
    },
    {
      "timestamp": "2026-04-28T14:30:12Z",
      "endpoint": "POST /api/conversations/",
      "response_time_ms": 245,
      "status_code": 201
    },
    {
      "timestamp": "2026-04-28T14:30:10Z",
      "endpoint": "GET /api/users/me/",
      "response_time_ms": 85,
      "status_code": 200
    }
  ],
  "timestamp": "2026-04-28T14:30:20Z"
}
```

---

## Database Schema Requirements

### performance_request_logs Table

Main table for storing request performance data.

```sql
CREATE TABLE performance_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    response_time_ms FLOAT NOT NULL,
    status_code INTEGER NOT NULL,
    query_count INTEGER DEFAULT 0,
    query_time_ms FLOAT DEFAULT 0,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    request_body_size INTEGER DEFAULT 0,
    response_body_size INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_perf_logs_timestamp ON performance_request_logs(timestamp DESC);
CREATE INDEX idx_perf_logs_endpoint ON performance_request_logs(endpoint);
CREATE INDEX idx_perf_logs_method ON performance_request_logs(method);
CREATE INDEX idx_perf_logs_status ON performance_request_logs(status_code);
CREATE INDEX idx_perf_logs_org ON performance_request_logs(organization_id);
CREATE INDEX idx_perf_logs_agent ON performance_request_logs(agent_id);
CREATE INDEX idx_perf_logs_user ON performance_request_logs(user_id);
CREATE INDEX idx_perf_logs_response_time ON performance_request_logs(response_time_ms);

-- Composite indexes for common queries
CREATE INDEX idx_perf_logs_timestamp_status ON performance_request_logs(timestamp, status_code);
CREATE INDEX idx_perf_logs_timestamp_endpoint ON performance_request_logs(timestamp, endpoint);
```

### performance_summaries Table (Optional)

Pre-aggregated summaries for faster queries.

```sql
CREATE TABLE performance_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ,
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),
    total_requests INTEGER NOT NULL DEFAULT 0,
    total_errors INTEGER NOT NULL DEFAULT 0,
    avg_response_time_ms FLOAT NOT NULL DEFAULT 0,
    max_response_time_ms FLOAT NOT NULL DEFAULT 0,
    min_response_time_ms FLOAT NOT NULL DEFAULT 0,
    p50_response_time_ms FLOAT,
    p95_response_time_ms FLOAT,
    p99_response_time_ms FLOAT,
    avg_query_count FLOAT DEFAULT 0,
    total_queries INTEGER DEFAULT 0,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (period_start, period_type, user_id, organization_id, agent_id)
);

CREATE INDEX idx_perf_summaries_period ON performance_summaries(period_start, period_type);
CREATE INDEX idx_perf_summaries_org ON performance_summaries(organization_id, period_start);
```

---

## Middleware for Request Logging

### Django Middleware Implementation

```python
# performance/middleware.py

import time
import uuid
import logging
from django.db import connection
from django.conf import settings
from .models import PerformanceRequestLog

logger = logging.getLogger(__name__)

class PerformanceLoggingMiddleware:
    """
    Middleware to log API request performance metrics.
    """

    # Paths to exclude from logging
    EXCLUDED_PATHS = [
        '/health/',
        '/metrics/',
        '/static/',
        '/media/',
        '/admin/jsi18n/',
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip excluded paths
        if any(request.path.startswith(path) for path in self.EXCLUDED_PATHS):
            return self.get_response(request)

        # Start timing
        start_time = time.time()
        initial_queries = len(connection.queries)

        # Process request
        response = self.get_response(request)

        # Calculate metrics
        response_time_ms = (time.time() - start_time) * 1000
        final_queries = connection.queries[initial_queries:]
        query_count = len(final_queries)
        query_time_ms = sum(float(q.get('time', 0)) for q in final_queries) * 1000

        # Get user and organization info
        user_id = None
        organization_id = None
        agent_id = None

        if hasattr(request, 'user') and request.user.is_authenticated:
            user_id = request.user.id
            organization_id = getattr(request.user, 'organization_id', None)

        # Check for agent ID in headers
        agent_id = request.headers.get('X-Agent-ID')

        # Log to database asynchronously (using celery or background task)
        try:
            self._log_request(
                endpoint=f"{request.method} {request.path}",
                method=request.method,
                path=request.path,
                response_time_ms=response_time_ms,
                status_code=response.status_code,
                query_count=query_count,
                query_time_ms=query_time_ms,
                user_id=user_id,
                organization_id=organization_id,
                agent_id=agent_id,
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get('User-Agent', '')[:500],
            )
        except Exception as e:
            logger.error(f"Failed to log performance metrics: {e}")

        return response

    def _log_request(self, **kwargs):
        """Log request to database."""
        PerformanceRequestLog.objects.create(**kwargs)

    def _get_client_ip(self, request):
        """Extract client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
```

### Django Model

```python
# performance/models.py

import uuid
from django.db import models

class PerformanceRequestLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    endpoint = models.CharField(max_length=255, db_index=True)
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=500)
    response_time_ms = models.FloatField()
    status_code = models.IntegerField(db_index=True)
    query_count = models.IntegerField(default=0)
    query_time_ms = models.FloatField(default=0)
    user_id = models.UUIDField(null=True, blank=True, db_index=True)
    organization_id = models.UUIDField(null=True, blank=True, db_index=True)
    agent_id = models.UUIDField(null=True, blank=True, db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'performance_request_logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['timestamp', 'status_code']),
            models.Index(fields=['timestamp', 'endpoint']),
            models.Index(fields=['organization_id', 'timestamp']),
        ]
```

---

## Aggregation Queries

### Django ORM Query Examples

```python
# performance/services.py

from datetime import datetime, timedelta
from django.db.models import Avg, Max, Min, Count, Sum, Q, F
from django.db.models.functions import TruncDay, TruncHour
from django.utils import timezone
from .models import PerformanceRequestLog


def get_date_range(period: str):
    """Calculate start date based on period."""
    now = timezone.now()
    periods = {
        '24h': timedelta(hours=24),
        '7d': timedelta(days=7),
        '30d': timedelta(days=30),
        '90d': timedelta(days=90),
    }
    delta = periods.get(period, timedelta(days=7))
    return now - delta, now


def get_performance_overview(period: str = '7d'):
    """Get overview statistics."""
    start_date, end_date = get_date_range(period)
    prev_start = start_date - (end_date - start_date)

    # Current period stats
    current_logs = PerformanceRequestLog.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date
    )

    # Previous period stats (for comparison)
    prev_logs = PerformanceRequestLog.objects.filter(
        timestamp__gte=prev_start,
        timestamp__lt=start_date
    )

    current_stats = current_logs.aggregate(
        total_requests=Count('id'),
        avg_response_time=Avg('response_time_ms'),
        max_response_time=Max('response_time_ms'),
        min_response_time=Min('response_time_ms'),
        total_queries=Sum('query_count'),
        avg_query_time=Avg('query_time_ms'),
    )

    prev_stats = prev_logs.aggregate(
        total_requests=Count('id'),
        avg_response_time=Avg('response_time_ms'),
    )

    total_errors = current_logs.filter(status_code__gte=400).count()
    prev_errors = prev_logs.filter(status_code__gte=400).count()
    slow_requests = current_logs.filter(response_time_ms__gt=1000).count()

    # Calculate changes
    def calc_change(current, previous):
        if not previous or previous == 0:
            return 0
        return round(((current - previous) / previous) * 100, 2)

    error_rate = (total_errors / current_stats['total_requests'] * 100) if current_stats['total_requests'] else 0
    prev_error_rate = (prev_errors / prev_stats['total_requests'] * 100) if prev_stats['total_requests'] else 0

    return {
        'total_requests': current_stats['total_requests'] or 0,
        'total_requests_change': calc_change(
            current_stats['total_requests'] or 0,
            prev_stats['total_requests'] or 0
        ),
        'avg_response_time_ms': round(current_stats['avg_response_time'] or 0, 2),
        'avg_response_time_change': calc_change(
            current_stats['avg_response_time'] or 0,
            prev_stats['avg_response_time'] or 0
        ),
        'max_response_time_ms': round(current_stats['max_response_time'] or 0, 2),
        'min_response_time_ms': round(current_stats['min_response_time'] or 0, 2),
        'error_rate': round(error_rate, 2),
        'error_rate_change': round(error_rate - prev_error_rate, 2),
        'total_errors': total_errors,
        'total_queries': current_stats['total_queries'] or 0,
        'avg_query_time_ms': round(current_stats['avg_query_time'] or 0, 2),
        'slow_requests': slow_requests,
        'period': period,
        'start_date': start_date.isoformat(),
        'end_date': end_date.isoformat(),
    }


def get_response_time_trend(period: str = '7d'):
    """Get response time trend data."""
    start_date, end_date = get_date_range(period)

    # Use hourly buckets for 24h, daily for others
    trunc_func = TruncHour if period == '24h' else TruncDay

    trend_data = PerformanceRequestLog.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date
    ).annotate(
        time_bucket=trunc_func('timestamp')
    ).values('time_bucket').annotate(
        avg_response_time=Avg('response_time_ms'),
        max_response_time=Max('response_time_ms'),
        min_response_time=Min('response_time_ms'),
        request_count=Count('id'),
        error_count=Count('id', filter=Q(status_code__gte=400)),
        avg_query_count=Avg('query_count'),
    ).order_by('time_bucket')

    return {
        'data': [
            {
                'timestamp': item['time_bucket'].isoformat(),
                'avg_response_time': round(item['avg_response_time'] or 0, 2),
                'max_response_time': round(item['max_response_time'] or 0, 2),
                'min_response_time': round(item['min_response_time'] or 0, 2),
                'request_count': item['request_count'],
                'error_count': item['error_count'],
                'avg_query_count': round(item['avg_query_count'] or 0, 2),
            }
            for item in trend_data
        ],
        'period': period,
    }


def get_endpoint_performance(period: str = '7d', limit: int = 10, sort_by: str = 'request_count'):
    """Get endpoint performance breakdown."""
    start_date, end_date = get_date_range(period)

    endpoints = PerformanceRequestLog.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date
    ).values('endpoint', 'method', 'path').annotate(
        request_count=Count('id'),
        avg_response_time=Avg('response_time_ms'),
        max_response_time=Max('response_time_ms'),
        error_count=Count('id', filter=Q(status_code__gte=400)),
        avg_query_count=Avg('query_count'),
    ).annotate(
        error_rate=F('error_count') * 100.0 / F('request_count')
    ).order_by(f'-{sort_by}')[:limit]

    return {
        'data': [
            {
                'endpoint': item['endpoint'],
                'method': item['method'],
                'path': item['path'],
                'request_count': item['request_count'],
                'avg_response_time': round(item['avg_response_time'] or 0, 2),
                'max_response_time': round(item['max_response_time'] or 0, 2),
                'error_rate': round(item['error_rate'] or 0, 2),
                'avg_query_count': round(item['avg_query_count'] or 0, 2),
            }
            for item in endpoints
        ]
    }


def get_status_distribution(period: str = '7d'):
    """Get HTTP status code distribution."""
    start_date, end_date = get_date_range(period)

    logs = PerformanceRequestLog.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date
    )

    # Category counts
    categories = {
        '2xx': logs.filter(status_code__gte=200, status_code__lt=300).count(),
        '3xx': logs.filter(status_code__gte=300, status_code__lt=400).count(),
        '4xx': logs.filter(status_code__gte=400, status_code__lt=500).count(),
        '5xx': logs.filter(status_code__gte=500).count(),
    }

    # Detailed breakdown
    detailed = logs.values('status_code').annotate(
        count=Count('id')
    ).order_by('-count')[:10]

    return {
        'categories': categories,
        'detailed': [
            {'status_code': item['status_code'], 'count': item['count']}
            for item in detailed
        ]
    }


def get_slow_requests(period: str = '7d', threshold: int = 1000, limit: int = 20):
    """Get slow requests exceeding threshold."""
    start_date, end_date = get_date_range(period)

    slow = PerformanceRequestLog.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date,
        response_time_ms__gt=threshold
    ).order_by('-response_time_ms')[:limit]

    return {
        'data': [
            {
                'id': str(item.id),
                'timestamp': item.timestamp.isoformat(),
                'endpoint': item.endpoint,
                'response_time_ms': round(item.response_time_ms, 2),
                'query_count': item.query_count,
                'query_time_ms': round(item.query_time_ms, 2),
                'status_code': item.status_code,
                'user_id': str(item.user_id) if item.user_id else None,
                'organization_id': str(item.organization_id) if item.organization_id else None,
                'agent_id': str(item.agent_id) if item.agent_id else None,
            }
            for item in slow
        ],
        'threshold_ms': threshold,
    }


def get_organization_breakdown(period: str = '7d', limit: int = 10):
    """Get performance breakdown by organization."""
    start_date, end_date = get_date_range(period)

    # This assumes you have an Organization model
    from organizations.models import Organization

    breakdown = PerformanceRequestLog.objects.filter(
        timestamp__gte=start_date,
        timestamp__lte=end_date,
        organization_id__isnull=False
    ).values('organization_id').annotate(
        request_count=Count('id'),
        avg_response_time=Avg('response_time_ms'),
        error_count=Count('id', filter=Q(status_code__gte=400)),
    ).annotate(
        error_rate=F('error_count') * 100.0 / F('request_count')
    ).order_by('-request_count')[:limit]

    # Get organization names
    org_ids = [item['organization_id'] for item in breakdown]
    orgs = {str(o.id): o.name for o in Organization.objects.filter(id__in=org_ids)}

    return {
        'data': [
            {
                'organization_id': str(item['organization_id']),
                'organization_name': orgs.get(str(item['organization_id']), 'Unknown'),
                'request_count': item['request_count'],
                'avg_response_time': round(item['avg_response_time'] or 0, 2),
                'error_rate': round(item['error_rate'] or 0, 2),
            }
            for item in breakdown
        ]
    }


def get_realtime_metrics():
    """Get real-time metrics for last 5 minutes."""
    five_mins_ago = timezone.now() - timedelta(minutes=5)

    recent_logs = PerformanceRequestLog.objects.filter(
        timestamp__gte=five_mins_ago
    )

    stats = recent_logs.aggregate(
        request_count=Count('id'),
        avg_response_time=Avg('response_time_ms'),
        error_count=Count('id', filter=Q(status_code__gte=400)),
    )

    recent_requests = recent_logs.order_by('-timestamp')[:10]

    return {
        'stats': {
            'request_count': stats['request_count'] or 0,
            'avg_response_time_ms': round(stats['avg_response_time'] or 0, 2),
            'error_count': stats['error_count'] or 0,
            'requests_per_minute': round((stats['request_count'] or 0) / 5, 2),
        },
        'recent_requests': [
            {
                'timestamp': item.timestamp.isoformat(),
                'endpoint': item.endpoint,
                'response_time_ms': round(item.response_time_ms, 2),
                'status_code': item.status_code,
            }
            for item in recent_requests
        ],
        'timestamp': timezone.now().isoformat(),
    }
```

### Django REST Framework Views

```python
# performance/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from . import services


class PerformanceOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        return Response(services.get_performance_overview(period))


class ResponseTimeTrendView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        return Response(services.get_response_time_trend(period))


class EndpointPerformanceView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        limit = int(request.query_params.get('limit', 10))
        sort_by = request.query_params.get('sort_by', 'request_count')
        return Response(services.get_endpoint_performance(period, limit, sort_by))


class StatusDistributionView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        return Response(services.get_status_distribution(period))


class SlowRequestsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        threshold = int(request.query_params.get('threshold', 1000))
        limit = int(request.query_params.get('limit', 20))
        return Response(services.get_slow_requests(period, threshold, limit))


class OrganizationBreakdownView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        limit = int(request.query_params.get('limit', 10))
        return Response(services.get_organization_breakdown(period, limit))


class AgentBreakdownView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        limit = int(request.query_params.get('limit', 10))
        return Response(services.get_agent_breakdown(period, limit))


class QueryPerformanceView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        period = request.query_params.get('period', '7d')
        return Response(services.get_query_performance(period))


class RealtimeMetricsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        return Response(services.get_realtime_metrics())
```

### URL Configuration

```python
# performance/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.PerformanceOverviewView.as_view(), name='performance-overview'),
    path('response-time-trend/', views.ResponseTimeTrendView.as_view(), name='response-time-trend'),
    path('endpoint-performance/', views.EndpointPerformanceView.as_view(), name='endpoint-performance'),
    path('status-distribution/', views.StatusDistributionView.as_view(), name='status-distribution'),
    path('slow-requests/', views.SlowRequestsView.as_view(), name='slow-requests'),
    path('organization-breakdown/', views.OrganizationBreakdownView.as_view(), name='organization-breakdown'),
    path('agent-breakdown/', views.AgentBreakdownView.as_view(), name='agent-breakdown'),
    path('query-performance/', views.QueryPerformanceView.as_view(), name='query-performance'),
    path('summaries/', views.PerformanceSummariesView.as_view(), name='performance-summaries'),
    path('realtime/', views.RealtimeMetricsView.as_view(), name='realtime-metrics'),
]
```

---

## Technologies Used

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **Redux Toolkit** | State management |
| **RTK Query** | Data fetching & caching |
| **Recharts** | Charts & visualizations |
| **Tailwind CSS** | Styling |

### Backend (Expected)

| Technology | Purpose |
|------------|---------|
| **Django 4.x** | Web framework |
| **Django REST Framework** | API framework |
| **PostgreSQL** | Database |
| **Celery** (optional) | Background task processing |
| **Redis** (optional) | Caching & Celery broker |

---

## Features Summary

| Feature | Description |
|---------|-------------|
| Real-time Monitoring | Live stats with 30s polling interval |
| Flexible Time Ranges | 24h, 7d, 30d, 90d predefined periods |
| Response Time Analysis | Average, min, max trends with charts |
| HTTP Status Distribution | Donut chart with detailed breakdown |
| Endpoint Performance | Sortable table with multiple metrics |
| Slow Request Detection | Configurable threshold (default 1000ms) |
| Database Query Metrics | Query count & execution time tracking |
| Organization Breakdown | Per-organization performance stats |
| Agent Breakdown | Per-agent performance stats |
| Change Indicators | Percentage change vs previous period |

---

## Performance Considerations

### Frontend
- RTK Query automatic caching reduces API calls
- 30-second polling interval for real-time data
- Lazy loading of tab content
- Memoized chart data transformations

### Backend
- Database indexes on frequently queried columns
- Optional pre-aggregated summaries table
- Pagination for large datasets
- Consider partitioning logs table by date for large volumes

### Scaling Recommendations
- Use connection pooling (e.g., pgBouncer)
- Consider time-series database for high-volume metrics
- Implement data retention policies (e.g., keep detailed logs for 90 days)
- Use background jobs for aggregation calculations

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-04-28 | Initial implementation |

---

## Author

Graaho AI Development Team

---

## License

Proprietary - Graaho AI
