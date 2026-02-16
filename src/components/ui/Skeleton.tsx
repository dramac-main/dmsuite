"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/* ── Skeleton ────────────────────────────────────────────────
   Loading placeholder with pulse animation.
   Usage: <Skeleton className="h-8 w-32" />
   ──────────────────────────────────────────────────────────── */

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: "rect" | "circle" | "text";
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rect", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-gray-200 dark:bg-gray-800",
          variant === "rect" && "rounded-lg",
          variant === "circle" && "rounded-full",
          variant === "text" && "rounded-md h-4",
          className
        )}
        {...props}
      />
    );
  }
);
Skeleton.displayName = "Skeleton";

/* ── Pre-built Skeleton Patterns ─────────────────────────── */

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3", className)}>
      <div className="flex items-start justify-between">
        <Skeleton className="size-10 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-1/2" />
    </div>
  );
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 space-y-3", className)}>
      <Skeleton className="size-10 rounded-lg" />
      <Skeleton className="h-8 w-20" />
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="text" className="w-16 mt-2" />
    </div>
  );
}

export function SkeletonHeroBanner({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 lg:p-10 space-y-4", className)}>
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton variant="text" className="w-1/2" />
      <Skeleton className="h-12 w-full max-w-lg rounded-xl mt-4" />
    </div>
  );
}

export { Skeleton };
