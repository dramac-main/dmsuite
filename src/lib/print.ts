// =============================================================================
// DMSuite — Print via Hidden Iframe
// Uses a hidden iframe instead of window.open to avoid popup blockers.
// Works from any context (async, Chiko actions, etc.).
// =============================================================================

/**
 * Print arbitrary HTML content using a hidden iframe.
 * This avoids browser popup blockers that would block `window.open`.
 *
 * @param html  Full HTML document string to print
 * @returns     Promise that resolves after the print dialog is shown
 */
export function printHTML(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for content (especially images/fonts) to load before printing
    const win = iframe.contentWindow;
    if (!win) {
      document.body.removeChild(iframe);
      resolve();
      return;
    }

    const triggerPrint = () => {
      win.focus();
      win.print();
      // Clean up after a brief delay to let the print dialog open
      setTimeout(() => {
        document.body.removeChild(iframe);
        resolve();
      }, 200);
    };

    // Listen for the iframe content to finish loading
    iframe.addEventListener("load", triggerPrint, { once: true });
  });
}
