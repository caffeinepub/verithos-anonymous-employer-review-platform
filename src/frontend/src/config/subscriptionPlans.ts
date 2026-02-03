// Centralized subscription plan configuration
// This serves as the single source of truth for all subscription plan details

export interface SubscriptionPlanConfig {
  id: string;
  name: string;
  priceEur: number;
  description?: string;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlanConfig> = {
  free: {
    id: 'free',
    name: 'Безплатен',
    priceEur: 0,
    description: 'Базов достъп до платформата'
  },
  official_profile_monthly: {
    id: 'official_profile_monthly',
    name: 'Официален профил',
    priceEur: 50,
    description: 'Пълен достъп до всички функции за официални профили'
  }
};

// Helper function to get plan by ID
export function getSubscriptionPlan(planId: string): SubscriptionPlanConfig {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free;
}

// Helper function to format price
export function formatPrice(priceEur: number): string {
  return `${priceEur} € / месец`;
}
