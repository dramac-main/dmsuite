// =============================================================================
// DMSuite — Sales Book Section: Brand & Supplier Logos
// Toggle brand logos, upload multiple logos, set position (top/bottom).
// =============================================================================

"use client";

import { useCallback, useRef } from "react";
import { useSalesBookEditor } from "@/stores/sales-book-editor";

export default function SBSectionBrandLogos() {
  const brandLogos = useSalesBookEditor((s) => s.form.brandLogos);
  const updateBrandLogos = useSalesBookEditor((s) => s.updateBrandLogos);
  const addBrandLogo = useSalesBookEditor((s) => s.addBrandLogo);
  const removeBrandLogo = useSalesBookEditor((s) => s.removeBrandLogo);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo must be under 2 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          addBrandLogo({ url: reader.result, name: file.name.replace(/\.[^.]+$/, "") });
        }
      };
      reader.readAsDataURL(file);
      // Reset file input
      e.target.value = "";
    },
    [addBrandLogo],
  );

  return (
    <div className="space-y-3">
      {/* Enable toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={brandLogos.enabled}
          onClick={() => updateBrandLogos({ enabled: !brandLogos.enabled })}
          className={`relative h-4 w-7 rounded-full transition-colors shrink-0 ${brandLogos.enabled ? "bg-primary-500" : "bg-gray-700"}`}
        >
          <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${brandLogos.enabled ? "translate-x-3" : ""}`} />
        </button>
        <span className="text-xs text-gray-300">Show brand/supplier logos on forms</span>
      </label>

      {brandLogos.enabled && (
        <>
          {/* Position */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Position</label>
            <div className="flex gap-2">
              {(["top", "bottom"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => updateBrandLogos({ position: pos })}
                  className={`rounded-lg border px-3 py-1 text-xs transition-all capitalize ${
                    brandLogos.position === pos
                      ? "border-primary-500 bg-primary-500/10 text-primary-300"
                      : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* Logo list */}
          {brandLogos.logos.length > 0 && (
            <div className="space-y-1.5">
              {brandLogos.logos.map((logo, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-800/50 border border-gray-700/50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo.url} alt={logo.name} className="h-8 w-auto rounded object-contain bg-white/5 p-0.5" />
                  <span className="text-xs text-gray-400 flex-1 truncate">{logo.name || `Logo ${i + 1}`}</span>
                  <button
                    onClick={() => removeBrandLogo(i)}
                    className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="4" x2="20" y2="20" /><line x1="20" y1="4" x2="4" y2="20" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add logo */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 w-full rounded-lg border border-dashed border-gray-700 bg-gray-800/30 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Logo
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={handleUpload}
            className="hidden"
          />

          <div className="text-[10px] text-gray-600">
            Add supplier, distributor, or brand logos to appear on printed forms.
          </div>
        </>
      )}
    </div>
  );
}
