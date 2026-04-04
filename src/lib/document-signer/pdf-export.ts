// =============================================================================
// DMSuite — Document Signer — PDF Export (pdf-lib)
// Creates real PDF documents with embedded signatures and field values.
// For uploaded PDFs: modifies the original PDF in-place.
// For template documents: generates a new PDF.
// =============================================================================

import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type {
  DocumentSignerForm,
  DocumentField,
} from "@/stores/document-signer-editor";

// A4 dimensions in PDF points (72 dpi)
const A4_W = 595.28;
const A4_H = 841.89;

// ── Hex → RGB conversion ────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) / 255,
    g: parseInt(clean.slice(2, 4), 16) / 255,
    b: parseInt(clean.slice(4, 6), 16) / 255,
  };
}

// ── Draw a single field value onto a PDF page ───────────────────────────────
async function drawFieldOnPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  field: DocumentField,
  font: PDFFont,
  pageWidth: number,
  pageHeight: number
) {
  if (!field.value) return;

  // Convert % positions to PDF points
  // PDF coordinates: origin at bottom-left, y increases upward
  const x = (field.x / 100) * pageWidth;
  const fieldTop = (field.y / 100) * pageHeight;
  const width = (field.width / 100) * pageWidth;
  const height = (field.height / 100) * pageHeight;
  // PDF y = page height - top position - field height (to get bottom of field)
  const y = pageHeight - fieldTop - height;

  const color = field.fontColor
    ? hexToRgb(field.fontColor)
    : { r: 0.1, g: 0.1, b: 0.18 };

  // Image-based fields (signature, stamp, initials, image)
  if (
    (field.type === "signature" ||
      field.type === "initials" ||
      field.type === "stamp" ||
      field.type === "image") &&
    field.value.startsWith("data:")
  ) {
    try {
      const base64 = field.value.split(",")[1];
      if (!base64) return;
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      let image;
      if (field.value.includes("image/png")) {
        image = await pdfDoc.embedPng(bytes);
      } else {
        image = await pdfDoc.embedJpg(bytes);
      }

      // Scale to fit within the field bounds
      const imgDims = image.scale(1);
      const scaleX = width / imgDims.width;
      const scaleY = height / imgDims.height;
      const scale = Math.min(scaleX, scaleY);

      page.drawImage(image, {
        x: x + (width - imgDims.width * scale) / 2,
        y: y + (height - imgDims.height * scale) / 2,
        width: imgDims.width * scale,
        height: imgDims.height * scale,
      });
    } catch {
      // If image embed fails, fall through to text rendering
      page.drawText(field.value.slice(0, 50), {
        x,
        y: y + height / 2 - 5,
        size: Math.min(field.fontSize || 12, height * 0.8),
        font,
        color: rgb(color.r, color.g, color.b),
      });
    }
    return;
  }

  // Checkbox
  if (field.type === "checkbox") {
    const mark = field.value === "true" ? "☑" : "☐";
    page.drawText(mark, {
      x: x + 2,
      y: y + height / 2 - 5,
      size: Math.min(14, height * 0.8),
      font,
      color: rgb(color.r, color.g, color.b),
    });
    return;
  }

  // Text-based fields
  const fontSize = Math.min(field.fontSize || 12, height * 0.7);
  const text = String(field.value);

  // Truncate if too long for width
  let displayText = text;
  const charWidth = fontSize * 0.5;
  const maxChars = Math.floor(width / charWidth);
  if (displayText.length > maxChars) {
    displayText = displayText.slice(0, maxChars - 1) + "…";
  }

  page.drawText(displayText, {
    x: x + 2,
    y: y + height / 2 - fontSize / 3,
    size: fontSize,
    font,
    color: rgb(color.r, color.g, color.b),
    maxWidth: width - 4,
  });
}

// ── Export: modify uploaded PDF ──────────────────────────────────────────────
async function exportUploadedPdf(form: DocumentSignerForm): Promise<Uint8Array> {
  // Decode the base64 PDF data
  const base64 = form.uploadedPdfData!.split(",")[1];
  if (!base64) throw new Error("Invalid PDF data");
  const pdfBytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

  const pdfDoc = await PDFDocument.load(pdfBytes);
  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // Group fields by page
  const fieldsByPage = new Map<number, DocumentField[]>();
  form.fields.forEach((f) => {
    const arr = fieldsByPage.get(f.page) || [];
    arr.push(f);
    fieldsByPage.set(f.page, arr);
  });

  // Draw fields on each page
  for (const [pageNum, fields] of fieldsByPage) {
    const pageIdx = pageNum - 1;
    if (pageIdx >= pages.length) continue;
    const page = pages[pageIdx];
    const { width, height } = page.getSize();

    for (const field of fields) {
      await drawFieldOnPage(pdfDoc, page, field, font, width, height);
    }
  }

  return pdfDoc.save();
}

// ── Export: generate new PDF from template ───────────────────────────────────
async function exportTemplatePdf(form: DocumentSignerForm): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Group fields by page
  const fieldsByPage = new Map<number, DocumentField[]>();
  form.fields.forEach((f) => {
    const arr = fieldsByPage.get(f.page) || [];
    arr.push(f);
    fieldsByPage.set(f.page, arr);
  });

  // Create pages
  for (const formPage of form.pages) {
    const page = pdfDoc.addPage([A4_W, A4_H]);

    // Title on first page
    if (formPage.number === 1) {
      let yPos = A4_H - 60;

      // Company name
      if (form.style.companyName) {
        const companyColor = hexToRgb(form.style.accentColor || "#6b7280");
        page.drawText(form.style.companyName, {
          x: A4_W / 2 - (form.style.companyName.length * 5) / 2,
          y: yPos,
          size: 10,
          font,
          color: rgb(companyColor.r, companyColor.g, companyColor.b),
        });
        yPos -= 20;
      }

      // Document title
      const titleColor = hexToRgb(form.style.accentColor || "#1a1a2e");
      const title = form.documentName || "Untitled Document";
      page.drawText(title, {
        x: A4_W / 2 - (title.length * 7) / 2,
        y: yPos,
        size: 18,
        font: boldFont,
        color: rgb(titleColor.r, titleColor.g, titleColor.b),
      });
      yPos -= 18;

      // Description
      if (form.description) {
        page.drawText(form.description, {
          x: A4_W / 2 - (form.description.length * 4) / 2,
          y: yPos,
          size: 10,
          font,
          color: rgb(0.42, 0.44, 0.50),
          maxWidth: A4_W - 80,
        });
        yPos -= 20;
      }

      // Separator line
      page.drawLine({
        start: { x: 40, y: yPos },
        end: { x: A4_W - 40, y: yPos },
        thickness: 0.5,
        color: rgb(0.83, 0.84, 0.86),
      });
    }

    // Page number
    const pageNumText = `Page ${formPage.number} of ${form.pages.length}`;
    page.drawText(pageNumText, {
      x: A4_W / 2 - (pageNumText.length * 3.5) / 2,
      y: 20,
      size: 8,
      font,
      color: rgb(0.63, 0.64, 0.66),
    });

    // Draw fields on this page
    const pageFields = fieldsByPage.get(formPage.number) || [];
    for (const field of pageFields) {
      await drawFieldOnPage(pdfDoc, page, field, font, A4_W, A4_H);
    }
  }

  return pdfDoc.save();
}

// ── Main export function ────────────────────────────────────────────────────
export async function exportDocumentAsPdf(
  form: DocumentSignerForm
): Promise<Blob> {
  let pdfBytes: Uint8Array;

  if (form.uploadedPdfData) {
    pdfBytes = await exportUploadedPdf(form);
  } else {
    pdfBytes = await exportTemplatePdf(form);
  }

  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}

// ── Download helper ─────────────────────────────────────────────────────────
export async function downloadDocumentPdf(
  form: DocumentSignerForm,
  filename?: string
): Promise<void> {
  const blob = await exportDocumentAsPdf(form);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ||
    `${form.documentName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-")}-signed.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
