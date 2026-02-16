import { NextRequest, NextResponse } from "next/server";

/* ── Unified Stock Image API ──────────────────────────────────
   Queries Unsplash, Pexels, and Pixabay in parallel.
   Returns a normalized array of StockImage results.
   
   GET /api/images?q=nature&page=1&per_page=24&provider=all
   ──────────────────────────────────────────────────────────── */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

export interface StockImage {
  id: string;
  provider: "unsplash" | "pexels" | "pixabay";
  description: string;
  photographer: string;
  photographerUrl: string;
  urls: {
    thumb: string;    // ~200px wide
    small: string;    // ~400px wide
    regular: string;  // ~1080px wide
    full: string;     // original / large
  };
  width: number;
  height: number;
  color: string;
  downloadUrl: string;
  attributionHtml: string;
}

export interface StockImageResponse {
  images: StockImage[];
  total: number;
  page: number;
  perPage: number;
  providers: string[];
}

/* ── Unsplash ─────────────────────────────────────────────── */

async function searchUnsplash(
  query: string,
  page: number,
  perPage: number
): Promise<{ images: StockImage[]; total: number }> {
  if (!UNSPLASH_ACCESS_KEY) return { images: [], total: 0 };

  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("orientation", "landscape");

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        "Accept-Version": "v1",
      },
    });

    if (!res.ok) {
      console.error("Unsplash error:", res.status, await res.text());
      return { images: [], total: 0 };
    }

    const data = await res.json();

    const images: StockImage[] = (data.results || []).map((img: Record<string, unknown>) => {
      const urls = img.urls as Record<string, string>;
      const user = img.user as Record<string, unknown>;
      const links = user.links as Record<string, string>;
      return {
        id: `unsplash-${img.id}`,
        provider: "unsplash" as const,
        description: (img.alt_description as string) || (img.description as string) || "Unsplash image",
        photographer: (user.name as string) || "Unknown",
        photographerUrl: links?.html || `https://unsplash.com/@${user.username}`,
        urls: {
          thumb: urls.thumb,
          small: urls.small,
          regular: urls.regular,
          full: urls.full,
        },
        width: img.width as number,
        height: img.height as number,
        color: (img.color as string) || "#000000",
        downloadUrl: (img.links as Record<string, string>)?.download || urls.full,
        attributionHtml: `Photo by <a href="${links?.html}?utm_source=dmsuite&utm_medium=referral" target="_blank">${user.name}</a> on <a href="https://unsplash.com/?utm_source=dmsuite&utm_medium=referral" target="_blank">Unsplash</a>`,
      };
    });

    return { images, total: data.total || 0 };
  } catch (err) {
    console.error("Unsplash fetch error:", err);
    return { images: [], total: 0 };
  }
}

/* ── Pexels ───────────────────────────────────────────────── */

async function searchPexels(
  query: string,
  page: number,
  perPage: number
): Promise<{ images: StockImage[]; total: number }> {
  if (!PEXELS_API_KEY) return { images: [], total: 0 };

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("orientation", "landscape");

    const res = await fetch(url.toString(), {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!res.ok) {
      console.error("Pexels error:", res.status, await res.text());
      return { images: [], total: 0 };
    }

    const data = await res.json();

    const images: StockImage[] = (data.photos || []).map((photo: Record<string, unknown>) => {
      const src = photo.src as Record<string, string>;
      return {
        id: `pexels-${photo.id}`,
        provider: "pexels" as const,
        description: (photo.alt as string) || "Pexels image",
        photographer: (photo.photographer as string) || "Unknown",
        photographerUrl: (photo.photographer_url as string) || "https://pexels.com",
        urls: {
          thumb: src.tiny,
          small: src.small,
          regular: src.large,
          full: src.original,
        },
        width: photo.width as number,
        height: photo.height as number,
        color: (photo.avg_color as string) || "#000000",
        downloadUrl: src.original,
        attributionHtml: `Photo by <a href="${photo.photographer_url}" target="_blank">${photo.photographer}</a> on <a href="https://www.pexels.com" target="_blank">Pexels</a>`,
      };
    });

    return { images, total: data.total_results || 0 };
  } catch (err) {
    console.error("Pexels fetch error:", err);
    return { images: [], total: 0 };
  }
}

/* ── Pixabay ──────────────────────────────────────────────── */

async function searchPixabay(
  query: string,
  page: number,
  perPage: number
): Promise<{ images: StockImage[]; total: number }> {
  if (!PIXABAY_API_KEY) return { images: [], total: 0 };

  try {
    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", PIXABAY_API_KEY);
    url.searchParams.set("q", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(Math.min(perPage, 200)));
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("orientation", "horizontal");
    url.searchParams.set("safesearch", "true");

    const res = await fetch(url.toString());

    if (!res.ok) {
      console.error("Pixabay error:", res.status, await res.text());
      return { images: [], total: 0 };
    }

    const data = await res.json();

    const images: StockImage[] = (data.hits || []).map((hit: Record<string, unknown>) => ({
      id: `pixabay-${hit.id}`,
      provider: "pixabay" as const,
      description: (hit.tags as string) || "Pixabay image",
      photographer: (hit.user as string) || "Unknown",
      photographerUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
      urls: {
        thumb: hit.previewURL as string,
        small: hit.webformatURL as string,
        regular: hit.largeImageURL as string,
        full: hit.largeImageURL as string,
      },
      width: hit.imageWidth as number,
      height: hit.imageHeight as number,
      color: "#000000",
      downloadUrl: hit.largeImageURL as string,
      attributionHtml: `Image by <a href="https://pixabay.com/users/${hit.user}-${hit.user_id}/" target="_blank">${hit.user}</a> on <a href="https://pixabay.com" target="_blank">Pixabay</a>`,
    }));

    return { images, total: data.totalHits || 0 };
  } catch (err) {
    console.error("Pixabay fetch error:", err);
    return { images: [], total: 0 };
  }
}

/* ── GET Handler ──────────────────────────────────────────── */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = Math.min(30, Math.max(1, parseInt(searchParams.get("per_page") || "24")));
  const provider = searchParams.get("provider") || "all";

  if (!query.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  const perProviderCount = provider === "all" ? Math.ceil(perPage / 3) : perPage;

  // Query providers in parallel
  const tasks: Promise<{ images: StockImage[]; total: number }>[] = [];
  const activeProviders: string[] = [];

  if (provider === "all" || provider === "unsplash") {
    tasks.push(searchUnsplash(query, page, perProviderCount));
    activeProviders.push("unsplash");
  }
  if (provider === "all" || provider === "pexels") {
    tasks.push(searchPexels(query, page, perProviderCount));
    activeProviders.push("pexels");
  }
  if (provider === "all" || provider === "pixabay") {
    tasks.push(searchPixabay(query, page, perProviderCount));
    activeProviders.push("pixabay");
  }

  const results = await Promise.all(tasks);

  // Merge and interleave results from different providers
  let allImages: StockImage[] = [];
  let totalCount = 0;

  if (provider === "all") {
    // Interleave: take 1 from each provider in round-robin
    const maxLen = Math.max(...results.map((r) => r.images.length));
    for (let i = 0; i < maxLen; i++) {
      for (const result of results) {
        if (i < result.images.length) {
          allImages.push(result.images[i]);
        }
      }
    }
    totalCount = results.reduce((sum, r) => sum + r.total, 0);
  } else {
    allImages = results[0]?.images || [];
    totalCount = results[0]?.total || 0;
  }

  // Cap to requested perPage
  allImages = allImages.slice(0, perPage);

  const response: StockImageResponse = {
    images: allImages,
    total: totalCount,
    page,
    perPage,
    providers: activeProviders,
  };

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
