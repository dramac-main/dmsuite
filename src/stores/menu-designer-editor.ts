// =============================================================================
// DMSuite — Menu Designer Editor Store
// Zustand + Immer + Zundo (temporal) for undo/redo of menu configuration.
// Follows the CertificateEditorStore architecture exactly.
// =============================================================================

"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import equal from "fast-deep-equal";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MenuType =
  | "restaurant"
  | "cafe"
  | "bar-cocktail"
  | "fine-dining"
  | "buffet"
  | "prix-fixe"
  | "wedding-event"
  | "takeaway"
  | "food-truck"
  | "wine-list"
  | "kids"
  | "dessert"
  | "brunch";

export const MENU_TYPES: { id: MenuType; label: string; defaultTitle: string }[] = [
  { id: "restaurant", label: "Restaurant", defaultTitle: "Our Menu" },
  { id: "cafe", label: "Café", defaultTitle: "Café Menu" },
  { id: "bar-cocktail", label: "Bar & Cocktail", defaultTitle: "Drinks & Cocktails" },
  { id: "fine-dining", label: "Fine Dining", defaultTitle: "Tasting Menu" },
  { id: "buffet", label: "Buffet", defaultTitle: "Buffet Selection" },
  { id: "prix-fixe", label: "Prix Fixe", defaultTitle: "Prix Fixe Menu" },
  { id: "wedding-event", label: "Wedding & Event", defaultTitle: "Wedding Menu" },
  { id: "takeaway", label: "Takeaway", defaultTitle: "Takeaway Menu" },
  { id: "food-truck", label: "Food Truck", defaultTitle: "Street Eats" },
  { id: "wine-list", label: "Wine List", defaultTitle: "Wine Selection" },
  { id: "kids", label: "Kids Menu", defaultTitle: "Kids Menu" },
  { id: "dessert", label: "Dessert Menu", defaultTitle: "Desserts & Sweets" },
  { id: "brunch", label: "Brunch", defaultTitle: "Brunch Menu" },
];

export type DietaryTag = "V" | "VG" | "GF" | "DF" | "N" | "SF" | "K" | "H" | "O" | "S";

export const DIETARY_TAGS: { id: DietaryTag; label: string; color: string }[] = [
  { id: "V", label: "Vegetarian", color: "#16a34a" },
  { id: "VG", label: "Vegan", color: "#059669" },
  { id: "GF", label: "Gluten Free", color: "#d97706" },
  { id: "DF", label: "Dairy Free", color: "#2563eb" },
  { id: "N", label: "Contains Nuts", color: "#92400e" },
  { id: "SF", label: "Shellfish", color: "#dc2626" },
  { id: "K", label: "Kosher", color: "#7c3aed" },
  { id: "H", label: "Halal", color: "#0891b2" },
  { id: "O", label: "Organic", color: "#65a30d" },
  { id: "S", label: "Spicy", color: "#ea580c" },
];

export type MenuTemplate =
  | "elegant-serif"
  | "modern-minimal"
  | "rustic-kraft"
  | "bistro-classic"
  | "cocktail-bar"
  | "farm-to-table"
  | "asian-fusion"
  | "italian-trattoria"
  | "seafood-coastal"
  | "steakhouse-bold"
  | "cafe-playful"
  | "prix-fixe-luxury";

export interface MenuTemplateConfig {
  id: MenuTemplate;
  name: string;
  accent: string;
  bgColor: string;
  textColor: string;
  fontPairing: string;
  priceStyle: PriceDisplayStyle;
  dividerStyle: DividerStyle;
}

export const MENU_TEMPLATES: MenuTemplateConfig[] = [
  { id: "elegant-serif", name: "Elegant Serif", accent: "#b8860b", bgColor: "#faf6ef", textColor: "#1a1a1a", fontPairing: "playfair-lato", priceStyle: "dots", dividerStyle: "ornamental" },
  { id: "modern-minimal", name: "Modern Minimal", accent: "#18181b", bgColor: "#ffffff", textColor: "#18181b", fontPairing: "inter-jetbrains", priceStyle: "right-aligned", dividerStyle: "thin-line" },
  { id: "rustic-kraft", name: "Rustic Kraft", accent: "#92400e", bgColor: "#f5ebe0", textColor: "#3d2c1e", fontPairing: "crimson-source", priceStyle: "dots", dividerStyle: "dashed" },
  { id: "bistro-classic", name: "Bistro Classic", accent: "#7c2d12", bgColor: "#fffbf0", textColor: "#292524", fontPairing: "cormorant-montserrat", priceStyle: "dots", dividerStyle: "ornamental" },
  { id: "cocktail-bar", name: "Cocktail Bar", accent: "#c084fc", bgColor: "#0f0f23", textColor: "#e2e8f0", fontPairing: "poppins-inter", priceStyle: "inline", dividerStyle: "glow-line" },
  { id: "farm-to-table", name: "Farm to Table", accent: "#65a30d", bgColor: "#f7fdf4", textColor: "#1a2e05", fontPairing: "merriweather-opensans", priceStyle: "right-aligned", dividerStyle: "botanical" },
  { id: "asian-fusion", name: "Asian Fusion", accent: "#dc2626", bgColor: "#fefce8", textColor: "#1c1917", fontPairing: "dm-serif-dm-sans", priceStyle: "inline", dividerStyle: "brush-stroke" },
  { id: "italian-trattoria", name: "Italian Trattoria", accent: "#b91c1c", bgColor: "#fef9f0", textColor: "#292524", fontPairing: "playfair-lato", priceStyle: "dots", dividerStyle: "grape-vine" },
  { id: "seafood-coastal", name: "Seafood Coastal", accent: "#0369a1", bgColor: "#f0f9ff", textColor: "#0c4a6e", fontPairing: "oswald-roboto", priceStyle: "right-aligned", dividerStyle: "wave" },
  { id: "steakhouse-bold", name: "Steakhouse Bold", accent: "#991b1b", bgColor: "#1c1917", textColor: "#fafaf9", fontPairing: "oswald-roboto", priceStyle: "right-aligned", dividerStyle: "thick-rule" },
  { id: "cafe-playful", name: "Café Playful", accent: "#ea580c", bgColor: "#fff7ed", textColor: "#431407", fontPairing: "poppins-inter", priceStyle: "inline", dividerStyle: "dots-pattern" },
  { id: "prix-fixe-luxury", name: "Prix Fixe Luxury", accent: "#78716c", bgColor: "#fafaf9", textColor: "#1c1917", fontPairing: "cormorant-montserrat", priceStyle: "centered", dividerStyle: "ornamental" },
];

export type PriceDisplayStyle = "dots" | "right-aligned" | "inline" | "centered" | "parentheses";

export type DividerStyle =
  | "none"
  | "thin-line"
  | "thick-rule"
  | "dashed"
  | "ornamental"
  | "dots-pattern"
  | "botanical"
  | "wave"
  | "brush-stroke"
  | "grape-vine"
  | "glow-line";

export type ColumnLayout = "single" | "two-column" | "three-column";

export type FoldType = "flat" | "bi-fold" | "tri-fold";

export type MenuPageSize = "a4" | "letter" | "a5" | "dl" | "square" | "tabloid";

// ---------------------------------------------------------------------------
// Menu Data Structures
// ---------------------------------------------------------------------------

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  dietary: DietaryTag[];
  featured: boolean;
  subItems?: string[];
}

export interface MenuSection {
  id: string;
  title: string;
  subtitle: string;
  items: MenuItem[];
  visible: boolean;
}

// ---------------------------------------------------------------------------
// Style & Format
// ---------------------------------------------------------------------------

export interface MenuStyleConfig {
  template: MenuTemplate;
  accentColor: string;
  bgColor: string;
  textColor: string;
  fontPairing: string;
  fontScale: number;
  priceStyle: PriceDisplayStyle;
  dividerStyle: DividerStyle;
  columnLayout: ColumnLayout;
  showDietaryLegend: boolean;
  showItemDescriptions: boolean;
  showSectionSubtitles: boolean;
  headerStyle: "centered" | "left-aligned" | "accent-bar";
  borderStyle: "none" | "thin" | "double" | "ornate" | "accent-edge";
  itemSpacing: "tight" | "normal" | "relaxed";
}

export interface MenuFormatConfig {
  pageSize: MenuPageSize;
  foldType: FoldType;
  margins: "narrow" | "standard" | "wide";
  orientation: "portrait" | "landscape";
  bleedMarks: boolean;
  cropMarks: boolean;
}

// ---------------------------------------------------------------------------
// Currency
// ---------------------------------------------------------------------------

export interface CurrencyConfig {
  code: string;
  symbol: string;
  position: "before" | "after";
  separator: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "ZMW", symbol: "K", position: "before", separator: "" },
  { code: "USD", symbol: "$", position: "before", separator: "" },
  { code: "GBP", symbol: "£", position: "before", separator: "" },
  { code: "EUR", symbol: "€", position: "before", separator: "" },
  { code: "ZAR", symbol: "R", position: "before", separator: " " },
  { code: "BWP", symbol: "P", position: "before", separator: "" },
  { code: "KES", symbol: "KSh", position: "before", separator: " " },
  { code: "NGN", symbol: "₦", position: "before", separator: "" },
  { code: "GHS", symbol: "GH₵", position: "before", separator: "" },
  { code: "TZS", symbol: "TSh", position: "before", separator: " " },
  { code: "UGX", symbol: "USh", position: "before", separator: " " },
  { code: "MWK", symbol: "MK", position: "before", separator: "" },
  { code: "MZN", symbol: "MT", position: "before", separator: " " },
  { code: "NAD", symbol: "N$", position: "before", separator: "" },
  { code: "AED", symbol: "AED", position: "before", separator: " " },
  { code: "INR", symbol: "₹", position: "before", separator: "" },
  { code: "JPY", symbol: "¥", position: "before", separator: "" },
  { code: "CNY", symbol: "¥", position: "before", separator: "" },
  { code: "AUD", symbol: "A$", position: "before", separator: "" },
  { code: "CAD", symbol: "C$", position: "before", separator: "" },
  { code: "CHF", symbol: "CHF", position: "before", separator: " " },
  { code: "BRL", symbol: "R$", position: "before", separator: "" },
  { code: "MXN", symbol: "MX$", position: "before", separator: "" },
  { code: "THB", symbol: "฿", position: "before", separator: "" },
  { code: "KRW", symbol: "₩", position: "before", separator: "" },
  { code: "SGD", symbol: "S$", position: "before", separator: "" },
  { code: "MYR", symbol: "RM", position: "before", separator: " " },
  { code: "PHP", symbol: "₱", position: "before", separator: "" },
  { code: "SEK", symbol: "kr", position: "after", separator: " " },
  { code: "NOK", symbol: "kr", position: "after", separator: " " },
];

// ---------------------------------------------------------------------------
// Font Pairings
// ---------------------------------------------------------------------------

export const MENU_FONT_PAIRINGS: Record<string, { heading: string; body: string; google: string }> = {
  "playfair-lato": {
    heading: "Playfair Display",
    body: "Lato",
    google: "Playfair+Display:wght@400;600;700;900&family=Lato:wght@300;400;700",
  },
  "inter-jetbrains": {
    heading: "Inter",
    body: "Inter",
    google: "Inter:wght@300;400;500;600;700;800",
  },
  "merriweather-opensans": {
    heading: "Merriweather",
    body: "Open Sans",
    google: "Merriweather:wght@400;700;900&family=Open+Sans:wght@300;400;600;700",
  },
  "cormorant-montserrat": {
    heading: "Cormorant Garamond",
    body: "Montserrat",
    google: "Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600",
  },
  "crimson-source": {
    heading: "Crimson Text",
    body: "Source Sans 3",
    google: "Crimson+Text:wght@400;600;700&family=Source+Sans+3:wght@300;400;600;700",
  },
  "poppins-inter": {
    heading: "Poppins",
    body: "Inter",
    google: "Poppins:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600",
  },
  "oswald-roboto": {
    heading: "Oswald",
    body: "Roboto",
    google: "Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700",
  },
  "dm-serif-dm-sans": {
    heading: "DM Serif Display",
    body: "DM Sans",
    google: "DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700",
  },
  "josefin-nunito": {
    heading: "Josefin Sans",
    body: "Nunito",
    google: "Josefin+Sans:wght@400;500;600;700&family=Nunito:wght@300;400;600;700",
  },
  "abril-raleway": {
    heading: "Abril Fatface",
    body: "Raleway",
    google: "Abril+Fatface&family=Raleway:wght@300;400;500;600;700",
  },
};

// ---------------------------------------------------------------------------
// Form Data
// ---------------------------------------------------------------------------

export interface MenuDesignerFormData {
  menuType: MenuType;

  // Restaurant / Header
  restaurantName: string;
  tagline: string;
  headerNote: string;
  footerNote: string;

  // Currency
  currency: CurrencyConfig;

  // Sections & Items
  sections: MenuSection[];

  // Style
  style: MenuStyleConfig;

  // Format
  format: MenuFormatConfig;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function createDefaultItem(name = "", description = "", price = ""): MenuItem {
  return { id: uid(), name, description, price, dietary: [], featured: false };
}

function createDefaultSection(title = "", subtitle = ""): MenuSection {
  return { id: uid(), title, subtitle, items: [], visible: true };
}

export function createDefaultMenuForm(menuType?: MenuType): MenuDesignerFormData {
  const type = menuType ?? "restaurant";

  const sections: MenuSection[] = [
    {
      id: uid(), title: "Starters", subtitle: "Begin your dining experience", visible: true,
      items: [
        { id: uid(), name: "Garden Salad", description: "Fresh mixed greens with house vinaigrette", price: "45", dietary: ["V", "GF"], featured: false },
        { id: uid(), name: "Mushroom Soup", description: "Creamy wild mushroom with crusty bread", price: "55", dietary: ["V"], featured: false },
        { id: uid(), name: "Bruschetta", description: "Toasted ciabatta with tomatoes, basil and mozzarella", price: "60", dietary: ["V"], featured: true },
      ],
    },
    {
      id: uid(), title: "Main Course", subtitle: "Signature dishes prepared with care", visible: true,
      items: [
        { id: uid(), name: "Grilled Tilapia", description: "Lake Kariba tilapia with nshima and seasonal vegetables", price: "120", dietary: ["GF"], featured: true },
        { id: uid(), name: "Beef Stew", description: "Slow-cooked Zambian beef with traditional greens", price: "110", dietary: ["GF", "DF"], featured: false },
        { id: uid(), name: "Village Chicken", description: "Free-range chicken with rice and mushroom gravy", price: "95", dietary: [], featured: false },
        { id: uid(), name: "Lamb Shank", description: "Braised lamb shank with roasted root vegetables", price: "145", dietary: ["GF"], featured: false },
      ],
    },
    {
      id: uid(), title: "Desserts", subtitle: "Sweet endings", visible: true,
      items: [
        { id: uid(), name: "Munkoyo Ice Cream", description: "Traditional Zambian flavour craft ice cream", price: "40", dietary: ["V"], featured: false },
        { id: uid(), name: "Chocolate Fondant", description: "Warm chocolate lava cake with vanilla ice cream", price: "65", dietary: ["V"], featured: true },
      ],
    },
    {
      id: uid(), title: "Beverages", subtitle: "Drinks & refreshments", visible: true,
      items: [
        { id: uid(), name: "Fresh Mango Juice", description: "Seasonal Zambian mangoes, freshly squeezed", price: "25", dietary: ["V", "VG", "GF", "DF"], featured: false },
        { id: uid(), name: "Zambian Tea", description: "Black tea served with milk and honey", price: "15", dietary: ["V"], featured: false },
        { id: uid(), name: "Craft Beer", description: "Local Mosi lager or pale ale", price: "35", dietary: ["VG"], featured: false },
      ],
    },
  ];

  return {
    menuType: type,
    restaurantName: "The Lusaka Kitchen",
    tagline: "A Taste of Zambia",
    headerNote: "",
    footerNote: "Please inform our staff of any allergies or dietary requirements.",
    currency: { code: "ZMW", symbol: "K", position: "before", separator: "" },
    sections,
    style: {
      template: "elegant-serif",
      accentColor: "#b8860b",
      bgColor: "#faf6ef",
      textColor: "#1a1a1a",
      fontPairing: "playfair-lato",
      fontScale: 1,
      priceStyle: "dots",
      dividerStyle: "ornamental",
      columnLayout: "single",
      showDietaryLegend: true,
      showItemDescriptions: true,
      showSectionSubtitles: true,
      headerStyle: "centered",
      borderStyle: "thin",
      itemSpacing: "normal",
    },
    format: {
      pageSize: "a4",
      foldType: "flat",
      margins: "standard",
      orientation: "portrait",
      bleedMarks: false,
      cropMarks: false,
    },
  };
}

export function getMenuTemplate(id: string): MenuTemplateConfig {
  return MENU_TEMPLATES.find((t) => t.id === id) ?? MENU_TEMPLATES[0];
}

// ---------------------------------------------------------------------------
// Store Interface
// ---------------------------------------------------------------------------

export interface MenuDesignerEditorState {
  form: MenuDesignerFormData;
  accentColorLocked: boolean;

  // Top-level
  setForm: (form: MenuDesignerFormData) => void;
  resetForm: (menuType?: MenuType) => void;
  setMenuType: (type: MenuType) => void;

  // Accent color lock
  setAccentColorLocked: (locked: boolean) => void;

  // Header / Restaurant
  updateHeader: (patch: Partial<Pick<MenuDesignerFormData, "restaurantName" | "tagline" | "headerNote" | "footerNote">>) => void;

  // Currency
  setCurrency: (currency: CurrencyConfig) => void;

  // Sections
  addSection: (title?: string) => string;
  removeSection: (id: string) => void;
  updateSection: (id: string, patch: Partial<Pick<MenuSection, "title" | "subtitle" | "visible">>) => void;
  reorderSections: (ids: string[]) => void;

  // Items
  addItem: (sectionId: string, item?: Partial<MenuItem>) => string;
  removeItem: (sectionId: string, itemId: string) => void;
  updateItem: (sectionId: string, itemId: string, patch: Partial<MenuItem>) => void;
  reorderItems: (sectionId: string, itemIds: string[]) => void;

  // Style
  updateStyle: (patch: Partial<MenuStyleConfig>) => void;
  setTemplate: (template: MenuTemplate) => void;
  setAccentColor: (color: string) => void;

  // Format
  updateFormat: (patch: Partial<MenuFormatConfig>) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useMenuDesignerEditor = create<MenuDesignerEditorState>()(
  temporal(
    persist(
      immer<MenuDesignerEditorState>((set) => ({
        form: createDefaultMenuForm(),
        accentColorLocked: false,

        setAccentColorLocked: (locked) =>
          set((s) => {
            s.accentColorLocked = locked;
          }),

        setMenuType: (type) =>
          set((s) => {
            const typeConfig = MENU_TYPES.find((t) => t.id === type);
            s.form.menuType = type;
            if (typeConfig) {
              s.form.restaurantName = s.form.restaurantName || typeConfig.defaultTitle;
            }
          }),

        setForm: (form) =>
          set((s) => {
            s.form = form;
          }),

        resetForm: (menuType) =>
          set((s) => {
            s.form = createDefaultMenuForm(menuType ?? s.form.menuType);
            s.accentColorLocked = false;
          }),

        updateHeader: (patch) =>
          set((s) => {
            Object.assign(s.form, patch);
          }),

        setCurrency: (currency) =>
          set((s) => {
            s.form.currency = currency;
          }),

        // Sections
        addSection: (title) => {
          const id = uid();
          set((s) => {
            s.form.sections.push(createDefaultSection(title ?? "New Section"));
            s.form.sections[s.form.sections.length - 1].id = id;
          });
          return id;
        },

        removeSection: (id) =>
          set((s) => {
            s.form.sections = s.form.sections.filter((sec) => sec.id !== id);
          }),

        updateSection: (id, patch) =>
          set((s) => {
            const sec = s.form.sections.find((sec) => sec.id === id);
            if (sec) Object.assign(sec, patch);
          }),

        reorderSections: (ids) =>
          set((s) => {
            const map = new Map(s.form.sections.map((sec) => [sec.id, sec]));
            s.form.sections = ids.map((id) => map.get(id)).filter(Boolean) as MenuSection[];
          }),

        // Items
        addItem: (sectionId, item) => {
          const id = uid();
          set((s) => {
            const sec = s.form.sections.find((sec) => sec.id === sectionId);
            if (sec) {
              const newItem = createDefaultItem(item?.name, item?.description, item?.price);
              newItem.id = id;
              if (item?.dietary) newItem.dietary = item.dietary;
              if (item?.featured) newItem.featured = item.featured;
              sec.items.push(newItem);
            }
          });
          return id;
        },

        removeItem: (sectionId, itemId) =>
          set((s) => {
            const sec = s.form.sections.find((sec) => sec.id === sectionId);
            if (sec) {
              sec.items = sec.items.filter((item) => item.id !== itemId);
            }
          }),

        updateItem: (sectionId, itemId, patch) =>
          set((s) => {
            const sec = s.form.sections.find((sec) => sec.id === sectionId);
            if (sec) {
              const item = sec.items.find((item) => item.id === itemId);
              if (item) Object.assign(item, patch);
            }
          }),

        reorderItems: (sectionId, itemIds) =>
          set((s) => {
            const sec = s.form.sections.find((sec) => sec.id === sectionId);
            if (sec) {
              const map = new Map(sec.items.map((item) => [item.id, item]));
              sec.items = itemIds.map((id) => map.get(id)).filter(Boolean) as MenuItem[];
            }
          }),

        // Style
        updateStyle: (patch) =>
          set((s) => {
            if (patch.accentColor) s.accentColorLocked = true;
            Object.assign(s.form.style, patch);
          }),

        setTemplate: (template) =>
          set((s) => {
            s.form.style.template = template;
            if (!s.accentColorLocked) {
              const tpl = getMenuTemplate(template);
              s.form.style.accentColor = tpl.accent;
              s.form.style.bgColor = tpl.bgColor;
              s.form.style.textColor = tpl.textColor;
              s.form.style.fontPairing = tpl.fontPairing;
              s.form.style.priceStyle = tpl.priceStyle;
              s.form.style.dividerStyle = tpl.dividerStyle;
            }
          }),

        setAccentColor: (color) =>
          set((s) => {
            s.form.style.accentColor = color;
            s.accentColorLocked = true;
          }),

        // Format
        updateFormat: (patch) =>
          set((s) => {
            Object.assign(s.form.format, patch);
          }),
      })),
      {
        name: "dmsuite-menu-designer",
        version: 1,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ form: s.form, accentColorLocked: s.accentColorLocked }),
      },
    ),
    {
      partialize: (state) => ({ form: state.form }),
      equality: (a, b) => equal(a, b),
      limit: 50,
    },
  ),
);

// ---------------------------------------------------------------------------
// Undo hook
// ---------------------------------------------------------------------------

export function useMenuDesignerUndo() {
  const { undo, redo, pastStates, futureStates } =
    useMenuDesignerEditor.temporal.getState();
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Price formatting helper
// ---------------------------------------------------------------------------

export function formatPrice(price: string, currency: CurrencyConfig): string {
  if (!price) return "";
  const val = price.replace(/[^\d.,]/g, "");
  if (!val) return "";
  if (currency.position === "after") {
    return `${val}${currency.separator}${currency.symbol}`;
  }
  return `${currency.symbol}${currency.separator}${val}`;
}
