import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pageContainerVariants = cva(
  "mx-auto w-full px-4 md:px-6",
  {
    variants: {
      maxWidth: {
        sm: "max-w-screen-sm",
        md: "max-w-screen-md",
        lg: "max-w-screen-lg",
        xl: "max-w-screen-xl",
        "2xl": "max-w-screen-2xl",
        "7xl": "max-w-7xl",
        full: "max-w-full",
      },
      padding: {
        none: "",
        sm: "py-4 md:py-6",
        default: "py-6 md:py-8",
        lg: "py-8 md:py-12",
      },
    },
    defaultVariants: {
      maxWidth: "7xl",
      padding: "default",
    },
  }
);

export interface PageContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pageContainerVariants> {}

export function PageContainer({
  className,
  maxWidth,
  padding,
  children,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(pageContainerVariants({ maxWidth, padding }), className)}
      {...props}
    >
      {children}
    </div>
  );
}
