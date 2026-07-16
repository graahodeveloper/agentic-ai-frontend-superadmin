'use client';

import React, { useState } from 'react';
import { useGetPlansQuery, Plan } from '@/features/subscriptionModel/billing/billingApi';

// Demo feature data for plans that don't have features yet
const DEMO_FEATURES: Record<string, string[]> = {
  free: [
    'Up to 100 API Calls',
    '1 Agent Access',
    '500 MB Storage',
    'Email Support',
    'Basic Analytics',
  ],
  starter: [
    'Up to 1,000 API Calls',
    '3 Agent Access',
    '2 GB Storage',
    'Priority Email Support',
    'Advanced Analytics',
    'Custom Branding',
  ],
  professional: [
    'Up to 10,000 API Calls',
    '10 Agent Access',
    '10 GB Storage',
    'Live Chat Support (Within 48 Hours)',
    'Full Analytics Suite',
    'Custom Branding',
    'API Access',
    'Team Collaboration',
  ],
  enterprise: [
    'Unlimited API Calls',
    'Unlimited Agent Access',
    '100 GB Storage',
    'Dedicated Support (Within 24 Hours)',
    'Full Analytics Suite',
    'White-label Solution',
    'API Access',
    'Team Collaboration',
    'SLA Guarantee',
    'Custom Integrations',
  ],
  custom: [
    'Customizable API Limits',
    'Flexible Agent Access',
    'Scalable Storage',
    'Dedicated Account Manager',
    'Custom Features',
  ],
};

const PLAN_COLORS: Record<string, { bg: string; accent: string; button: string }> = {
  free: { bg: 'from-slate-800 to-slate-900', accent: 'text-slate-400', button: 'bg-slate-600 hover:bg-slate-500' },
  starter: { bg: 'from-slate-800 to-slate-900', accent: 'text-blue-400', button: 'bg-blue-600 hover:bg-blue-500' },
  professional: { bg: 'from-slate-800 to-slate-900', accent: 'text-purple-400', button: 'bg-purple-600 hover:bg-purple-500' },
  enterprise: { bg: 'from-slate-800 to-slate-900', accent: 'text-amber-400', button: 'bg-amber-600 hover:bg-amber-500' },
  custom: { bg: 'from-slate-800 to-slate-900', accent: 'text-emerald-400', button: 'bg-emerald-600 hover:bg-emerald-500' },
};

const PLAN_SUBTITLES: Record<string, string> = {
  free: 'For individuals getting started',
  starter: 'For small teams',
  professional: 'For growing businesses',
  enterprise: 'For large organizations',
  custom: 'Tailored to your needs',
};

interface PricingCardProps {
  plan: Plan;
  isPopular?: boolean;
  isDarkMode: boolean;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, isPopular, isDarkMode }) => {
  const colors = PLAN_COLORS[plan.plan_type] || PLAN_COLORS.custom;
  const subtitle = PLAN_SUBTITLES[plan.plan_type] || 'Custom plan';

  // Parse features from feature_list or use demo features
  const features = plan.feature_list
    ? plan.feature_list.split('\n').filter(f => f.trim())
    : DEMO_FEATURES[plan.plan_type] || DEMO_FEATURES.custom;

  const originalPrice = plan.discount_percentage
    ? (parseFloat(plan.base_price) / (1 - parseFloat(plan.discount_percentage) / 100)).toFixed(2)
    : null;

  const savingsPercent = plan.discount_percentage ? parseFloat(plan.discount_percentage).toFixed(0) : null;

  if (isDarkMode) {
    return (
      <div className={`relative rounded-2xl bg-gradient-to-b ${colors.bg} p-6 border border-slate-700 flex flex-col h-full ${isPopular ? 'ring-2 ring-purple-500 scale-105' : ''}`}>
        {/* Popular Badge */}
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
              Most Popular
            </span>
          </div>
        )}

        {/* Plan Name */}
        <h3 className={`text-sm font-bold uppercase tracking-wider ${colors.accent} mb-2`}>
          {plan.plan_type}
        </h3>

        {/* Price */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">${parseFloat(plan.base_price).toFixed(0)}</span>
            <span className="text-slate-400 text-sm">/{plan.billing_period}</span>
          </div>
          {originalPrice && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500 line-through text-sm">${originalPrice}</span>
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                {savingsPercent}% save
              </span>
            </div>
          )}
        </div>

        {/* Subtitle */}
        <p className="text-slate-400 text-sm mb-4">{subtitle}</p>

        {/* Support Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors.accent} bg-white/5`}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Support within {plan.grace_period_days * 24}h
          </span>
        </div>

        {/* Features */}
        <div className="flex-1 space-y-3 mb-6">
          {features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full ${colors.accent} bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-slate-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <button className={`w-full py-3 px-4 rounded-xl ${colors.button} text-white font-semibold transition-all flex items-center justify-center gap-2`}>
          {plan.plan_type === 'enterprise' ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Talk to Sales
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
          {plan.is_active && (
            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">Active</span>
          )}
          {plan.is_public && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">Public</span>
          )}
          {plan.featured && (
            <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">Featured</span>
          )}
        </div>
      </div>
    );
  }

  // Light mode card
  return (
    <div className={`relative rounded-2xl bg-white p-6 border border-gray-200 shadow-lg flex flex-col h-full ${isPopular ? 'ring-2 ring-indigo-500 scale-105' : ''}`}>
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 mb-2">
        {plan.plan_type}
      </h3>

      {/* Price */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-gray-900">${parseFloat(plan.base_price).toFixed(0)}</span>
          <span className="text-gray-500 text-sm">/{plan.billing_period}</span>
        </div>
        {originalPrice && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 line-through text-sm">${originalPrice}</span>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
              {savingsPercent}% save
            </span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-gray-500 text-sm mb-4">{subtitle}</p>

      {/* Support Badge */}
      <div className="mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-indigo-600 bg-indigo-50">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Support within {plan.grace_period_days * 24}h
        </span>
      </div>

      {/* Features */}
      <div className="flex-1 space-y-3 mb-6">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-gray-600 text-sm">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <button className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all flex items-center justify-center gap-2">
        {plan.plan_type === 'enterprise' ? (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Talk to Sales
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
        {plan.is_active && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Active</span>
        )}
        {plan.is_public && (
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Public</span>
        )}
        {plan.featured && (
          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Featured</span>
        )}
      </div>
    </div>
  );
};

export default function PlanPreviewPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showOnlyPublic, setShowOnlyPublic] = useState(false);
  const { data: plansResponse, isLoading, error } = useGetPlansQuery({ is_active: true });

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
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-sm ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Plan Preview
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Preview how plans appear to end users on the pricing page
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Show Only Public Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Public only</span>
                <button
                  onClick={() => setShowOnlyPublic(!showOnlyPublic)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${showOnlyPublic ? 'bg-indigo-600' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${showOnlyPublic ? 'translate-x-5' : ''}`} />
                </button>
              </label>

              {/* Theme Toggle */}
              <div className={`flex items-center gap-1 p-1 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setIsDarkMode(false)}
                  className={`p-2 rounded-md transition-all ${!isDarkMode ? 'bg-white shadow text-gray-900' : 'text-slate-400 hover:text-white'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsDarkMode(true)}
                  className={`p-2 rounded-md transition-all ${isDarkMode ? 'bg-slate-700 shadow text-white' : 'text-gray-400 hover:text-gray-900'}`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className={`${isDarkMode ? 'bg-indigo-900/30 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className={`text-sm ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              This is a preview of how your plans will appear on the customer-facing pricing page.
              Plans without custom features will show demo features.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Pricing Header */}
        <div className="text-center mb-12">
          <h2 className={`text-4xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Choose Your Plan
          </h2>
          <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Select the perfect plan for your business needs
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className={`text-center py-20 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            <p>Failed to load plans. Please try again.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sortedPlans.length === 0 && (
          <div className={`text-center py-20 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm6 6H7v2h6v-2z" clipRule="evenodd" />
            </svg>
            <p className="text-lg font-medium">No plans found</p>
            <p className="text-sm mt-1">Create some plans to see them here</p>
          </div>
        )}

        {/* Plans Grid */}
        {!isLoading && !error && sortedPlans.length > 0 && (
          <div className={`grid gap-6 ${
            sortedPlans.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
            sortedPlans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' :
            sortedPlans.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          }`}>
            {sortedPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isPopular={plan.id === popularPlanId}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        )}

        {/* Footer Note */}
        <div className={`text-center mt-12 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
          <p className="text-sm">
            All plans include 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
}
