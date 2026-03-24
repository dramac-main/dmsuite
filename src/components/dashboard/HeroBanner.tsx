"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchTools, type FlatTool, totalToolCount } from "@/data/tools";
import { getIcon, IconSearch, IconArrowRight, IconX, IconSparkles } from "@/components/icons";

export default function HeroBanner() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(timer);
  }, [query]);

  const results: FlatTool[] = useMemo(() => searchTools(debouncedQuery), [debouncedQuery]);
  const visibleResults = results.slice(0, 8);
  const showResults = focused && query.length > 0;

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setFocused(false);
      setSelectedIdx(-1);
    }
  }, []);

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
      {/* ── Animated gradient mesh background ── */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-primary-500/20 blur-[100px] animate-pulse" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-secondary-500/20 blur-[100px] animate-pulse [animation-delay:1.5s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-primary-400/10 blur-[80px] animate-pulse [animation-delay:3s]" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      </div>

      <div className="relative rounded-2xl border border-white/20 dark:border-white/[0.06] bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl p-6 sm:p-8 lg:p-10 overflow-hidden">
        {/* Top-right decorative orb */}
        <div className="absolute -top-12 -right-12 size-40 rounded-full bg-linear-to-br from-primary-500/20 to-secondary-500/20 blur-2xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 backdrop-blur-sm mb-5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-primary-500" />
          </span>
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-300 tracking-wide">
            AI-Powered Suite
          </span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white tracking-tight mb-3 leading-[1.15]">
          Your Complete{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-primary-400 via-primary-500 to-secondary-400">
            AI Creative Studio
          </span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
          {totalToolCount}+ AI tools for design, documents, video, content, marketing & more —
          everything to deliver jaw-dropping results for your clients.
        </p>

        {/* Search bar — elevated glassmorphic */}
        <div ref={containerRef} onBlur={handleBlur} className="relative max-w-xl z-50">
          <div
            className={`
              relative flex items-center h-13 sm:h-14 rounded-2xl
              bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg
              border transition-all duration-300
              ${focused
                ? "border-primary-500/40 ring-4 ring-primary-500/10 shadow-xl shadow-primary-500/10"
                : "border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-black/5 dark:shadow-black/20"
              }
            `}
          >
            <IconSearch className={`absolute left-4 sm:left-5 size-5 transition-colors duration-200 ${focused ? "text-primary-500" : "text-gray-400"}`} />
            <input
              type="text"
              placeholder="Search any tool — logos, sales books, video editor..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIdx(-1); }}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              role="combobox"
              aria-expanded={showResults}
              aria-autocomplete="list"
              aria-activedescendant={selectedIdx >= 0 ? `hero-search-${selectedIdx}` : undefined}
              className="w-full h-full pl-12 sm:pl-13 pr-10 bg-transparent text-sm sm:text-base
                text-gray-900 dark:text-white placeholder:text-gray-400
                focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <IconX className="size-4" />
              </button>
            )}
          </div>

          {/* Search results dropdown — glassmorphic */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50
              bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl
              border border-gray-200/60 dark:border-gray-700/60
              rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/30 max-h-80 overflow-y-auto"
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
                    const Icon = getIcon(tool.icon);
                    return (
                      <Link
                        key={tool.id}
                        id={`hero-search-${idx}`}
                        role="option"
                        aria-selected={idx === selectedIdx}
                        href={`/tools/${tool.categoryId}/${tool.id}`}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                          transition-all duration-150 group
                          ${idx === selectedIdx
                            ? "bg-primary-500/10 dark:bg-primary-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}
                      >
                        <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors
                          ${idx === selectedIdx
                            ? "bg-primary-500/15 dark:bg-primary-500/20"
                            : "bg-gray-100 dark:bg-gray-700"}`}>
                          <Icon className={`size-4 transition-colors ${idx === selectedIdx ? "text-primary-500" : "text-gray-500 dark:text-gray-400"}`} />
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
