import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EngineResult } from "@/types/models";
import { portfolioService } from "@/services/portfolioService";
import { mockEngineService } from "@/services/mockEngineService";
import { historyService } from "@/services/historyService";
import { stockPickerRunService } from "@/services/stockPickerRunService";
import { StrategyBadge } from "@/components/StrategyBadge";
import { ActionBadge } from "@/components/ActionBadge";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { AllocationBars } from "@/components/AllocationBars";
import { InvalidationList } from "@/components/InvalidationList";
import { RuleTraceTable } from "@/components/RuleTraceTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function RecommendationPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<EngineResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    evaluatePortfolio();
  }, []);

  const evaluatePortfolio = async () => {
    try {
      const portfolioId = portfolioService.getCurrentPortfolioId();
      if (!portfolioId) {
        navigate("/dashboard");
        return;
      }

      const lastRun = stockPickerRunService.getLastRun();
      if (lastRun) {
        setResult(stockPickerRunService.toEngineResult(lastRun));
        return;
      }

      const snapshot = await portfolioService.getPortfolioSnapshot(portfolioId);
      const engineResult = await mockEngineService.evaluatePortfolio(snapshot);
      setResult(engineResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDecision = async () => {
    if (!result) return;

    setIsSaving(true);
    try {
      const portfolioId = portfolioService.getCurrentPortfolioId();
      if (!portfolioId) throw new Error("Portfolio not found");

      await historyService.saveRecommendation(portfolioId, result);
      toast.success("Decision saved to history");
      setTimeout(() => navigate("/history"), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save decision");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyDebug = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast.success("Debug JSON copied to clipboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p className="text-slate-600">Evaluating portfolio...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to generate recommendation"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Investment Recommendation</h1>
        <p className="text-slate-600 mt-2">
          Based on your portfolio analysis
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-blue-100 bg-blue-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg">Decision</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <p className="text-xs text-slate-600 mb-1">Strategy</p>
              <StrategyBadge strategy={result.strategy} size="lg" />
            </div>
            <div>
              <p className="text-xs text-slate-600 mb-1">Action</p>
              <ActionBadge action={result.action} size="lg" />
            </div>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="text-sm text-slate-600 mb-2">Recommended Amount</p>
            <p className="text-3xl font-bold text-slate-900">
              ${result.amount.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {result.action === "INVEST_NOW" && "Deploy immediately"}
              {result.action === "PARTIAL_DEPLOY" && "Gradual deployment recommended"}
              {result.action === "REBALANCE" && "Rebalance existing positions"}
              {result.action === "WAIT" && "Hold and monitor"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confidence & Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfidenceGauge
              confidence={result.confidence}
              recessionProbability={result.recession_probability}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Target Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <AllocationBars allocation={result.allocation} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            {result.explanation_summary}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Mitigation</CardTitle>
        </CardHeader>
        <CardContent>
          <InvalidationList conditions={result.invalidated_if} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engine Analysis</CardTitle>
          <CardDescription>
            Rules and factors that influenced this recommendation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RuleTraceTable
            rules={result.triggered_rules}
            onCopyDebug={handleCopyDebug}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-col sm:flex-row">
        <Button
          onClick={handleSaveDecision}
          disabled={isSaving}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {isSaving ? "Saving..." : "Save Decision"}
        </Button>
        <Button
          onClick={evaluatePortfolio}
          variant="outline"
          className="flex-1"
        >
          Run Again
        </Button>
        <Button
          onClick={() => navigate("/history")}
          variant="outline"
          className="flex-1"
        >
          View History
        </Button>
      </div>
    </div>
  );
}
