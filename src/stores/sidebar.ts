import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  /** Whether sidebar is open on mobile */
  mobileOpen: boolean;
  /** Whether sidebar is collapsed on desktop (icons only) */
  collapsed: boolean;
  /** Open the mobile sidebar */
  openMobile: () => void;
  /** Close the mobile sidebar */
  closeMobile: () => void;
  /** Toggle mobile sidebar */
  toggleMobile: () => void;
  /** Toggle desktop collapsed state */
  toggleCollapsed: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      mobileOpen: false,
      collapsed: false,
      openMobile: () => set({ mobileOpen: true }),
      closeMobile: () => set({ mobileOpen: false }),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
      toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    {
      name: "dmsuite-sidebar",
      partialize: (state) => ({ collapsed: state.collapsed }),
    }
  )
);
