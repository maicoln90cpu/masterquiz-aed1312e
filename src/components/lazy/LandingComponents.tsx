// Lazy loaded landing page components
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy imports
export const LazyFeatureShowcase = lazy(() => 
  import("@/components/landing/FeatureShowcase").then(mod => ({ default: mod.FeatureShowcase }))
);

export const LazyPlatformGallery = lazy(() => 
  import("@/components/landing/PlatformGallery").then(mod => ({ default: mod.PlatformGallery }))
);

export const LazyFAQAccordion = lazy(() => 
  import("@/components/landing/FAQAccordion").then(mod => ({ default: mod.FAQAccordion }))
);

export const LazyFlowDiagram = lazy(() => 
  import("@/components/landing/FlowDiagram").then(mod => ({ default: mod.FlowDiagram }))
);

export const LazyFinalCTA = lazy(() => 
  import("@/components/landing/FinalCTA").then(mod => ({ default: mod.FinalCTA }))
);

// Loading skeletons
export const FeatureShowcaseSkeleton = () => (
  <div className="space-y-20">
    {[1, 2, 3].map((i) => (
      <div key={i} className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="aspect-video rounded-xl" />
      </div>
    ))}
  </div>
);

export const FAQSkeleton = () => (
  <div className="space-y-4 max-w-3xl mx-auto">
    {[1, 2, 3, 4, 5].map((i) => (
      <Skeleton key={i} className="h-16 w-full rounded-lg" />
    ))}
  </div>
);

// Wrapper components with Suspense
interface FeatureShowcaseWrapperProps {
  features: any[];
}

export const FeatureShowcaseWrapper = ({ features }: FeatureShowcaseWrapperProps) => (
  <Suspense fallback={<FeatureShowcaseSkeleton />}>
    <LazyFeatureShowcase features={features} />
  </Suspense>
);

export const PlatformGalleryWrapper = () => (
  <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
    <LazyPlatformGallery />
  </Suspense>
);

export const FAQAccordionWrapper = () => (
  <Suspense fallback={<FAQSkeleton />}>
    <LazyFAQAccordion />
  </Suspense>
);

export const FlowDiagramWrapper = () => (
  <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
    <LazyFlowDiagram />
  </Suspense>
);

export const FinalCTAWrapper = () => (
  <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
    <LazyFinalCTA />
  </Suspense>
);
