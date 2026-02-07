import { ReactNode } from "react";
import { useLandingABTest } from "@/hooks/useLandingABTest";

interface ABTestVariantProps {
  element: string;
  children: (content: Record<string, any> | null, variant: 'A' | 'B' | null) => ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that renders content based on A/B test variant assignment
 * 
 * Usage:
 * <ABTestVariant element="hero_cta">
 *   {(content, variant) => (
 *     <Button className={content?.style === 'gradient' ? 'bg-gradient-to-r' : ''}>
 *       {content?.text || 'Default Text'}
 *     </Button>
 *   )}
 * </ABTestVariant>
 */
export const ABTestVariant = ({ element, children, fallback }: ABTestVariantProps) => {
  const { getContentForElement, getVariantForElement, isLoading } = useLandingABTest(element);

  if (isLoading) {
    return <>{fallback}</>;
  }

  const content = getContentForElement(element);
  const variant = getVariantForElement(element);

  return <>{children(content, variant)}</>;
};

interface ABTestWrapperProps {
  element: string;
  variantA: ReactNode;
  variantB: ReactNode;
  fallback?: ReactNode;
}

/**
 * Simpler wrapper that renders one of two variants directly
 * 
 * Usage:
 * <ABTestWrapper
 *   element="hero_headline"
 *   variantA={<h1>Original Headline</h1>}
 *   variantB={<h1>New Headline</h1>}
 * />
 */
export const ABTestWrapper = ({ element, variantA, variantB, fallback }: ABTestWrapperProps) => {
  const { getVariantForElement, isLoading } = useLandingABTest(element);

  if (isLoading) {
    return <>{fallback || variantA}</>;
  }

  const variant = getVariantForElement(element);

  if (variant === 'B') {
    return <>{variantB}</>;
  }

  return <>{variantA}</>;
};

interface ABTestTrackerProps {
  element: string;
  conversionType: string;
  children: (trackConversion: () => void) => ReactNode;
}

/**
 * Component that provides conversion tracking functionality
 * 
 * Usage:
 * <ABTestTracker element="hero_cta" conversionType="signup">
 *   {(track) => (
 *     <Button onClick={() => { track(); handleSignup(); }}>
 *       Sign Up
 *     </Button>
 *   )}
 * </ABTestTracker>
 */
export const ABTestTracker = ({ element, conversionType, children }: ABTestTrackerProps) => {
  const { getTestByElement, trackConversion } = useLandingABTest(element);

  const handleTrack = () => {
    const test = getTestByElement(element);
    if (test) {
      trackConversion({ testId: test.id, conversionType });
    }
  };

  return <>{children(handleTrack)}</>;
};
