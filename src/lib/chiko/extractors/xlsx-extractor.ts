// =============================================================================
// DMSuite — XLSX Extractor
// Extracts sheet names, column headers, and row data from XLSX buffers
// using the xlsx (SheetJS) library.
// =============================================================================

import * as XLSX from "xlsx";
import type {
  ExtractedFileData,
  ExtractedTable,
  SheetInfo,
} from "./index";

const MAX_ROWS_PER_SHEET = 500;

/**
 * Format a cell value to a string.
 */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    // Check if it looks like a date serial number (Excel dates are > 25000)
    // But only format as date if it's in a reasonable date range
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }
  return String(value);
}

/**
 * Detect column purpose from header names.
 */
function detectSheetType(headers: string[]): string {
  const lower = headers.map((h) => h.toLowerCase());

  const contactHeaders = ["name", "company", "phone", "email", "address", "contact"];
  const productHeaders = ["price", "qty", "quantity", "amount", "description", "unit price", "unit", "item", "product", "sku"];

  const contactScore = contactHeaders.filter((h) =>
    lower.some((l) => l.includes(h))
  ).length;
  const productScore = productHeaders.filter((h) =>
    lower.some((l) => l.includes(h))
  ).length;

  if (productScore >= 2) return "line-items/product data";
  if (contactScore >= 2) return "contacts/business data";
  return "";
}

/**
 * Extract sheets, columns, and row data from an XLSX buffer.
 */
export async function extractXlsx(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedFileData> {
  const workbook = XLSX.read(buffer, { type: "buffer" });

  const sheets: SheetInfo[] = [];
  const tables: ExtractedTable[] = [];
  const detectedTypes: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert to array of arrays
    const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });

    // Filter out completely empty rows
    const data = rawData.filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && cell !== "")
    );

    if (data.length === 0) {
      sheets.push({ name: sheetName, rowCount: 0, columns: [] });
      continue;
    }

    // First row as headers
    const headers = data[0].map((cell) => cellToString(cell));
    const dataRows = data.slice(1);

    // Truncate if needed
    const truncated = dataRows.length > MAX_ROWS_PER_SHEET;
    const rowsToUse = truncated
      ? dataRows.slice(0, MAX_ROWS_PER_SHEET)
      : dataRows;

    sheets.push({
      name: sheetName,
      rowCount: dataRows.length,
      columns: headers,
    });

    const tableRows = rowsToUse.map((row) => row.map((cell) => cellToString(cell)));

    tables.push({
      title: sheetName,
      hasHeaders: true,
      headers,
      rows: tableRows,
    });

    // Detect sheet type
    const sheetType = detectSheetType(headers);
    if (sheetType) {
      detectedTypes.push(`'${sheetName}': ${sheetType}`);
    }
  }

  // Build summary
  const summaryParts = [
    `XLSX spreadsheet with ${sheets.length} sheet${sheets.length !== 1 ? "s" : ""}`,
  ];

  for (const sheet of sheets) {
    if (sheet.rowCount > 0) {
      summaryParts.push(
        `'${sheet.name}' has ${sheet.rowCount} row${sheet.rowCount !== 1 ? "s" : ""}${sheet.columns.length > 0 ? `: ${sheet.columns.join(", ")}` : ""}`
      );
    }
  }

  if (detectedTypes.length > 0) {
    summaryParts.push(`Detected data types: ${detectedTypes.join("; ")}`);
  }

  return {
    fileName,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileSize: buffer.length,
    extractionType: "xlsx",
    sheets,
    tables: tables.length > 0 ? tables : undefined,
    summary: summaryParts.join(". "),
  };
}
