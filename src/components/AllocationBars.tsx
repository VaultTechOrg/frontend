import { AllocationBreakdown } from "@/types/models";

interface AllocationBarsProps {
  allocation: AllocationBreakdown;
}

export function AllocationBars({ allocation }: AllocationBarsProps) {
  const total = allocation.equities + allocation.defensive + allocation.cash;
  const normalizedAllocation = {
    equities: (allocation.equities / total) * 100,
    defensive: (allocation.defensive / total) * 100,
    cash: (allocation.cash / total) * 100,
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-700">
        Target Allocation
      </h3>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm text-slate-600">Equities</span>
            <span className="text-sm font-semibold text-slate-800">
              {normalizedAllocation.equities.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${normalizedAllocation.equities}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm text-slate-600">Defensive</span>
            <span className="text-sm font-semibold text-slate-800">
              {normalizedAllocation.defensive.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${normalizedAllocation.defensive}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm text-slate-600">Cash</span>
            <span className="text-sm font-semibold text-slate-800">
              {normalizedAllocation.cash.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-slate-400"
              style={{ width: `${normalizedAllocation.cash}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
