import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
        primary:
          "bg-primary-500/15 text-primary-600 dark:text-primary-400",
        secondary:
          "bg-secondary-500/15 text-secondary-600 dark:text-secondary-400",
        success:
          "bg-success/15 text-success",
        warning:
          "bg-warning/15 text-warning",
        error:
          "bg-error/15 text-error",
        info:
          "bg-info/15 text-info",
        outline:
          "border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[0.625rem] rounded-md",
        md: "px-2 py-0.5 text-xs rounded-md",
        lg: "px-2.5 py-1 text-xs rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor, children, ...props }, ref) => {
    return (
      <span
        className={cn(badgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "size-1.5 rounded-full",
              dotColor || "bg-current"
            )}
          />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
