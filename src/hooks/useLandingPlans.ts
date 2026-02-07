// This hook is deprecated - use usePricingPlans instead
// Keeping for backward compatibility

import { usePricingPlans } from "./usePricingPlans";

export const useLandingPlans = () => {
  const { plans, isLoading } = usePricingPlans();
  
  return {
    plans,
    isLoading
  };
};

