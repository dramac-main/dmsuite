import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  /* base */
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-gray-950 hover:bg-primary-400 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30",
        secondary:
          "bg-secondary-500 text-white hover:bg-secondary-400 shadow-lg shadow-secondary-500/20",
        outline:
          "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600",
        ghost:
          "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200",
        danger:
          "bg-error text-white hover:bg-red-600 shadow-lg shadow-error/20",
        link:
          "text-primary-500 hover:text-primary-400 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-7 px-2.5 text-xs rounded-md",
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-9 px-4 text-sm rounded-lg",
        lg: "h-10 px-5 text-sm rounded-xl",
        xl: "h-12 px-6 text-base rounded-xl",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-8 rounded-lg",
        "icon-xs": "size-7 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
