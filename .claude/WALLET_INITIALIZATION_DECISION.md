# Wallet Initialization Decision - Session Notes (UPDATED)

## Date: July 8, 2026

## Problem Statement

Plan e component link kora thake (PlanComponentInclusion) + Agent e same component link kora thake (AgentComponentPricing) - subscription er shomoy wallet kivabe initialize hobe?

---

## KEY CHANGE: AgentComponentPricing Structure

**OLD Understanding (WRONG):**
- AgentComponentPricing e consumption_rate thake (per execution koto use hoy)

**NEW Understanding (CORRECT):**
- AgentComponentPricing e **total_quantity** thake (Plan Component er motoi)
- consumption_rate NAI, direct quantity ache
- Eta basically Agent-specific component allocation

---

## Current System

- `PlanComponentInclusion` theke wallet initialize hoy
- `AgentComponentPricing` er quantity, override_price, is_unlimited IGNORE hocche

---

## 5 Ta Edge Cases & Solutions

### Case 1: Same Component - Both Plan & Agent e ache
```
PlanComponentInclusion:  compute_tokens = 1,000,000
AgentComponentPricing:   compute_tokens = 500,000 (override_price = $0.0005)

Solution: SUM BOTH
- Wallet quantity: 1,000,000 + 500,000 = 1,500,000
- Wallet price: $0.0005 (Agent override)
```

### Case 2: Same Component - Agent e Unlimited
```
PlanComponentInclusion:  compute_tokens = 1,000,000
AgentComponentPricing:   compute_tokens (is_unlimited = true)

Solution: UNLIMITED WINS
- Wallet: is_unlimited = true
- Quantity ignored
```

### Case 3: Only Agent e ache, Plan e NAI
```
PlanComponentInclusion:  ❌ NAI
AgentComponentPricing:   ✅ compute_tokens = 500,000

Solution: Agent theke wallet create
- Wallet: 500,000 tokens allocated
```

### Case 4: Only Plan e ache, Agent e NAI
```
PlanComponentInclusion:  ✅ storage_gb = 10 GB
AgentComponentPricing:   ❌ NAI

Solution: Plan theke wallet create (normal)
- Wallet: 10 GB storage allocated
```

### Case 5: Mixed Components
```
Plan: compute_tokens=1M, storage_gb=10
Agent: compute_tokens=200K, embedding_tokens=100K, api_calls=UNLIMITED

Solution: MERGE ALL
- compute_tokens: 1M + 200K = 1.2M (SUM)
- storage_gb: 10 GB (Plan only)
- embedding_tokens: 100K (Agent only)
- api_calls: UNLIMITED (Agent unlimited)
```

---

## Decision Matrix (FINAL)

| Plan Component | Agent Component | Wallet Result |
|----------------|-----------------|---------------|
| ✅ 1M tokens | ✅ 500K tokens | **1.5M tokens (SUM)** |
| ✅ 1M tokens | ✅ 500K + override $0.0005 | **1.5M @ $0.0005** |
| ✅ 1M tokens | ✅ unlimited | **♾️ UNLIMITED** |
| ✅ 1M tokens | ❌ Nai | **1M tokens** |
| ❌ Nai | ✅ 500K tokens | **500K tokens** |
| ❌ Nai | ✅ unlimited | **♾️ UNLIMITED** |
| ❌ Nai | ❌ Nai | **No wallet** |

---

## Priority Order (FINAL)

```
1. 🥇 is_unlimited = true (from Agent) → UNLIMITED, ignore quantities
2. 🥈 Both Plan + Agent have quantity → SUM quantities, use Agent price if override
3. 🥉 Only Plan has quantity → Use Plan quantity and price
4. 🏅 Only Agent has quantity → Use Agent quantity and price
```

---

## Required Changes

### 1. Backend Model: AgentComponentPricing
File: `apps/agents/models/billing.py`
```python
# REMOVE: consumption_rate field
# ADD: total_quantity field (if not exists, rename consumption_rate)
total_quantity = DecimalField(max_digits=20, decimal_places=2, default=0)
```

### 2. Backend Model: ResourceWallet
File: `apps/agents/models/wallet.py`
```python
# ADD new fields:
is_unlimited = BooleanField(default=False)
effective_price_per_unit = DecimalField(max_digits=10, decimal_places=6, null=True)
source = CharField(max_length=50, default='plan')  # 'plan', 'agent', 'plan+agent'
```

### 3. Backend Service: Wallet Initialization
File: `apps/agents/services/stripe_service.py`
Method: `_allocate_subscription_resources()`
- Update to consider AgentComponentPricing
- Implement SUM logic for same components
- Handle is_unlimited flag

### 4. Backend Service: Wallet Service
File: `apps/agents/services/wallet_service.py`
- Update initialize_wallet() to accept new fields

### 5. Super Admin Frontend: Validation
File: `src/components/subscription-model/plan/AgentComponentPricingManagement.tsx`
- Show warning if component in both Plan and Agent
- Show info about unlimited flag effect

### 6. User Frontend: Plan Details
File: `graaho-ai-agent-frontend/src/app/dashboard/upgrade/page.tsx`
- Show merged component breakdown
- Display source (Plan/Agent/Both)
- Show unlimited badge

---

## Wallet Initialization Logic

```python
def initialize_wallets_from_subscription(subscription):
    plan = subscription.plan
    user = subscription.user
    wallet_data = {}

    # Step 1: Collect Plan Components
    for inclusion in plan.included_components.all():
        comp_type = inclusion.component.component_type
        wallet_data[comp_type] = {
            'quantity': inclusion.total_quantity,
            'price': inclusion.component.price_per_unit,
            'is_unlimited': False,
            'sources': ['plan']
        }

    # Step 2: Process Agent Components
    for agent_inclusion in plan.included_agents.all():
        agent = agent_inclusion.agent

        for agent_comp in agent.component_pricing.filter(is_active=True):
            comp_type = agent_comp.component.component_type

            if agent_comp.is_unlimited:
                # UNLIMITED WINS
                wallet_data[comp_type] = {
                    'quantity': None,
                    'price': Decimal('0'),
                    'is_unlimited': True,
                    'sources': ['agent_unlimited']
                }
            elif comp_type in wallet_data and not wallet_data[comp_type]['is_unlimited']:
                # SUM quantities
                wallet_data[comp_type]['quantity'] += agent_comp.total_quantity
                wallet_data[comp_type]['sources'].append('agent')
                if agent_comp.override_price:
                    wallet_data[comp_type]['price'] = agent_comp.override_price
            else:
                # New component from Agent
                wallet_data[comp_type] = {
                    'quantity': agent_comp.total_quantity,
                    'price': agent_comp.override_price or agent_comp.component.price_per_unit,
                    'is_unlimited': False,
                    'sources': ['agent']
                }

    # Step 3: Create/Update Wallets
    for comp_type, data in wallet_data.items():
        ResourceWallet.objects.update_or_create(
            user=user,
            subscription=subscription,
            resource_type=comp_type,
            defaults={
                'total_allocated': data['quantity'] or Decimal('0'),
                'is_unlimited': data['is_unlimited'],
                'effective_price_per_unit': data['price'],
                'source': '+'.join(data['sources']),
                'is_active': True
            }
        )
```

---

## Frontend Display Format

```
┌─────────────────────────────────────────────────────────────────┐
│  STARTER PLAN - $29/month                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📦 TOTAL RESOURCES                                             │
│  ┌────────────────────┬────────────┬────────────────────────┐   │
│  │ Resource           │ Amount     │ Source                 │   │
│  ├────────────────────┼────────────┼────────────────────────┤   │
│  │ Compute Tokens     │ 1,500,000  │ Plan: 1M + Agent: 500K │   │
│  │ Storage            │ 10 GB      │ Plan                   │   │
│  │ Embedding Tokens   │ 100,000    │ ChatBot Agent          │   │
│  │ API Calls          │ ♾️ Unlimited│ ChatBot Agent          │   │
│  └────────────────────┴────────────┴────────────────────────┘   │
│                                                                  │
│  🤖 INCLUDED AGENTS                                             │
│  ChatBot Agent (2 instances)                                    │
│    └─ Adds: +500K Tokens, +100K Embeddings, Unlimited API      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Modify (In Order)

### Backend (graaho-ai-agent-backend)
1. `apps/agents/models/billing.py` - AgentComponentPricing field rename
2. `apps/agents/models/wallet.py` - Add is_unlimited, effective_price, source
3. `apps/agents/migrations/` - Create migration
4. `apps/agents/services/stripe_service.py` - Update _allocate_subscription_resources
5. `apps/agents/services/wallet_service.py` - Update initialize_wallet
6. `apps/agents/serializers.py` - Update serializers
7. `apps/agents/views/subscription_views.py` - Update sync_wallets

### Super Admin Frontend (graaho-ai-agent-frontend-super-admin)
1. `src/features/subscriptionModel/billing/billingApi.ts` - Update types
2. `src/components/subscription-model/plan/AgentComponentPricingManagement.tsx` - UI update

### User Frontend (graaho-ai-agent-frontend)
1. `src/features/subscription/subscriptionApi.ts` - Update types
2. `src/app/dashboard/upgrade/page.tsx` - Plan details breakdown

---

## Notes

- AgentComponentPricing has total_quantity (NOT consumption_rate)
- SUM quantities when same component in both Plan and Agent
- is_unlimited always wins over quantities
- Agent override_price takes precedence over Plan price
