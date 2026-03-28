import { fabric } from "fabric";
import type { FilterName } from "./types";

// ─── Text type detection ────────────────────────────────────────────────────
export function isTextType(type: string | undefined): boolean {
  return type === "text" || type === "i-text" || type === "textbox";
}

// ─── Download a data-URL as a file ──────────────────────────────────────────
export function downloadFile(dataUrl: string, ext: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `design.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ─── Create a Fabric image filter by name ───────────────────────────────────
// Fabric v5 has many filters not fully typed in @types/fabric — use `any`
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const F = fabric.Image.filters as any;

export function createFilter(value: string): fabric.IBaseFilter | null {
  const name = value as FilterName;
  switch (name) {
    case "polaroid":
      return new F.Polaroid();
    case "sepia":
      return new F.Sepia();
    case "kodachrome":
      return new F.Kodachrome();
    case "contrast":
      return new F.Contrast({ contrast: 0.3 });
    case "brightness":
      return new F.Brightness({ brightness: 0.2 });
    case "greyscale":
      return new F.Grayscale();
    case "brownie":
      return new F.Brownie();
    case "vintage":
      return new F.Vintage();
    case "technicolor":
      return new F.Technicolor();
    case "pixelate":
      return new F.Pixelate({ blocksize: 4 });
    case "invert":
      return new F.Invert();
    case "blur":
      return new F.Blur({ blur: 0.5 });
    case "sharpen":
      return new F.Convolute({
        matrix: [0, -1, 0, -1, 5, -1, 0, -1, 0],
      });
    case "emboss":
      return new F.Convolute({
        matrix: [1, 1, 1, 1, 0.7, -1, -1, -1, -1],
      });
    case "blacknwhite":
      return new F.BlackWhite();
    case "vibrance":
      return new F.Vibrance({ vibrance: 1 });
    case "huerotate":
      return new F.HueRotation({ rotation: 0.5 });
    case "none":
    default:
      return null;
  }
}

// ─── Fix text transform for JSON round-trip ─────────────────────────────────
export async function transformText(
  objects: fabric.Object[]
): Promise<void> {
  if (!objects) return;
  for (const obj of objects) {
    if (isTextType(obj.type)) {
      // fabric.Textbox sometimes loses transformMatrix on export
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (obj as any).set("transformMatrix", null);
    }
  }
}

// ─── Find a Fabric object by name ───────────────────────────────────────────
export function findObjectByName(
  canvas: fabric.Canvas,
  name: string
): fabric.Object | undefined {
  return canvas.getObjects().find((o) => o.name === name);
}

// ─── Find all objects matching a name pattern ───────────────────────────────
export function findObjectsByNamePrefix(
  canvas: fabric.Canvas,
  prefix: string
): fabric.Object[] {
  return canvas.getObjects().filter((o) => o.name?.startsWith(prefix));
}

// ─── Generate a unique object name ──────────────────────────────────────────
let _nameCounter = 0;
export function generateObjectName(prefix: string): string {
  _nameCounter += 1;
  return `${prefix}-${_nameCounter}`;
}

// ─── Clamp a number ─────────────────────────────────────────────────────────
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
