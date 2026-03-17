// =============================================================================
// DMSuite — useChikoActions Hook
// Registration hook that tool workspace components call to register their
// action manifest with Chiko. Handles mount/unmount lifecycle.
// =============================================================================

import { useEffect, useRef } from "react";
import { useChikoActionRegistry, type ChikoActionManifest } from "@/stores/chiko-actions";

/**
 * Register a tool's action manifest with the Chiko action registry.
 * The manifest is registered on mount and unregistered on unmount.
 *
 * @param manifestFactory - A function that returns the manifest, or a static manifest.
 *   Called once on mount (and again if the reference changes).
 */
export function useChikoActions(manifestFactory: () => ChikoActionManifest) {
  const register = useChikoActionRegistry((s) => s.register);
  const unregister = useChikoActionRegistry((s) => s.unregister);
  const toolIdRef = useRef<string | null>(null);

  useEffect(() => {
    const manifest = manifestFactory();
    toolIdRef.current = manifest.toolId;
    register(manifest);

    return () => {
      if (toolIdRef.current) {
        unregister(toolIdRef.current);
        toolIdRef.current = null;
      }
    };
  }, [manifestFactory, register, unregister]);
}
