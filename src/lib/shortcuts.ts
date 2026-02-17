/**
 * DMSuite — Keyboard Shortcuts Registry
 * Centrally registered, discoverable, conflict-free shortcuts.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: string;
  description: string;
  scope: "global" | "workspace" | "canvas";
}

// ---------------------------------------------------------------------------
// Format & Match
// ---------------------------------------------------------------------------

const isMac =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

/** Format shortcut for display: "⌘K" on Mac, "Ctrl+K" on Windows */
export function formatShortcut(s: Shortcut): string {
  const parts: string[] = [];
  if (s.ctrl || s.meta) parts.push(isMac ? "⌘" : "Ctrl");
  if (s.shift) parts.push(isMac ? "⇧" : "Shift");
  if (s.alt) parts.push(isMac ? "⌥" : "Alt");

  let key = s.key;
  const labels: Record<string, string> = {
    ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→",
    Backspace: "⌫", Delete: "Del", Escape: "Esc", Enter: "↵",
    " ": "Space", Tab: "⇥",
  };
  if (labels[key]) key = labels[key];
  else if (key.length === 1) key = key.toUpperCase();

  parts.push(key);
  return parts.join(isMac ? "" : "+");
}

/** Check if a keyboard event matches a shortcut definition */
export function matchShortcut(e: KeyboardEvent, s: Shortcut): boolean {
  const wantsMod = s.ctrl || s.meta;
  const hasMod = e.ctrlKey || e.metaKey;
  if (wantsMod && !hasMod) return false;
  if (!wantsMod && hasMod) return false;
  if (!!s.shift !== e.shiftKey) return false;
  if (!!s.alt !== e.altKey) return false;
  return e.key.toLowerCase() === s.key.toLowerCase();
}

// ---------------------------------------------------------------------------
// Global Shortcuts
// ---------------------------------------------------------------------------

export const GLOBAL_SHORTCUTS: Shortcut[] = [
  { key: "k", ctrl: true, action: "command-palette", description: "Open Command Palette", scope: "global" },
  { key: "/", ctrl: true, action: "toggle-theme", description: "Toggle theme", scope: "global" },
  { key: "b", ctrl: true, action: "toggle-sidebar", description: "Toggle sidebar", scope: "global" },
  { key: "h", ctrl: true, action: "go-dashboard", description: "Go to Dashboard", scope: "global" },
  { key: "F", ctrl: true, shift: true, action: "focus-search", description: "Focus global search", scope: "global" },
  { key: "Escape", action: "close-overlay", description: "Close any modal/overlay", scope: "global" },
  { key: "?", action: "shortcuts-help", description: "Show keyboard shortcuts", scope: "global" },
];

// ---------------------------------------------------------------------------
// Canvas Shortcuts
// ---------------------------------------------------------------------------

export const CANVAS_SHORTCUTS: Shortcut[] = [
  { key: "Delete", action: "delete-layer", description: "Delete selected layer", scope: "canvas" },
  { key: "Backspace", action: "delete-layer", description: "Delete selected layer", scope: "canvas" },
  { key: "z", ctrl: true, action: "undo", description: "Undo", scope: "canvas" },
  { key: "z", ctrl: true, shift: true, action: "redo", description: "Redo", scope: "canvas" },
  { key: "d", ctrl: true, action: "duplicate-layer", description: "Duplicate layer", scope: "canvas" },
  { key: "a", ctrl: true, action: "select-all", description: "Select all layers", scope: "canvas" },
  { key: "A", ctrl: true, shift: true, action: "deselect-all", description: "Deselect all", scope: "canvas" },
  { key: "c", ctrl: true, action: "copy-layer", description: "Copy layer", scope: "canvas" },
  { key: "v", ctrl: true, action: "paste-layer", description: "Paste layer", scope: "canvas" },
  { key: "x", ctrl: true, action: "cut-layer", description: "Cut layer", scope: "canvas" },
  { key: "g", ctrl: true, action: "group-layers", description: "Group selected layers", scope: "canvas" },
  { key: "G", ctrl: true, shift: true, action: "ungroup-layers", description: "Ungroup", scope: "canvas" },
  { key: "]", ctrl: true, action: "bring-forward", description: "Bring forward", scope: "canvas" },
  { key: "[", ctrl: true, action: "send-backward", description: "Send backward", scope: "canvas" },
  { key: "]", ctrl: true, shift: true, action: "bring-to-front", description: "Bring to front", scope: "canvas" },
  { key: "[", ctrl: true, shift: true, action: "send-to-back", description: "Send to back", scope: "canvas" },
  { key: "e", ctrl: true, action: "quick-export", description: "Quick export", scope: "canvas" },
  { key: "s", ctrl: true, action: "save-project", description: "Save project", scope: "canvas" },
  { key: "+", action: "zoom-in", description: "Zoom in", scope: "canvas" },
  { key: "-", action: "zoom-out", description: "Zoom out", scope: "canvas" },
  { key: "0", ctrl: true, action: "zoom-fit", description: "Zoom to fit", scope: "canvas" },
  { key: "1", ctrl: true, action: "zoom-100", description: "Zoom to 100%", scope: "canvas" },
  { key: "t", action: "add-text", description: "Add text layer", scope: "canvas" },
  { key: "r", action: "add-rectangle", description: "Add rectangle shape", scope: "canvas" },
  { key: "ArrowUp", action: "nudge-up", description: "Nudge up 1px", scope: "canvas" },
  { key: "ArrowDown", action: "nudge-down", description: "Nudge down 1px", scope: "canvas" },
  { key: "ArrowLeft", action: "nudge-left", description: "Nudge left 1px", scope: "canvas" },
  { key: "ArrowRight", action: "nudge-right", description: "Nudge right 1px", scope: "canvas" },
  { key: "ArrowUp", shift: true, action: "nudge-up-10", description: "Nudge up 10px", scope: "canvas" },
  { key: "ArrowDown", shift: true, action: "nudge-down-10", description: "Nudge down 10px", scope: "canvas" },
  { key: "ArrowLeft", shift: true, action: "nudge-left-10", description: "Nudge left 10px", scope: "canvas" },
  { key: "ArrowRight", shift: true, action: "nudge-right-10", description: "Nudge right 10px", scope: "canvas" },
  { key: "Enter", action: "edit-text", description: "Edit text layer", scope: "canvas" },
  { key: "Escape", action: "deselect", description: "Deselect / exit edit", scope: "canvas" },
  { key: "Tab", action: "cycle-layers", description: "Cycle through layers", scope: "canvas" },
  { key: "l", ctrl: true, action: "toggle-layer-panel", description: "Toggle layer panel", scope: "canvas" },
  { key: "f", action: "fullscreen-preview", description: "Toggle fullscreen", scope: "canvas" },
];

// ---------------------------------------------------------------------------
// Workspace-Specific Shortcuts
// ---------------------------------------------------------------------------

export const WORKSPACE_SHORTCUTS: Record<string, Shortcut[]> = {
  "ai-chat": [
    { key: "Enter", ctrl: true, action: "send-message", description: "Send message", scope: "workspace" },
    { key: "n", ctrl: true, action: "new-conversation", description: "New conversation", scope: "workspace" },
    { key: "C", ctrl: true, shift: true, action: "copy-last-response", description: "Copy last response", scope: "workspace" },
  ],
  presentation: [
    { key: "ArrowLeft", action: "prev-slide", description: "Previous slide", scope: "workspace" },
    { key: "ArrowRight", action: "next-slide", description: "Next slide", scope: "workspace" },
    { key: "m", ctrl: true, action: "new-slide", description: "New slide", scope: "workspace" },
    { key: "D", ctrl: true, shift: true, action: "duplicate-slide", description: "Duplicate slide", scope: "workspace" },
    { key: "F5", action: "start-slideshow", description: "Start slideshow", scope: "workspace" },
  ],
  "resume-cv": [
    { key: "p", ctrl: true, action: "preview-print", description: "Preview / Print", scope: "workspace" },
  ],
  "invoice-designer": [
    { key: "p", ctrl: true, action: "preview-print", description: "Preview / Print", scope: "workspace" },
  ],
  "logo-generator": [
    { key: "e", ctrl: true, action: "quick-export", description: "Quick export", scope: "workspace" },
    { key: "s", ctrl: true, action: "download-current", description: "Download current", scope: "workspace" },
    { key: "ArrowLeft", action: "prev-variant", description: "Previous variant", scope: "workspace" },
    { key: "ArrowRight", action: "next-variant", description: "Next variant", scope: "workspace" },
    { key: "g", ctrl: true, action: "generate-ai", description: "Generate AI variants", scope: "workspace" },
  ],
};

// ---------------------------------------------------------------------------
// All Shortcuts (flattened for help modal)
// ---------------------------------------------------------------------------

export function getAllShortcuts(): Shortcut[] {
  return [
    ...GLOBAL_SHORTCUTS,
    ...CANVAS_SHORTCUTS,
    ...Object.values(WORKSPACE_SHORTCUTS).flat(),
  ];
}
