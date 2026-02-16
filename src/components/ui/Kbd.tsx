import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/* ── Kbd ──────────────────────────────────────────────────────
   Keyboard shortcut display component.
   Usage: <Kbd>⌘K</Kbd> or <Kbd keys={["Ctrl", "K"]} />
   ──────────────────────────────────────────────────────────── */

export interface KbdProps extends HTMLAttributes<HTMLElement> {
  keys?: string[];
}

const Kbd = forwardRef<HTMLElement, KbdProps>(
  ({ className, keys, children, ...props }, ref) => {
    if (keys && keys.length > 0) {
      return (
        <span className="inline-flex items-center gap-0.5">
          {keys.map((key, i) => (
            <kbd
              key={i}
              ref={i === 0 ? ref : undefined}
              className={cn(
                "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[0.625rem] font-mono font-semibold rounded border",
                "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400",
                "shadow-[0_1px_0_1px] shadow-gray-200/50 dark:shadow-gray-700/50",
                className
              )}
              {...props}
            >
              {key}
            </kbd>
          ))}
        </span>
      );
    }

    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[0.625rem] font-mono font-semibold rounded border",
          "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400",
          "shadow-[0_1px_0_1px] shadow-gray-200/50 dark:shadow-gray-700/50",
          className
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = "Kbd";

export { Kbd };
