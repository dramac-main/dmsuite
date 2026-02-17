"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GLOBAL_SHORTCUTS, matchShortcut } from "@/lib/shortcuts";
import { useTheme } from "@/components/ThemeProvider";
import { useSidebarStore } from "@/stores/sidebar";

/**
 * Global keyboard shortcuts — attached to the window.
 * Should be mounted once in the layout (or root provider).
 */
export function useGlobalShortcuts() {
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const toggleSidebar = useSidebarStore((s) => s.toggleMobile);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Skip when focused on editable elements (unless the shortcut should override)
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        // Only allow Escape in editable fields
        if (e.key !== "Escape") return;
      }

      for (const shortcut of GLOBAL_SHORTCUTS) {
        if (!matchShortcut(e, shortcut)) continue;

        switch (shortcut.action) {
          case "command-palette":
            // CommandPalette handles Ctrl+K itself — skip here
            break;

          case "toggle-theme":
            e.preventDefault();
            toggleTheme();
            break;

          case "toggle-sidebar":
            e.preventDefault();
            toggleSidebar();
            break;

          case "go-dashboard":
            e.preventDefault();
            router.push("/dashboard");
            break;

          case "focus-search": {
            e.preventDefault();
            const searchInput = document.querySelector<HTMLInputElement>(
              '[data-search-input="hero"]'
            );
            searchInput?.focus();
            break;
          }

          case "shortcuts-help":
            e.preventDefault();
            // Dispatch custom event that ShortcutsHelpModal listens to
            window.dispatchEvent(new CustomEvent("dmsuite:shortcuts-help"));
            break;

          case "close-overlay":
            // modals handle Escape themselves
            break;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleTheme, toggleSidebar, router]);
}
