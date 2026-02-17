"use client";

import { useState, useCallback } from "react";
import { IconSearch, IconImage, IconLoader, IconPlus } from "@/components/icons";

// =============================================================================
// DMSuite — Stock Image Integration
// Reusable component for searching and selecting stock images in any workspace.
// Uses the existing /api/images endpoint (Unsplash/Pexels integration).
// =============================================================================

export interface SelectedImage {
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  alt: string;
  credit: string;
}

interface StockImageIntegrationProps {
  onSelect: (image: SelectedImage) => void;
  /** Compact mode — smaller UI */
  compact?: boolean;
  /** Default search query */
  defaultQuery?: string;
  /** Label */
  label?: string;
  className?: string;
}

export default function StockImageIntegration({
  onSelect,
  compact = false,
  defaultQuery = "",
  label = "Add Image",
  className = "",
}: StockImageIntegrationProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [results, setResults] = useState<SelectedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const searchImages = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/images?query=${encodeURIComponent(searchQuery)}&per_page=12`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();

      const images: SelectedImage[] = (data.results || data.photos || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => ({
          url: item.urls?.regular || item.src?.large || item.url || "",
          thumbUrl: item.urls?.thumb || item.src?.tiny || item.urls?.small || "",
          width: item.width || 800,
          height: item.height || 600,
          alt: item.alt_description || item.alt || item.description || searchQuery,
          credit: item.user?.name || item.photographer || "Stock Photo",
        })
      );
      setResults(images);
    } catch {
      // Fallback: generate placeholder URLs for demo
      setResults(
        Array.from({ length: 8 }, (_, i) => ({
          url: `https://picsum.photos/800/600?random=${Date.now() + i}`,
          thumbUrl: `https://picsum.photos/200/150?random=${Date.now() + i}`,
          width: 800,
          height: 600,
          alt: `${searchQuery} - ${i + 1}`,
          credit: "Picsum Photos",
        }))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => searchImages(query);

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-600 hover:border-primary-500/50 hover:bg-primary-500/5 text-gray-400 hover:text-primary-400 transition-colors text-sm w-full ${className}`}
      >
        <IconImage className="size-4" />
        <span>{label}</span>
        <IconPlus className="size-3 ml-auto" />
      </button>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-700 bg-gray-800/50 p-3 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search stock images..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-500/50"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-3 py-2 rounded-lg bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <IconLoader className="size-3.5 animate-spin" /> : "Search"}
        </button>
      </div>

      {/* Quick search tags */}
      <div className="flex gap-1.5 flex-wrap">
        {["Food", "Business", "Nature", "People", "Technology", "Abstract"].map((tag) => (
          <button
            key={tag}
            onClick={() => {
              setQuery(tag.toLowerCase());
              searchImages(tag.toLowerCase());
            }}
            className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Results grid */}
      {results.length > 0 && (
        <div className={`grid ${compact ? "grid-cols-3" : "grid-cols-4"} gap-1.5 max-h-48 overflow-y-auto`}>
          {results.map((img, i) => (
            <button
              key={i}
              onClick={() => onSelect(img)}
              className="group relative aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-gray-700 hover:ring-primary-500 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbUrl || img.url}
                alt={img.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <IconPlus className="size-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      )}

      {results.length === 0 && !loading && (
        <p className="text-xs text-gray-500 text-center py-4">
          Search for images to add to your design
        </p>
      )}
    </div>
  );
}
