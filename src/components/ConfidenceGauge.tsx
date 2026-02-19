interface ConfidenceGaugeProps {
  confidence: number;
  recessionProbability?: number;
}

export function ConfidenceGauge({
  confidence,
  recessionProbability,
}: ConfidenceGaugeProps) {
  const percentage = confidence * 100;
  const isMedium = percentage >= 60 && percentage < 75;
  const isHigh = percentage >= 75;

  let barColor = "bg-orange-500";
  if (isHigh) barColor = "bg-green-500";
  else if (isMedium) barColor = "bg-yellow-500";

  const textColor = isHigh ? "text-green-700" : isMedium ? "text-yellow-700" : "text-orange-700";

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-700">Confidence</span>
        <span className={`text-lg font-bold ${textColor}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>

      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {recessionProbability !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-slate-600">
              Recession Probability
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {(recessionProbability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="h-full bg-red-400"
              style={{ width: `${recessionProbability * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
