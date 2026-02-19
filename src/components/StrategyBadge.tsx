import { Badge } from "@/components/ui/badge";
import { Strategy } from "@/types/models";

interface StrategyBadgeProps {
  strategy: Strategy;
  size?: "sm" | "md" | "lg";
}

const strategyColors: Record<Strategy, string> = {
  GROWTH: "bg-blue-100 text-blue-800 border-blue-300",
  HOLD: "bg-slate-100 text-slate-800 border-slate-300",
  DIVERSIFY: "bg-green-100 text-green-800 border-green-300",
};

const strategyLabels: Record<Strategy, string> = {
  GROWTH: "Growth",
  HOLD: "Hold",
  DIVERSIFY: "Diversify",
};

export function StrategyBadge({ strategy, size = "md" }: StrategyBadgeProps) {
  const sizeClass =
    size === "sm" ? "text-xs px-2 py-1" : size === "lg" ? "text-base px-3 py-1.5" : "text-sm px-2.5 py-1";

  return (
    <Badge
      variant="outline"
      className={`${strategyColors[strategy]} ${sizeClass} font-medium`}
    >
      {strategyLabels[strategy]}
    </Badge>
  );
}
