export interface ChangelogEntry {
  id: string;
  version: string;
  date: string; // ISO date
  title: string;
  type: "feature" | "improvement" | "fix" | "announcement";
  description: string;
  toolId?: string; // optional link to a tool
}

export const changelog: ChangelogEntry[] = [
  {
    id: "cl-001",
    version: "2.4.0",
    date: "2025-07-20",
    title: "Notification Center",
    type: "feature",
    description:
      "Stay in the loop — real-time notifications for credits, updates, and tool activity.",
  },
  {
    id: "cl-002",
    version: "2.4.0",
    date: "2025-07-20",
    title: "Favorites & Recent Tools",
    type: "feature",
    description:
      "Star your go-to tools and instantly resume from where you left off with recent-tools tracking.",
  },
  {
    id: "cl-003",
    version: "2.3.1",
    date: "2025-07-18",
    title: "Global Toast Feedback",
    type: "improvement",
    description:
      "Actions now surface instant, non-blocking toast confirmations across the entire platform.",
  },
  {
    id: "cl-004",
    version: "2.3.0",
    date: "2025-07-15",
    title: "Mobile Bottom Navigation",
    type: "improvement",
    description:
      "Redesigned mobile nav with a swipe-up recent-tools sheet for faster access on the go.",
  },
  {
    id: "cl-005",
    version: "2.2.0",
    date: "2025-07-10",
    title: "250+ AI Tools Available",
    type: "announcement",
    description:
      "The tool library has grown past 250 tools spanning 8 creative and business categories.",
  },
  {
    id: "cl-006",
    version: "2.1.0",
    date: "2025-07-05",
    title: "Chiko AI Assistant",
    type: "feature",
    description:
      "Meet Chiko — your contextual AI copilot that helps inside every workspace.",
    toolId: "ai-assistant",
  },
  {
    id: "cl-007",
    version: "2.0.0",
    date: "2025-06-28",
    title: "Electric Violet Redesign",
    type: "improvement",
    description:
      "Full visual overhaul — glassmorphism surfaces, electric-violet accent, smoother animations.",
  },
  {
    id: "cl-008",
    version: "1.9.0",
    date: "2025-06-20",
    title: "Resume & CV Builder",
    type: "feature",
    description:
      "Professional resume builder with 13 premium templates and PDF export.",
    toolId: "resume-cv-builder",
  },
];
