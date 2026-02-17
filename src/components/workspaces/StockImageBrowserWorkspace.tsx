"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSearch,
  IconDownload,
  IconLoader,
  IconImage,
  IconExternalLink,
  IconX,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconHeart,
  IconPlus,
  IconTrash,
  IconFolder,
  IconFilter,
} from "@/components/icons";

/* ── Types ───────────────────────────────────────────────── */

interface StockImage {
  id: string;
  provider: "unsplash" | "pexels" | "pixabay";
  description: string;
  photographer: string;
  photographerUrl: string;
  urls: { thumb: string; small: string; regular: string; full: string };
  width: number;
  height: number;
  color: string;
  downloadUrl: string;
  attributionHtml: string;
}

interface Board {
  id: string;
  name: string;
  images: StockImage[];
}

const LS_BOARDS_KEY = "dmsuite-stock-boards";
const LS_FAVORITES_KEY = "dmsuite-stock-favorites";

const ORIENTATION_OPTIONS = [
  { id: "all" as const, label: "All" },
  { id: "portrait" as const, label: "Portrait" },
  { id: "landscape" as const, label: "Landscape" },
  { id: "square" as const, label: "Square" },
];

/* ── Constants ───────────────────────────────────────────── */

const PROVIDERS = [
  { id: "all", label: "All Sources" },
  { id: "unsplash", label: "Unsplash" },
  { id: "pexels", label: "Pexels" },
  { id: "pixabay", label: "Pixabay" },
] as const;

const CURATED_COLLECTIONS = [
  { label: "Business & Finance", query: "business office" },
  { label: "Technology", query: "technology computer" },
  { label: "Nature & Landscape", query: "nature landscape" },
  { label: "Architecture", query: "architecture building" },
  { label: "People & Portraits", query: "people portrait" },
  { label: "Food & Drink", query: "food gourmet" },
  { label: "Abstract & Patterns", query: "abstract pattern" },
  { label: "Travel & Adventure", query: "travel adventure" },
  { label: "Health & Wellness", query: "health wellness yoga" },
  { label: "Fashion & Style", query: "fashion style model" },
  { label: "Art & Creative", query: "art creative design" },
  { label: "Urban & City", query: "urban city street" },
];

/* ── Component ───────────────────────────────────────────── */

export default function StockImageBrowserWorkspace() {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<StockImage[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<StockImage | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedAttribution, setCopiedAttribution] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── New feature state ──────────────────────────────────── */
  const [boards, setBoards] = useState<Board[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [colorFilter, setColorFilter] = useState<string | null>(null);
  const [orientationFilter, setOrientationFilter] = useState<"all" | "portrait" | "landscape" | "square">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [boardsPanelOpen, setBoardsPanelOpen] = useState(false);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");
  const [renamingBoardId, setRenamingBoardId] = useState<string | null>(null);
  const [renamingBoardName, setRenamingBoardName] = useState("");
  const [saveMenuImageId, setSaveMenuImageId] = useState<string | null>(null);

  /* ── Load boards & favorites from localStorage ──────────── */
  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_BOARDS_KEY);
      if (stored) setBoards(JSON.parse(stored));
    } catch { /* ignore */ }
    try {
      const stored = localStorage.getItem(LS_FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_BOARDS_KEY, JSON.stringify(boards));
  }, [boards]);

  useEffect(() => {
    localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const searchImages = useCallback(
    async (q: string, p: number, prov: string, append = false, color?: string | null, orientation?: string) => {
      if (!q.trim()) return;
      setLoading(true);
      setHasSearched(true);
      try {
        const params = new URLSearchParams({ q: q.trim(), page: String(p), per_page: "24", provider: prov });
        if (color) params.set("color", color);
        if (orientation && orientation !== "all") params.set("orientation", orientation);
        const res = await fetch(`/api/images?${params}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setImages((prev) => (append ? [...prev, ...data.images] : data.images));
        setTotal(data.total || 0);
        setPage(p);
      } catch (err) { console.error("Image search error:", err); }
      finally { setLoading(false); }
    },
    []
  );

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) searchImages(query, 1, provider, false, colorFilter, orientationFilter);
  }, [query, provider, searchImages, colorFilter, orientationFilter]);

  const handleCollection = useCallback((q: string) => {
    setQuery(q);
    searchImages(q, 1, provider, false, colorFilter, orientationFilter);
  }, [provider, searchImages, colorFilter, orientationFilter]);

  const handleProviderChange = useCallback((prov: string) => {
    setProvider(prov);
    if (query.trim()) searchImages(query, 1, prov, false, colorFilter, orientationFilter);
  }, [query, searchImages, colorFilter, orientationFilter]);

  const handleLoadMore = useCallback(() => {
    searchImages(query, page + 1, provider, true, colorFilter, orientationFilter);
  }, [query, page, provider, searchImages, colorFilter, orientationFilter]);

  /* ── Favorites helpers ──────────────────────────────────── */
  const toggleFavorite = useCallback((imageId: string) => {
    setFavorites((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  }, []);

  const isFavorited = useCallback((imageId: string) => favorites.includes(imageId), [favorites]);

  /* ── Board helpers ──────────────────────────────────────── */
  const createBoard = useCallback((name: string) => {
    if (!name.trim()) return;
    const newBoard: Board = { id: crypto.randomUUID(), name: name.trim(), images: [] };
    setBoards((prev) => [...prev, newBoard]);
    setNewBoardName("");
  }, []);

  const deleteBoard = useCallback((boardId: string) => {
    setBoards((prev) => prev.filter((b) => b.id !== boardId));
    if (activeBoardId === boardId) setActiveBoardId(null);
  }, [activeBoardId]);

  const renameBoard = useCallback((boardId: string, newName: string) => {
    if (!newName.trim()) return;
    setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, name: newName.trim() } : b)));
    setRenamingBoardId(null);
    setRenamingBoardName("");
  }, []);

  const saveToBoard = useCallback((boardId: string, image: StockImage) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === boardId
          ? { ...b, images: b.images.some((i) => i.id === image.id) ? b.images : [...b.images, image] }
          : b
      )
    );
    setSaveMenuImageId(null);
  }, []);

  const removeFromBoard = useCallback((boardId: string, imageId: string) => {
    setBoards((prev) =>
      prev.map((b) => (b.id === boardId ? { ...b, images: b.images.filter((i) => i.id !== imageId) } : b))
    );
  }, []);

  /* ── Filter images by orientation & favorites ───────────── */
  const filteredImages = (() => {
    let filtered = images;
    if (orientationFilter !== "all") {
      filtered = filtered.filter((img) => {
        const ratio = img.width / img.height;
        if (orientationFilter === "landscape") return ratio > 1.1;
        if (orientationFilter === "portrait") return ratio < 0.9;
        if (orientationFilter === "square") return ratio >= 0.9 && ratio <= 1.1;
        return true;
      });
    }
    if (showFavoritesOnly) {
      filtered = filtered.filter((img) => favorites.includes(img.id));
    }
    return filtered;
  })();

  /* ── Active board images ────────────────────────────────── */
  const activeBoard = boards.find((b) => b.id === activeBoardId) || null;

  const handleDownload = useCallback(async (image: StockImage) => {
    const a = document.createElement("a");
    a.href = image.downloadUrl;
    a.download = `${image.provider}-${image.id.split("-").pop()}.jpg`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }, []);

  const handleCopyAttribution = useCallback(async (image: StockImage) => {
    const text = image.attributionHtml.replace(/<[^>]*>/g, "");
    await navigator.clipboard.writeText(text);
    setCopiedAttribution(true);
    setTimeout(() => setCopiedAttribution(false), 2000);
  }, []);

  const providerBadge = (p: string) => {
    switch (p) {
      case "unsplash": return "bg-gray-900/80 text-white";
      case "pexels": return "bg-green-600/80 text-white";
      case "pixabay": return "bg-blue-600/80 text-white";
      default: return "bg-gray-600/80 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search millions of free stock photos…"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <button type="submit" disabled={!query.trim() || loading}
            className="h-12 px-6 rounded-xl bg-primary-500 text-gray-950 text-sm font-bold hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/20">
            {loading ? <IconLoader className="size-4.5 animate-spin" /> : "Search"}
          </button>
        </form>
        <div className="flex items-center gap-2 mt-3">
          {PROVIDERS.map((p) => (
            <button key={p.id} onClick={() => handleProviderChange(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${provider === p.id ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
              {p.label}
            </button>
          ))}
          {total > 0 && <span className="text-xs text-gray-400 ml-auto">{total.toLocaleString()} results</span>}
        </div>

        {/* ── Filters row: Color, Orientation, Favorites, Boards ── */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {/* Color filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="color-filter" className="text-[0.6875rem] text-gray-500 dark:text-gray-400 font-medium">Color:</label>
            <div className="relative">
              <input
                id="color-filter"
                type="color"
                value={colorFilter || "#000000"}
                onChange={(e) => setColorFilter(e.target.value)}
                className="size-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"
              />
            </div>
            {colorFilter && (
              <button
                onClick={() => { setColorFilter(null); if (query.trim()) searchImages(query, 1, provider, false, null, orientationFilter); }}
                className="text-[0.625rem] text-gray-400 hover:text-error transition-colors"
                title="Clear color filter"
              >
                <IconX className="size-3.5" />
              </button>
            )}
          </div>

          {/* Orientation filter */}
          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
            {ORIENTATION_OPTIONS.map((o) => (
              <button
                key={o.id}
                onClick={() => setOrientationFilter(o.id)}
                className={`px-2.5 py-1 rounded-lg text-[0.6875rem] font-medium transition-all ${
                  orientationFilter === o.id
                    ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Favorites toggle */}
          <button
            onClick={() => setShowFavoritesOnly((v) => !v)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[0.6875rem] font-medium border-l border-gray-200 dark:border-gray-700 pl-3 transition-all ${
              showFavoritesOnly
                ? "text-error"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <IconHeart className="size-3.5" style={showFavoritesOnly ? { fill: "currentColor" } : undefined} />
            Favorites{favorites.length > 0 && ` (${favorites.length})`}
          </button>

          {/* Boards toggle */}
          <button
            onClick={() => setBoardsPanelOpen((v) => !v)}
            className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[0.6875rem] font-medium transition-all ${
              boardsPanelOpen
                ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <IconFolder className="size-3.5" />
            Boards{boards.length > 0 && ` (${boards.length})`}
          </button>
        </div>
      </div>

      {/* ── Boards Panel ─────────────────────────────────────── */}
      {boardsPanelOpen && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconFolder className="size-4 text-primary-500" />
              Image Boards
            </h3>
            <button onClick={() => setBoardsPanelOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <IconX className="size-4" />
            </button>
          </div>

          {/* Create board */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createBoard(newBoardName); }}
              placeholder="New board name…"
              className="flex-1 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <button
              onClick={() => createBoard(newBoardName)}
              disabled={!newBoardName.trim()}
              className="h-9 px-4 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <IconPlus className="size-3.5" />
            </button>
          </div>

          {/* Board list */}
          {boards.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No boards yet. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {boards.map((board) => (
                <div
                  key={board.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    activeBoardId === board.id
                      ? "border-primary-500/30 bg-primary-500/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => setActiveBoardId(activeBoardId === board.id ? null : board.id)}
                >
                  <IconFolder className="size-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {renamingBoardId === board.id ? (
                      <input
                        type="text"
                        value={renamingBoardName}
                        onChange={(e) => setRenamingBoardName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") renameBoard(board.id, renamingBoardName); if (e.key === "Escape") { setRenamingBoardId(null); setRenamingBoardName(""); } }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full h-6 px-2 rounded border border-primary-500 bg-transparent text-xs text-gray-900 dark:text-white focus:outline-none"
                      />
                    ) : (
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{board.name}</p>
                    )}
                    <p className="text-[0.625rem] text-gray-400">{board.images.length} image{board.images.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setRenamingBoardId(board.id); setRenamingBoardName(board.name); }}
                      className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Rename board"
                    >
                      <IconFilter className="size-3" />
                    </button>
                    <button
                      onClick={() => deleteBoard(board.id)}
                      className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-error hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      title="Delete board"
                    >
                      <IconTrash className="size-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active board contents */}
          {activeBoard && activeBoard.images.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {activeBoard.name} — {activeBoard.images.length} image{activeBoard.images.length !== 1 ? "s" : ""}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {activeBoard.images.map((img) => (
                  <div key={img.id} className="group relative rounded-lg overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.urls.thumb} alt={img.description} className="w-full aspect-square object-cover" style={{ backgroundColor: img.color }} loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => removeFromBoard(activeBoard.id, img.id)}
                        className="size-7 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center text-error hover:bg-white transition-colors"
                        title="Remove from board"
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      {!hasSearched ? (
        /* Collections grid */
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Browse Collections</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CURATED_COLLECTIONS.map((c) => (
              <button key={c.label} onClick={() => handleCollection(c.query)}
                className="group p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-500/30 hover:bg-primary-500/5 text-left transition-all">
                <div className="size-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-2.5 group-hover:bg-primary-500/10 transition-colors">
                  <IconImage className="size-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{c.label}</p>
                <p className="text-[0.625rem] text-gray-400 mt-0.5">Free stock photos</p>
              </button>
            ))}
          </div>
        </div>
      ) : loading && images.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <IconLoader className="size-8 text-primary-500 animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <IconImage className="size-7 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">No images found</p>
          <p className="text-xs text-gray-400">Try a different search term or provider</p>
        </div>
      ) : (
        <>
          {/* Masonry grid */}
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {filteredImages.map((img) => (
              <div
                key={img.id}
                className="group relative block w-full rounded-xl overflow-hidden border-2 border-transparent hover:border-primary-500/40 transition-all break-inside-avoid"
              >
                <button type="button" onClick={() => setSelectedImage(img)} className="w-full cursor-pointer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.urls.small} alt={img.description} className="w-full h-auto block" style={{ backgroundColor: img.color }} loading="lazy" />
                </button>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col justify-between p-2.5 opacity-0 group-hover:opacity-100 pointer-events-none">
                  <div className="flex justify-between items-start pointer-events-auto">
                    {/* Favorite button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(img.id); }}
                      className="size-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                      title={isFavorited(img.id) ? "Remove from favorites" : "Add to favorites"}
                    >
                      <IconHeart
                        className={`size-4 transition-colors ${isFavorited(img.id) ? "text-error" : "text-white"}`}
                        style={isFavorited(img.id) ? { fill: "currentColor" } : undefined}
                      />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {/* Save to board button */}
                      <div className="relative">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSaveMenuImageId(saveMenuImageId === img.id ? null : img.id); }}
                          className="size-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                          title="Save to board"
                        >
                          <IconFolder className="size-4 text-white" />
                        </button>
                        {/* Board dropdown */}
                        {saveMenuImageId === img.id && (
                          <div className="absolute right-0 top-9 z-10 w-48 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl py-1 max-h-52 overflow-y-auto">
                            {boards.length === 0 ? (
                              <p className="px-3 py-2 text-[0.6875rem] text-gray-400">No boards. Open Boards panel to create one.</p>
                            ) : (
                              boards.map((board) => (
                                <button
                                  key={board.id}
                                  onClick={(e) => { e.stopPropagation(); saveToBoard(board.id, img); }}
                                  className="w-full text-left px-3 py-2 text-[0.6875rem] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                                >
                                  <IconFolder className="size-3 text-gray-400 shrink-0" />
                                  <span className="truncate">{board.name}</span>
                                  {board.images.some((i) => i.id === img.id) && <IconCheck className="size-3 text-success ml-auto shrink-0" />}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[0.5625rem] font-semibold uppercase ${providerBadge(img.provider)}`}>{img.provider}</span>
                    </div>
                  </div>
                  <div className="pointer-events-auto">
                    <p className="text-[0.6875rem] text-white font-medium truncate">{img.photographer}</p>
                    <p className="text-[0.5625rem] text-white/60 truncate">{img.width}×{img.height}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No filtered results message */}
          {filteredImages.length === 0 && images.length > 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-gray-500">No images match the current filters.</p>
              <p className="text-xs text-gray-400 mt-1">Try changing orientation, clearing color filter, or toggling off favorites.</p>
            </div>
          )}

          {/* Load more */}
          {images.length < total && (
            <div className="flex justify-center pt-2">
              <button onClick={handleLoadMore} disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                {loading ? <IconLoader className="size-4 animate-spin" /> : `Load more (${images.length} of ${total.toLocaleString()})`}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Image Detail Modal ─────────────────────────────── */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedImage(null)} />
          <div className="relative w-full max-w-5xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`shrink-0 px-2 py-0.5 rounded-md text-[0.625rem] font-bold uppercase ${providerBadge(selectedImage.provider)}`}>{selectedImage.provider}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedImage.description}</span>
              </div>
              <button onClick={() => setSelectedImage(null)} className="shrink-0 size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <IconX className="size-4" />
              </button>
            </div>

            {/* Image */}
            <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedImage.urls.regular} alt={selectedImage.description} className="max-w-full max-h-[65vh] rounded-lg shadow-lg object-contain" style={{ backgroundColor: selectedImage.color }} />
            </div>

            {/* Footer */}
            <div className="shrink-0 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedImage.photographer}</span>
                    <a href={selectedImage.photographerUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary-500 transition-colors">
                      <IconExternalLink className="size-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-400">{selectedImage.width}×{selectedImage.height} • Free for commercial use</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(selectedImage.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                      isFavorited(selectedImage.id)
                        ? "border-error/30 bg-error/5 text-error"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <IconHeart
                      className="size-3.5"
                      style={isFavorited(selectedImage.id) ? { fill: "currentColor" } : undefined}
                    />
                    {isFavorited(selectedImage.id) ? "Favorited" : "Favorite"}
                  </button>
                  <button onClick={() => handleCopyAttribution(selectedImage)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    {copiedAttribution ? <IconCheck className="size-3.5 text-success" /> : null}
                    {copiedAttribution ? "Copied!" : "Copy Attribution"}
                  </button>
                  <button onClick={() => handleDownload(selectedImage)}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-primary-500 text-gray-950 text-sm font-bold hover:bg-primary-400 transition-colors shadow-lg shadow-primary-500/20">
                    <IconDownload className="size-4" />Download
                  </button>
                </div>
              </div>
              <div className="mt-2 text-[0.625rem] text-gray-400" dangerouslySetInnerHTML={{ __html: selectedImage.attributionHtml }} />
            </div>

            {/* Nav arrows */}
            {(() => {
              const idx = images.findIndex((i) => i.id === selectedImage.id);
              return (
                <>
                  {idx > 0 && (
                    <button onClick={() => setSelectedImage(images[idx - 1])}
                      className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                      <IconChevronLeft className="size-5" />
                    </button>
                  )}
                  {idx < images.length - 1 && (
                    <button onClick={() => setSelectedImage(images[idx + 1])}
                      className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors">
                      <IconChevronRight className="size-5" />
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
