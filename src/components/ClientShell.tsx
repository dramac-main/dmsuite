"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
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
const ToastContainer = dynamic(
  () => import("@/components/ToastContainer"),
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
 *
 * Auth-aware: Chiko, mobile nav, install prompt, and shortcuts are hidden
 * on auth pages (login, signup, verify, reset-password, callback).
 */
export default function ClientShell() {
  useGlobalShortcuts();
  const pathname = usePathname();

  // Auth pages should not show Chiko, mobile nav, or shortcuts
  const isAuthPage = pathname.startsWith("/auth/");
  // Tool workspace pages have their own bottom bar — hide global mobile nav
  const isToolPage = pathname.startsWith("/tools/");

  if (isAuthPage) return null;

  return (
    <>
      {!isToolPage && <MobileBottomNav />}
      <InstallPrompt />
      <ShortcutsHelpModal />
      <ToastContainer />
      <ChikoFAB />
      <ChikoAssistant />
      <ChikoOnboarding />
    </>
  );
}
