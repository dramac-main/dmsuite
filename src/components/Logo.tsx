import { cn } from "@/lib/utils";

/* ── DMSuite Logo ────────────────────────────────────────────
   Inline SVG logo component — no external assets needed.
   Usage: <Logo className="h-8" />
   ──────────────────────────────────────────────────────────── */

interface LogoProps {
  className?: string;
  variant?: "full" | "mark" | "wordmark";
}

export function Logo({ className, variant = "full" }: LogoProps) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-8 w-auto", className)}
        aria-label="DMSuite"
      >
        {/* Abstract "DM" mark — two interlocking shapes with primary accent */}
        <rect width="32" height="32" rx="8" className="fill-primary-500" />
        <path
          d="M8 8h5a8 8 0 0 1 0 16H8V8z"
          className="fill-gray-950"
          opacity="0.9"
        />
        <path
          d="M16 8l4 8-4 8h4l4-8-4-8h-4z"
          className="fill-gray-950"
          opacity="0.7"
        />
      </svg>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        className={cn(
          "text-xl font-black tracking-tight text-gray-900 dark:text-white",
          className
        )}
      >
        DM<span className="text-primary-500">Suite</span>
      </span>
    );
  }

  // Full: mark + wordmark
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-auto"
        aria-label="DMSuite"
      >
        <rect width="32" height="32" rx="8" className="fill-primary-500" />
        <path
          d="M8 8h5a8 8 0 0 1 0 16H8V8z"
          className="fill-gray-950"
          opacity="0.9"
        />
        <path
          d="M16 8l4 8-4 8h4l4-8-4-8h-4z"
          className="fill-gray-950"
          opacity="0.7"
        />
      </svg>
      <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
        DM<span className="text-primary-500">Suite</span>
      </span>
    </span>
  );
}
