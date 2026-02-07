import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const sectionVariants = cva(
  "w-full",
  {
    variants: {
      variant: {
        default: "py-16 md:py-20",
        compact: "py-8 md:py-12",
        hero: "py-20 md:py-32",
        gradient: "py-16 md:py-20 bg-gradient-to-b from-background to-secondary/20",
        "gradient-accent": "py-16 md:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5",
        muted: "py-16 md:py-20 bg-muted/30",
      },
      container: {
        none: "",
        default: "container mx-auto px-4 md:px-6",
        narrow: "container mx-auto px-4 md:px-6 max-w-4xl",
        wide: "container mx-auto px-4 md:px-6 max-w-7xl",
      },
    },
    defaultVariants: {
      variant: "default",
      container: "none",
    },
  }
);

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants> {
  as?: "section" | "div" | "article" | "aside";
}

export function Section({
  className,
  variant,
  container,
  as: Component = "section",
  children,
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn(sectionVariants({ variant, container }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}
