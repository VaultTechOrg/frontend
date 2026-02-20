import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EngineResult, StockPickerStrategyResult, SuggestedStock } from "@/types/models";
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
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

function parseDecisionTickers(decision: string | null): string[] {
  if (!decision) return [];

  return decision
    .split("+")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function flattenShortlist(shortlist: StockPickerStrategyResult["shortlist"]): SuggestedStock[] {
  return shortlist.flatMap((bucket) => bucket.suggested_stocks);
}

export function RecommendationPage() {
  const navigate = useNavigate();
  const [result, setResult] = useState<EngineResult | null>(null);
  const [rawStrategyResult, setRawStrategyResult] = useState<StockPickerStrategyResult | null>(null);
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
        const firstResult = Object.values(lastRun.results)[0] || null;
        setRawStrategyResult(firstResult);
        setResult(stockPickerRunService.toEngineResult(lastRun));
        return;
      }

      const snapshot = await portfolioService.getPortfolioSnapshot(portfolioId);
      const engineResult = await mockEngineService.evaluatePortfolio(snapshot);
      setResult(engineResult);
      setRawStrategyResult(null);
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

  const shortlist = useMemo(
    () => (rawStrategyResult ? flattenShortlist(rawStrategyResult.shortlist) : []),
    [rawStrategyResult]
  );
  const decisionTickers = useMemo(
    () => parseDecisionTickers(rawStrategyResult?.decision || null),
    [rawStrategyResult]
  );

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
        <AlertDescription>{error || "Failed to generate recommendation"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Investment Recommendation</h1>
        <p className="text-slate-600 mt-2">Informative dashboard built from your latest engine run.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-2 border-blue-100 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="text-lg">Run Summary</CardTitle>
          <CardDescription>High-level decision and confidence from backend run output</CardDescription>
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
            {rawStrategyResult?.request_id && (
              <div>
                <p className="text-xs text-slate-600 mb-1">Run ID</p>
                <p className="text-sm font-mono text-slate-800">{rawStrategyResult.request_id}</p>
              </div>
            )}
          </div>

          {decisionTickers.length > 0 && (
            <div className="pt-2 border-t border-blue-200">
              <p className="text-sm text-slate-600 mb-2">Chosen Decision Basket</p>
              <div className="flex flex-wrap gap-2">
                {decisionTickers.map((ticker) => (
                  <Badge key={ticker} className="bg-blue-600 hover:bg-blue-600 text-white">
                    {ticker}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {rawStrategyResult && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Candidate Assets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{rawStrategyResult.candidates_new_assets.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Shortlist Baskets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">{rawStrategyResult.shortlist.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-600">Total Suggested Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-slate-900">
                {(shortlist.reduce((sum, stock) => sum + stock.allocation, 0) * 100).toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confidence & Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfidenceGauge confidence={result.confidence} recessionProbability={result.recession_probability} />
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

      {rawStrategyResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Candidates Universe</CardTitle>
            <CardDescription>All assets considered for this strategy run</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {rawStrategyResult.candidates_new_assets.map((ticker) => (
                <Badge key={ticker} variant="secondary" className="text-xs">
                  {ticker}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {shortlist.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shortlist Allocation Detail</CardTitle>
            <CardDescription>Per-asset allocation from shortlisted ideas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shortlist.map((stock) => (
              <div key={`${stock.ticker}-${stock.allocation}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{stock.ticker}</span>
                  <span className="text-slate-600">{(stock.allocation * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.max(stock.allocation * 100, 2)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">{result.explanation_summary}</p>
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
          <CardDescription>Rules and factors that influenced this recommendation</CardDescription>
        </CardHeader>
        <CardContent>
          <RuleTraceTable rules={result.triggered_rules} onCopyDebug={handleCopyDebug} />
        </CardContent>
      </Card>

      <div className="flex gap-3 flex-col sm:flex-row">
        <Button onClick={handleSaveDecision} disabled={isSaving} className="flex-1 bg-green-600 hover:bg-green-700">
          {isSaving ? "Saving..." : "Save Decision"}
        </Button>
        <Button onClick={evaluatePortfolio} variant="outline" className="flex-1">
          Run Again
        </Button>
        <Button onClick={() => navigate("/history")} variant="outline" className="flex-1">
          View History
        </Button>
      </div>
    </div>
  );
}
