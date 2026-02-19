import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface RiskToleranceSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const riskDescriptions: Record<number, { label: string; description: string }> =
  {
    0: {
      label: "Conservative",
      description:
        "Prioritize capital preservation with minimal volatility. Suitable for short-term goals.",
    },
    25: {
      label: "Moderate",
      description:
        "Balance growth and stability. Suitable for medium-term horizons.",
    },
    50: {
      label: "Balanced",
      description:
        "Equal mix of growth and security. Suitable for long-term investors.",
    },
    75: {
      label: "Aggressive",
      description:
        "Accept higher volatility for growth potential. Suitable for experienced investors.",
    },
    100: {
      label: "Risk-On",
      description:
        "Maximum growth orientation with significant volatility. Requires strong conviction.",
    },
  };

function getDescription(value: number): { label: string; description: string } {
  const keys = Object.keys(riskDescriptions)
    .map(Number)
    .sort((a, b) => a - b);

  let closest = keys[0];
  for (const key of keys) {
    if (Math.abs(key - value) < Math.abs(closest - value)) {
      closest = key;
    }
  }

  return riskDescriptions[closest];
}

export function RiskToleranceSlider({
  value,
  onChange,
  disabled,
}: RiskToleranceSliderProps) {
  const description = getDescription(value);

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold text-slate-900">
        Risk Tolerance
      </Label>

      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-slate-500 px-1">
        <span>Conservative</span>
        <span>Balanced</span>
        <span>Risk-on</span>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-slate-900">{description.label}</p>
            <p className="text-sm text-slate-600">{value}/100</p>
          </div>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          {description.description}
        </p>
      </div>
    </div>
  );
}
