// =============================================================================
// DMSuite — Menu Designer: Menu Tab
// Section management and menu item editing — the core data tab.
// Users add/remove/reorder sections and items, set dietary tags, prices, etc.
// =============================================================================

"use client";

import { useState, useCallback } from "react";
import {
  useMenuDesignerEditor,
  DIETARY_TAGS,
  type DietaryTag,
  type MenuSection,
  type MenuItem,
} from "@/stores/menu-designer-editor";
import {
  AccordionSection,
  FormInput,
  FormTextarea,
  ActionButton,
  IconButton,
  Toggle,
  SIcon,
  EmptyState,
} from "@/components/workspaces/shared/WorkspaceUIKit";

// ━━━ Icons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const menuIcons = {
  section: <SIcon d="M4 6h16M4 12h16M4 18h16" />,
  item: <SIcon d="M12 5v14M5 12h14" />,
  trash: <SIcon d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />,
  star: <SIcon d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  reorder: <SIcon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  moveUp: <SIcon d="M12 19V5M5 12l7-7 7 7" />,
  moveDown: <SIcon d="M12 5v14M5 12l7 7 7-7" />,
};

// ━━━ Dietary Tag Picker ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DietaryTagPicker({ selected, onChange }: { selected: DietaryTag[]; onChange: (tags: DietaryTag[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {DIETARY_TAGS.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              if (active) {
                onChange(selected.filter((t) => t !== tag.id));
              } else {
                onChange([...selected, tag.id]);
              }
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
              active
                ? "border-primary-500/40 bg-primary-500/15 text-primary-300"
                : "border-gray-700/40 text-gray-500 hover:border-gray-600 hover:text-gray-400"
            }`}
            title={tag.label}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: tag.color }}
            />
            {tag.id}
          </button>
        );
      })}
    </div>
  );
}

// ━━━ Single Menu Item Editor ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MenuItemEditor({
  item,
  sectionId,
  currencySymbol,
  onUpdate,
  onRemove,
}: {
  item: MenuItem;
  sectionId: string;
  currencySymbol: string;
  onUpdate: (sectionId: string, itemId: string, patch: Partial<MenuItem>) => void;
  onRemove: (sectionId: string, itemId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative group rounded-lg border border-gray-800/40 bg-gray-800/20 hover:border-gray-700/50 transition-all">
      {/* Compact row */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Featured star */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onUpdate(sectionId, item.id, { featured: !item.featured }); }}
          className={`shrink-0 transition-colors ${item.featured ? "text-yellow-400" : "text-gray-700 hover:text-gray-500"}`}
          title={item.featured ? "Unmark featured" : "Mark as featured"}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill={item.featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>

        {/* Name + price summary */}
        <span className="flex-1 text-[12px] text-gray-300 truncate font-medium">
          {item.name || "Untitled Item"}
        </span>
        <span className="text-[11px] text-primary-400 font-mono shrink-0">
          {item.price ? `${currencySymbol}${item.price}` : "—"}
        </span>

        {/* Dietary badges */}
        {item.dietary.length > 0 && (
          <div className="flex gap-0.5 shrink-0">
            {item.dietary.slice(0, 3).map((d) => {
              const cfg = DIETARY_TAGS.find((t) => t.id === d);
              return (
                <span
                  key={d}
                  className="w-3.5 h-3.5 rounded-full text-[7px] font-bold text-white flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cfg?.color }}
                >
                  {d}
                </span>
              );
            })}
            {item.dietary.length > 3 && (
              <span className="text-[8px] text-gray-600">+{item.dietary.length - 3}</span>
            )}
          </div>
        )}

        {/* Expand chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="currentColor"
          className={`text-gray-600 transition-transform duration-150 ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M3 1l4 4-4 4" />
        </svg>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-gray-800/30">
          <div className="pt-2.5">
            <FormInput
              label="Item Name"
              value={item.name}
              onChange={(e) => onUpdate(sectionId, item.id, { name: e.target.value })}
              placeholder="Grilled Tilapia"
            />
          </div>
          <FormTextarea
            label="Description"
            value={item.description}
            onChange={(e) => onUpdate(sectionId, item.id, { description: e.target.value })}
            placeholder="Short description of the dish..."
            rows={2}
          />
          <FormInput
            label={`Price (${currencySymbol})`}
            value={item.price}
            onChange={(e) => onUpdate(sectionId, item.id, { price: e.target.value.replace(/[^\d.,]/g, "") })}
            placeholder="120"
          />
          <div>
            <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">Dietary Tags</label>
            <DietaryTagPicker
              selected={item.dietary}
              onChange={(tags) => onUpdate(sectionId, item.id, { dietary: tags })}
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => onRemove(sectionId, item.id)}
              className="text-[10px] text-error/70 hover:text-error transition-colors"
            >
              Remove Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━ Section Editor ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function SectionEditor({
  section,
  index,
  totalSections,
}: {
  section: MenuSection;
  index: number;
  totalSections: number;
}) {
  const updateSection = useMenuDesignerEditor((s) => s.updateSection);
  const removeSection = useMenuDesignerEditor((s) => s.removeSection);
  const addItem = useMenuDesignerEditor((s) => s.addItem);
  const updateItem = useMenuDesignerEditor((s) => s.updateItem);
  const removeItem = useMenuDesignerEditor((s) => s.removeItem);
  const reorderSections = useMenuDesignerEditor((s) => s.reorderSections);
  const form = useMenuDesignerEditor((s) => s.form);
  const currencySymbol = form.currency.symbol;

  const [isOpen, setIsOpen] = useState(index === 0);

  const moveSection = useCallback((dir: -1 | 1) => {
    const sectionIds = form.sections.map((s) => s.id);
    const idx = sectionIds.indexOf(section.id);
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= sectionIds.length) return;
    const newIds = [...sectionIds];
    [newIds[idx], newIds[newIdx]] = [newIds[newIdx], newIds[idx]];
    reorderSections(newIds);
  }, [form.sections, section.id, reorderSections]);

  return (
    <AccordionSection
      title={section.title || "Untitled Section"}
      icon={menuIcons.section}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      badge={`${section.items.length}`}
    >
      <div className="px-4 pb-4 space-y-3">
        {/* Section header fields */}
        <FormInput
          label="Section Title"
          value={section.title}
          onChange={(e) => updateSection(section.id, { title: e.target.value })}
          placeholder="Starters"
        />
        <FormInput
          label="Section Subtitle"
          value={section.subtitle}
          onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
          placeholder="Begin your dining experience"
        />

        {/* Visibility toggle */}
        <Toggle
          checked={section.visible}
          onChange={(v) => updateSection(section.id, { visible: v })}
          label="Show Section"
          description="Hide this section without deleting it"
        />

        {/* Reorder buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => moveSection(-1)}
            disabled={index === 0}
            className="text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {menuIcons.moveUp} Move Up
          </button>
          <button
            type="button"
            onClick={() => moveSection(1)}
            disabled={index === totalSections - 1}
            className="text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {menuIcons.moveDown} Move Down
          </button>
        </div>

        {/* Items list */}
        <div>
          <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
            Items ({section.items.length})
          </label>

          {section.items.length === 0 ? (
            <EmptyState
              title="No items yet"
              description="Add your first menu item to this section"
            />
          ) : (
            <div className="space-y-1.5">
              {section.items.map((item) => (
                <MenuItemEditor
                  key={item.id}
                  item={item}
                  sectionId={section.id}
                  currencySymbol={currencySymbol}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}

          <ActionButton
            variant="ghost"
            size="sm"
            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
            onClick={() => addItem(section.id)}
            className="w-full mt-2"
          >
            Add Item
          </ActionButton>
        </div>

        {/* Delete section */}
        <div className="flex justify-end pt-1 border-t border-gray-800/30">
          <button
            type="button"
            onClick={() => removeSection(section.id)}
            className="text-[10px] text-error/70 hover:text-error transition-colors"
          >
            Delete Section
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}

// ━━━ Main Tab Component ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function MenuDesignerMenuTab() {
  const form = useMenuDesignerEditor((s) => s.form);
  const addSection = useMenuDesignerEditor((s) => s.addSection);

  const totalItems = form.sections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <div>
      {/* Stats bar */}
      <div className="px-4 py-2.5 border-b border-gray-800/30 flex items-center gap-3">
        <span className="text-[10px] text-gray-500">
          <span className="text-primary-400 font-mono">{form.sections.length}</span> sections
        </span>
        <span className="w-px h-3 bg-gray-800" />
        <span className="text-[10px] text-gray-500">
          <span className="text-primary-400 font-mono">{totalItems}</span> items
        </span>
      </div>

      {/* Sections */}
      <div className="divide-y divide-gray-800/30">
        {form.sections.map((section, i) => (
          <SectionEditor
            key={section.id}
            section={section}
            index={i}
            totalSections={form.sections.length}
          />
        ))}
      </div>

      {/* Add section button */}
      <div className="p-4">
        <ActionButton
          variant="secondary"
          size="sm"
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
          onClick={() => addSection()}
          className="w-full"
        >
          Add Section
        </ActionButton>
      </div>
    </div>
  );
}
