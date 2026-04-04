// =============================================================================
// DMSuite — Document Signer — Settings Tab
// Email notifications, signature config (react-signature-canvas), audit trail
// =============================================================================

"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useDocumentSignerEditor, type SignatureMode } from "@/stores/document-signer-editor";

// react-signature-canvas — MIT license, smooth Bézier curves, touch support
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as any;

const SIGNATURE_FONTS = [
  "Dancing Script",
  "Great Vibes",
  "Pacifico",
  "Sacramento",
  "Alex Brush",
  "Allura",
];

const SIG_COLORS = ["#1a1a2e", "#1e3a5f", "#3b0764", "#14532d", "#7c2d12"];

export default function DocumentSignerSettingsTab() {
  const form = useDocumentSignerEditor((s) => s.form);
  const updateEmailSettings = useDocumentSignerEditor((s) => s.updateEmailSettings);
  const updateSignatureConfig = useDocumentSignerEditor((s) => s.updateSignatureConfig);
  const addAuditEntry = useDocumentSignerEditor((s) => s.addAuditEntry);

  const [section, setSection] = useState<"signature" | "email" | "audit">("signature");

  return (
    <div className="p-4 space-y-4">
      {/* Section tabs */}
      <div className="flex rounded-lg border border-gray-700/40 overflow-hidden">
        {(["signature", "email", "audit"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={`flex-1 py-2 text-[10px] font-medium capitalize transition-all ${
              section === key
                ? "bg-primary-500/15 text-primary-300 border-b-2 border-primary-500"
                : "text-gray-500 hover:text-gray-400 hover:bg-white/3"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {section === "signature" && (
        <SignatureSection
          config={form.signatureConfig}
          onUpdate={updateSignatureConfig}
        />
      )}

      {section === "email" && (
        <EmailSection
          settings={form.emailSettings}
          onUpdate={updateEmailSettings}
        />
      )}

      {section === "audit" && (
        <AuditSection
          entries={form.auditTrail}
          onAddEntry={addAuditEntry}
        />
      )}
    </div>
  );
}

// ── Signature Configuration Section ─────────────────────────────────────────
function SignatureSection({
  config,
  onUpdate,
}: {
  config: { mode: SignatureMode; drawData: string; typeText: string; typeFont: string; uploadData: string; color: string; penWidth: number };
  onUpdate: (patch: Partial<typeof config>) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sigCanvasRef = useRef<any>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleEndDraw = useCallback(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas || canvas.isEmpty()) return;
    // getTrimmedCanvas() crops whitespace for a clean signature
    const trimmed = canvas.getTrimmedCanvas();
    onUpdate({ drawData: trimmed.toDataURL("image/png") });
  }, [onUpdate]);

  const clearCanvas = useCallback(() => {
    sigCanvasRef.current?.clear();
    onUpdate({ drawData: "" });
  }, [onUpdate]);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        onUpdate({ uploadData: reader.result as string });
      };
      reader.readAsDataURL(file);
    },
    [onUpdate]
  );

  return (
    <div className="space-y-4">
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Signature Capture
      </label>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-1.5">
        {(["draw", "type", "upload"] as SignatureMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => onUpdate({ mode })}
            className={`py-2 text-[10px] font-medium rounded-lg border capitalize transition-all ${
              config.mode === mode
                ? "border-primary-500/50 bg-primary-500/10 text-primary-300"
                : "border-gray-700/40 text-gray-500 hover:border-gray-600"
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Draw mode — react-signature-canvas */}
      {config.mode === "draw" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-[9px] text-gray-500 uppercase tracking-wider">Pen Color</label>
            <div className="flex gap-1">
              {SIG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onUpdate({ color: c });
                    // SignatureCanvas doesn't update color dynamically; clear and let user redraw
                  }}
                  className={`w-5 h-5 rounded-full transition-all ${
                    config.color === c ? "ring-2 ring-white/30 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <label className="text-[9px] text-gray-500">Width</label>
              <input
                type="range"
                min={0.5}
                max={5}
                step={0.5}
                value={config.penWidth}
                onChange={(e) => onUpdate({ penWidth: Number(e.target.value) })}
                className="w-16 accent-primary-500"
              />
            </div>
          </div>
          <div className="rounded-xl border border-gray-700/40 bg-white overflow-hidden">
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor={config.color}
              minWidth={config.penWidth * 0.5}
              maxWidth={config.penWidth * 1.5}
              velocityFilterWeight={0.7}
              canvasProps={{
                className: "w-full h-28",
                style: { width: "100%", height: "112px" },
              }}
              onEnd={handleEndDraw}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearCanvas}
              className="text-[10px] text-gray-500 hover:text-gray-400 transition-colors"
            >
              Clear Signature
            </button>
            {config.drawData && (
              <span className="text-[9px] text-green-500/70">✓ Captured</span>
            )}
          </div>
        </div>
      )}

      {/* Type mode */}
      {config.mode === "type" && (
        <div className="space-y-3">
          <input
            type="text"
            value={config.typeText}
            onChange={(e) => onUpdate({ typeText: e.target.value })}
            placeholder="Type your signature..."
            className="w-full h-10 px-3 rounded-lg bg-gray-800/60 border border-gray-700/50 text-lg text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
            style={{ fontFamily: `'${config.typeFont}', cursive` }}
          />
          <div className="space-y-1">
            <label className="text-[9px] text-gray-500 uppercase tracking-wider">Signature Font</label>
            <div className="grid grid-cols-2 gap-1.5">
              {SIGNATURE_FONTS.map((font) => (
                <button
                  key={font}
                  onClick={() => onUpdate({ typeFont: font })}
                  className={`py-2 px-2 text-sm rounded-lg border transition-all ${
                    config.typeFont === font
                      ? "border-primary-500/50 bg-primary-500/10"
                      : "border-gray-700/40 hover:border-gray-600"
                  }`}
                  style={{ fontFamily: `'${font}', cursive`, color: config.color }}
                >
                  {config.typeText || "Signature"}
                </button>
              ))}
            </div>
          </div>
          {/* Color */}
          <div className="flex items-center gap-2">
            <label className="text-[9px] text-gray-500 uppercase tracking-wider">Color</label>
            <div className="flex gap-1">
              {SIG_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => onUpdate({ color: c })}
                  className={`w-5 h-5 rounded-full transition-all ${
                    config.color === c ? "ring-2 ring-white/30 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          {/* Preview */}
          {config.typeText && (
            <div className="p-4 rounded-xl border border-gray-700/30 bg-white text-center">
              <span
                className="text-2xl"
                style={{
                  fontFamily: `'${config.typeFont}', cursive`,
                  color: config.color,
                }}
              >
                {config.typeText}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Upload mode */}
      {config.mode === "upload" && (
        <div className="space-y-2">
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          {config.uploadData ? (
            <div className="p-4 rounded-xl border border-gray-700/30 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.uploadData}
                alt="Signature"
                className="max-w-full max-h-28 mx-auto object-contain"
              />
              <button
                onClick={() => onUpdate({ uploadData: "" })}
                className="mt-2 text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => uploadRef.current?.click()}
              className="w-full p-6 rounded-xl border-2 border-dashed border-gray-700/50 hover:border-primary-500/40 transition-all"
            >
              <div className="flex flex-col items-center gap-1.5 text-gray-500">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span className="text-[11px]">Upload signature image</span>
                <span className="text-[9px] text-gray-600">PNG or JPG, transparent background recommended</span>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Email Notification Section ──────────────────────────────────────────────
function EmailSection({
  settings,
  onUpdate,
}: {
  settings: { subject: string; message: string; sendReminders: boolean; reminderDays: number; ccEmails: string[]; replyTo: string; completionMessage: string };
  onUpdate: (patch: Partial<typeof settings>) => void;
}) {
  return (
    <div className="space-y-4">
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
        Email Notifications
      </label>

      {/* Subject */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Email Subject</label>
        <input
          type="text"
          value={settings.subject}
          onChange={(e) => onUpdate({ subject: e.target.value })}
          placeholder="Please sign: {{documentName}}"
          className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        />
        <p className="text-[8px] text-gray-600">Use {"{{documentName}}"} for auto-replacement</p>
      </div>

      {/* Message */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Message Body</label>
        <textarea
          value={settings.message}
          onChange={(e) => onUpdate({ message: e.target.value })}
          rows={3}
          className="w-full px-2.5 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all resize-none"
        />
      </div>

      {/* Reply-To */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Reply-To Email</label>
        <input
          type="email"
          value={settings.replyTo}
          onChange={(e) => onUpdate({ replyTo: e.target.value })}
          placeholder="you@company.com"
          className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        />
      </div>

      {/* CC */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">CC Emails (comma separated)</label>
        <input
          type="text"
          value={settings.ccEmails.join(", ")}
          onChange={(e) =>
            onUpdate({
              ccEmails: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="cc1@example.com, cc2@example.com"
          className="w-full h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
        />
      </div>

      {/* Reminders */}
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.sendReminders}
          onChange={(e) => onUpdate({ sendReminders: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-gray-600 text-primary-500 focus:ring-primary-500/30 bg-gray-800"
        />
        <span className="text-[11px] text-gray-300">Send reminder emails</span>
      </label>

      {settings.sendReminders && (
        <div className="space-y-1 ml-6">
          <label className="text-[9px] text-gray-500 uppercase tracking-wider">Reminder interval (days)</label>
          <input
            type="number"
            value={settings.reminderDays}
            onChange={(e) => onUpdate({ reminderDays: Math.max(1, Number(e.target.value)) })}
            min={1}
            max={30}
            className="w-24 h-8 px-2.5 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
      )}

      {/* Completion message */}
      <div className="space-y-1">
        <label className="text-[9px] text-gray-500 uppercase tracking-wider">Completion Message</label>
        <textarea
          value={settings.completionMessage}
          onChange={(e) => onUpdate({ completionMessage: e.target.value })}
          rows={2}
          className="w-full px-2.5 py-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-[11px] text-gray-200 focus:outline-none focus:border-primary-500/50 transition-all resize-none"
        />
      </div>
    </div>
  );
}

// ── Audit Trail Section ─────────────────────────────────────────────────────
function AuditSection({
  entries,
  onAddEntry,
}: {
  entries: { id: string; timestamp: string; action: string; actor: string; details: string }[];
  onAddEntry: (action: string, actor: string, details: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Audit Trail ({entries.length})
        </label>
        <button
          onClick={() =>
            onAddEntry(
              "document_viewed",
              "System",
              "Document opened in workspace"
            )
          }
          className="text-[9px] text-primary-400 hover:text-primary-300 transition-colors"
        >
          + Log Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <p className="text-[10px] text-gray-600 text-center py-6">
          No audit entries yet. Actions will be logged as signers interact with the document.
        </p>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-thin">
          {[...entries].reverse().map((entry) => (
            <div
              key={entry.id}
              className="p-2.5 rounded-lg border border-gray-700/30 bg-gray-800/20"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-gray-300">
                  {entry.action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </span>
                <span className="text-[8px] text-gray-600 font-mono">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-[9px] text-gray-500">{entry.details}</p>
              <p className="text-[8px] text-gray-600 mt-0.5">By: {entry.actor}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
