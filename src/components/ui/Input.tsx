import { forwardRef, type InputHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  /* base */
  "w-full bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20",
        ghost:
          "border-transparent bg-gray-100 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-primary-500/20",
        flush:
          "border-b border-gray-200 dark:border-gray-700 rounded-none px-0 focus:border-primary-500",
      },
      inputSize: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-9 px-3.5 text-sm rounded-lg",
        lg: "h-10 px-4 text-sm rounded-xl",
        xl: "h-12 px-5 text-base rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, icon, ...props }, ref) => {
    if (icon) {
      return (
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
          <input
            className={cn(inputVariants({ variant, inputSize, className }), "pl-9")}
            ref={ref}
            {...props}
          />
        </div>
      );
    }
    return (
      <input
        className={cn(inputVariants({ variant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
