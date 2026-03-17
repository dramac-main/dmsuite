import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  /** Whether sidebar is open on mobile (overlay drawer) */
  mobileOpen: boolean;
  /** Whether desktop sidebar is currently hovered (transient — not persisted) */
  hovered: boolean;
  /** Whether user has pinned the sidebar open on desktop (persisted).
   *  When pinned the sidebar pushes main content; when unpinned it overlays. */
  pinned: boolean;

  /** Open the mobile sidebar */
  openMobile: () => void;
  /** Close the mobile sidebar */
  closeMobile: () => void;
  /** Toggle mobile sidebar */
  toggleMobile: () => void;
  /** Set hovered state (called by mouse-enter / mouse-leave with delay) */
  setHovered: (hovered: boolean) => void;
  /** Toggle pinned state (user clicks the pin button) */
  togglePinned: () => void;
  /** Explicitly set pinned state */
  setPinned: (pinned: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      mobileOpen: false,
      hovered: false,
      pinned: false,

      openMobile: () => set({ mobileOpen: true }),
      closeMobile: () => set({ mobileOpen: false }),
      toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),

      setHovered: (hovered) => set({ hovered }),

      togglePinned: () =>
        set((s) => ({ pinned: !s.pinned, hovered: false })),

      setPinned: (pinned) => set({ pinned, hovered: false }),
    }),
    {
      name: "dmsuite-sidebar",
      partialize: (state) => ({
        pinned: state.pinned,
      }),
    }
  )
);
