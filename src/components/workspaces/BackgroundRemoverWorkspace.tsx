"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconScissors,
  IconDownload,
  IconLoader,
  IconPlus,
  IconImage,
  IconCheck,
  IconTrash,
} from "@/components/icons";

/* -- Types ------------------------------------------------- */

type BackgroundType = "transparent" | "solid" | "gradient" | "image" | "blur";
type GradientDirection = "to-right" | "to-bottom" | "to-br" | "to-bl" | "radial";
type ExportFormat = "png" | "jpeg" | "webp";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  /** The raw alpha-masked (transparent-bg) result blob URL */
  maskUrl?: string;
  /** The final composite (with chosen background) blob URL */
  resultUrl?: string;
  processed: boolean;
  processing: boolean;
  progress: number;
  width: number;
  height: number;
}

/* -- Constants --------------------------------------------- */

const BG_TYPES: { id: BackgroundType; label: string }[] = [
  { id: "transparent", label: "Transparent" },
  { id: "solid", label: "Solid Color" },
  { id: "gradient", label: "Gradient" },
  { id: "image", label: "Custom Image" },
  { id: "blur", label: "Blur Original" },
];

const GRADIENT_DIRS: { id: GradientDirection; label: string }[] = [
  { id: "to-right", label: "\u2192" },
  { id: "to-bottom", label: "\u2193" },
  { id: "to-br", label: "\u2198" },
  { id: "to-bl", label: "\u2199" },
  { id: "radial", label: "\u25CE" },
];

const PRESET_COLORS = [
  "#ffffff", "#000000", "#f43f5e", "#f97316", "#eab308",
  "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* -- Helpers ----------------------------------------------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve({ width: 1920, height: 1080 });
    img.src = url;
  });
}

/* -- Component --------------------------------------------- */

export default function BackgroundRemoverWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [dragOver, setDragOver] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [quality, setQuality] = useState(92);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const removeBackgroundRef = useRef<any>(null);

  /* Background settings */
  const [bgType, setBgType] = useState<BackgroundType>("transparent");
  const [solidColor, setSolidColor] = useState("#ffffff");
  const [gradientColor1, setGradientColor1] = useState("#667eea");
  const [gradientColor2, setGradientColor2] = useState("#764ba2");
  const [gradientDir, setGradientDir] = useState<GradientDirection>("to-br");
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [blurAmount, setBlurAmount] = useState(20);

  /* Display */
  const [sliderPosition, setSliderPosition] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const activeImage = images.find((img) => img.id === selectedImageId) ?? images[0] ?? null;

  /* -- Load the removal model lazily via CDN --------------- */
  const ensureModel = useCallback(async () => {
    if (removeBackgroundRef.current) return removeBackgroundRef.current;
    setModelLoading(true);
    setErrorMsg(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;

      // If the ESM module is already loaded, reuse it
      if (w.__imglyBgRemoval) {
        removeBackgroundRef.current = w.__imglyBgRemoval;
        setModelReady(true);
        return w.__imglyBgRemoval;
      }

      // Dynamically load from CDN – avoids npm/WASM bundling issues entirely
      const cdnUrl =
        "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/index.js";
      const mod = await import(/* webpackIgnore: true */ cdnUrl);
      const fn = mod.default || mod.removeBackground;
      w.__imglyBgRemoval = fn;
      removeBackgroundRef.current = fn;
      setModelReady(true);
      return fn;
    } catch (err) {
      console.error("Background removal load error:", err);
      setErrorMsg("Failed to load the AI model. Please refresh and try again.");
      return null;
    } finally {
      setModelLoading(false);
    }
  }, []);

  /* -- File handling --------------------------------------- */
  const addImage = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (files.length === 0) return;

      const newImages: UploadedImage[] = await Promise.all(
        files.map(async (f) => {
          const dims = await getImageDimensions(f);
          return {
            id: uid(),
            file: f,
            preview: URL.createObjectURL(f),
            processed: false,
            processing: false,
            progress: 0,
            width: dims.width,
            height: dims.height,
          };
        })
      );

      if (!batchMode && newImages.length > 0) {
        setImages([newImages[0]]);
        setSelectedImageId(newImages[0].id);
      } else {
        setImages((prev) => [...prev, ...newImages]);
        if (!selectedImageId && newImages.length > 0) setSelectedImageId(newImages[0].id);
      }
    },
    [batchMode, selectedImageId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addImage(e.dataTransfer.files);
    },
    [addImage]
  );

  const removeImage = (id: string) => {
    setImages((prev) => {
      const remaining = prev.filter((img) => img.id !== id);
      if (selectedImageId === id) {
        setSelectedImageId(remaining[0]?.id ?? null);
      }
      return remaining;
    });
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (bgImageUrl) URL.revokeObjectURL(bgImageUrl);
      setBgImageUrl(URL.createObjectURL(file));
    }
  };

  /* -- Real background removal ----------------------------- */
  const processImage = useCallback(
    async (id: string) => {
      const img = images.find((i) => i.id === id);
      if (!img || img.processing) return;

      setImages((prev) =>
        prev.map((i) =>
          i.id === id
            ? { ...i, processing: true, progress: 0, processed: false, maskUrl: undefined, resultUrl: undefined }
            : i
        )
      );
      setErrorMsg(null);

      try {
        const removeBg = await ensureModel();
        if (!removeBg) {
          setImages((prev) => prev.map((i) => (i.id === id ? { ...i, processing: false } : i)));
          return;
        }

        window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { progress: 10 } }));
        setImages((prev) => prev.map((i) => (i.id === id ? { ...i, progress: 15 } : i)));

        const resultBlob: Blob = await removeBg(img.file, {
          output: { format: "image/png" as const, quality: 1 },
          progress: (key: string, current: number, total: number) => {
            const pct = total > 0 ? Math.round((current / total) * 100) : 0;
            setImages((prev) =>
              prev.map((i) => (i.id === id ? { ...i, progress: Math.min(pct, 95) } : i))
            );
            window.dispatchEvent(
              new CustomEvent("workspace:progress", { detail: { progress: Math.min(pct, 95) } })
            );
          },
        });

        const maskBlobUrl = URL.createObjectURL(resultBlob);

        setImages((prev) =>
          prev.map((i) =>
            i.id === id
              ? {
                  ...i,
                  processing: false,
                  processed: true,
                  progress: 100,
                  maskUrl: maskBlobUrl,
                  resultUrl: maskBlobUrl,
                }
              : i
          )
        );

        window.dispatchEvent(new CustomEvent("workspace:progress", { detail: { progress: 100 } }));
        window.dispatchEvent(new CustomEvent("workspace:dirty", { detail: { dirty: true } }));
      } catch (err) {
        console.error("Background removal failed:", err);
        setErrorMsg(
          err instanceof Error ? err.message : "Background removal failed. Try a different image."
        );
        setImages((prev) =>
          prev.map((i) => (i.id === id ? { ...i, processing: false, progress: 0 } : i))
        );
      }
    },
    [images, ensureModel]
  );

  const processAll = useCallback(async () => {
    for (const img of images) {
      if (!img.processed && !img.processing) {
        await processImage(img.id);
      }
    }
  }, [images, processImage]);

  /* -- Composite: render foreground on chosen background ---- */
  const compositeResult = useCallback(
    async (img: UploadedImage, format: ExportFormat, q: number): Promise<Blob | null> => {
      if (!img.maskUrl) return null;

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      switch (bgType) {
        case "transparent":
          break;
        case "solid":
          ctx.fillStyle = solidColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
        case "gradient": {
          let grad: CanvasGradient;
          if (gradientDir === "radial") {
            grad = ctx.createRadialGradient(
              canvas.width / 2,
              canvas.height / 2,
              0,
              canvas.width / 2,
              canvas.height / 2,
              Math.max(canvas.width, canvas.height) / 2
            );
          } else {
            const coords: Record<string, [number, number, number, number]> = {
              "to-right": [0, 0, canvas.width, 0],
              "to-bottom": [0, 0, 0, canvas.height],
              "to-br": [0, 0, canvas.width, canvas.height],
              "to-bl": [canvas.width, 0, 0, canvas.height],
            };
            const [x0, y0, x1, y1] = coords[gradientDir] ?? [0, 0, canvas.width, canvas.height];
            grad = ctx.createLinearGradient(x0, y0, x1, y1);
          }
          grad.addColorStop(0, gradientColor1);
          grad.addColorStop(1, gradientColor2);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
        }
        case "image":
          if (bgImageUrl) {
            try {
              const bgImg = await loadImage(bgImageUrl);
              ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            } catch {
              /* ignore */
            }
          }
          break;
        case "blur":
          try {
            const origImg = await loadImage(img.preview);
            ctx.filter = `blur(${blurAmount}px)`;
            ctx.drawImage(
              origImg,
              -blurAmount * 2,
              -blurAmount * 2,
              canvas.width + blurAmount * 4,
              canvas.height + blurAmount * 4
            );
            ctx.filter = "none";
          } catch {
            /* ignore */
          }
          break;
      }

      const fgImg = await loadImage(img.maskUrl);
      ctx.drawImage(fgImg, 0, 0, canvas.width, canvas.height);

      const mimeMap: Record<ExportFormat, string> = {
        png: "image/png",
        jpeg: "image/jpeg",
        webp: "image/webp",
      };
      return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeMap[format], q / 100));
    },
    [bgType, solidColor, gradientColor1, gradientColor2, gradientDir, bgImageUrl, blurAmount]
  );

  /* -- Export / Download ----------------------------------- */
  const handleExport = useCallback(
    async (targetImage?: UploadedImage) => {
      const img = targetImage ?? activeImage;
      if (!img?.processed || !img.maskUrl) return;

      const blob = await compositeResult(img, exportFormat, quality);
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = img.file.name.replace(/\.[^.]+$/, "");
      a.download = `${baseName}-no-bg.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.dispatchEvent(new CustomEvent("workspace:save"));
    },
    [activeImage, compositeResult, exportFormat, quality]
  );

  const handleExportAll = useCallback(async () => {
    for (const img of images) {
      if (img.processed && img.maskUrl) await handleExport(img);
    }
  }, [images, handleExport]);

  /* -- Regenerate composite when bg settings change -------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const img of images) {
        if (!img.processed || !img.maskUrl || cancelled) continue;
        const blob = await compositeResult(img, "png", 100);
        if (blob && !cancelled) {
          const url = URL.createObjectURL(blob);
          setImages((prev) =>
            prev.map((i) => {
              if (i.id === img.id) {
                if (i.resultUrl && i.resultUrl !== i.maskUrl) URL.revokeObjectURL(i.resultUrl);
                return { ...i, resultUrl: url };
              }
              return i;
            })
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgType, solidColor, gradientColor1, gradientColor2, gradientDir, bgImageUrl, blurAmount]);

  /* -- Slider drag handling -------------------------------- */
  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPosition(pct);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      handleSliderMove(clientX);
    };
    const onUp = () => {
      isDragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [handleSliderMove]);

  /* -- Background preview helper (CSS for settings panel) -- */
  const bgPreviewStyle = (): React.CSSProperties => {
    switch (bgType) {
      case "transparent":
        return {
          backgroundImage:
            "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        };
      case "solid":
        return { backgroundColor: solidColor };
      case "gradient": {
        const dir =
          gradientDir === "radial"
            ? "radial-gradient(circle"
            : `linear-gradient(${
                gradientDir === "to-right"
                  ? "to right"
                  : gradientDir === "to-bottom"
                  ? "to bottom"
                  : gradientDir === "to-br"
                  ? "to bottom right"
                  : "to bottom left"
              }`;
        return { backgroundImage: `${dir}, ${gradientColor1}, ${gradientColor2})` };
      }
      case "image":
        return bgImageUrl
          ? { backgroundImage: `url(${bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
          : {};
      case "blur":
        return { backgroundColor: "#666", opacity: 0.5 };
      default:
        return {};
    }
  };

  const checkerboardStyle: React.CSSProperties = {
    backgroundImage:
      "linear-gradient(45deg, #e2e2e2 25%, transparent 25%), linear-gradient(-45deg, #e2e2e2 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e2e2 75%), linear-gradient(-45deg, transparent 75%, #e2e2e2 75%)",
    backgroundSize: "20px 20px",
    backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0",
  };

  const anyProcessing = images.some((img) => img.processing);
  const allProcessed = images.length > 0 && images.every((img) => img.processed);

  /* -- UI -------------------------------------------------- */
  return (
    <div>
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 lg:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${
              mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* -- Settings Panel ------------------------------ */}
        <div
          className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto max-h-[calc(100vh-10rem)] ${
            mobileTab !== "settings" ? "hidden lg:block" : ""
          }`}
        >
          {/* Model Status */}
          {modelLoading && (
            <div className="rounded-xl border border-primary-500/30 bg-primary-500/5 p-3 flex items-center gap-3">
              <IconLoader className="size-4 text-primary-500 animate-spin shrink-0" />
              <p className="text-xs text-primary-400">
                Loading AI model... (first time may take a moment)
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
              <p className="text-xs text-red-400">{errorMsg}</p>
            </div>
          )}

          {/* Background Options */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconImage className="size-4 text-primary-500" />
              Background
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {BG_TYPES.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => setBgType(bt.id)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                    bgType === bt.id
                      ? "bg-primary-500 text-gray-950"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {bt.label}
                </button>
              ))}
            </div>

            {bgType === "solid" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={solidColor}
                    onChange={(e) => setSolidColor(e.target.value)}
                    className="size-8 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={solidColor}
                    onChange={(e) => setSolidColor(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSolidColor(c)}
                      className={`size-6 rounded-md border-2 transition-all ${
                        solidColor === c
                          ? "border-primary-500 scale-110"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            )}

            {bgType === "gradient" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-gray-400">Color 1</label>
                    <input
                      type="color"
                      value={gradientColor1}
                      onChange={(e) => setGradientColor1(e.target.value)}
                      className="w-full h-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-gray-400">Color 2</label>
                    <input
                      type="color"
                      value={gradientColor2}
                      onChange={(e) => setGradientColor2(e.target.value)}
                      className="w-full h-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex gap-1">
                  {GRADIENT_DIRS.map((gd) => (
                    <button
                      key={gd.id}
                      onClick={() => setGradientDir(gd.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        gradientDir === gd.id
                          ? "bg-primary-500 text-gray-950"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {gd.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bgType === "image" && (
              <div>
                <button
                  onClick={() => bgImageInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:border-primary-500 transition-colors"
                >
                  <IconImage className="size-3.5" />
                  {bgImageUrl ? "Change Image" : "Upload Background"}
                </button>
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgImageUpload}
                />
                {bgImageUrl && (
                  <img
                    src={bgImageUrl}
                    alt="bg"
                    className="mt-2 rounded-lg w-full h-16 object-cover"
                  />
                )}
              </div>
            )}

            {bgType === "blur" && (
              <div className="space-y-1">
                <label className="block text-xs text-gray-400">
                  Blur:{" "}
                  <span className="text-gray-900 dark:text-white font-semibold">{blurAmount}px</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>
            )}

            {/* Preview swatch */}
            <div
              className="h-14 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={bgPreviewStyle()}
            />
          </div>

          {/* Export Settings */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export Settings</h3>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Format</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["png", "jpeg", "webp"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setExportFormat(f)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                      exportFormat === f
                        ? "bg-primary-500 text-gray-950"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {exportFormat !== "png" && (
              <div className="space-y-1">
                <label className="block text-xs text-gray-400">
                  Quality:{" "}
                  <span className="text-gray-900 dark:text-white font-semibold">{quality}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>
            )}
            {activeImage && (
              <p className="text-[10px] text-gray-400">
                Output: {activeImage.width} x {activeImage.height}px
              </p>
            )}
          </div>

          {/* Batch Toggle */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Batch Mode</span>
              <div
                onClick={() => setBatchMode(!batchMode)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  batchMode ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`size-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${
                    batchMode ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={() => {
                if (batchMode) processAll();
                else if (activeImage && !activeImage.processed) processImage(activeImage.id);
              }}
              disabled={
                images.length === 0 || anyProcessing || (!batchMode && !!activeImage?.processed)
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {anyProcessing ? (
                <IconLoader className="size-4 animate-spin" />
              ) : (
                <IconScissors className="size-4" />
              )}
              {anyProcessing
                ? "Processing..."
                : batchMode
                ? `Remove All (${images.filter((i) => !i.processed).length})`
                : activeImage?.processed
                ? "Done \u2713"
                : "Remove Background"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleExport()}
                disabled={!activeImage?.processed}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IconDownload className="size-3.5" />
                Download
              </button>
              {batchMode && (
                <button
                  onClick={handleExportAll}
                  disabled={!allProcessed}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <IconDownload className="size-3.5" />
                  All ({images.filter((i) => i.processed).length})
                </button>
              )}
              {!batchMode && activeImage?.processed && (
                <button
                  onClick={() => {
                    if (activeImage) {
                      setImages((prev) =>
                        prev.map((i) =>
                          i.id === activeImage.id
                            ? {
                                ...i,
                                processed: false,
                                maskUrl: undefined,
                                resultUrl: undefined,
                                progress: 0,
                              }
                            : i
                        )
                      );
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Re-process
                </button>
              )}
            </div>
          </div>
        </div>

        {/* -- Content Area --------------------------------- */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Upload Zone */}
          {images.length === 0 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-16 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-primary-500 bg-primary-500/5"
                  : "border-gray-300 dark:border-gray-700 hover:border-primary-500/50 bg-white dark:bg-gray-900"
              }`}
            >
              <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-primary-500/10 mb-4">
                <IconScissors className="size-8 text-primary-500" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Drag & drop an image or{" "}
                <span className="text-primary-500">click to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, WebP supported &middot; AI-powered removal
              </p>
              {modelReady && (
                <p className="text-[10px] text-green-500 mt-2">{"\u2713"} AI model ready</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple={batchMode}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) addImage(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          )}

          {/* Before / After Comparison */}
          {activeImage && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-48">
                    {activeImage.file.name}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {activeImage.width}x{activeImage.height}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {!activeImage.processed && !activeImage.processing && (
                    <button
                      onClick={() => processImage(activeImage.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 transition-colors"
                    >
                      <IconScissors className="size-3" />
                      Remove BG
                    </button>
                  )}
                  {activeImage.processed && (
                    <button
                      onClick={() => handleExport()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 transition-colors"
                    >
                      <IconDownload className="size-3" />
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => {
                      removeImage(activeImage.id);
                      fileInputRef.current?.click();
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="Replace image"
                  >
                    <IconPlus className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Canvas */}
              <div
                ref={sliderRef}
                className="relative w-full overflow-hidden select-none"
                style={{
                  aspectRatio: `${activeImage.width} / ${activeImage.height}`,
                  maxHeight: "65vh",
                }}
                onMouseDown={(e) => {
                  if (activeImage.processed) {
                    isDragging.current = true;
                    handleSliderMove(e.clientX);
                  }
                }}
                onTouchStart={(e) => {
                  if (activeImage.processed) {
                    isDragging.current = true;
                    handleSliderMove(e.touches[0].clientX);
                  }
                }}
              >
                {/* Before (original) */}
                <img
                  src={activeImage.preview}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain"
                  draggable={false}
                />

                {/* After (processed) -- clipped from left */}
                {activeImage.processed && activeImage.resultUrl && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <div
                      className="relative w-full h-full"
                      style={
                        bgType === "transparent"
                          ? {
                              ...checkerboardStyle,
                              width: sliderRef.current
                                ? `${sliderRef.current.clientWidth}px`
                                : "100vw",
                            }
                          : {
                              width: sliderRef.current
                                ? `${sliderRef.current.clientWidth}px`
                                : "100vw",
                            }
                      }
                    >
                      {bgType !== "transparent" && (
                        <div className="absolute inset-0" style={bgPreviewStyle()} />
                      )}
                      <img
                        src={activeImage.resultUrl}
                        alt="Result"
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{
                          width: sliderRef.current
                            ? `${sliderRef.current.clientWidth}px`
                            : "100%",
                        }}
                        draggable={false}
                      />
                    </div>
                  </div>
                )}

                {/* Slider divider line + handle */}
                {activeImage.processed && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 pointer-events-none"
                      style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
                    />
                    <div
                      className="absolute z-20 top-1/2 -translate-y-1/2 size-8 rounded-full border-2 border-white bg-gray-900/50 backdrop-blur flex items-center justify-center cursor-col-resize shadow-lg"
                      style={{
                        left: `${sliderPosition}%`,
                        transform: "translate(-50%, -50%)",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path
                          d="M3 6H0M3 6L1 4M3 6L1 8M9 6H12M9 6L11 4M9 6L11 8"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </>
                )}

                {/* Processing overlay */}
                {activeImage.processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
                    <div className="flex flex-col items-center gap-3 p-6">
                      <IconLoader className="size-10 text-primary-500 animate-spin" />
                      <span className="text-sm text-white font-medium">
                        Removing background...
                      </span>
                      <div className="w-48 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-300"
                          style={{ width: `${activeImage.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300">{activeImage.progress}%</span>
                    </div>
                  </div>
                )}

                {/* Labels */}
                {activeImage.processed && (
                  <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-10">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm">
                      After
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-sm">
                      Before
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Image List */}
          {batchMode && images.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                  <span className="text-gray-400 font-normal">
                    ({images.filter((i) => i.processed).length} processed)
                  </span>
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400 transition-colors"
                >
                  <IconPlus className="size-3" />
                  Add More
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImageId(img.id)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer ring-2 transition-all ${
                      selectedImageId === img.id
                        ? "ring-primary-500"
                        : "ring-transparent hover:ring-gray-400"
                    }`}
                  >
                    <img
                      src={img.preview}
                      alt=""
                      className="w-full aspect-square object-cover"
                    />
                    {img.processed && (
                      <div className="absolute top-1 right-1 p-0.5 rounded-full bg-green-500">
                        <IconCheck className="size-2.5 text-white" />
                      </div>
                    )}
                    {img.processing && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <IconLoader className="size-4 text-white animate-spin" />
                      </div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(img.id);
                      }}
                      className="absolute top-1 left-1 p-0.5 rounded bg-black/50 text-white hover:bg-red-500 transition-colors"
                    >
                      <IconTrash className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replace image button when single image is loaded */}
          {!batchMode && images.length > 0 && (
            <div className="flex justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors"
              >
                <IconPlus className="size-3.5" />
                Upload New Image
              </button>
            </div>
          )}

          {/* Hidden file input (shared) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple={batchMode}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addImage(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
