"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSearch,
  IconX,
  IconLoader,
  IconImage,
  IconExternalLink,
  IconCheck,
} from "@/components/icons";

/* ── Types (mirror the API) ──────────────────────────────── */

export interface StockImage {
  id: string;
  provider: "unsplash" | "pexels" | "pixabay";
  description: string;
  photographer: string;
  photographerUrl: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
  };
  width: number;
  height: number;
  color: string;
  downloadUrl: string;
  attributionHtml: string;
}

interface StockImagePickerProps {
  /** Whether the picker modal is open */
  open: boolean;
  /** Called when the user closes the picker */
  onClose: () => void;
  /** Called when the user selects an image */
  onSelect: (image: StockImage) => void;
  /** Initial search query */
  initialQuery?: string;
  /** Title shown in the header */
  title?: string;
}

const PROVIDERS = [
  { id: "all", label: "All" },
  { id: "unsplash", label: "Unsplash" },
  { id: "pexels", label: "Pexels" },
  { id: "pixabay", label: "Pixabay" },
] as const;

const SUGGESTIONS = [
  "business", "technology", "nature", "abstract", "people",
  "office", "creative", "minimal", "architecture", "food",
];

/* ── Component ───────────────────────────────────────────── */

export default function StockImagePicker({
  open,
  onClose,
  onSelect,
  initialQuery = "",
  title = "Choose an Image",
}: StockImagePickerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [images, setImages] = useState<StockImage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setSelectedId(null);
    }
  }, [open]);

  // Set initial query when it changes
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const searchImages = useCallback(
    async (searchQuery: string, searchPage: number, searchProvider: string, append = false) => {
      if (!searchQuery.trim()) return;
      setLoading(true);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          page: String(searchPage),
          per_page: "24",
          provider: searchProvider,
        });

        const res = await fetch(`/api/images?${params}`);
        if (!res.ok) throw new Error("Search failed");

        const data = await res.json();
        setImages((prev) => (append ? [...prev, ...data.images] : data.images));
        setTotal(data.total || 0);
        setPage(searchPage);
      } catch (err) {
        console.error("Image search error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      searchImages(query, 1, provider);
    },
    [query, provider, searchImages]
  );

  const handleSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      searchImages(suggestion, 1, provider);
    },
    [provider, searchImages]
  );

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      setProvider(newProvider);
      if (query.trim()) {
        searchImages(query, 1, newProvider);
      }
    },
    [query, searchImages]
  );

  const handleLoadMore = useCallback(() => {
    searchImages(query, page + 1, provider, true);
  }, [query, page, provider, searchImages]);

  const handleSelect = useCallback(
    (image: StockImage) => {
      setSelectedId(image.id);
      onSelect(image);
      // Auto-close after a brief visual confirmation
      setTimeout(() => onClose(), 300);
    },
    [onSelect, onClose]
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <IconImage className="size-4.5 text-primary-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-xs text-gray-400">
                  {total > 0 ? `${total.toLocaleString()} results` : "Search millions of free stock photos"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <IconX className="size-4" />
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for images…"
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="h-10 px-5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <IconLoader className="size-4 animate-spin" /> : "Search"}
            </button>
          </form>

          {/* Provider pills + suggestions */}
          <div className="flex items-center justify-between mt-3 gap-3">
            <div className="flex items-center gap-1">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    provider === p.id
                      ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {!hasSearched && (
              <div className="flex items-center gap-1 overflow-x-auto">
                {SUGGESTIONS.slice(0, 5).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-2.5 py-1 rounded-md text-[0.6875rem] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap capitalize"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <IconImage className="size-7 text-gray-300 dark:text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Search for stock images</p>
              <p className="text-xs text-gray-400 max-w-xs">
                Browse millions of free photos from Unsplash, Pexels, and Pixabay
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSuggestion(s)}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 hover:text-primary-500 hover:border-primary-500/30 transition-colors capitalize"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : loading && images.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <IconLoader className="size-6 text-primary-500 animate-spin" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-gray-500 mb-1">No images found</p>
              <p className="text-xs text-gray-400">Try a different search term or provider</p>
            </div>
          ) : (
            <>
              <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => handleSelect(img)}
                    className={`group relative block w-full rounded-xl overflow-hidden border-2 transition-all break-inside-avoid ${
                      selectedId === img.id
                        ? "border-primary-500 ring-2 ring-primary-500/30"
                        : "border-transparent hover:border-primary-500/40"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.urls.small}
                      alt={img.description}
                      className="w-full h-auto block"
                      style={{ backgroundColor: img.color }}
                      loading="lazy"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <div className="w-full p-2.5 translate-y-full group-hover:translate-y-0 transition-transform">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[0.625rem] text-white/90 truncate font-medium">
                              {img.photographer}
                            </span>
                            <a
                              href={img.photographerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              <IconExternalLink className="size-2.5 text-white/50 hover:text-white/80" />
                            </a>
                          </div>
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded text-[0.5625rem] font-semibold uppercase ${
                              img.provider === "unsplash"
                                ? "bg-white/20 text-white"
                                : img.provider === "pexels"
                                ? "bg-green-500/30 text-green-200"
                                : "bg-blue-500/30 text-blue-200"
                            }`}
                          >
                            {img.provider}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Selected check */}
                    {selectedId === img.id && (
                      <div className="absolute top-2 right-2 size-6 rounded-full bg-primary-500 flex items-center justify-center">
                        <IconCheck className="size-3.5 text-gray-950" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Load more */}
              {images.length < total && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    {loading ? (
                      <IconLoader className="size-4 animate-spin" />
                    ) : (
                      `Load more (${images.length} of ${total.toLocaleString()})`
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer attribution */}
        <div className="shrink-0 px-6 py-2.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50">
          <p className="text-[0.625rem] text-gray-400 text-center">
            Photos provided by{" "}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-500">Unsplash</a>
            {", "}
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-500">Pexels</a>
            {", and "}
            <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-primary-500">Pixabay</a>
            {" — free for commercial use"}
          </p>
        </div>
      </div>
    </div>
  );
}
