import { useState } from "react";
import { TriggeredRule } from "@/types/models";
import { ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface RuleTraceTableProps {
  rules: TriggeredRule[];
  onCopyDebug: () => void;
}

export function RuleTraceTable({ rules, onCopyDebug }: RuleTraceTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpanded = (ruleId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-700">Rule Trace</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={onCopyDebug}
          className="text-xs"
        >
          Copy Debug JSON
        </Button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <Table className="text-sm">
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-slate-50">
              <TableHead className="w-8 text-center">
                <span className="sr-only">Expand</span>
              </TableHead>
              <TableHead className="text-slate-700 font-semibold">
                Rule
              </TableHead>
              <TableHead className="text-slate-700 font-semibold text-right">
                Weight
              </TableHead>
              <TableHead className="text-slate-700 font-semibold">
                Direction
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => {
              const isExpanded = expandedRows.has(rule.rule_id);
              return (
                <div key={rule.rule_id}>
                  <TableRow
                    onClick={() => toggleExpanded(rule.rule_id)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <TableCell className="text-center">
                      <ChevronDown
                        className={`w-4 h-4 transition-transform inline-block text-slate-400 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {rule.name}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {(rule.weight * 100).toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          rule.direction === "positive"
                            ? "bg-green-50 text-green-700"
                            : rule.direction === "negative"
                              ? "bg-red-50 text-red-700"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {rule.direction}
                      </span>
                    </TableCell>
                  </TableRow>

                  {isExpanded && (
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableCell colSpan={4} className="pt-3 pb-3">
                        <div className="space-y-2 pl-4">
                          <div>
                            <p className="text-xs font-semibold text-slate-600 mb-1">
                              Inputs Used:
                            </p>
                            <div className="bg-white border border-slate-200 rounded p-2 text-xs font-mono text-slate-700 max-h-32 overflow-auto">
                              {Object.entries(rule.inputs_used).map(
                                ([key, value]) => (
                                  <div key={key}>
                                    <span className="text-slate-500">{key}:</span>{" "}
                                    {String(value)}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-600">
                              Rationale: {rule.rationale_key}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </div>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
