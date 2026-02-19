import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Position } from "@/types/models";
import { portfolioService } from "@/services/portfolioService";
import { stockPickerRunService } from "@/services/stockPickerRunService";
import { RiskToleranceSlider } from "@/components/RiskToleranceSlider";
import { ImportWizard } from "@/components/ImportWizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const currencies = ["USD", "EUR", "GBP", "CAD", "AUD"];

export function OnboardingPage() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [step, setStep] = useState<"main" | "import">("main");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [riskTolerance, setRiskTolerance] = useState(50);
  const [cashAmount, setCashAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [positions, setPositions] = useState<Position[]>([]);

  const handleImportComplete = (newPositions: Position[]) => {
    setPositions(newPositions);
    setStep("main");
  };

  const handleFinish = async () => {
    setError("");
    const cash = parseFloat(cashAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;

    if (cash < 0 || monthly < 0) {
      setError("Cash and monthly contribution must be non-negative");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to get Clerk session token");
      }

      await portfolioService.createPortfolio(
        cash,
        monthly,
        riskTolerance,
        positions
      );

      const runPayload = stockPickerRunService.buildPayload(
        riskTolerance,
        cash,
        positions,
        currency
      );

      const runResponse = await stockPickerRunService.runPortfolio(runPayload, token);
      stockPickerRunService.saveLastRun(runResponse);
      navigate("/recommendation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "import") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Import Holdings</CardTitle>
            <CardDescription>
              Add your stock and ETF positions using one of three methods
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportWizard
              onImport={handleImportComplete}
              onCancel={() => setStep("main")}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Setup Your Portfolio</h1>
        <p className="text-slate-600 mt-2">
          Enter your investment parameters to receive personalized analysis and
          recommendations.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <RiskToleranceSlider
            value={riskTolerance}
            onChange={setRiskTolerance}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Capital Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cash" className="text-sm font-semibold">
              Cash Available
            </Label>
            <div className="flex gap-2">
              <Input
                id="cash"
                type="number"
                placeholder="50000"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="flex-1"
                min="0"
                step="100"
              />
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthly" className="text-sm font-semibold">
              Monthly Contribution (optional)
            </Label>
            <Input
              id="monthly"
              type="number"
              placeholder="0"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(e.target.value)}
              min="0"
              step="100"
            />
            <p className="text-xs text-slate-500">
              Amount you plan to invest each month
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Holdings {positions.length > 0 && `(${positions.length})`}
          </CardTitle>
          <CardDescription>
            Add your stock and ETF positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {positions.length > 0 ? (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {positions.map((pos, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span className="font-mono font-semibold">
                        {pos.ticker}
                      </span>
                      <span className="text-slate-600">
                        {pos.quantity} shares
                        {pos.avg_cost && ` @ $${pos.avg_cost.toFixed(2)}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                onClick={() => setStep("import")}
                variant="outline"
                className="w-full text-sm"
              >
                Edit Holdings
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setStep("import")}
              variant="outline"
              className="w-full text-sm"
            >
              Add Holdings
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleFinish}
          disabled={isLoading || !cashAmount}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? "Running..." : "RUN"}
        </Button>
      </div>
    </div>
  );
}
