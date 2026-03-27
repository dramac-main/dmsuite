// =============================================================================
// DMSuite — Menu Designer Action Manifest for Chiko
// Gives Chiko AI full control over the Menu Designer:
// content, sections, items, dietary tags, style, and format settings.
// Follows the exact same architecture as certificate.ts.
// =============================================================================

import type { ChikoActionManifest, ChikoActionResult } from "@/stores/chiko-actions";
import {
  useMenuDesignerEditor,
  type MenuDesignerFormData,
  type MenuType,
  type MenuStyleConfig,
  type MenuFormatConfig,
  type MenuTemplate,
  type MenuItem,
  type CurrencyConfig,
  type DietaryTag,
  CURRENCIES,
} from "@/stores/menu-designer-editor";
import { withActivityLogging } from "@/stores/activity-log";
import { useBusinessMemory } from "@/stores/business-memory";

// ---------------------------------------------------------------------------
// Manifest Options
// ---------------------------------------------------------------------------

export interface MenuDesignerManifestOptions {
  onPrintRef?: React.RefObject<(() => void) | null>;
}

// ---------------------------------------------------------------------------
// Internal getState helper
// ---------------------------------------------------------------------------

function readMenuState(): Record<string, unknown> {
  const { form } = useMenuDesignerEditor.getState();
  return {
    menuType: form.menuType,
    restaurantName: form.restaurantName,
    tagline: form.tagline,
    headerNote: form.headerNote,
    footerNote: form.footerNote,
    currency: form.currency,
    sectionCount: form.sections.length,
    sections: form.sections.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      visible: s.visible,
      itemCount: s.items.length,
      items: s.items.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        dietary: item.dietary,
        featured: item.featured,
      })),
    })),
    style: { ...form.style },
    format: { ...form.format },
  };
}

// ---------------------------------------------------------------------------
// Pre-print Validation
// ---------------------------------------------------------------------------

interface ValidationIssue {
  severity: "error" | "warning";
  field: string;
  message: string;
}

function validateMenu(): { issues: ValidationIssue[]; ready: boolean } {
  const { form } = useMenuDesignerEditor.getState();
  const issues: ValidationIssue[] = [];

  if (!form.restaurantName || form.restaurantName.trim().length === 0) {
    issues.push({ severity: "warning", field: "restaurantName", message: "Restaurant name is empty" });
  }
  if (form.sections.length === 0) {
    issues.push({ severity: "error", field: "sections", message: "Menu has no sections — add at least one" });
  }
  const totalItems = form.sections.reduce((n, s) => n + s.items.length, 0);
  if (totalItems === 0) {
    issues.push({ severity: "error", field: "items", message: "Menu has no items — add at least one item" });
  }
  const unnamedItems = form.sections.flatMap((s) => s.items.filter((i) => !i.name.trim()));
  if (unnamedItems.length > 0) {
    issues.push({ severity: "warning", field: "items", message: `${unnamedItems.length} item(s) have no name` });
  }
  const unpricedItems = form.sections.flatMap((s) => s.items.filter((i) => !i.price.trim()));
  if (unpricedItems.length > 0) {
    issues.push({ severity: "warning", field: "items", message: `${unpricedItems.length} item(s) have no price` });
  }

  const errorCount = issues.filter((i) => i.severity === "error").length;
  return { issues, ready: errorCount === 0 };
}

// ---------------------------------------------------------------------------
// Manifest Factory
// ---------------------------------------------------------------------------

export function createMenuDesignerManifest(options?: MenuDesignerManifestOptions): ChikoActionManifest {
  const baseManifest: ChikoActionManifest = {
    toolId: "menu-designer",
    toolName: "Menu Designer",
    actions: [
      // ── Header / Restaurant ─────────────────────────────────────────────
      {
        name: "updateHeader",
        description: "Update restaurant header: restaurantName, tagline, headerNote, footerNote.",
        parameters: {
          type: "object",
          properties: {
            restaurantName: { type: "string", description: "Restaurant or venue name" },
            tagline: { type: "string", description: "Tagline or subtitle" },
            headerNote: { type: "string", description: "Note at the top of the menu" },
            footerNote: { type: "string", description: "Note at the bottom (e.g. allergies disclaimer)" },
          },
        },
        category: "Content",
      },

      // ── Menu Type ──────────────────────────────────────────────────────────
      {
        name: "setMenuType",
        description: "Change the menu type.",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "restaurant", "cafe", "bar-cocktail", "fine-dining", "buffet",
                "prix-fixe", "wedding-event", "takeaway", "food-truck",
                "wine-list", "kids", "dessert", "brunch",
              ],
              description: "Menu type",
            },
          },
          required: ["type"],
        },
        category: "Content",
      },

      // ── Currency ──────────────────────────────────────────────────────────
      {
        name: "setCurrency",
        description: "Set the currency for menu prices by code (e.g. ZMW, USD, EUR, GBP).",
        parameters: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "Currency code (e.g. ZMW, USD, GBP, EUR, ZAR, KES, NGN)",
            },
          },
          required: ["code"],
        },
        category: "Content",
      },

      // ── Sections ──────────────────────────────────────────────────────────
      {
        name: "addSection",
        description: "Add a new menu section. Returns the new section ID.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Section title (e.g. 'Starters', 'Main Course', 'Desserts')" },
          },
        },
        category: "Menu",
      },
      {
        name: "updateSection",
        description: "Update a section's title, subtitle, or visibility.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Section ID (from readCurrentState)" },
            title: { type: "string", description: "Section title" },
            subtitle: { type: "string", description: "Section subtitle" },
            visible: { type: "boolean", description: "Show or hide section" },
          },
          required: ["id"],
        },
        category: "Menu",
      },
      {
        name: "removeSection",
        description: "Remove a menu section and all its items.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Section ID" },
          },
          required: ["id"],
        },
        category: "Menu",
        destructive: true,
      },

      // ── Items ─────────────────────────────────────────────────────────────
      {
        name: "addItem",
        description: "Add a menu item to a section. Returns the new item ID.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string", description: "Section ID to add the item to" },
            name: { type: "string", description: "Item name (e.g. 'Grilled Tilapia')" },
            description: { type: "string", description: "Item description" },
            price: { type: "string", description: "Price as string (e.g. '120')" },
            dietary: {
              type: "array",
              items: { type: "string", enum: ["V", "VG", "GF", "DF", "N", "SF", "K", "H", "O", "S"] },
              description: "Dietary tags (V=Vegetarian, VG=Vegan, GF=Gluten Free, etc.)",
            },
            featured: { type: "boolean", description: "Mark as featured/signature item" },
          },
          required: ["sectionId", "name"],
        },
        category: "Menu",
      },
      {
        name: "updateItem",
        description: "Update a menu item.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string", description: "Section ID containing the item" },
            itemId: { type: "string", description: "Item ID (from readCurrentState)" },
            name: { type: "string", description: "Item name" },
            description: { type: "string", description: "Item description" },
            price: { type: "string", description: "Price as string" },
            dietary: {
              type: "array",
              items: { type: "string", enum: ["V", "VG", "GF", "DF", "N", "SF", "K", "H", "O", "S"] },
              description: "Dietary tags",
            },
            featured: { type: "boolean", description: "Featured item flag" },
          },
          required: ["sectionId", "itemId"],
        },
        category: "Menu",
      },
      {
        name: "removeItem",
        description: "Remove a menu item.",
        parameters: {
          type: "object",
          properties: {
            sectionId: { type: "string", description: "Section ID" },
            itemId: { type: "string", description: "Item ID" },
          },
          required: ["sectionId", "itemId"],
        },
        category: "Menu",
        destructive: true,
      },

      // ── Style ─────────────────────────────────────────────────────────────
      {
        name: "updateStyle",
        description:
          "Change visual style: template, accentColor, fontPairing, fontScale, priceStyle, dividerStyle, columnLayout, headerStyle, borderStyle, itemSpacing, showDietaryLegend, showItemDescriptions, showSectionSubtitles.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "elegant-serif", "modern-minimal", "rustic-kraft", "bistro-classic",
                "cocktail-bar", "farm-to-table", "asian-fusion", "italian-trattoria",
                "seafood-coastal", "steakhouse-bold", "cafe-playful", "prix-fixe-luxury",
              ],
              description: "Visual template preset",
            },
            accentColor: { type: "string", description: "Accent colour as hex (e.g. #b8860b)" },
            fontPairing: {
              type: "string",
              enum: [
                "playfair-lato", "inter-jetbrains", "merriweather-opensans", "cormorant-montserrat",
                "crimson-source", "poppins-inter", "oswald-roboto", "dm-serif-dm-sans",
                "josefin-nunito", "abril-raleway",
              ],
              description: "Font pairing ID",
            },
            fontScale: { type: "number", description: "Font scale multiplier (0.7–1.4)" },
            priceStyle: {
              type: "string",
              enum: ["dots", "right-aligned", "inline", "centered", "parentheses"],
              description: "Price display style",
            },
            dividerStyle: {
              type: "string",
              enum: [
                "none", "thin-line", "thick-rule", "dashed", "ornamental",
                "dots-pattern", "botanical", "wave", "brush-stroke", "grape-vine", "glow-line",
              ],
              description: "Section divider style",
            },
            columnLayout: {
              type: "string",
              enum: ["single", "two-column", "three-column"],
              description: "Column layout",
            },
            headerStyle: {
              type: "string",
              enum: ["centered", "left-aligned", "accent-bar"],
              description: "Header alignment style",
            },
            borderStyle: {
              type: "string",
              enum: ["none", "thin", "double", "ornate", "accent-edge"],
              description: "Page border style",
            },
            itemSpacing: {
              type: "string",
              enum: ["tight", "normal", "relaxed"],
              description: "Spacing between items",
            },
            showDietaryLegend: { type: "boolean", description: "Show dietary legend at bottom" },
            showItemDescriptions: { type: "boolean", description: "Show item descriptions" },
            showSectionSubtitles: { type: "boolean", description: "Show section subtitles" },
          },
        },
        category: "Style",
      },
      {
        name: "setTemplate",
        description: "Quick-apply a full template preset. Updates accent, fonts, colors, dividers, and price style at once.",
        parameters: {
          type: "object",
          properties: {
            template: {
              type: "string",
              enum: [
                "elegant-serif", "modern-minimal", "rustic-kraft", "bistro-classic",
                "cocktail-bar", "farm-to-table", "asian-fusion", "italian-trattoria",
                "seafood-coastal", "steakhouse-bold", "cafe-playful", "prix-fixe-luxury",
              ],
              description: "Template preset ID",
            },
          },
          required: ["template"],
        },
        category: "Style",
      },

      // ── Format ────────────────────────────────────────────────────────────
      {
        name: "updateFormat",
        description: "Change format settings: pageSize, orientation, margins, foldType, bleedMarks, cropMarks.",
        parameters: {
          type: "object",
          properties: {
            pageSize: { type: "string", enum: ["a4", "letter", "a5", "dl", "square", "tabloid"], description: "Paper size" },
            orientation: { type: "string", enum: ["landscape", "portrait"], description: "Page orientation" },
            margins: { type: "string", enum: ["narrow", "standard", "wide"], description: "Margin size" },
            foldType: { type: "string", enum: ["flat", "bi-fold", "tri-fold"], description: "Fold type" },
            bleedMarks: { type: "boolean", description: "Show bleed marks" },
            cropMarks: { type: "boolean", description: "Show crop marks" },
          },
        },
        category: "Format",
      },

      // ── Reset / Read ──────────────────────────────────────────────────────
      {
        name: "resetForm",
        description: "Reset the menu to defaults. WARNING: Erases all current content.",
        parameters: {
          type: "object",
          properties: {
            menuType: {
              type: "string",
              enum: [
                "restaurant", "cafe", "bar-cocktail", "fine-dining", "buffet",
                "prix-fixe", "wedding-event", "takeaway", "food-truck",
                "wine-list", "kids", "dessert", "brunch",
              ],
              description: "Menu type to reset to (optional — defaults to current type)",
            },
          },
        },
        category: "Document",
        destructive: true,
      },
      {
        name: "readCurrentState",
        description: "Read all current menu settings. No changes made.",
        parameters: { type: "object", properties: {} },
        category: "Read",
      },
      {
        name: "prefillFromMemory",
        description: "Pre-fill restaurant name from saved business profile.",
        parameters: { type: "object", properties: {} },
        category: "Content",
      },

      // ── Validation ─────────────────────────────────────────────────────────
      {
        name: "validateBeforePrint",
        description:
          "Check the menu for issues before printing: missing items, unnamed entries, missing prices. ALWAYS call this before exportPrint.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },

      // ── Export ─────────────────────────────────────────────────────────────
      {
        name: "exportPrint",
        description: "Open the browser print dialog for the current menu.",
        parameters: { type: "object", properties: {} },
        category: "Export",
      },
    ],

    // ── getState ─────────────────────────────────────────────────────────────
    getState: readMenuState,

    // ── executeAction ─────────────────────────────────────────────────────────
    executeAction: (actionName: string, params: Record<string, unknown>): ChikoActionResult => {
      const store = useMenuDesignerEditor.getState();
      try {
        switch (actionName) {
          case "updateHeader":
            store.updateHeader(params as Parameters<typeof store.updateHeader>[0]);
            return { success: true, message: "Header updated" };

          case "setMenuType":
            store.setMenuType(params.type as MenuType);
            return { success: true, message: `Menu type changed to ${params.type}` };

          case "setCurrency": {
            const curr = CURRENCIES.find((c) => c.code === params.code);
            if (!curr) return { success: false, message: `Unknown currency: ${params.code}` };
            store.setCurrency(curr);
            return { success: true, message: `Currency set to ${curr.code} (${curr.symbol})` };
          }

          case "addSection": {
            const id = store.addSection(params.title as string | undefined);
            return { success: true, message: `Section added (id: ${id})` };
          }

          case "updateSection":
            store.updateSection(params.id as string, params as Parameters<typeof store.updateSection>[1]);
            return { success: true, message: "Section updated" };

          case "removeSection":
            store.removeSection(params.id as string);
            return { success: true, message: "Section removed" };

          case "addItem": {
            const id = store.addItem(params.sectionId as string, {
              name: params.name as string | undefined,
              description: params.description as string | undefined,
              price: params.price as string | undefined,
              dietary: params.dietary as DietaryTag[] | undefined,
              featured: params.featured as boolean | undefined,
            });
            return { success: true, message: `Item added (id: ${id})` };
          }

          case "updateItem":
            store.updateItem(
              params.sectionId as string,
              params.itemId as string,
              params as Partial<MenuItem>,
            );
            return { success: true, message: "Item updated" };

          case "removeItem":
            store.removeItem(params.sectionId as string, params.itemId as string);
            return { success: true, message: "Item removed" };

          case "updateStyle":
            store.updateStyle(params as Partial<MenuStyleConfig>);
            return { success: true, message: "Style updated" };

          case "setTemplate":
            store.setTemplate(params.template as MenuTemplate);
            return { success: true, message: `Template set to ${params.template}` };

          case "updateFormat":
            store.updateFormat(params as Partial<MenuFormatConfig>);
            return { success: true, message: "Format updated" };

          case "resetForm":
            store.resetForm(params.menuType as MenuType | undefined);
            return { success: true, message: "Menu reset to defaults" };

          case "readCurrentState":
            return { success: true, message: "Current menu state", newState: readMenuState() };

          case "prefillFromMemory": {
            const memory = useBusinessMemory.getState();
            if (!memory.hasProfile) {
              return { success: false, message: "No business profile saved yet. Ask the user to set up their Business Memory first." };
            }
            const profile = memory.profile;
            if (profile.companyName) {
              store.updateHeader({ restaurantName: profile.companyName });
              return { success: true, message: `Restaurant name pre-filled: ${profile.companyName}` };
            }
            return { success: false, message: "Business profile has no company name to pre-fill." };
          }

          case "validateBeforePrint": {
            const { issues, ready } = validateMenu();
            const errorCount = issues.filter((i) => i.severity === "error").length;
            const warningCount = issues.filter((i) => i.severity === "warning").length;
            let msg = "";
            if (ready && warningCount === 0) {
              msg = "Menu is ready to print — no issues found.";
            } else if (ready) {
              msg = `Menu can be printed but has ${warningCount} warning(s) to review:\n`;
              for (const i of issues) msg += `  ⚠ ${i.message}\n`;
            } else {
              msg = `Menu has ${errorCount} error(s) and ${warningCount} warning(s):\n`;
              for (const i of issues) msg += `  ${i.severity === "error" ? "✘" : "⚠"} ${i.message}\n`;
            }
            return { success: true, message: msg.trim(), newState: { issues, ready, errorCount, warningCount } };
          }

          case "exportPrint": {
            const { issues, ready } = validateMenu();
            const errors = issues.filter((i) => i.severity === "error");
            if (!ready) {
              return {
                success: false,
                message: `Cannot print — ${errors.length} error(s) found:\n${errors.map((i) => `• ${i.message}`).join("\n")}`,
              };
            }
            const handler = options?.onPrintRef?.current;
            if (!handler) {
              return { success: false, message: "Export not ready yet — please wait and try again." };
            }
            handler();
            return { success: true, message: `Print dialog opened for ${store.form.restaurantName || "menu"}.` };
          }

          default:
            return { success: false, message: `Unknown action: ${actionName}` };
        }
      } catch (err) {
        return { success: false, message: `Action failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    },
  };

  return withActivityLogging(
    baseManifest,
    () => useMenuDesignerEditor.getState().form,
    (snapshot) => useMenuDesignerEditor.getState().setForm(snapshot as MenuDesignerFormData),
  );
}
