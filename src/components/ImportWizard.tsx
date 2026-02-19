import { useState } from "react";
import { Position, ImportValidationResult, ImportPreviewRow } from "@/types/models";
import { importService } from "@/services/importService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2, Upload } from "lucide-react";

interface ImportWizardProps {
  onImport: (positions: Position[]) => void;
  onCancel?: () => void;
}

interface ManualRow {
  id: string;
  ticker: string;
  quantity: number;
  avg_cost?: number;
}

export function ImportWizard({ onImport, onCancel }: ImportWizardProps) {
  const [pasteValue, setPasteValue] = useState("");
  const [pasteValidation, setPasteValidation] = useState<ImportValidationResult | null>(null);
  const [manualRows, setManualRows] = useState<ManualRow[]>([
    { id: "1", ticker: "", quantity: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handlePasteParse = async () => {
    if (!pasteValue.trim()) return;
    setIsLoading(true);
    try {
      const result = await importService.parseTable(pasteValue);
      setPasteValidation(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteConfirm = () => {
    if (!pasteValidation) return;
    const positions = importService.validatePositions(pasteValidation.valid_rows);
    onImport(positions);
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      let result: ImportValidationResult;

      if (file.name.endsWith(".xlsx")) {
        result = await importService.parseXLSX(buffer);
      } else if (file.name.endsWith(".csv")) {
        result = await importService.parseCSV(new TextDecoder().decode(buffer));
      } else {
        return;
      }

      setPasteValidation(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const addManualRow = () => {
    setManualRows([
      ...manualRows,
      { id: Date.now().toString(), ticker: "", quantity: 0 },
    ]);
  };

  const removeManualRow = (id: string) => {
    setManualRows(manualRows.filter((r) => r.id !== id));
  };

  const updateManualRow = (id: string, field: keyof ManualRow, value: any) => {
    setManualRows(
      manualRows.map((r) =>
        r.id === id ? { ...r, [field]: value } : r
      )
    );
  };

  const handleManualConfirm = () => {
    const positions = manualRows
      .filter((r) => r.ticker.trim())
      .map((r) => ({
        ticker: r.ticker.toUpperCase(),
        quantity: r.quantity,
        avg_cost: r.avg_cost,
      }));
    onImport(positions);
  };

  const PreviewTable = ({ rows }: { rows: ImportPreviewRow[] }) => (
    <div className="space-y-2">
      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <Table className="text-xs">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-slate-700 font-semibold">Ticker</TableHead>
              <TableHead className="text-slate-700 font-semibold text-right">Qty</TableHead>
              <TableHead className="text-slate-700 font-semibold text-right">Avg Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-mono">{row.ticker}</TableCell>
                <TableCell className="text-right font-mono">
                  {row.quantity.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {row.avg_cost ? `$${row.avg_cost.toFixed(2)}` : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="paste" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="paste">Paste Table</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Paste table from broker, Excel, or Google Sheets
            </Label>
            <Textarea
              placeholder="Ticker    Qty    Entry Price&#10;AAPL    100    150.50&#10;MSFT    50    330.00"
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              className="font-mono text-xs h-32 mb-2"
            />
            <Button
              onClick={handlePasteParse}
              disabled={isLoading || !pasteValue.trim()}
              className="w-full"
            >
              {isLoading ? "Parsing..." : "Parse & Preview"}
            </Button>
          </div>

          {pasteValidation && (
            <div className="space-y-3">
              <Alert className={pasteValidation.invalid_rows.length > 0 ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Imported {pasteValidation.total_imported} rows
                  {pasteValidation.total_skipped > 0
                    ? `, skipped ${pasteValidation.total_skipped} rows`
                    : ""}
                </AlertDescription>
              </Alert>

              {pasteValidation.valid_rows.length > 0 && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Valid rows to import:
                    </p>
                    <PreviewTable rows={pasteValidation.valid_rows} />
                  </div>
                  <Button
                    onClick={handlePasteConfirm}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Confirm & Import {pasteValidation.total_imported} Positions
                  </Button>
                </>
              )}

              {pasteValidation.invalid_rows.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-900 mb-2">
                    Errors:
                  </p>
                  <ul className="space-y-1 text-xs text-amber-800">
                    {pasteValidation.invalid_rows.map((err) => (
                      <li key={err.row_number}>
                        Row {err.row_number}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-900 mb-1">
              Drag & drop CSV or XLSX file
            </p>
            <p className="text-xs text-slate-600 mb-3">
              or click to select
            </p>
            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
              id="file-upload"
            />
            <Label htmlFor="file-upload" className="cursor-pointer">
              <Button size="sm" variant="outline" className="cursor-pointer">
                Select File
              </Button>
            </Label>
          </div>

          {pasteValidation && (
            <div className="space-y-3">
              <Alert className={pasteValidation.invalid_rows.length > 0 ? "border-amber-300 bg-amber-50" : "border-green-300 bg-green-50"}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Imported {pasteValidation.total_imported} rows
                  {pasteValidation.total_skipped > 0
                    ? `, skipped ${pasteValidation.total_skipped} rows`
                    : ""}
                </AlertDescription>
              </Alert>

              {pasteValidation.valid_rows.length > 0 && (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Valid rows to import:
                    </p>
                    <PreviewTable rows={pasteValidation.valid_rows} />
                  </div>
                  <Button
                    onClick={handlePasteConfirm}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Confirm & Import {pasteValidation.total_imported} Positions
                  </Button>
                </>
              )}

              {pasteValidation.invalid_rows.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-amber-900 mb-2">
                    Errors:
                  </p>
                  <ul className="space-y-1 text-xs text-amber-800">
                    {pasteValidation.invalid_rows.map((err) => (
                      <li key={err.row_number}>
                        Row {err.row_number}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {manualRows.map((row) => (
              <div key={row.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label className="text-xs text-slate-600">Ticker</Label>
                  <Input
                    placeholder="AAPL"
                    value={row.ticker}
                    onChange={(e) =>
                      updateManualRow(row.id, "ticker", e.target.value)
                    }
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-slate-600">Quantity</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={row.quantity || ""}
                    onChange={(e) =>
                      updateManualRow(row.id, "quantity", parseFloat(e.target.value) || 0)
                    }
                    className="text-sm h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-slate-600">Avg Cost (opt.)</Label>
                  <Input
                    type="number"
                    placeholder="150.50"
                    value={row.avg_cost || ""}
                    onChange={(e) =>
                      updateManualRow(row.id, "avg_cost", parseFloat(e.target.value) || undefined)
                    }
                    className="text-sm h-8"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeManualRow(row.id)}
                  className="px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            onClick={addManualRow}
            variant="outline"
            className="w-full text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Row
          </Button>

          <Button
            onClick={handleManualConfirm}
            disabled={manualRows.filter((r) => r.ticker.trim()).length === 0}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Add Positions
          </Button>
        </TabsContent>
      </Tabs>

      {onCancel && (
        <Button onClick={onCancel} variant="outline" className="w-full mt-4">
          Cancel
        </Button>
      )}
    </div>
  );
}
