import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-xl transition-all duration-200", {
  variants: {
    variant: {
      default:
        "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900",
      ghost:
        "bg-gray-50 dark:bg-gray-900/50",
      glass:
        "border border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl",
      elevated:
        "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg shadow-black/5 dark:shadow-black/20",
      interactive:
        "border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:-translate-y-0.5 cursor-pointer",
      glow:
        "border border-primary-500/20 bg-white dark:bg-gray-900 shadow-lg shadow-primary-500/5",
    },
    padding: {
      none: "p-0",
      sm: "p-3 sm:p-4",
      md: "p-4 sm:p-5",
      lg: "p-5 sm:p-6",
      xl: "p-6 sm:p-8",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, ...props }, ref) => {
    return (
      <div
        className={cn(cardVariants({ variant, padding, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

/* ── Sub-components ─────────────────────────────────────────── */

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-between mb-4", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        "text-base font-bold text-gray-900 dark:text-white tracking-tight",
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800",
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
