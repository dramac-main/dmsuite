import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely — handles conflicts, conditionals, and arrays.
 * Usage: cn("px-4 py-2", conditional && "bg-primary-500", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
