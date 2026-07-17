'use client';

import React, { useState } from 'react';
import { useGetPlansQuery, useGetPlanQuery, Plan, PlanAgentInclusion } from '@/features/subscriptionModel/billing/billingApi';

// Plan type badge styles (consistent with PlansManagement)
const PLAN_TYPE_STYLES: Record<string, { badge: string; gradient: string }> = {
  free: { badge: 'bg-emerald-100 text-emerald-800', gradient: 'from-emerald-500 to-teal-500' },
  starter: { badge: 'bg-blue-100 text-blue-800', gradient: 'from-blue-500 to-sky-500' },
  professional: { badge: 'bg-purple-100 text-purple-800', gradient: 'from-purple-500 to-violet-500' },
  enterprise: { badge: 'bg-indigo-100 text-indigo-800', gradient: 'from-indigo-500 to-blue-600' },
  custom: { badge: 'bg-pink-100 text-pink-800', gradient: 'from-pink-500 to-rose-500' },
};

interface PricingCardProps {
  plan: Plan;
  isPopular?: boolean;
}

// Loading skeleton for cards
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="h-1.5 bg-gray-200" />
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-6 bg-gray-200 rounded-full w-20" />
        <div className="h-5 bg-gray-100 rounded-full w-16" />
      </div>
      <div className="h-10 bg-gray-200 rounded w-1/2" />
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="space-y-2 pt-4">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-5/6" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
      </div>
      <div className="h-12 bg-gray-200 rounded-xl mt-6" />
    </div>
  </div>
);

// Wrapper component that fetches full plan details
const PricingCardWrapper: React.FC<PricingCardProps> = ({ plan, isPopular }) => {
  const { data: fullPlan, isLoading } = useGetPlanQuery(plan.id);

  if (isLoading) {
    return <CardSkeleton />;
  }

  // Merge the full plan data with list plan data
  const mergedPlan = fullPlan || plan;

  return (
    <PricingCard
      plan={mergedPlan}
      isPopular={isPopular}
    />
  );
};

const PricingCard: React.FC<PricingCardProps> = ({ plan, isPopular }) => {
  const style = PLAN_TYPE_STYLES[plan.plan_type] || PLAN_TYPE_STYLES.custom;

  // Get plan-level features from feature_list (from Create Plan modal)
  const planFeatures = plan.feature_list
    ? plan.feature_list.split('\n').filter(f => f.trim())
    : [];

  // Get per-agent features from included_agents (from Assign Agent modal)
  const agentFeatures: string[] = [];
  if (plan.included_agents && plan.included_agents.length > 0) {
    plan.included_agents.forEach((inclusion: PlanAgentInclusion) => {
      // Only add individual agent features (NOT agent names)
      if (inclusion.features && inclusion.features.length > 0) {
        inclusion.features.forEach(f => {
          if (f.feature_text && f.is_active) {
            agentFeatures.push(f.feature_text);
          }
        });
      }
    });
  }

  // Final features list: only plan features + agent features (NO components)
  const allFeatures = [...planFeatures, ...agentFeatures];
  const hasAnyFeatures = allFeatures.length > 0;

  const originalPrice = plan.discount_percentage && parseFloat(plan.discount_percentage) > 0
    ? (parseFloat(plan.base_price) / (1 - parseFloat(plan.discount_percentage) / 100)).toFixed(2)
    : null;

  const savingsPercent = plan.discount_percentage ? parseFloat(plan.discount_percentage).toFixed(0) : null;

  return (
    <div className={`relative bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full transition-all duration-200 hover:shadow-lg ${
      isPopular ? 'border-purple-300 ring-2 ring-purple-500/20 scale-[1.02]' : 'border-gray-100 hover:border-indigo-200/70'
    }`}>
      {/* Accent strip */}
      <div className={`h-1.5 bg-gradient-to-r ${style.gradient}`} />

      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-full shadow-lg">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Plan Type Badge & Name */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.badge}`}>
              {plan.plan_type.charAt(0).toUpperCase() + plan.plan_type.slice(1)}
            </span>
            {plan.has_trial && plan.trial_period_days > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium border border-violet-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {plan.trial_period_days}-day trial
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-gray-900">
              ${parseFloat(plan.base_price).toFixed(0)}
            </span>
            <span className="text-gray-500 text-sm font-medium">/{plan.billing_period}</span>
          </div>
          {originalPrice && savingsPercent && parseFloat(savingsPercent) > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-gray-400 line-through text-sm">${originalPrice}</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                Save {savingsPercent}%
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {plan.description ? (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description}</p>
        ) : (
          <p className="text-sm text-gray-400 italic mb-4">No description</p>
        )}

        {/* Divider */}
        <div className="border-t border-gray-100 my-4" />

        {/* Features */}
        <div className="flex-1 space-y-3 mb-6">
          {hasAnyFeatures ? (
            allFeatures.slice(0, 8).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${style.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm">{feature}</span>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="text-center">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-400 text-sm">No features configured</p>
              </div>
            </div>
          )}
          {allFeatures.length > 8 && (
            <div className="text-sm text-indigo-600 font-medium">
              +{allFeatures.length - 8} more features
            </div>
          )}
        </div>

        {/* CTA Button */}
        <button className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
          plan.plan_type === 'enterprise'
            ? 'bg-gray-900 hover:bg-gray-800 text-white'
            : `bg-gradient-to-r ${style.gradient} hover:opacity-90 text-white shadow-sm`
        }`}>
          {plan.plan_type === 'enterprise' ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contact Sales
            </>
          ) : plan.plan_type === 'free' ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Started Free
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get {plan.name}
            </>
          )}
        </button>

        {/* Status Badges */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {plan.is_active ? 'Active' : 'Inactive'}
          </span>
          {plan.is_public && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Public
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function PlanPreviewPage() {
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const { data: plansResponse, isLoading, error } = useGetPlansQuery({ is_active: showOnlyActive || undefined });

  const plans = plansResponse?.results || [];
  const filteredPlans = showOnlyPublic ? plans.filter(p => p.is_public) : plans;

  // Sort plans by display_order, then by plan_type priority
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    const typeOrder = ['free', 'starter', 'professional', 'enterprise', 'custom'];
    const aOrder = a.display_order || typeOrder.indexOf(a.plan_type) * 10;
    const bOrder = b.display_order || typeOrder.indexOf(b.plan_type) * 10;
    return aOrder - bOrder;
  });

  // Find the "popular" plan (featured or professional)
  const popularPlanId = sortedPlans.find(p => p.featured)?.id ||
                        sortedPlans.find(p => p.plan_type === 'professional')?.id;

  return (
    <div className="w-full min-h-screen p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                Plan Preview
              </h1>
              <p className="text-gray-600 mt-2">
                Preview how plans appear to customers ({sortedPlans.length} plans)
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              {/* Show Only Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Active only</span>
                <button
                  onClick={() => setShowOnlyActive(!showOnlyActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showOnlyActive ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    showOnlyActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </label>

              {/* Show Only Public Toggle */}
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                <span className="text-sm font-medium text-gray-700">Public only</span>
                <button
                  onClick={() => setShowOnlyPublic(!showOnlyPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showOnlyPublic ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    showOnlyPublic ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </label>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900">Customer Pricing Preview</h3>
              <p className="text-sm text-indigo-700 mt-1">
                This is how your plans will appear on the customer-facing pricing page.
                Features are pulled from plan configurations, linked agents, and components.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Failed to load plans</h3>
            <p className="mt-2 text-gray-600">Please try again later</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sortedPlans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No plans found</h3>
            <p className="mt-2 text-gray-600">Create some plans to see them here</p>
          </div>
        )}

        {/* Plans Grid */}
        {!isLoading && !error && sortedPlans.length > 0 && (
          <>
            {/* Pricing Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Choose Your Plan
              </h2>
              <p className="text-gray-600 text-lg">
                Select the perfect plan for your business needs
              </p>
            </div>

            <div className={`grid gap-6 ${
              sortedPlans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              sortedPlans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' :
              sortedPlans.length === 3 ? 'grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {sortedPlans.map((plan) => (
                <PricingCardWrapper
                  key={plan.id}
                  plan={plan}
                  isPopular={plan.id === popularPlanId}
                />
              ))}
            </div>

            {/* Footer Note */}
            <div className="text-center mt-10">
              <p className="text-sm text-gray-500">
                All paid plans include a money-back guarantee. Cancel anytime.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
