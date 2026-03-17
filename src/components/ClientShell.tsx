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
const ChikoFAB = dynamic(
  () => import("@/components/Chiko/ChikoFAB").then((m) => ({ default: m.ChikoFAB })),
  { ssr: false }
);
const ChikoAssistant = dynamic(
  () => import("@/components/Chiko/ChikoAssistant").then((m) => ({ default: m.ChikoAssistant })),
  { ssr: false }
);
const ChikoOnboarding = dynamic(
  () => import("@/components/Chiko/ChikoOnboarding").then((m) => ({ default: m.ChikoOnboarding })),
  { ssr: false }
);

/**
 * Client-side shell — wraps global shortcuts, mobile nav, install prompt,
 * shortcuts help modal, Chiko AI assistant, and onboarding tour.
 * Mounted once inside ThemeProvider in layout.tsx.
 */
export default function ClientShell() {
  useGlobalShortcuts();

  return (
    <>
      <MobileBottomNav />
      <InstallPrompt />
      <ShortcutsHelpModal />
      <ChikoFAB />
      <ChikoAssistant />
      <ChikoOnboarding />
    </>
  );
}
