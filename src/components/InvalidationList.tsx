import { InvalidationCondition } from "@/types/models";
import { AlertCircle } from "lucide-react";

interface InvalidationListProps {
  conditions: InvalidationCondition[];
}

export function InvalidationList({ conditions }: InvalidationListProps) {
  const opLabels: Record<string, string> = {
    ">": "exceeds",
    "<": "falls below",
    ">=": "reaches or exceeds",
    "<=": "falls to or below",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-semibold text-slate-700">
          Invalidation Conditions
        </h3>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
        {conditions.map((condition, idx) => (
          <div key={idx} className="text-sm text-slate-700">
            <span className="font-medium">{condition.metric}</span>
            {" " + opLabels[condition.op] + " "}
            <span className="font-medium">{condition.threshold}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 italic">
        If any condition is triggered, reconsider this decision before proceeding.
      </p>
    </div>
  );
}
