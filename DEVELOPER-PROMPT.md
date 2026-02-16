# DMSuite Dashboard — Developer Implementation Prompt

```markdown
## UI Brief

Build the **DMSuite Dashboard** — a financial management dashboard for a graphic-design
SaaS application. The layout is a **fixed sidebar + scrollable main content** shell.
Both **dark mode** (default) and **light mode** must be supported via a theme toggle in
the top-right utility bar; the entire UI should swap surfaces, text, and border colors
seamlessly.

---

### Sidebar

A full-height left sidebar (240 px on desktop, icon-only 72 px when collapsed, fully
hidden on mobile with a hamburger toggle). It contains:

1. **Logo area** — a small green circle icon beside the word "DMSuite" in white.
   A collapse chevron sits at the far right of the logo row.
2. **Search field** — rounded input with a magnifying-glass icon, placeholder
   "Search Anything…".
3. **Three nav groups** labelled MENU, FEATURES, TOOLS in small uppercase overline
   text. Each item is an icon + label row. The active item ("Dashboard") uses the
   **primary** color as its background with dark text; inactive items are muted and
   show a subtle hover highlight.

---

### Top Bar

Inside the main content area, a simple row: page title "Dashboard" on the left
(heading 1, bold); on the right a dark/light toggle icon, a bell notification icon,
and a circular user avatar.

---

### Action Bar

A row of two outline buttons — "Generate Report" (file icon) and "Export"
(download icon) — left-aligned. A search input right-aligned.

---

### KPI Cards Row

Three equal-width cards in a horizontal grid:

| Card | Value | Note |
|---|---|---|
| Total Revenue this month | $21,219.24 | "Vs Last month" footer |
| Total Saving | $14,376.26 | Same footer; card may have a subtle **secondary** accent border |
| Taxes to be paid | $4,667.02 | Same footer |

Each card has a label (muted), a large bold dollar value, and a small clock-icon
footer. Cards use the standard surface background with a thin border.

---

### Middle Row (two cards, ~40 / 60 split)

**Left card — AI-Generated Spending Limits**

- Heading + dollar value ($4,815.23).
- A **segmented horizontal progress bar** with four color-coded segments:
  Shopping (primary), Subscriptions (secondary/cyan), Dining Out (amber/warning),
  Other (gray). Below the bar, a dot-legend shows each category with its percentage.
- Below that, a **mock Visa card** rendered as a dark greenish-gradient rounded
  rectangle with VISA branding, a masked card number in monospace, a chip icon,
  cardholder name, and expiry date.

**Right card — Available Balance**

- Large display value ($102,175.96) on the left.
- Two action buttons on the right: outline "Request" and filled primary "Transfer"
  (send icon). A kebab menu icon sits beside them.
- A **view toggle** ("Line view" / "Bar view") — tabs with an active underline.
- A **vertical bar chart** (Jan–Sep). Most bars are muted/dark; one highlighted
  month (Apr or May) uses the bright primary color. Y-axis shows dollar labels;
  X-axis shows month abbreviations. Faint horizontal grid lines.
- A "Vs Last month" footer.

---

### Transactions Table

A full-width bordered card containing:

1. **Toolbar** — search input ("Search Transaction…"), two date-filter chips
   ("Processed Date"), a "More" dropdown chip, and right-side ghost-style
   "Import" / "Export" buttons.
2. **Table columns**: checkbox, Payment ID (monospace), Total Amount, To (avatar +
   name), Payment Period, Payment Method (colored badge — purple "Wire Transfer"
   or blue "Bank Transfer"), Processed Date, Status (dot + label badge — green
   "Received", red "Failed", amber "Processed").
3. **Pagination bar** — numbered page buttons (active page uses primary bg), left/
   right chevron arrows, and "Showing 1 to 8 of 50 entries · Show All" on the right.

---

### Upgrade Banner

A small floating card pinned to the bottom-left (overlapping the sidebar area).
Dark green-tinted background with:

- A "Upgrade Pro!" heading with a sparkle icon.
- Descriptive text: "Upgrade to Pro and elevate your experience today".
- A dismiss "×" button top-right.
- A row of a filled primary "Upgrade" button (crown icon) and a "Learn more" text
  link.

---

### Token Rules & Usage

| Token | Where to use |
|---|---|
| **primary.500** (electric-lime green) | Active nav item bg, filled CTA buttons ("Transfer", "Upgrade"), active pagination page bg, chart highlight bar, progress-bar segment (Shopping) |
| **primary.400** | Chart bar highlight, upgrade badge text |
| **secondary.500** (cyan/teal) | "Total Saving" card accent border, progress-bar segment (Subscriptions), any secondary info highlight |
| **gray.950 → gray.700** | Body bg, sidebar bg, card bg, card borders, input bg — the entire dark surface hierarchy |
| **gray.400 → gray.500** | Muted / secondary text, placeholders, inactive nav text, axis labels |
| **success (#22c55e)** | "Received" status badge bg+text, green dot |
| **error (#ef4444)** | "Failed" status badge bg+text, red dot |
| **warning (#f59e0b)** | "Processed" status badge bg+text, amber dot, Dining Out segment |
| **accents.wireTransfer (#7c3aed)** | Wire Transfer method badge (purple) |
| **accents.bankTransfer (#2563eb)** | Bank Transfer method badge (blue) |

**General rules:**

- In **dark mode**, surfaces go from `gray.950` (body) → `gray.900` (sidebar) →
  `gray.800` (cards) → `gray.700` (borders/dividers).
- In **light mode**, surfaces invert: white body, white cards, `gray.200` borders,
  `gray.50` alternate rows.
- All text with primary-colored backgrounds must use `gray.950` (near-black) for
  maximum contrast.
- Status and method badges use their accent color at ~15 % opacity as background
  with full-opacity text.
- Border radius follows the scale: inputs/buttons `md (8 px)`, cards `lg (12 px)`,
  Visa card `xl (16 px)`, avatars `full`.
- Responsive: sidebar hidden below `lg`, grids collapse from 3 → 2 → 1 column at
  `md` and `sm` breakpoints, table gains horizontal scroll below `lg`.
```
