# Graaho AI - Subscription Model Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Concepts](#core-concepts)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Billing Flows](#billing-flows)
8. [API Endpoints](#api-endpoints)
9. [Super Admin Configuration Guide](#super-admin-configuration-guide)
10. [Appendix](#appendix)

---

## Overview

Graaho AI এর Subscription Model একটি **component-based, multi-tier pricing system** যা দুইটি billing mode সাপোর্ট করে:
- **Prepaid**: আগে পেমেন্ট করে resource use করা (Wallet-based)
- **Postpaid**: Resource use করে পরে pay করা (Invoice-based)

### Key Features:
- Multi-tier subscription plans (Free, Starter, Professional, Enterprise, Custom)
- Component-based pricing (Tokens, Storage, API Calls, Agent Instances)
- Agent-specific pricing with multiple billing methods
- Promotional codes with percentage discounts
- Resource wallet system with rollover support
- Comprehensive invoice management
- Grace period handling

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                              GRAAHO AI SUBSCRIPTION ARCHITECTURE                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SUPER ADMIN DASHBOARD                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Plans     │  │ Components  │  │   Agent     │  │Link Plans   │  │   Plan      │   │
│  │ Management  │  │ Management  │  │  Pricing    │  │& Components │  │  Summary    │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ RTK Query API
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND LAYER                                        │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              billingApi.ts (RTK Query)                              │ │
│  │  ┌──────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐ ┌──────────┐  │ │
│  │  │  Plans   │ │Plan Component│ │Agent Pricing│ │Plan Inclusions   │ │ Summary  │  │ │
│  │  │  CRUD    │ │   CRUD       │ │    CRUD     │ │ Component/Agent  │ │ Queries  │  │ │
│  │  └──────────┘ └──────────────┘ └─────────────┘ └──────────────────┘ └──────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ REST API Calls
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    BACKEND LAYER                                         │
│                                                                                          │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                              Django REST Framework                                   │ │
│  │                                                                                      │ │
│  │  ┌─────────────────────────┐        ┌─────────────────────────┐                    │ │
│  │  │   subscription_views.py  │        │    billing_views.py     │                    │ │
│  │  │   - PlanViewSet         │        │   - TransactionViewSet   │                    │ │
│  │  │   - ComponentViewSet    │        │   - UsageRecordViewSet   │                    │ │
│  │  │   - AgentPricingViewSet │        │   - WalletViewSet        │                    │ │
│  │  │   - SubscriptionViewSet │        │   - InvoiceViewSet       │                    │ │
│  │  └─────────────────────────┘        └─────────────────────────┘                    │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │                                               │
│  ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│  │                               SERVICES LAYER                                         │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐                   │ │
│  │  │SubscriptionService│  │  BillingService  │  │  WalletService   │                   │ │
│  │  │- subscribe_user() │  │- create_invoice()│  │- consume()       │                   │ │
│  │  │- calculate_price()│  │- process_payment │  │- rollover()      │                   │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────┘                   │ │
│  └────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATABASE LAYER                                        │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            PRICING MODELS                                         │   │
│  │  ┌────────────┐     ┌─────────────────┐     ┌────────────────────┐               │   │
│  │  │    Plan    │────▶│PlanComponent    │────▶│PlanComponentInclu- │               │   │
│  │  │            │     │Inclusion        │     │sion                │               │   │
│  │  └────────────┘     └─────────────────┘     └────────────────────┘               │   │
│  │        │                                                                          │   │
│  │        │            ┌─────────────────┐     ┌────────────────────┐               │   │
│  │        └───────────▶│  AgentPricing   │────▶│ PlanAgentInclusion │               │   │
│  │                     └─────────────────┘     └────────────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                         SUBSCRIPTION MODELS                                       │   │
│  │  ┌─────────────────┐     ┌────────────────────┐     ┌────────────────────┐       │   │
│  │  │ClientSubscription│────▶│SubscriptionComponent│    │ SubscriptionAgent  │       │   │
│  │  └─────────────────┘     └────────────────────┘     └────────────────────┘       │   │
│  │        │                                                                          │   │
│  │        │            ┌─────────────────┐     ┌────────────────────┐               │   │
│  │        ├───────────▶│ BillingInvoice  │────▶│  InvoiceLineItem   │               │   │
│  │        │            └─────────────────┘     └────────────────────┘               │   │
│  │        │                                                                          │   │
│  │        │            ┌─────────────────┐     ┌────────────────────┐               │   │
│  │        └───────────▶│ ResourceWallet  │────▶│ WalletTransaction  │               │   │
│  │                     └─────────────────┘     └────────────────────┘               │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                          │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          BILLING MODELS                                           │   │
│  │  ┌─────────────────┐     ┌────────────────────┐     ┌────────────────────┐       │   │
│  │  │ PlanTransaction │     │    UsageRecord     │     │AgentComponentPricing│       │   │
│  │  └─────────────────┘     └────────────────────┘     └────────────────────┘       │   │
│  └──────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Plan (সাবস্ক্রিপশন প্ল্যান)

```
┌───────────────────────────────────────────────────────────────────┐
│                           PLAN                                     │
├───────────────────────────────────────────────────────────────────┤
│  Plan Types:                                                       │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌────────────┐ ┌──────┐│
│  │  Free   │ │ Starter │ │Professional  │ │ Enterprise │ │Custom││
│  │  $0     │ │  $XX    │ │    $XXX      │ │   $XXXX    │ │ $?   ││
│  └─────────┘ └─────────┘ └──────────────┘ └────────────┘ └──────┘│
├───────────────────────────────────────────────────────────────────┤
│  Billing Periods:    │ Monthly │ Quarterly │ Yearly │             │
├───────────────────────────────────────────────────────────────────┤
│  Billing Modes:      │ Prepaid │ Postpaid │                       │
├───────────────────────────────────────────────────────────────────┤
│  Key Fields:                                                       │
│  - name, description                                               │
│  - base_price, cost_per_unit                                       │
│  - promotion_code, discount_percentage                             │
│  - grace_period_days                                               │
│  - is_active, is_public, featured                                  │
└───────────────────────────────────────────────────────────────────┘
```

### 2. Plan Component (Resource Components)

```
┌───────────────────────────────────────────────────────────────────┐
│                      PLAN COMPONENT                                │
├───────────────────────────────────────────────────────────────────┤
│  Component Types:                                                  │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐          │
│  │ Compute Tokens  │ │  Storage GB  │ │   API Calls   │          │
│  │ 1M tokens = $20 │ │ 10GB = $5    │ │ 10K = $10     │          │
│  └─────────────────┘ └──────────────┘ └───────────────┘          │
│  ┌─────────────────┐ ┌──────────────┐ ┌───────────────┐          │
│  │ Agent Instances │ │ Active Agents│ │    Custom     │          │
│  │ Per instance    │ │ Per agent    │ │ Custom unit   │          │
│  └─────────────────┘ └──────────────┘ └───────────────┘          │
├───────────────────────────────────────────────────────────────────┤
│  Key Fields:                                                       │
│  - quantity (e.g., 1,000,000 tokens)                              │
│  - price (e.g., $20 for 1M tokens)                                │
│  - cost_per_unit (internal cost)                                  │
│  - price_per_unit (client-facing price)                           │
│  - unit_label (e.g., "tokens", "GB", "calls")                     │
│  - is_renewable (rollover support)                                │
└───────────────────────────────────────────────────────────────────┘
```

### 3. Agent Pricing

```
┌───────────────────────────────────────────────────────────────────┐
│                       AGENT PRICING                                │
├───────────────────────────────────────────────────────────────────┤
│  Unit Types:                                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐             │
│  │ Per Use  │ │ Per Hour │ │ Per Day  │ │Per Month │             │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐              │
│  │Per Transaction│ │ Per Request  │ │  Flat Rate   │              │
│  └──────────────┘ └──────────────┘ └──────────────┘              │
├───────────────────────────────────────────────────────────────────┤
│  Billing Methods:                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌────────────┐       │
│  │ Prepaid  │ │ Postpaid │ │Pay As You Go │ │Subscription│       │
│  └──────────┘ └──────────┘ └──────────────┘ └────────────┘       │
├───────────────────────────────────────────────────────────────────┤
│  Key Fields:                                                       │
│  - agent (FK to Agent Template)                                    │
│  - price, unit, billing_method                                     │
│  - estimated_tokens_per_use                                        │
│  - estimated_storage_mb                                            │
│  - promotion_code, discount_percentage                             │
└───────────────────────────────────────────────────────────────────┘
```

### 4. Inclusion Models (Linking)

```
┌───────────────────────────────────────────────────────────────────┐
│                    PLAN-COMPONENT INCLUSION                        │
├───────────────────────────────────────────────────────────────────┤
│  Links Plan ↔ Component                                           │
│                                                                    │
│  ┌──────────┐    PlanComponentInclusion    ┌──────────────┐       │
│  │   Plan   │◄────────────────────────────►│ PlanComponent│       │
│  └──────────┘   - quantity_multiplier       └──────────────┘       │
│                 - is_featured                                      │
│                 - display_order                                    │
├───────────────────────────────────────────────────────────────────┤
│  Example:                                                          │
│  Starter Plan × Compute Tokens (2x multiplier)                    │
│  = 2,000,000 tokens included @ $40 total                          │
└───────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│                    PLAN-AGENT INCLUSION                            │
├───────────────────────────────────────────────────────────────────┤
│  Links Plan ↔ Agent (via AgentPricing)                            │
│                                                                    │
│  ┌──────────┐     PlanAgentInclusion      ┌─────────────┐         │
│  │   Plan   │◄───────────────────────────►│AgentPricing │         │
│  └──────────┘   - included_instances       └─────────────┘         │
│                 - is_featured                     │                │
│                 - display_order                   ▼                │
│                                           ┌─────────────┐         │
│                                           │    Agent    │         │
│                                           └─────────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌────────────┐
                                    │   Users    │
                                    └─────┬──────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
    ┌─────────────────┐       ┌─────────────────┐          ┌─────────────────┐
    │ClientSubscription│       │  ResourceWallet │          │ PlanTransaction │
    └────────┬────────┘       └─────────────────┘          └─────────────────┘
             │                         │
             │                         ▼
             │                ┌─────────────────┐
             │                │WalletTransaction│
             │                └─────────────────┘
             │
    ┌────────┴────────┬─────────────────┬─────────────────┐
    │                 │                 │                 │
    ▼                 ▼                 ▼                 ▼
┌────────────┐ ┌────────────┐  ┌─────────────┐  ┌─────────────┐
│Subscription│ │Subscription│  │BillingInvoice│  │ Additional  │
│ Component  │ │   Agent    │  └──────┬──────┘  │ Purchase    │
└────────────┘ └────────────┘         │         └─────────────┘
                                      ▼
                              ┌───────────────┐
                              │InvoiceLineItem│
                              └───────────────┘

                    ┌────────────────────────────────┐
                    │            Plan                 │
                    └───────────────┬────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           │                        │                        │
           ▼                        ▼                        ▼
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│PlanComponentInclusion│   │ PlanAgentInclusion │   │  (Direct Plan      │
└──────────┬─────────┘   └──────────┬─────────┘   │   Properties)       │
           │                        │             └────────────────────┘
           ▼                        ▼
   ┌───────────────┐        ┌────────────┐
   │ PlanComponent │        │AgentPricing│
   └───────────────┘        └─────┬──────┘
           │                      │
           │                      ▼
           │                ┌────────────┐
           │                │   Agents   │
           │                └────────────┘
           │
           ▼
   ┌────────────────────┐
   │AgentComponentPricing│ (Links Agent → Component consumption rates)
   └────────────────────┘
```

### Tables Summary

| Table Name | Description | Key Relationships |
|------------|-------------|-------------------|
| `plans` | Subscription plans definition | Has many inclusions |
| `plan_components` | Billable resource components | Included in plans |
| `plan_component_inclusions` | Links plans to components | FK to Plan, Component |
| `agent_pricing` | Pricing tiers for agents | FK to Agent |
| `plan_agent_inclusions` | Links plans to agents | FK to Plan, AgentPricing |
| `client_subscriptions` | User subscriptions | FK to User, Plan |
| `subscription_components` | Components in subscription | FK to Subscription |
| `subscription_agents` | Agents in subscription | FK to Subscription |
| `resource_wallets` | Prepaid resource pools | FK to User, Subscription |
| `wallet_transactions` | Wallet activity log | FK to Wallet |
| `plan_transactions` | Subscription transactions | FK to User, Plan |
| `usage_records` | Postpaid usage tracking | FK to User, Component |
| `billing_invoices` | Invoice records | FK to User, Subscription |
| `invoice_line_items` | Invoice line items | FK to Invoice |
| `agent_component_pricing` | Agent resource consumption | FK to Agent, Component |

---

## Backend Implementation

### Directory Structure

```
apps/agents/
├── models/
│   ├── pricing.py          # Plan, PlanComponent, AgentPricing, Inclusions
│   ├── subscriptions.py    # ClientSubscription, Invoice models
│   ├── billing.py          # PlanTransaction, UsageRecord, AgentComponentPricing
│   └── wallet.py           # ResourceWallet, WalletTransaction
├── views/
│   ├── subscription_views.py   # Plan/Component/Subscription APIs
│   └── billing_views.py        # Transaction/Invoice/Wallet APIs
├── services/
│   ├── subscription_service.py # High-level subscription operations
│   ├── billing_service.py      # Invoice & payment processing
│   └── wallet_service.py       # Resource wallet management
├── serializers.py              # DRF serializers
└── urls.py                     # API routing
```

### Key Backend Models

#### Plan Model (pricing.py:13-121)

```python
class Plan(AuditMixin):
    PLAN_TYPE_CHOICES = [
        ('free', 'Free'),
        ('starter', 'Starter'),
        ('professional', 'Professional'),
        ('enterprise', 'Enterprise'),
        ('custom', 'Custom'),
    ]

    BILLING_PERIOD_CHOICES = [
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    ]

    BILLING_MODE_CHOICES = [
        ('prepaid', 'Prepaid'),
        ('postpaid', 'Postpaid'),
    ]

    # Fields
    id = UUIDField(primary_key=True)
    name = CharField(max_length=200, unique=True)
    description = TextField()
    plan_type = CharField(choices=PLAN_TYPE_CHOICES)
    base_price = DecimalField(max_digits=10, decimal_places=2)
    billing_period = CharField(choices=BILLING_PERIOD_CHOICES)
    billing_mode = CharField(choices=BILLING_MODE_CHOICES)
    grace_period_days = IntegerField(default=7)
    cost_per_unit = DecimalField()  # Internal cost
    promotion_code = CharField()
    discount_percentage = DecimalField()
    is_active = BooleanField(default=True)
    is_public = BooleanField(default=True)
    featured = BooleanField(default=False)
```

#### PlanComponent Model (pricing.py:122-281)

```python
class PlanComponent(AuditMixin):
    COMPONENT_TYPE_CHOICES = [
        ('compute_tokens', 'Compute Tokens'),
        ('storage_gb', 'Storage (GB)'),
        ('api_calls', 'API Calls'),
        ('agent_instances', 'Agent Instances'),
        ('active_agents', 'Active Agents'),
        ('custom', 'Custom Component'),
    ]

    # Fields
    name = CharField()
    component_type = CharField(choices=COMPONENT_TYPE_CHOICES)
    quantity = DecimalField()        # e.g., 1,000,000 tokens
    price = DecimalField()           # e.g., $20
    cost_per_unit = DecimalField()   # Internal cost per unit
    price_per_unit = DecimalField()  # Client-facing price per unit
    unit_label = CharField()         # "tokens", "GB", etc.
    is_renewable = BooleanField()    # Rollover support

    @property
    def effective_price(self):
        """Price after applying discount"""
        if self.is_promotion_valid() and self.discount_percentage:
            return self.price * (1 - self.discount_percentage/100)
        return self.price
```

#### ResourceWallet Model (wallet.py:15-170)

```python
class ResourceWallet(AuditMixin):
    RESOURCE_TYPE_CHOICES = [
        ('compute_tokens', 'Compute Tokens'),
        ('storage_gb', 'Storage (GB)'),
        ('api_calls', 'API Calls'),
        ('agent_instances', 'Agent Instances'),
    ]

    user = ForeignKey(Users)
    subscription = ForeignKey(ClientSubscription)
    resource_type = CharField(choices=RESOURCE_TYPE_CHOICES)
    total_allocated = DecimalField()   # From subscription
    total_used = DecimalField()        # Consumed
    rollover_balance = DecimalField()  # From previous period
    expires_at = DateTimeField()
    is_active = BooleanField()

    @property
    def available_balance(self):
        return max(0, self.total_allocated + self.rollover_balance - self.total_used)

    def consume(self, amount, description="", metadata=None):
        """Deduct from wallet, create transaction"""
        ...

    def rollover_unused(self):
        """Move unused balance to next period"""
        ...
```

---

## Frontend Implementation

### Directory Structure

```
src/
├── features/
│   ├── subscriptionModel/
│   │   └── billing/
│   │       └── billingApi.ts      # RTK Query API (958 lines)
│   └── plan/
│       └── planApi.ts             # Legacy plan API
├── components/
│   └── subscription-model/
│       └── plan/
│           ├── PlansManagement.tsx
│           ├── CreateEditPlanDrawer.tsx
│           ├── PlanSummary.tsx
│           ├── PlanDetailsModal.tsx
│           ├── PlanComponentsManagement.tsx
│           ├── AgentPricingManagement.tsx
│           ├── PlanComponentInclusionManagement.tsx
│           ├── PlanAgentInclusionManagement.tsx
│           └── AgentComponentPricingManagement.tsx
├── app/
│   └── dashboard/
│       └── subscription/
│           ├── plans/page.tsx
│           ├── components/page.tsx
│           ├── agent-pricing/page.tsx
│           ├── link-components/page.tsx
│           ├── link-agents/page.tsx
│           ├── plan-summary/page.tsx
│           └── agemt-component-pricing/page.tsx
└── store.ts                       # Redux store configuration
```

### Key TypeScript Interfaces (billingApi.ts)

```typescript
// Plan Interface
interface Plan {
  id: string;
  name: string;
  description: string | null;
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';
  base_price: string;
  billing_period: 'monthly' | 'quarterly' | 'yearly';
  billing_mode: 'prepaid' | 'postpaid';
  grace_period_days: number;
  cost_per_unit: string | null;
  promotion_code: string | null;
  discount_percentage: string | null;
  is_active: boolean;
  is_public: boolean;
  featured: boolean;
  included_components: PlanComponentInclusion[];
  included_agents: PlanAgentInclusion[];
  total_components_value: string;
  total_agents_value: string;
  total_plan_value: string;
}

// PlanComponent Interface
interface PlanComponent {
  id: string;
  name: string;
  component_type: 'compute_tokens' | 'storage_gb' | 'api_calls' |
                  'agent_instances' | 'active_agents' | 'custom';
  description: string | null;
  quantity: string | null;
  price: string | null;
  cost_per_unit: string | null;
  price_per_unit: string;
  unit_label: string;
  is_active: boolean;
  is_renewable: boolean;
}

// AgentPricing Interface
interface AgentPricing {
  id: string;
  agent_id: string;
  agent_name: string;
  name: string;
  price: string;
  unit: 'per_use' | 'per_hour' | 'per_day' | 'per_month' |
        'per_transaction' | 'per_request' | 'flat_rate';
  billing_method: 'prepaid' | 'postpaid' | 'pay_as_you_go' | 'subscription';
  estimated_tokens_per_use: number;
  estimated_storage_mb: string;
  is_active: boolean;
}

// PlanSummary Response (Comprehensive)
interface PlanSummaryResponse {
  plan: { ... };
  components: {
    items: PlanSummaryComponentItem[];
    count: number;
    total_value: number;
  };
  agents: {
    items: PlanSummaryAgentItem[];
    count: number;
    total_value: number;
  };
  pricing_summary: {
    base_price: number;
    effective_base_price: number;
    components_value: number;
    agents_value: number;
    total_plan_value: number;
    total_with_discounts: number;
    currency: string;
  };
  statistics: {
    active_subscriptions: number;
    total_subscriptions: number;
  };
}
```

### RTK Query Hooks

```typescript
// Plan Hooks
useGetPlansQuery()
useGetPlanQuery(id)
useCreatePlanMutation()
useUpdatePlanMutation()
useDeletePlanMutation()
useDuplicatePlanMutation()
useGetPlanSummaryQuery(planId)
useGetPlanStatsQuery()

// Component Hooks
useGetPlanComponentsQuery()
useCreatePlanComponentMutation()
useUpdatePlanComponentMutation()
useDeletePlanComponentMutation()

// Inclusion Hooks
useGetPlanComponentsInPlanQuery(planId)
useAddComponentToPlanMutation()
useRemoveComponentFromPlanMutation()
useGetPlanAgentsInPlanQuery(planId)
useAddAgentToPlanMutation()
useRemoveAgentFromPlanMutation()

// Agent Pricing Hooks
useGetAgentPricingQuery()
useCreateAgentPricingMutation()
useUpdateAgentPricingMutation()
useDeleteAgentPricingMutation()

// Agent Component Pricing Hooks
useGetAgentComponentsQuery(agentId)
useAddComponentToAgentMutation()
useUpdateAgentComponentMutation()
useGetAgentComponentSummaryQuery(agentId)
```

---

## Billing Flows

### 1. Prepaid Subscription Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PREPAID SUBSCRIPTION FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

User selects plan
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Create     │────▶│   Create     │────▶│   Payment    │
│ Subscription │     │   Invoice    │     │   Required   │
│  (Pending)   │     │  (Pending)   │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  ▼
                                          ┌──────────────┐
                                          │   Process    │
                                          │   Payment    │
                                          └──────┬───────┘
                                                  │
              ┌───────────────────────────────────┴───────────────────────────────────┐
              │                                                                        │
              ▼                                                                        ▼
     ┌──────────────┐                                                       ┌──────────────┐
     │   Payment    │                                                       │   Payment    │
     │   Success    │                                                       │   Failed     │
     └──────┬───────┘                                                       └──────────────┘
              │
              ▼
     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
     │   Invoice    │────▶│  Initialize  │────▶│ Subscription │
     │    Paid      │     │   Wallets    │     │   Active     │
     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                       │
                                                       ▼
                                              ┌──────────────┐
                                              │    User      │
                                              │ Consumes     │
                                              │ Resources    │
                                              └──────┬───────┘
                                                       │
                                                       ▼
                                              ┌──────────────┐
                                              │   Wallet     │
                                              │   Debit      │
                                              └──────────────┘
                                                       │
                       ┌───────────────────────────────┴───────────────────────────────┐
                       │                                                                │
              (Period End)                                                      (Normal Usage)
                       │                                                                │
                       ▼                                                                ▼
              ┌──────────────┐                                                 ┌──────────────┐
              │   Rollover   │                                                 │   Continue   │
              │   Unused     │                                                 │    Using     │
              │   Balance    │                                                 │              │
              └──────┬───────┘                                                 └──────────────┘
                       │
                       ▼
              ┌──────────────┐     ┌──────────────┐
              │   New Period │────▶│   Create     │ (Cycle repeats)
              │    Starts    │     │ New Invoice  │
              └──────────────┘     └──────────────┘
```

### 2. Postpaid Subscription Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              POSTPAID SUBSCRIPTION FLOW                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

User selects plan
       │
       ▼
┌──────────────┐                              ┌──────────────┐
│   Create     │─────────────────────────────▶│ Subscription │
│ Subscription │                              │    Active    │
│              │                              │  (No upfront │
└──────────────┘                              │   payment)   │
                                              └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │    User      │
                                              │   Consumes   │
                                              │  Resources   │
                                              └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │   Record     │
                                              │   Usage      │
                                              │ (UsageRecord)│
                                              └──────┬───────┘
                                                     │
                                              (Period Ends)
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │  Calculate   │
                                              │   Total      │
                                              │   Usage      │
                                              └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │   Create     │
                                              │   Invoice    │
                                              │(With Overage)│
                                              └──────┬───────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │   Due Date   │
                                              │  (Grace      │
                                              │   Period)    │
                                              └──────┬───────┘
                                                     │
              ┌──────────────────────────────────────┴──────────────────────────────────┐
              │                                                                         │
              ▼                                                                         ▼
     ┌──────────────┐                                                        ┌──────────────┐
     │   Payment    │                                                        │   Payment    │
     │   Received   │                                                        │   Overdue    │
     └──────┬───────┘                                                        └──────┬───────┘
              │                                                                         │
              ▼                                                                         │
     ┌──────────────┐                                                        ┌──────────────┐
     │    Next      │                                                        │   Suspend    │
     │   Period     │◀─────────────────(After grace period)──────────────────│   Service    │
     │   Starts     │                                                        └──────────────┘
     └──────────────┘
```

### 3. Invoice Processing Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              INVOICE PROCESSING FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   Invoice    │
                              │   Created    │
                              │   (Draft)    │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │   Invoice    │
                              │   Issued     │
                              │  (Pending)   │
                              └──────┬───────┘
                                     │
                                     ▼
                              ┌──────────────┐
                 ┌────────────│   Due Date   │────────────┐
                 │            │   Check      │            │
                 │            └──────────────┘            │
                 │                                        │
        (Before Due)                               (After Due)
                 │                                        │
                 ▼                                        ▼
        ┌──────────────┐                         ┌──────────────┐
        │   Payment    │                         │   Invoice    │
        │   Received   │                         │   Overdue    │
        └──────┬───────┘                         └──────┬───────┘
                 │                                        │
                 ▼                                        ▼
        ┌──────────────┐                         ┌──────────────┐
        │   Invoice    │                         │   Grace      │
        │    Paid      │                         │   Period     │
        └──────────────┘                         │   Check      │
                                                 └──────┬───────┘
                                                        │
                                    ┌───────────────────┴───────────────────┐
                                    │                                        │
                           (Within Grace)                              (Grace Expired)
                                    │                                        │
                                    ▼                                        ▼
                           ┌──────────────┐                         ┌──────────────┐
                           │   Payment    │                         │   Suspend    │
                           │   Received   │                         │ Subscription │
                           └──────┬───────┘                         └──────────────┘
                                    │
                                    ▼
                           ┌──────────────┐
                           │   Invoice    │
                           │    Paid      │
                           └──────────────┘
```

---

## API Endpoints

### Plan Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plans/` | List all plans |
| POST | `/plans/` | Create new plan |
| GET | `/plans/{id}/` | Get plan details |
| PATCH | `/plans/{id}/` | Update plan |
| DELETE | `/plans/{id}/` | Delete plan |
| POST | `/plans/{id}/duplicate/` | Duplicate plan |
| GET | `/plans/{id}/summary/` | Get comprehensive plan summary |
| GET | `/plans/stats/` | Get plan statistics |
| GET | `/plans/{id}/components/` | Get plan's components |
| POST | `/plans/{id}/components/` | Add component to plan |
| DELETE | `/plans/{id}/components/{component_id}/` | Remove component |
| GET | `/plans/{id}/agents/` | Get plan's agents |
| POST | `/plans/{id}/agents/` | Add agent to plan |
| DELETE | `/plans/{id}/agents/{agent_id}/` | Remove agent |

### Component Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/plan-components/` | List all components |
| POST | `/plan-components/` | Create component |
| GET | `/plan-components/{id}/` | Get component details |
| PATCH | `/plan-components/{id}/` | Update component |
| DELETE | `/plan-components/{id}/` | Delete component |

### Agent Pricing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent-pricing/` | List all agent pricing |
| POST | `/agent-pricing/` | Create agent pricing |
| GET | `/agent-pricing/{id}/` | Get pricing details |
| PATCH | `/agent-pricing/{id}/` | Update pricing |
| DELETE | `/agent-pricing/{id}/` | Delete pricing |
| GET | `/agent-pricing/by-agent/{agent_id}/` | Get pricing for agent |

### Agent Component Pricing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agent-templates/{id}/components/` | Get agent's components |
| POST | `/agent-templates/{id}/components/` | Add component to agent |
| PATCH | `/agent-templates/{id}/update_component/` | Update component |
| DELETE | `/agent-templates/{id}/remove_component/` | Remove component |
| GET | `/agent-templates/{id}/component_summary/` | Get consumption summary |

### Subscription/Billing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/subscriptions/` | List subscriptions |
| POST | `/subscriptions/` | Create subscription |
| GET | `/subscriptions/{id}/active/` | Get active subscription |
| POST | `/subscriptions/{id}/cancel/` | Cancel subscription |
| GET | `/plan-transactions/` | List transactions |
| GET | `/usage-records/` | List usage records |
| GET | `/wallets/` | List wallets |
| GET | `/wallets/summary/` | Get wallet summary |
| GET | `/invoices/` | List invoices |
| POST | `/invoices/{id}/process_payment/` | Process payment |

---

## Super Admin Configuration Guide

### Step 1: Create Plan Components

```
Dashboard → Subscription → Components Management

1. Click "Create Component"
2. Fill in:
   - Name: "Compute Tokens Pack"
   - Component Type: "Compute Tokens"
   - Quantity: 1000000 (1M tokens)
   - Price: $20
   - Cost Per Unit: 0.00002 (internal cost)
   - Price Per Unit: 0.00002 (client price)
   - Unit Label: "tokens"
   - Is Renewable: Yes (for rollover)
3. Save
4. Repeat for: Storage, API Calls, Agent Instances
```

### Step 2: Create Agent Pricing

```
Dashboard → Subscription → Agent Pricing

1. Click "Create Agent Pricing"
2. Select Agent Template
3. Fill in:
   - Name: "ChatBot Standard Pricing"
   - Price: $10
   - Unit: Per Month
   - Billing Method: Subscription
   - Estimated Tokens Per Use: 5000
   - Estimated Storage: 50 MB
4. Save
```

### Step 3: Configure Agent Component Consumption

```
Dashboard → Subscription → Agent Component Pricing

1. Select Agent
2. Click "Add Component"
3. Set:
   - Component: Compute Tokens
   - Consumption Rate: 5000 (tokens per execution)
   - Override Price: (optional, leave blank for component default)
4. Repeat for other components the agent uses
```

### Step 4: Create Subscription Plans

```
Dashboard → Subscription → Plans Management

1. Click "Create Plan"
2. Fill in:
   - Name: "Starter Plan"
   - Plan Type: Starter
   - Base Price: $29/month
   - Billing Period: Monthly
   - Billing Mode: Prepaid
   - Grace Period: 7 days
   - Is Active: Yes
   - Is Public: Yes
3. Save
```

### Step 5: Link Components to Plans

```
Dashboard → Subscription → Link Components

1. Select Plan
2. Click "Add Component"
3. Select Component
4. Set Quantity Multiplier (e.g., 2x = 2M tokens)
5. Set Featured: Yes/No
6. Set Display Order
7. Save
```

### Step 6: Link Agents to Plans

```
Dashboard → Subscription → Link Agents

1. Select Plan
2. Click "Add Agent"
3. Select Agent Pricing
4. Set Included Instances
5. Set Featured: Yes/No
6. Save
```

### Step 7: Review Plan Summary

```
Dashboard → Subscription → Plan Summary

1. Select Plan from dropdown
2. Review:
   - Plan Details
   - Pricing Breakdown
   - Components included
   - Agents included
   - Cost estimates
   - Statistics
```

---

## Appendix

### A. Configuration Checklist

- [ ] Create base plan components (tokens, storage, API calls)
- [ ] Configure agent pricing for all template agents
- [ ] Set up agent component consumption rates
- [ ] Create subscription plans (Free, Starter, Professional, Enterprise)
- [ ] Link components to each plan with appropriate multipliers
- [ ] Link agents to each plan with instance limits
- [ ] Test plan summary for pricing accuracy
- [ ] Verify promotion codes work correctly
- [ ] Test prepaid flow end-to-end
- [ ] Test postpaid flow end-to-end
- [ ] Configure grace periods appropriately

### B. Common Component Types

| Type | Unit Label | Example Quantity | Typical Price |
|------|------------|-----------------|---------------|
| compute_tokens | tokens | 1,000,000 | $20 |
| storage_gb | GB | 10 | $5 |
| api_calls | calls | 10,000 | $10 |
| agent_instances | instances | 5 | $25 |
| active_agents | agents | 3 | $15 |

### C. Billing Period Calculations

| Period | Duration | Next Period Start |
|--------|----------|-------------------|
| Monthly | 1 month | current_period_end |
| Quarterly | 3 months | current_period_end |
| Yearly | 12 months | current_period_end |

### D. Promotion Code Structure

```json
{
  "promotion_code": "SUMMER2024",
  "discount_percentage": 20,
  "promotion_valid_from": "2024-06-01T00:00:00Z",
  "promotion_valid_until": "2024-08-31T23:59:59Z"
}
```

### E. Plan Snapshot Example

```json
{
  "plan_id": "uuid-here",
  "plan_name": "Starter Plan",
  "plan_type": "starter",
  "base_price": "29.00",
  "billing_period": "monthly",
  "billing_mode": "prepaid",
  "snapshot_created_at": "2024-01-15T10:30:00Z"
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-15 | Initial documentation |

---

**Document Generated By**: Claude Code (Anthropic)
**Last Updated**: 2024
