/**
 * Handle 402 "Insufficient credits" responses from API routes.
 *
 * Call this whenever a fetch response returns 402. It opens the credit
 * purchase modal and returns a user-friendly error message.
 *
 * Usage:
 *   if (res.status === 402) {
 *     const msg = handleCreditError();
 *     // show msg to user, preserve editor state
 *   }
 */
export function handleCreditError(): string {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("dmsuite:open-credit-purchase"));
  }
  return "You've run out of credits. Purchase more to continue — your work is saved.";
}

/**
 * Check if a fetch Response is a credit error (402).
 * If so, opens the purchase modal and returns the error message.
 * If not, returns null.
 */
export function checkCreditError(response: Response): string | null {
  if (response.status === 402) {
    return handleCreditError();
  }
  return null;
}
