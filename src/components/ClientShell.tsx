"use client";

import dynamic from "next/dynamic";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";

const MobileBottomNav = dynamic(() => import("@/components/MobileBottomNav"), {
  ssr: false,
});
const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"), {
  ssr: false,
});
const ShortcutsHelpModal = dynamic(
  () => import("@/components/ShortcutsHelpModal"),
  { ssr: false }
);

/**
 * Client-side shell — wraps global shortcuts, mobile nav, install prompt,
 * and shortcuts help modal. Mounted once inside ThemeProvider in layout.tsx.
 */
export default function ClientShell() {
  useGlobalShortcuts();

  return (
    <>
      <MobileBottomNav />
      <InstallPrompt />
      <ShortcutsHelpModal />
    </>
  );
}
