// =============================================================================
// DMSuite — Custom Block Renderer Components
// Renders CustomBlock[] at a given position inside the form renderer.
// Each block renders as a self-contained div with margins and alignment.
// =============================================================================

"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import type {
  CustomBlock,
  BlockPosition,
  QRCodeBlock,
  TextBlock,
  DividerBlock,
  SpacerBlock,
  ImageBlock,
  SignatureBoxBlock,
} from "./custom-blocks";

// ---------------------------------------------------------------------------
// QR Code Block — uses async toDataURL with state
// ---------------------------------------------------------------------------

function QRCodeBlockRender({
  block,
  accentColor,
  density,
}: {
  block: QRCodeBlock;
  accentColor: string;
  density: number;
}) {
  const [dataUri, setDataUri] = useState<string | null>(null);
  const { url, size, caption, fgColor, bgColor } = block.data;

  useEffect(() => {
    if (!url) {
      setDataUri(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: Math.round(size * density),
      margin: 1,
      color: { dark: fgColor, light: bgColor },
    })
      .then((uri) => {
        if (!cancelled) setDataUri(uri);
      })
      .catch(() => {
        if (!cancelled) setDataUri(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size, density, fgColor, bgColor]);

  const imgSize = Math.round(size * density);

  return (
    <div>
      {dataUri ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUri}
          alt="QR Code"
          width={imgSize}
          height={imgSize}
          style={{ display: "block", margin: block.alignment === "center" ? "0 auto" : block.alignment === "right" ? "0 0 0 auto" : "0" }}
        />
      ) : url ? (
        <div
          style={{
            width: `${imgSize}px`,
            height: `${imgSize}px`,
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: `${Math.round(8 * density)}px`,
            color: "#9ca3af",
            margin: block.alignment === "center" ? "0 auto" : block.alignment === "right" ? "0 0 0 auto" : "0",
          }}
        >
          QR
        </div>
      ) : null}
      {caption && (
        <div
          style={{
            fontSize: `${Math.round(9 * density)}px`,
            color: "#6b7280",
            textAlign: block.alignment,
            marginTop: `${Math.round(3 * density)}px`,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Text Block
// ---------------------------------------------------------------------------

function TextBlockRender({
  block,
  accentColor,
  density,
}: {
  block: TextBlock;
  accentColor: string;
  density: number;
}) {
  const { content, fontSize, fontWeight, color, italic, uppercase } = block.data;
  if (!content) return null;

  const resolvedColor = color === "accent" ? accentColor : color;

  return (
    <div
      style={{
        fontSize: `${Math.round(fontSize * density)}px`,
        fontWeight,
        color: resolvedColor,
        fontStyle: italic ? "italic" : "normal",
        textTransform: uppercase ? "uppercase" : "none",
        textAlign: block.alignment,
        lineHeight: 1.5,
        whiteSpace: "pre-line",
      }}
    >
      {content}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Divider Block
// ---------------------------------------------------------------------------

function DividerBlockRender({
  block,
  accentColor,
  density,
}: {
  block: DividerBlock;
  accentColor: string;
  density: number;
}) {
  const { style, thickness, color, widthPercent } = block.data;
  const resolvedColor = color === "accent" ? accentColor : color;

  return (
    <div
      style={{
        width: `${widthPercent}%`,
        margin: block.alignment === "center" ? "0 auto" : block.alignment === "right" ? "0 0 0 auto" : "0",
      }}
    >
      <div
        style={{
          borderTopStyle: style === "double" ? "double" : style,
          borderTopWidth: style === "double" ? `${thickness * 3}px` : `${thickness}px`,
          borderTopColor: resolvedColor,
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spacer Block
// ---------------------------------------------------------------------------

function SpacerBlockRender({
  block,
  density,
}: {
  block: SpacerBlock;
  density: number;
}) {
  return <div style={{ height: `${Math.round(block.data.height * density)}px` }} />;
}

// ---------------------------------------------------------------------------
// Image Block
// ---------------------------------------------------------------------------

function ImageBlockRender({
  block,
  density,
}: {
  block: ImageBlock;
  density: number;
}) {
  const { src, width, height, objectFit, opacity, caption } = block.data;
  if (!src) return null;

  const imgWidth = Math.round(width * density);
  const imgHeight = height > 0 ? Math.round(height * density) : undefined;

  return (
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          width: `${imgWidth}px`,
          height: imgHeight ? `${imgHeight}px` : "auto",
          objectFit,
          opacity,
          display: "block",
          margin: block.alignment === "center" ? "0 auto" : block.alignment === "right" ? "0 0 0 auto" : "0",
        }}
      />
      {caption && (
        <div
          style={{
            fontSize: `${Math.round(9 * density)}px`,
            color: "#6b7280",
            textAlign: block.alignment,
            marginTop: `${Math.round(3 * density)}px`,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signature Box Block
// ---------------------------------------------------------------------------

function SignatureBoxBlockRender({
  block,
  accentColor,
  density,
}: {
  block: SignatureBoxBlock;
  accentColor: string;
  density: number;
}) {
  const { label, lineWidth, lineStyle } = block.data;
  const w = Math.round(lineWidth * density);

  return (
    <div
      style={{
        display: "inline-block",
        margin: block.alignment === "center" ? "0 auto" : block.alignment === "right" ? "0 0 0 auto" : "0",
        ...(block.alignment !== "left" ? { display: "block", textAlign: block.alignment } : {}),
      }}
    >
      <div
        style={{
          width: `${w}px`,
          height: `${Math.round(28 * density)}px`,
          borderBottom: `1.5px ${lineStyle} ${accentColor}50`,
          display: "inline-block",
        }}
      />
      <div
        style={{
          fontSize: `${Math.round(10 * density)}px`,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: accentColor,
          marginTop: `${Math.round(3 * density)}px`,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CustomBlocksRegion — renders all blocks at a given position
// ---------------------------------------------------------------------------

export function CustomBlocksRegion({
  blocks,
  position,
  accentColor,
  density,
}: {
  blocks: CustomBlock[];
  position: BlockPosition;
  accentColor: string;
  density: number;
}) {
  const filtered = blocks.filter((b) => b.enabled && b.position === position);
  if (filtered.length === 0) return null;

  return (
    <>
      {filtered.map((block) => (
        <div
          key={block.id}
          style={{
            marginTop: `${Math.round(block.marginTop * density)}px`,
            marginBottom: `${Math.round(block.marginBottom * density)}px`,
          }}
        >
          {block.type === "qr-code" && (
            <QRCodeBlockRender block={block} accentColor={accentColor} density={density} />
          )}
          {block.type === "text" && (
            <TextBlockRender block={block} accentColor={accentColor} density={density} />
          )}
          {block.type === "divider" && (
            <DividerBlockRender block={block} accentColor={accentColor} density={density} />
          )}
          {block.type === "spacer" && (
            <SpacerBlockRender block={block} density={density} />
          )}
          {block.type === "image" && (
            <ImageBlockRender block={block} density={density} />
          )}
          {block.type === "signature-box" && (
            <SignatureBoxBlockRender block={block} accentColor={accentColor} density={density} />
          )}
        </div>
      ))}
    </>
  );
}

export default CustomBlocksRegion;
