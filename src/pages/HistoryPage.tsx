import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Recommendation } from "@/types/models";
import { portfolioService } from "@/services/portfolioService";
import { historyService } from "@/services/historyService";
import { StrategyBadge } from "@/components/StrategyBadge";
import { ActionBadge } from "@/components/ActionBadge";
import { ConfidenceGauge } from "@/components/ConfidenceGauge";
import { AllocationBars } from "@/components/AllocationBars";
import { InvalidationList } from "@/components/InvalidationList";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export function HistoryPage() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const portfolioId = portfolioService.getCurrentPortfolioId();
      if (!portfolioId) {
        navigate("/dashboard");
        return;
      }

      const recs = await historyService.getRecommendations(portfolioId);
      setRecommendations(recs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyDebug = (rec: Recommendation) => {
    const debugData = {
      strategy: rec.strategy,
      action: rec.action,
      amount: rec.amount,
      allocation: rec.allocation,
      confidence: rec.confidence,
      recession_probability: rec.recession_probability,
      triggered_rules: rec.triggered_rules,
      invalidated_if: rec.invalidated_if,
    };
    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    toast.success("Debug JSON copied to clipboard");
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Recommendation History</h1>
        <p className="text-slate-600 mt-2">
          Review all previous investment recommendations
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-96">
          <p className="text-slate-600">Loading history...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <Card>
          <CardContent className="pt-8 text-center">
            <p className="text-slate-600 mb-4">
              No recommendations yet. Run an analysis to get started.
            </p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <Card
              key={rec.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedRec(rec)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mb-2">
                      {formatDate(rec.created_at)}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <StrategyBadge strategy={rec.strategy} size="sm" />
                      <ActionBadge action={rec.action} size="sm" />
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">
                      {rec.explanation_summary}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right">
                    <div>
                      <p className="text-xs text-slate-500">Confidence</p>
                      <p className="text-lg font-bold text-slate-900">
                        {(rec.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Amount</p>
                      <p className="text-sm font-semibold text-slate-900">
                        ${rec.amount.toFixed(0)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedRec} onOpenChange={(open) => !open && setSelectedRec(null)}>
        <DialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          {selectedRec && (
            <>
              <DialogHeader>
                <DialogTitle>Recommendation Details</DialogTitle>
                <DialogDescription>
                  {formatDate(selectedRec.created_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <p className="text-xs text-slate-600 mb-2">Decision</p>
                  <div className="flex gap-2">
                    <StrategyBadge strategy={selectedRec.strategy} />
                    <ActionBadge action={selectedRec.action} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <ConfidenceGauge
                      confidence={selectedRec.confidence}
                      recessionProbability={selectedRec.recession_probability}
                    />
                  </div>
                  <div>
                    <AllocationBars allocation={selectedRec.allocation} />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">
                    Recommendation
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedRec.explanation_summary}
                  </p>
                </div>

                <div>
                  <InvalidationList conditions={selectedRec.invalidated_if} />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-semibold text-slate-700">
                      Rule Trace
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyDebug(selectedRec)}
                      className="text-xs"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="text-xs space-y-1 bg-slate-50 p-2 rounded border border-slate-200 max-h-32 overflow-y-auto">
                    {selectedRec.triggered_rules.map((rule, idx) => (
                      <div key={idx} className="text-slate-700">
                        <span className="font-semibold">{rule.name}</span> (
                        {(rule.weight * 100).toFixed(0)}%)
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
