"use client";

import { useState, useCallback } from "react";
import {
  IconMonitor,
  IconDownload,
  IconCopy,
  IconCheck,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type QRDataType = "url" | "text" | "email" | "phone" | "sms" | "wifi" | "vcard" | "location";
type QRStyle = "classic" | "rounded" | "dots" | "branded";
type ErrorCorrection = "L" | "M" | "Q" | "H";

interface WiFiData {
  ssid: string;
  password: string;
  encryption: "WPA" | "WEP" | "None";
}

interface VCardData {
  name: string;
  phone: string;
  email: string;
  company: string;
  title: string;
}

interface LocationData {
  latitude: string;
  longitude: string;
}

interface EmailData {
  to: string;
  subject: string;
  body: string;
}

const QR_TYPES: { id: QRDataType; label: string }[] = [
  { id: "url", label: "URL" },
  { id: "text", label: "Text" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "sms", label: "SMS" },
  { id: "wifi", label: "WiFi" },
  { id: "vcard", label: "vCard" },
  { id: "location", label: "Location" },
];

const QR_STYLES: { id: QRStyle; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "rounded", label: "Rounded" },
  { id: "dots", label: "Dots" },
  { id: "branded", label: "Branded" },
];

const ERROR_LEVELS: { id: ErrorCorrection; label: string; desc: string }[] = [
  { id: "L", label: "Low", desc: "7% recovery" },
  { id: "M", label: "Medium", desc: "15% recovery" },
  { id: "Q", label: "Quartile", desc: "25% recovery" },
  { id: "H", label: "High", desc: "30% recovery" },
];

/* ── Simple QR Grid Renderer ──────────────────────────────── */
function generateQRGrid(data: string, size: number): boolean[][] {
  const gridSize = 21;
  const grid: boolean[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => false)
  );

  // Finder patterns (top-left, top-right, bottom-left)
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[row + r][col + c] = isOuter || isInner;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, gridSize - 7);
  drawFinder(gridSize - 7, 0);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Data area — deterministic hash-based fill
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  for (let r = 9; r < gridSize - 8; r++) {
    for (let c = 9; c < gridSize - 8; c++) {
      hash = ((hash << 5) - hash + r * 31 + c * 17) | 0;
      grid[r][c] = (Math.abs(hash) % 3) < 1;
    }
  }

  return grid;
}

/* ── Component ─────────────────────────────────────────────── */

export default function QRCodeWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copied, setCopied] = useState(false);

  const [dataType, setDataType] = useState<QRDataType>("url");
  const [qrStyle, setQRStyle] = useState<QRStyle>("classic");
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrection>("M");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  // Data inputs
  const [urlInput, setUrlInput] = useState("https://");
  const [textInput, setTextInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("+260");
  const [smsInput, setSmsInput] = useState("+260");
  const [emailData, setEmailData] = useState<EmailData>({ to: "", subject: "", body: "" });
  const [wifiData, setWifiData] = useState<WiFiData>({ ssid: "", password: "", encryption: "WPA" });
  const [vcardData, setVcardData] = useState<VCardData>({ name: "", phone: "+260", email: "", company: "", title: "" });
  const [locationData, setLocationData] = useState<LocationData>({ latitude: "-15.4167", longitude: "28.2833" });

  /* ── Get QR data string ─────────────────────────────────── */
  const getQRData = useCallback((): string => {
    switch (dataType) {
      case "url": return urlInput;
      case "text": return textInput;
      case "phone": return `tel:${phoneInput}`;
      case "sms": return `sms:${smsInput}`;
      case "email": return `mailto:${emailData.to}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      case "wifi": return `WIFI:T:${wifiData.encryption};S:${wifiData.ssid};P:${wifiData.password};;`;
      case "vcard": return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardData.name}\nTEL:${vcardData.phone}\nEMAIL:${vcardData.email}\nORG:${vcardData.company}\nTITLE:${vcardData.title}\nEND:VCARD`;
      case "location": return `geo:${locationData.latitude},${locationData.longitude}`;
      default: return "";
    }
  }, [dataType, urlInput, textInput, phoneInput, smsInput, emailData, wifiData, vcardData, locationData]);

  /* ── Export ──────────────────────────────────────────────── */
  const downloadQR = useCallback(
    (format: "png" | "svg") => {
      const data = getQRData();
      if (!data) return;
      const grid = generateQRGrid(data, size);
      const gridSize = grid.length;
      const cellSize = Math.floor(size / gridSize);
      const borderRadius = qrStyle === "rounded" ? cellSize * 0.3 : qrStyle === "dots" ? cellSize * 0.5 : 0;

      if (format === "png") {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = fgColor;
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (grid[r][c]) {
              const x = c * cellSize;
              const y = r * cellSize;
              if (borderRadius > 0) {
                ctx.beginPath();
                ctx.roundRect(x, y, cellSize, cellSize, borderRadius);
                ctx.fill();
              } else {
                ctx.fillRect(x, y, cellSize, cellSize);
              }
            }
          }
        }
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = "qr-code.png";
        a.click();
      } else {
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
        svg += `<rect width="${size}" height="${size}" fill="${bgColor}"/>`;
        for (let r = 0; r < gridSize; r++) {
          for (let c = 0; c < gridSize; c++) {
            if (grid[r][c]) {
              const x = c * cellSize;
              const y = r * cellSize;
              if (qrStyle === "dots") {
                svg += `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${cellSize / 2}" fill="${fgColor}"/>`;
              } else {
                svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${borderRadius}" fill="${fgColor}"/>`;
              }
            }
          }
        }
        svg += `</svg>`;
        const blob = new Blob([svg], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "qr-code.svg";
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [getQRData, size, qrStyle, fgColor, bgColor]
  );

  const copyData = async () => {
    await navigator.clipboard.writeText(getQRData());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Render QR Preview ──────────────────────────────────── */
  const renderPreview = () => {
    const data = getQRData();
    if (!data) return null;
    const grid = generateQRGrid(data, size);
    const gridSize = grid.length;
    const cellSize = Math.floor(size / gridSize);

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <rect width={size} height={size} fill={bgColor} />
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            const x = c * cellSize;
            const y = r * cellSize;
            if (qrStyle === "dots") {
              return <circle key={`${r}-${c}`} cx={x + cellSize / 2} cy={y + cellSize / 2} r={cellSize / 2 - 0.5} fill={fgColor} />;
            }
            const rx = qrStyle === "rounded" ? cellSize * 0.3 : 0;
            return <rect key={`${r}-${c}`} x={x} y={y} width={cellSize} height={cellSize} rx={rx} fill={fgColor} />;
          })
        )}
      </svg>
    );
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
        <div className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto ${mobileTab !== "settings" ? "hidden lg:block" : ""}`}>
          {/* Data Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMonitor className="size-4 text-primary-500" />
              QR Data Type
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {QR_TYPES.map((qt) => (
                <button
                  key={qt.id}
                  onClick={() => setDataType(qt.id)}
                  className={`px-1.5 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${dataType === qt.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {qt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Input */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Data</h3>

            {dataType === "url" && (
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            )}

            {dataType === "text" && (
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                rows={3}
                placeholder="Enter text…"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            )}

            {dataType === "phone" && (
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="+260 97X XXX XXX"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
            )}

            {dataType === "sms" && (
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="+260 97X XXX XXX"
                value={smsInput}
                onChange={(e) => setSmsInput(e.target.value)}
              />
            )}

            {dataType === "email" && (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="To"
                  value={emailData.to}
                  onChange={(e) => setEmailData((p) => ({ ...p, to: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData((p) => ({ ...p, subject: e.target.value }))}
                />
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  rows={2}
                  placeholder="Body"
                  value={emailData.body}
                  onChange={(e) => setEmailData((p) => ({ ...p, body: e.target.value }))}
                />
              </div>
            )}

            {dataType === "wifi" && (
              <div className="space-y-2">
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="SSID (network name)"
                  value={wifiData.ssid}
                  onChange={(e) => setWifiData((p) => ({ ...p, ssid: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Password"
                  type="password"
                  value={wifiData.password}
                  onChange={(e) => setWifiData((p) => ({ ...p, password: e.target.value }))}
                />
                <div className="grid grid-cols-3 gap-1.5">
                  {(["WPA", "WEP", "None"] as const).map((enc) => (
                    <button
                      key={enc}
                      onClick={() => setWifiData((p) => ({ ...p, encryption: enc }))}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${wifiData.encryption === enc ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}
                    >
                      {enc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {dataType === "vcard" && (
              <div className="space-y-2">
                {(
                  [
                    { key: "name" as const, label: "Full Name" },
                    { key: "phone" as const, label: "Phone" },
                    { key: "email" as const, label: "Email" },
                    { key: "company" as const, label: "Company" },
                    { key: "title" as const, label: "Job Title" },
                  ]
                ).map(({ key, label }) => (
                  <input
                    key={key}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    placeholder={label}
                    value={vcardData[key]}
                    onChange={(e) => setVcardData((p) => ({ ...p, [key]: e.target.value }))}
                  />
                ))}
              </div>
            )}

            {dataType === "location" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Latitude</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    value={locationData.latitude}
                    onChange={(e) => setLocationData((p) => ({ ...p, latitude: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Longitude</label>
                  <input
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    value={locationData.longitude}
                    onChange={(e) => setLocationData((p) => ({ ...p, longitude: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* QR Style */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Style</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {QR_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setQRStyle(s.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${qrStyle === s.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Colors</h3>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 w-24">Foreground</label>
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 font-mono">{fgColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400 w-24">Background</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
              />
              <span className="text-[10px] text-gray-500 font-mono">{bgColor}</span>
            </div>
          </div>

          {/* Size */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">
              Size: <span className="text-gray-900 dark:text-white font-semibold">{size}px</span>
            </label>
            <input
              type="range"
              min={128}
              max={512}
              step={16}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-primary-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>128px</span>
              <span>512px</span>
            </div>
          </div>

          {/* Error Correction */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Error Correction</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ERROR_LEVELS.map((el) => (
                <button
                  key={el.id}
                  onClick={() => setErrorCorrection(el.id)}
                  className={`px-2 py-2 rounded-lg text-left transition-colors ${errorCorrection === el.id ? "bg-primary-500/10 border border-primary-500 text-primary-500" : "bg-gray-100 dark:bg-gray-800 border border-transparent text-gray-600 dark:text-gray-300"}`}
                >
                  <span className="text-xs font-semibold block">{el.label}</span>
                  <span className="text-[10px] opacity-60">{el.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Logo Overlay */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Logo Overlay</h3>
            <div className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 cursor-pointer hover:border-primary-500 hover:text-primary-500 transition-colors">
              Drop logo here or click to upload
            </div>
            <p className="text-[10px] text-gray-400">Use High error correction for best results with a logo overlay.</p>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadQR("png")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
              >
                <IconDownload className="size-4" />
                PNG
              </button>
              <button
                onClick={() => downloadQR("svg")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
              >
                <IconDownload className="size-4" />
                SVG
              </button>
            </div>
            <button
              onClick={copyData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? <IconCheck className="size-4 text-success" /> : <IconCopy className="size-4" />}
              {copied ? "Copied!" : "Copy Data"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* QR Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 flex flex-col items-center justify-center min-h-96">
            <div className="mb-4 rounded-xl border border-gray-100 dark:border-gray-800 p-4 inline-block" style={{ backgroundColor: bgColor }}>
              {renderPreview()}
            </div>
            <p className="text-xs text-gray-400 mt-2">{size} × {size}px • {qrStyle} • EC: {errorCorrection}</p>
          </div>

          {/* Data Preview */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Encoded Data</h3>
            <pre className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap break-all">
              {getQRData() || "(No data entered)"}
            </pre>
          </div>

          {/* Empty State */}
          {!getQRData() && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconMonitor className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Generate a QR Code</h3>
              <p className="text-sm text-gray-400 max-w-md">
                Select a data type and enter the information in the settings panel to generate your QR code.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
