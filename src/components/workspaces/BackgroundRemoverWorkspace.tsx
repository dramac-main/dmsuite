"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconScissors,
  IconDownload,
  IconLoader,
  IconPlus,
  IconImage,
  IconCheck,
  IconTrash,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type BackgroundType = "transparent" | "solid" | "gradient" | "image" | "blur";
type GradientDirection = "to-right" | "to-bottom" | "to-br" | "to-bl" | "radial";
type DetectionMode = "auto" | "person" | "product" | "animal";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  processed: boolean;
  resultUrl?: string;
  processing: boolean;
}

/* ── Constants ─────────────────────────────────────────────── */

const BG_TYPES: { id: BackgroundType; label: string }[] = [
  { id: "transparent", label: "Transparent" },
  { id: "solid", label: "Solid Color" },
  { id: "gradient", label: "Gradient" },
  { id: "image", label: "Custom Image" },
  { id: "blur", label: "Blur" },
];

const GRADIENT_DIRS: { id: GradientDirection; label: string }[] = [
  { id: "to-right", label: "→" },
  { id: "to-bottom", label: "↓" },
  { id: "to-br", label: "↘" },
  { id: "to-bl", label: "↙" },
  { id: "radial", label: "◎" },
];

const DETECTION_MODES: { id: DetectionMode; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "person", label: "Person" },
  { id: "product", label: "Product" },
  { id: "animal", label: "Animal" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Component ─────────────────────────────────────────────── */

export default function BackgroundRemoverWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [dragOver, setDragOver] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  /* Background settings */
  const [bgType, setBgType] = useState<BackgroundType>("transparent");
  const [solidColor, setSolidColor] = useState("#ffffff");
  const [gradientColor1, setGradientColor1] = useState("#667eea");
  const [gradientColor2, setGradientColor2] = useState("#764ba2");
  const [gradientDir, setGradientDir] = useState<GradientDirection>("to-br");
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null);
  const [blurAmount, setBlurAmount] = useState(20);

  /* Processing settings */
  const [edgeSmooth, setEdgeSmooth] = useState(50);
  const [detectionMode, setDetectionMode] = useState<DetectionMode>("auto");
  const [sliderPosition, setSliderPosition] = useState(50);

  const activeImage = images.find((img) => img.id === selectedImageId) ?? images[0] ?? null;

  /* ── File handling ───────────────────────────────────────── */
  const addImage = useCallback((fileList: FileList | File[]) => {
    const newImages: UploadedImage[] = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: uid(),
        file: f,
        preview: URL.createObjectURL(f),
        processed: false,
        processing: false,
      }));
    if (!batchMode && newImages.length > 0) {
      setImages([newImages[0]]);
      setSelectedImageId(newImages[0].id);
    } else {
      setImages((prev) => [...prev, ...newImages]);
      if (!selectedImageId && newImages.length > 0) setSelectedImageId(newImages[0].id);
    }
  }, [batchMode, selectedImageId]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addImage(e.dataTransfer.files);
    },
    [addImage]
  );

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImageId === id) {
      setSelectedImageId(images.length > 1 ? images.find((img) => img.id !== id)?.id ?? null : null);
    }
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setBgImageUrl(URL.createObjectURL(file));
  };

  /* ── Simulate processing ────────────────────────────────── */
  const processImage = async (id: string) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, processing: true } : img))
    );
    await new Promise((r) => setTimeout(r, 2000));
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, processing: false, processed: true, resultUrl: img.preview } : img
      )
    );
  };

  const processAll = async () => {
    for (const img of images) {
      if (!img.processed) await processImage(img.id);
    }
  };

  /* ── Background preview helper ──────────────────────────── */
  const bgPreviewStyle = (): React.CSSProperties => {
    switch (bgType) {
      case "transparent":
        return {
          backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
        };
      case "solid":
        return { backgroundColor: solidColor };
      case "gradient": {
        const dir = gradientDir === "radial" ? "radial-gradient(circle" : `linear-gradient(${gradientDir === "to-right" ? "to right" : gradientDir === "to-bottom" ? "to bottom" : gradientDir === "to-br" ? "to bottom right" : "to bottom left"}`;
        return { backgroundImage: `${dir}, ${gradientColor1}, ${gradientColor2})` };
      }
      case "image":
        return bgImageUrl ? { backgroundImage: `url(${bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {};
      case "blur":
        return { backdropFilter: `blur(${blurAmount}px)` };
      default:
        return {};
    }
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 lg:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div
          className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto ${mobileTab !== "settings" ? "hidden lg:block" : ""}`}
        >
          {/* Detection Mode */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconScissors className="size-4 text-primary-500" />
              Detection Mode
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {DETECTION_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setDetectionMode(m.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${detectionMode === m.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Options */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Background
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {BG_TYPES.map((bt) => (
                <button
                  key={bt.id}
                  onClick={() => setBgType(bt.id)}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${bgType === bt.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {bt.label}
                </button>
              ))}
            </div>

            {bgType === "solid" && (
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
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${gradientDir === gd.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
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
              </div>
            )}

            {bgType === "blur" && (
              <div className="space-y-1">
                <label className="block text-xs text-gray-400">
                  Blur: <span className="text-gray-900 dark:text-white font-semibold">{blurAmount}px</span>
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

            {/* Preview */}
            <div
              className="h-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              style={bgPreviewStyle()}
            />
          </div>

          {/* Edge Refinement */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <label className="block text-xs text-gray-400">
              Edge Smoothness: <span className="text-gray-900 dark:text-white font-semibold">{edgeSmooth}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={edgeSmooth}
              onChange={(e) => setEdgeSmooth(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
          </div>

          {/* Batch Toggle */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Batch Mode</span>
              <div
                onClick={() => setBatchMode(!batchMode)}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${batchMode ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <div
                  className={`size-4 rounded-full bg-white shadow absolute top-0.5 transition-transform ${batchMode ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </div>
            </label>
          </div>

          {/* Process & Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={() => {
                if (batchMode) processAll();
                else if (activeImage) processImage(activeImage.id);
              }}
              disabled={images.length === 0 || images.some((img) => img.processing)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {images.some((img) => img.processing) ? (
                <IconLoader className="size-4 animate-spin" />
              ) : (
                <IconScissors className="size-4" />
              )}
              {batchMode ? `Remove All (${images.length})` : "Remove Background"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!activeImage?.processed}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <IconDownload className="size-3.5" />
                PNG
              </button>
              <button
                disabled={!activeImage?.processed}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <IconDownload className="size-3.5" />
                JPEG
              </button>
            </div>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
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
              className={`rounded-xl border-2 border-dashed p-16 text-center cursor-pointer transition-colors ${dragOver ? "border-primary-500 bg-primary-500/5" : "border-gray-300 dark:border-gray-700 hover:border-primary-500/50 bg-white dark:bg-gray-900"}`}
            >
              <IconPlus className="size-10 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Drag & drop an image or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={batchMode}
                className="hidden"
                onChange={(e) => e.target.files && addImage(e.target.files)}
              />
            </div>
          )}

          {/* Before / After Comparison */}
          {activeImage && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="relative w-full aspect-video overflow-hidden">
                {/* Before (original) */}
                <img
                  src={activeImage.preview}
                  alt="Original"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                {/* After (processed) — clipped */}
                {activeImage.processed && (
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <div className="relative w-full h-full" style={bgPreviewStyle()}>
                      <img
                        src={activeImage.resultUrl}
                        alt="Processed"
                        className="absolute inset-0 w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
                {/* Slider divider */}
                {activeImage.processed && (
                  <>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10 cursor-col-resize"
                      style={{ left: `${sliderPosition}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 w-3/4 z-20 accent-primary-500"
                    />
                  </>
                )}
                {/* Processing overlay */}
                {activeImage.processing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <IconLoader className="size-8 text-primary-500 animate-spin" />
                      <span className="text-sm text-white font-medium">Removing background…</span>
                    </div>
                  </div>
                )}
                {/* Labels */}
                {activeImage.processed && (
                  <div className="absolute top-3 left-3 right-3 flex justify-between pointer-events-none z-10">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
                      After
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
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
                  {images.length} image{images.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400 transition-colors"
                >
                  <IconPlus className="size-3" />
                  Add More
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImageId(img.id)}
                    className={`relative rounded-lg overflow-hidden cursor-pointer ring-2 transition-all ${selectedImageId === img.id ? "ring-primary-500" : "ring-transparent hover:ring-gray-400"}`}
                  >
                    <img src={img.preview} alt="" className="w-full aspect-square object-cover" />
                    {img.processed && (
                      <div className="absolute top-1 right-1">
                        <IconCheck className="size-3.5 text-green-500 drop-shadow" />
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

          {/* Empty State (no image) */}
          {images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconScissors className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Remove Backgrounds
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Upload an image to automatically remove its background. Choose a replacement background in the settings panel — transparent, solid color, gradient, or custom image.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
