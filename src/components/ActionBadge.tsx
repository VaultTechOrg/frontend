import { Badge } from "@/components/ui/badge";
import { Action } from "@/types/models";

interface ActionBadgeProps {
  action: Action;
  size?: "sm" | "md" | "lg";
}

const actionColors: Record<Action, string> = {
  INVEST_NOW: "bg-emerald-100 text-emerald-800 border-emerald-300",
  PARTIAL_DEPLOY: "bg-amber-100 text-amber-800 border-amber-300",
  WAIT: "bg-orange-100 text-orange-800 border-orange-300",
  REBALANCE: "bg-indigo-100 text-indigo-800 border-indigo-300",
};

const actionLabels: Record<Action, string> = {
  INVEST_NOW: "Invest Now",
  PARTIAL_DEPLOY: "Partial Deploy",
  WAIT: "Wait",
  REBALANCE: "Rebalance",
};

export function ActionBadge({ action, size = "md" }: ActionBadgeProps) {
  const sizeClass =
    size === "sm" ? "text-xs px-2 py-1" : size === "lg" ? "text-base px-3 py-1.5" : "text-sm px-2.5 py-1";

  return (
    <Badge
      variant="outline"
      className={`${actionColors[action]} ${sizeClass} font-medium`}
    >
      {actionLabels[action]}
    </Badge>
  );
}
