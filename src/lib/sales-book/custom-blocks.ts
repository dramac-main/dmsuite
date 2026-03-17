// =============================================================================
// DMSuite — Custom Blocks Types, Constants, and Factory
// Central definition for all custom block types used in template-based tools.
// Pure types + data + factory — NO React code, NO store dependencies.
// =============================================================================

import { v4 as uuidv4 } from "uuid";

// ---------------------------------------------------------------------------
// Block Type & Position
// ---------------------------------------------------------------------------

export type CustomBlockType =
  | "qr-code"
  | "text"
  | "divider"
  | "spacer"
  | "image"
  | "signature-box";

/** Where in the form the block renders */
export type BlockPosition =
  | "after-header"
  | "after-items"
  | "before-signature"
  | "after-footer";

// ---------------------------------------------------------------------------
// Block Interfaces
// ---------------------------------------------------------------------------

/** Base shape shared by all block types */
export interface CustomBlockBase {
  id: string;
  type: CustomBlockType;
  position: BlockPosition;
  enabled: boolean;
  label?: string;
  alignment: "left" | "center" | "right";
  marginTop: number;
  marginBottom: number;
}

export interface QRCodeBlock extends CustomBlockBase {
  type: "qr-code";
  data: {
    url: string;
    size: number;
    caption?: string;
    fgColor: string;
    bgColor: string;
  };
}

export interface TextBlock extends CustomBlockBase {
  type: "text";
  data: {
    content: string;
    fontSize: number;
    fontWeight: "normal" | "bold";
    color: string;
    italic: boolean;
    uppercase: boolean;
  };
}

export interface DividerBlock extends CustomBlockBase {
  type: "divider";
  data: {
    style: "solid" | "dashed" | "dotted" | "double";
    thickness: number;
    color: string;
    widthPercent: number;
  };
}

export interface SpacerBlock extends CustomBlockBase {
  type: "spacer";
  data: {
    height: number;
  };
}

export interface ImageBlock extends CustomBlockBase {
  type: "image";
  data: {
    src: string;
    width: number;
    height: number;
    objectFit: "contain" | "cover";
    opacity: number;
    caption?: string;
  };
}

export interface SignatureBoxBlock extends CustomBlockBase {
  type: "signature-box";
  data: {
    label: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed" | "dotted";
  };
}

// ---------------------------------------------------------------------------
// Union Type
// ---------------------------------------------------------------------------

export type CustomBlock =
  | QRCodeBlock
  | TextBlock
  | DividerBlock
  | SpacerBlock
  | ImageBlock
  | SignatureBoxBlock;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const BLOCK_TYPES: { type: CustomBlockType; label: string; icon: string }[] = [
  { type: "qr-code", label: "QR Code", icon: "qr" },
  { type: "text", label: "Text", icon: "text" },
  { type: "divider", label: "Divider", icon: "divider" },
  { type: "spacer", label: "Spacer", icon: "spacer" },
  { type: "image", label: "Image", icon: "image" },
  { type: "signature-box", label: "Signature", icon: "signature" },
];

export const BLOCK_POSITIONS: { value: BlockPosition; label: string }[] = [
  { value: "after-header", label: "After Header" },
  { value: "after-items", label: "After Items" },
  { value: "before-signature", label: "Before Signature" },
  { value: "after-footer", label: "After Footer" },
];

// ---------------------------------------------------------------------------
// Default Block Factory
// ---------------------------------------------------------------------------

export function createDefaultBlock(type: CustomBlockType): CustomBlock {
  const base: CustomBlockBase = {
    id: uuidv4(),
    type,
    position: "after-items",
    enabled: true,
    alignment: "center",
    marginTop: 8,
    marginBottom: 8,
  };

  switch (type) {
    case "qr-code":
      return {
        ...base,
        type: "qr-code",
        data: { url: "", size: 80, caption: "", fgColor: "#000000", bgColor: "#ffffff" },
      };
    case "text":
      return {
        ...base,
        type: "text",
        data: { content: "", fontSize: 11, fontWeight: "normal", color: "#374151", italic: false, uppercase: false },
      };
    case "divider":
      return {
        ...base,
        type: "divider",
        data: { style: "solid", thickness: 1, color: "accent", widthPercent: 100 },
      };
    case "spacer":
      return {
        ...base,
        type: "spacer",
        data: { height: 16 },
      };
    case "image":
      return {
        ...base,
        type: "image",
        data: { src: "", width: 120, height: 0, objectFit: "contain", opacity: 1 },
      };
    case "signature-box":
      return {
        ...base,
        type: "signature-box",
        data: { label: "Signature", lineWidth: 160, lineStyle: "solid" },
      };
  }
}

/** Get a human-readable summary for a block (used in sidebar labels) */
export function getBlockSummary(block: CustomBlock): string {
  switch (block.type) {
    case "qr-code":
      return block.data.url ? block.data.url.replace(/^https?:\/\//, "").slice(0, 30) : "No URL";
    case "text":
      return block.data.content ? `"${block.data.content.slice(0, 25)}${block.data.content.length > 25 ? "…" : ""}"` : "Empty";
    case "divider":
      return block.data.style;
    case "spacer":
      return `${block.data.height}px`;
    case "image":
      return block.data.src ? "Has image" : "No image";
    case "signature-box":
      return block.data.label;
  }
}
