"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchTools, type FlatTool, totalToolCount } from "@/data/tools";
import { iconMap, IconSearch, IconArrowRight, IconX, IconSparkles } from "@/components/icons";

export default function HeroBanner() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const results: FlatTool[] = useMemo(() => searchTools(query), [query]);
  const visibleResults = results.slice(0, 8);
  const showResults = focused && query.length > 0;

  /** Close dropdown on outside click instead of race-prone setTimeout */
  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setFocused(false);
      setSelectedIdx(-1);
    }
  }, []);

  /** Keyboard navigation in search results */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showResults || visibleResults.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, visibleResults.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIdx >= 0 && visibleResults[selectedIdx]) {
          const t = visibleResults[selectedIdx];
          router.push(`/tools/${t.categoryId}/${t.id}`);
        }
        break;
      case "Escape":
        e.preventDefault();
        setFocused(false);
        setSelectedIdx(-1);
        break;
    }
  }, [showResults, visibleResults, selectedIdx, router]);

  return (
    <section className="relative z-20 mb-8">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-secondary-500/10 blur-3xl" />
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl p-6 sm:p-8 lg:p-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 mb-4">
          <IconSparkles className="size-3.5 text-primary-500" />
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
            AI-Powered Suite
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
          Your Complete{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 to-secondary-400">
            AI Creative Studio
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-xl mb-6">
          {totalToolCount}+ AI tools for design, documents, video, content, marketing & more —
          everything to deliver jaw-dropping results for your clients.
        </p>

        {/* Search bar */}
        <div ref={containerRef} onBlur={handleBlur} className="relative max-w-lg z-50">
          <div
            className={`
              relative flex items-center h-12 rounded-xl
              bg-white dark:bg-gray-800
              border transition-all duration-200
              ${focused
                ? "border-primary-500/50 ring-4 ring-primary-500/10 shadow-lg shadow-primary-500/5"
                : "border-gray-200 dark:border-gray-700 shadow-sm"
              }
            `}
          >
            <IconSearch className="absolute left-4 size-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search any tool — logos, sales books, video editor, AI chat..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1); }}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={showResults}
              aria-autocomplete="list"
              aria-activedescendant={selectedIdx >= 0 ? `hero-search-${selectedIdx}` : undefined}
              className="w-full h-full pl-11 pr-10 bg-transparent text-sm
                text-gray-900 dark:text-white placeholder:text-gray-400
                focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <IconX className="size-4" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50
              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-xl shadow-2xl shadow-black/10 max-h-80 overflow-y-auto"
              role="listbox"
            >
              {results.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">
                  No tools found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                <div className="p-2">
                  <p className="px-3 py-1.5 text-[0.625rem] font-semibold uppercase tracking-widest text-gray-400">
                    {results.length} tool{results.length !== 1 ? "s" : ""} found
                  </p>
                  {visibleResults.map((tool, idx) => {
                    const Icon = iconMap[tool.icon];
                    return (
                      <Link
                        key={tool.id}
                        id={`hero-search-${idx}`}
                        role="option"
                        aria-selected={idx === selectedIdx}
                        href={`/tools/${tool.categoryId}/${tool.id}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-colors group
                          ${idx === selectedIdx ? "bg-gray-100 dark:bg-gray-700" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
                      >
                        <div className="size-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                          {Icon && <Icon className="size-4 text-gray-500 dark:text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {tool.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {tool.categoryName}
                          </p>
                        </div>
                        <IconArrowRight className="size-4 text-gray-300 dark:text-gray-600
                          group-hover:text-primary-500 transition-colors" />
                      </Link>
                    );
                  })}
                  {results.length > 8 && (
                    <p className="px-3 py-2 text-xs text-center text-gray-400">
                      +{results.length - 8} more results
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
