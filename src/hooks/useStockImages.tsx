"use client";

import { useState, useCallback, useRef } from "react";

// =============================================================================
// DMSuite — useStockImages Hook
// Global hook for fetching stock images from /api/images.
// Used by ALL workspaces that need real images for designs.
// Provides search, loading state, caching, and selection.
// =============================================================================

export interface StockImage {
  id: string;
  provider: string;
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
}

interface UseStockImagesReturn {
  images: StockImage[];
  isSearching: boolean;
  error: string | null;
  query: string;
  setQuery: (q: string) => void;
  search: (q?: string) => Promise<StockImage[]>;
  loadMore: () => Promise<void>;
  selectedImage: StockImage | null;
  selectImage: (img: StockImage | null) => void;
  hasMore: boolean;
  total: number;
}

export function useStockImages(defaultQuery = ""): UseStockImagesReturn {
  const [images, setImages] = useState<StockImage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(defaultQuery);
  const [selectedImage, setSelectedImage] = useState<StockImage | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q?: string): Promise<StockImage[]> => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return [];

    // Abort previous search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearching(true);
    setError(null);
    setPage(1);

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        per_page: "24",
        page: "1",
      });
      const res = await fetch(`/api/images?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      const results = data.images || [];
      setImages(results);
      setTotal(data.total || 0);
      if (q) setQuery(q);
      return results;
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError("Failed to fetch images. Check API keys.");
        setImages([]);
      }
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const loadMore = useCallback(async () => {
    if (isSearching || !query.trim()) return;
    setIsSearching(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams({
        q: query.trim(),
        per_page: "24",
        page: String(nextPage),
      });
      const res = await fetch(`/api/images?${params}`);
      if (!res.ok) throw new Error("Load more failed");
      const data = await res.json();
      setImages((prev) => [...prev, ...(data.images || [])]);
      setPage(nextPage);
    } catch {
      setError("Failed to load more images.");
    } finally {
      setIsSearching(false);
    }
  }, [isSearching, query, page]);

  return {
    images,
    isSearching,
    error,
    query,
    setQuery,
    search,
    loadMore,
    selectedImage,
    selectImage: setSelectedImage,
    hasMore: images.length < total,
    total,
  };
}

// ---------------------------------------------------------------------------
// Stock Image Picker Panel (Inline component for workspace panels)
// ---------------------------------------------------------------------------

interface StockImagePanelProps {
  onSelect: (image: StockImage) => void;
  className?: string;
}

export function StockImagePanel({ onSelect, className = "" }: StockImagePanelProps) {
  const { images, isSearching, query, setQuery, search, selectedImage, selectImage } = useStockImages();

  return (
    <div className={className}>
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          placeholder="Search images…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          onClick={() => search()}
          disabled={isSearching || !query.trim()}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isSearching ? "…" : "Go"}
        </button>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1 max-h-48 overflow-y-auto rounded-lg">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => { selectImage(img); onSelect(img); }}
              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all hover:scale-[1.02] ${
                selectedImage?.id === img.id
                  ? "border-primary-500 ring-1 ring-primary-500"
                  : "border-transparent"
              }`}
            >
              <img
                src={img.urls.thumb}
                alt={img.description}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {images.length === 0 && !isSearching && (
        <p className="text-[10px] text-gray-500 text-center py-3">
          Search for images to add to your design
        </p>
      )}
    </div>
  );
}
