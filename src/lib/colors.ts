/**
 * Safe color class lookup maps for Tailwind CSS JIT compatibility.
 * Template literals like `bg-${color}/10` are NOT detected by Tailwind's JIT scanner.
 * These maps contain pre-defined, statically-analyzable class strings.
 */

/** Background with 10% opacity — for category icons, tool highlights.
 *  Key format: "bg-primary-500" (with prefix) */
export const bgOpacity10: Record<string, string> = {
  "bg-primary-500": "bg-primary-500/10",
  "bg-secondary-500": "bg-secondary-500/10",
  "bg-error": "bg-error/10",
  "bg-info": "bg-info/10",
  "bg-warning": "bg-warning/10",
  "bg-wire-transfer": "bg-wire-transfer/10",
  "bg-bank-transfer": "bg-bank-transfer/10",
  "bg-gray-500": "bg-gray-500/10",
  "bg-success": "bg-success/10",
};

/** Background with 20% opacity — for hover states */
export const bgOpacity20: Record<string, string> = {
  "bg-primary-500": "bg-primary-500/20",
  "bg-secondary-500": "bg-secondary-500/20",
  "bg-error": "bg-error/20",
  "bg-info": "bg-info/20",
  "bg-warning": "bg-warning/20",
  "bg-wire-transfer": "bg-wire-transfer/20",
  "bg-bank-transfer": "bg-bank-transfer/20",
  "bg-gray-500": "bg-gray-500/20",
  "bg-success": "bg-success/20",
};

/** Group-hover background with 10% opacity — for ToolCard hover effects.
 *  Key format: stripped color name e.g. "primary-500" (without "bg-" prefix) */
export const groupHoverBg10: Record<string, string> = {
  "primary-500": "group-hover:bg-primary-500/10",
  "secondary-500": "group-hover:bg-secondary-500/10",
  "error": "group-hover:bg-error/10",
  "info": "group-hover:bg-info/10",
  "warning": "group-hover:bg-warning/10",
  "wire-transfer": "group-hover:bg-wire-transfer/10",
  "bank-transfer": "group-hover:bg-bank-transfer/10",
  "gray-500": "group-hover:bg-gray-500/10",
  "success": "group-hover:bg-success/10",
};
