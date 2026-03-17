// =============================================================================
// DMSuite — Step 1: Logo Upload
// Large centered drop zone, logo type selector, skip option.
// =============================================================================

"use client";

import { useCallback, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBusinessCardWizard, type LogoType } from "@/stores/business-card-wizard";

const LOGO_TYPES: { value: LogoType; label: string; desc: string }[] = [
  { value: "auto-detect", label: "Auto-detect", desc: "AI will determine the best treatment" },
  { value: "separable", label: "Separable", desc: "Icon + text that can be split" },
  { value: "wordmark", label: "Wordmark", desc: "Text-only logo" },
  { value: "lockup", label: "Lockup", desc: "Icon & text locked together" },
  { value: "icon-only", label: "Icon Only", desc: "Symbol/icon without text" },
  { value: "emblem", label: "Emblem", desc: "Badge or crest-style logo" },
];

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

/**
 * Extract dominant colors from a logo image by sampling pixels on a canvas.
 * Returns up to 6 distinct hex color strings sorted by frequency.
 */
function extractLogoColors(img: HTMLImageElement): string[] {
  const size = 100; // sample at 100px for speed
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  // Draw logo scaled to sample size
  const aspect = img.naturalWidth / img.naturalHeight;
  let dw = size, dh = size;
  if (aspect > 1) { dh = size / aspect; } else { dw = size * aspect; }
  const dx = (size - dw) / 2, dy = (size - dh) / 2;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(img, dx, dy, dw, dh);

  const data = ctx.getImageData(0, 0, size, size).data;
  const colorCounts = new Map<string, number>();

  for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 128) continue; // skip transparent pixels

    // Quantize to reduce noise (round to nearest 16)
    const qr = Math.round(r / 16) * 16;
    const qg = Math.round(g / 16) * 16;
    const qb = Math.round(b / 16) * 16;

    // Skip near-white and near-black (background noise)
    const lum = 0.299 * qr + 0.587 * qg + 0.114 * qb;
    if (lum > 240 || lum < 15) continue;

    const hex = `#${qr.toString(16).padStart(2, "0")}${qg.toString(16).padStart(2, "0")}${qb.toString(16).padStart(2, "0")}`;
    colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
  }

  // Sort by frequency and return top 6 distinct colors
  return Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([hex]) => hex);
}

export default function StepLogoUpload() {
  const {
    logo,
    setLogoUrl,
    setLogoType,
    setLogoElement,
    setLogoColors,
    setIconOnlyUrl,
    nextStep,
  } = useBusinessCardWizard();

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Please upload a PNG, JPG, WebP, or SVG file.");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError("File is too large. Maximum size is 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setLogoUrl(dataUrl);

        // Pre-load as HTMLImageElement for canvas rendering
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          setLogoElement(img);
          // Extract dominant colors from the logo
          const colors = extractLogoColors(img);
          setLogoColors(colors);
        };
        img.onerror = () => setError("Failed to load the logo image.");
        img.src = dataUrl;
      };
      reader.onerror = () => setError("Failed to read the file.");
      reader.readAsDataURL(file);
    },
    [setLogoUrl, setLogoElement, setLogoColors]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleIconFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) return;
      const reader = new FileReader();
      reader.onload = (e) => setIconOnlyUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    },
    [setIconOnlyUrl]
  );

  const removeLogo = useCallback(() => {
    setLogoUrl(null);
    setLogoElement(null);
    setIconOnlyUrl(null);
    setLogoColors([]);
    setLogoType("auto-detect");
  }, [setLogoUrl, setLogoElement, setIconOnlyUrl, setLogoColors, setLogoType]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        <h2 className="text-2xl font-semibold text-white mb-2">
          Upload Your Logo
        </h2>
        <p className="text-gray-400 text-sm max-w-md">
          Start with your brand identity. Upload a logo for personalized designs,
          or skip to use text-only treatments.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!logo.logoUrl ? (
          /* ---- Drop Zone ---- */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative w-full max-w-md aspect-[16/10] rounded-xl border-2 border-dashed transition-colors duration-200 flex flex-col items-center justify-center gap-4 cursor-pointer ${
              isDragging
                ? "border-primary-500 bg-primary-500/5"
                : "border-gray-600 hover:border-gray-500 bg-gray-800/30"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />

            {/* Upload icon */}
            <motion.div
              animate={{ y: isDragging ? -5 : 0 }}
              className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-gray-400"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </motion.div>

            <div className="text-center">
              <p className="text-gray-300 text-sm font-medium">
                {isDragging ? "Drop your logo here" : "Drop your logo here or click to browse"}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                PNG, JPG, WebP, or SVG — max 10MB
              </p>
            </div>
          </motion.div>
        ) : (
          /* ---- Logo Preview ---- */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6 w-full max-w-md"
          >
            {/* Logo image */}
            <div className="relative group">
              <div className="w-48 h-48 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center p-6 overflow-hidden">
                <img
                  src={logo.logoUrl!}
                  alt="Your logo"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <button
                onClick={removeLogo}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/50 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                title="Remove logo"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Logo type selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full"
            >
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-center">
                Logo Type
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LOGO_TYPES.map(({ value, label, desc }) => (
                  <button
                    key={value}
                    onClick={() => setLogoType(value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      logo.logoType === value
                        ? "bg-primary-500/15 text-primary-400 ring-1 ring-primary-500/40"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                    }`}
                    title={desc}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Icon-only upload (shows when separable selected) */}
            <AnimatePresence>
              {(logo.logoType === "separable" || logo.logoType === "auto-detect") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="w-full overflow-hidden"
                >
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <p className="text-xs text-gray-400 mb-2">
                      Have a standalone icon version? Upload it for better design options.
                    </p>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIconFile(file);
                      }}
                    />
                    {logo.iconOnlyUrl ? (
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center p-2">
                          <img src={logo.iconOnlyUrl} alt="Icon" className="max-w-full max-h-full object-contain" />
                        </div>
                        <button
                          onClick={() => setIconOnlyUrl(null)}
                          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => iconInputRef.current?.click()}
                        className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                      >
                        + Upload icon version
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-sm"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4"
      >
        {!logo.logoUrl && (
          <button
            onClick={nextStep}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
          >
            Skip — I don't have a logo
          </button>
        )}

        {logo.logoUrl && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={nextStep}
            className="px-8 py-3 rounded-xl bg-primary-500 text-gray-950 font-semibold text-sm shadow-lg shadow-primary-500/20 hover:bg-primary-400 transition-colors"
          >
            Continue →
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
