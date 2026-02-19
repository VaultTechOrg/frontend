import { useState, useMemo } from "react";
import { Position } from "@/types/models";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";

interface HoldingData extends Position {
  id: string;
  current_price: number;
  market_value: number;
  portfolio_share: number;
  profit_loss: number;
}

interface HoldingsTableProps {
  holdings: HoldingData[];
  isLoading?: boolean;
}

type SortField = keyof HoldingData | null;
type SortOrder = "asc" | "desc";

export function HoldingsTable({ holdings, isLoading }: HoldingsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("market_value");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const filteredAndSorted = useMemo(() => {
    let filtered = holdings.filter((h) =>
      h.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortField) {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        const numA = Number(aVal) || 0;
        const numB = Number(bVal) || 0;

        return sortOrder === "asc" ? numA - numB : numB - numA;
      });
    }

    return filtered;
  }, [holdings, searchTerm, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const SortableHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-slate-100 text-slate-700 font-semibold"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className="w-4 h-4 opacity-40" />
      </div>
    </TableHead>
  );

  if (isLoading) {
    return <div className="text-sm text-slate-500 py-8 text-center">Loading holdings...</div>;
  }

  if (holdings.length === 0) {
    return (
      <div className="text-sm text-slate-500 py-8 text-center">
        No holdings yet. Start by adding positions in onboarding.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by ticker..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-xs text-sm"
      />

      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <Table className="text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-slate-50">
              <SortableHeader field="ticker" label="Ticker" />
              <SortableHeader field="quantity" label="Qty" />
              <SortableHeader field="avg_cost" label="Avg Cost" />
              <SortableHeader field="current_price" label="Current Price" />
              <SortableHeader field="market_value" label="Market Value" />
              <SortableHeader field="portfolio_share" label="Share %" />
              <SortableHeader field="profit_loss" label="P/L" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.map((holding) => (
              <TableRow key={holding.id} className="hover:bg-slate-50">
                <TableCell className="font-bold text-slate-900">
                  {holding.ticker}
                </TableCell>
                <TableCell className="text-slate-700 text-right">
                  {holding.quantity.toFixed(2)}
                </TableCell>
                <TableCell className="text-slate-700 text-right">
                  ${(holding.avg_cost || 0).toFixed(2)}
                </TableCell>
                <TableCell className="text-slate-700 text-right">
                  ${holding.current_price.toFixed(2)}
                </TableCell>
                <TableCell className="text-slate-900 font-medium text-right">
                  ${holding.market_value.toFixed(2)}
                </TableCell>
                <TableCell className="text-slate-700 text-right">
                  {holding.portfolio_share.toFixed(1)}%
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    holding.profit_loss >= 0
                      ? "text-green-700"
                      : "text-red-700"
                  }`}
                >
                  {holding.profit_loss >= 0 ? "+" : ""}
                  {holding.profit_loss.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-slate-500">
        Total rows: {filteredAndSorted.length}
      </p>
    </div>
  );
}
