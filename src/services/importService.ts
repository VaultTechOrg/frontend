import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Position, ImportValidationResult, ImportPreviewRow } from "@/types/models";

const COMMON_HEADERS = {
  ticker: ["ticker", "symbol", "symbol/cusip", "instrument"],
  quantity: ["quantity", "qty", "shares", "units"],
  cost: [
    "entry price",
    "avg cost",
    "average cost",
    "purchase price",
    "entry",
    "cost",
  ],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim();
}

function detectDelimiter(text: string): string {
  const lines = text.split("\n").slice(0, 5);
  let tabCount = 0,
    commaCount = 0,
    semicolonCount = 0;

  lines.forEach((line) => {
    tabCount += (line.match(/\t/g) || []).length;
    commaCount += (line.match(/,/g) || []).length;
    semicolonCount += (line.match(/;/g) || []).length;
  });

  if (tabCount > commaCount && tabCount > semicolonCount) return "\t";
  if (semicolonCount > commaCount) return ";";
  return ",";
}

function findHeaderRow(
  rows: string[][]
): { headerRowIndex: number; headers: string[] } {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i];
    const normalized = row.map(normalizeHeader);

    const hasTickerLike = normalized.some((h) =>
      COMMON_HEADERS.ticker.some((th) => h.includes(th))
    );
    const hasQtyLike = normalized.some((h) =>
      COMMON_HEADERS.quantity.some((th) => h.includes(th))
    );

    if (hasTickerLike && hasQtyLike) {
      return { headerRowIndex: i, headers: normalized };
    }
  }

  return { headerRowIndex: 0, headers: rows[0]?.map(normalizeHeader) || [] };
}

function findColumnIndices(headers: string[]): {
  tickerIdx: number;
  qtyIdx: number;
  costIdx: number;
} {
  let tickerIdx = -1,
    qtyIdx = -1,
    costIdx = -1;

  headers.forEach((header, idx) => {
    if (
      tickerIdx === -1 &&
      COMMON_HEADERS.ticker.some((th) => header.includes(th))
    ) {
      tickerIdx = idx;
    }
    if (
      qtyIdx === -1 &&
      COMMON_HEADERS.quantity.some((th) => header.includes(th))
    ) {
      qtyIdx = idx;
    }
    if (
      costIdx === -1 &&
      COMMON_HEADERS.cost.some((th) => header.includes(th))
    ) {
      costIdx = idx;
    }
  });

  return { tickerIdx, qtyIdx, costIdx };
}

function parseRow(
  row: string[],
  tickerIdx: number,
  qtyIdx: number,
  costIdx: number
): ImportPreviewRow | null {
  const ticker = row[tickerIdx]?.trim().toUpperCase();
  const qtyStr = row[qtyIdx]?.trim();
  const costStr = costIdx !== -1 ? row[costIdx]?.trim() : undefined;

  if (!ticker) {
    return null;
  }

  if (!qtyStr) {
    return { ticker, quantity: 0, error: "Missing quantity" };
  }

  const quantity = parseFloat(qtyStr.replace(/,/g, ""));
  if (isNaN(quantity) || quantity <= 0) {
    return { ticker, quantity: 0, error: "Invalid quantity" };
  }

  let avg_cost: number | undefined;
  if (costStr) {
    const cost = parseFloat(costStr.replace(/,/g, ""));
    if (isNaN(cost) || cost < 0) {
      return {
        ticker,
        quantity,
        error: "Invalid average cost format",
      };
    }
    avg_cost = cost;
  }

  return { ticker, quantity, avg_cost };
}

export const importService = {
  async parseTable(text: string): Promise<ImportValidationResult> {
    const delimiter = detectDelimiter(text);
    const { data: rows } = Papa.parse(text, {
      delimiter,
      skipEmptyLines: true,
    });

    const typedRows = rows as string[][];
    if (typedRows.length === 0) {
      return { valid_rows: [], invalid_rows: [], total_imported: 0, total_skipped: 0 };
    }

    const { headerRowIndex, headers } = findHeaderRow(typedRows);
    const { tickerIdx, qtyIdx, costIdx } = findColumnIndices(headers);

    if (tickerIdx === -1 || qtyIdx === -1) {
      return {
        valid_rows: [],
        invalid_rows: [
          {
            row_number: 0,
            error: "Could not detect ticker and quantity columns",
          },
        ],
        total_imported: 0,
        total_skipped: 1,
      };
    }

    const dataRows = typedRows.slice(headerRowIndex + 1);
    const valid_rows: ImportPreviewRow[] = [];
    const invalid_rows: { row_number: number; error: string }[] = [];

    dataRows.forEach((row, idx) => {
      const rowNumber = headerRowIndex + 2 + idx;
      const parsed = parseRow(row, tickerIdx, qtyIdx, costIdx);

      if (!parsed) {
        return;
      }

      if (parsed.error) {
        invalid_rows.push({ row_number: rowNumber, error: parsed.error });
      } else {
        valid_rows.push(parsed);
      }
    });

    return {
      valid_rows,
      invalid_rows,
      total_imported: valid_rows.length,
      total_skipped: invalid_rows.length,
    };
  },

  async parseCSV(content: string): Promise<ImportValidationResult> {
    return this.parseTable(content);
  },

  async parseXLSX(buffer: ArrayBuffer): Promise<ImportValidationResult> {
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      return {
        valid_rows: [],
        invalid_rows: [{ row_number: 0, error: "No data found in file" }],
        total_imported: 0,
        total_skipped: 1,
      };
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const typedRows = rows as string[][];

    if (typedRows.length === 0) {
      return {
        valid_rows: [],
        invalid_rows: [{ row_number: 0, error: "No data found in file" }],
        total_imported: 0,
        total_skipped: 1,
      };
    }

    const { headerRowIndex, headers } = findHeaderRow(typedRows);
    const { tickerIdx, qtyIdx, costIdx } = findColumnIndices(headers);

    if (tickerIdx === -1 || qtyIdx === -1) {
      return {
        valid_rows: [],
        invalid_rows: [
          {
            row_number: 0,
            error: "Could not detect ticker and quantity columns",
          },
        ],
        total_imported: 0,
        total_skipped: 1,
      };
    }

    const dataRows = typedRows.slice(headerRowIndex + 1);
    const valid_rows: ImportPreviewRow[] = [];
    const invalid_rows: { row_number: number; error: string }[] = [];

    dataRows.forEach((row, idx) => {
      const rowNumber = headerRowIndex + 2 + idx;
      const parsed = parseRow(row, tickerIdx, qtyIdx, costIdx);

      if (!parsed) {
        return;
      }

      if (parsed.error) {
        invalid_rows.push({ row_number: rowNumber, error: parsed.error });
      } else {
        valid_rows.push(parsed);
      }
    });

    return {
      valid_rows,
      invalid_rows,
      total_imported: valid_rows.length,
      total_skipped: invalid_rows.length,
    };
  },

  validatePositions(rows: ImportPreviewRow[]): Position[] {
    return rows
      .filter((row) => !row.error)
      .map((row) => ({
        ticker: row.ticker,
        quantity: row.quantity,
        avg_cost: row.avg_cost,
      }));
  },
};
