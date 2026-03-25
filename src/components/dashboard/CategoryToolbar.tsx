"use client";

import { useState } from "react";

export type SortOption = "default" | "name-asc" | "name-desc" | "status";
export type FilterStatus = "all" | "ready" | "beta" | "coming-soon";

interface CategoryToolbarProps {
  sortBy: SortOption;
  filterStatus: FilterStatus;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterStatus) => void;
  totalCount: number;
}

const sortLabels: Record<SortOption, string> = {
  default: "Default",
  "name-asc": "A → Z",
  "name-desc": "Z → A",
  status: "By status",
};

const filterLabels: Record<FilterStatus, string> = {
  all: "All",
  ready: "Ready",
  beta: "Beta",
  "coming-soon": "Coming Soon",
};

export default function CategoryToolbar({
  sortBy,
  filterStatus,
  onSortChange,
  onFilterChange,
  totalCount,
}: CategoryToolbarProps) {
  const [showSort, setShowSort] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter pills */}
      <div className="flex items-center gap-1">
        {(Object.keys(filterLabels) as FilterStatus[]).map((key) => (
          <button
            key={key}
            onClick={() => onFilterChange(key)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              filterStatus === key
                ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"
            }`}
          >
            {filterLabels[key]}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Count badge */}
        <span className="text-[10px] text-gray-500">
          {totalCount} tools
        </span>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSort((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-white/5 transition-all"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="14" y2="12" />
              <line x1="4" y1="18" x2="8" y2="18" />
            </svg>
            {sortLabels[sortBy]}
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-white/10 bg-gray-900/95 backdrop-blur-xl shadow-2xl py-1 z-50">
              {(Object.keys(sortLabels) as SortOption[]).map((key) => (
                <button
                  key={key}
                  onClick={() => { onSortChange(key); setShowSort(false); }}
                  className={`flex items-center w-full px-3 py-1.5 text-xs transition-colors ${
                    sortBy === key
                      ? "text-primary-400 bg-primary-500/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {sortLabels[key]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
