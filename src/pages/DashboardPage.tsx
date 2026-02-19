import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Portfolio } from "@/types/models";
import { portfolioService } from "@/services/portfolioService";
import { mockEngineService } from "@/services/mockEngineService";
import { HoldingsTable } from "@/components/HoldingsTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface HoldingDisplay {
  id: string;
  ticker: string;
  quantity: number;
  avg_cost?: number;
  current_price: number;
  market_value: number;
  portfolio_share: number;
  profit_loss: number;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<HoldingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const portfolioId = portfolioService.getCurrentPortfolioId();
      if (!portfolioId) {
        navigate("/onboarding");
        return;
      }

      const portfolioData = await portfolioService.getPortfolio(portfolioId);
      if (!portfolioData) {
        navigate("/onboarding");
        return;
      }

      setPortfolio(portfolioData);

      const positions = await portfolioService.getPositions(portfolioId);

      const totalInvested = positions.reduce((sum, p) => sum + (p.avg_cost || 0) * p.quantity, 0);
      const totalValue = totalInvested + portfolioData.cash_amount;

      const mockHoldings = positions.map((pos, idx) => {
        const basePriceVariation = (Math.random() - 0.5) * 0.3;
        const currentPrice = (pos.avg_cost || 100) * (1 + basePriceVariation);
        const market_value = pos.quantity * currentPrice;
        const profit_loss = pos.avg_cost
          ? ((currentPrice - pos.avg_cost) / pos.avg_cost) * 100
          : 0;

        return {
          id: `pos-${idx}`,
          ticker: pos.ticker,
          quantity: pos.quantity,
          avg_cost: pos.avg_cost,
          current_price: currentPrice,
          market_value,
          portfolio_share: (market_value / totalValue) * 100,
          profit_loss,
        };
      });

      setHoldings(mockHoldings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      const portfolioId = portfolioService.getCurrentPortfolioId();
      if (!portfolioId) return;

      const snapshot = await portfolioService.getPortfolioSnapshot(portfolioId);
      await mockEngineService.evaluatePortfolio(snapshot);
      navigate("/recommendation");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run analysis");
    }
  };

  const totalValue = holdings.reduce((sum, h) => sum + h.market_value, 0) + (portfolio?.cash_amount || 0);
  const totalInvested = holdings.reduce((sum, h) => sum + h.market_value, 0);
  const cashRatio = portfolio ? (portfolio.cash_amount / totalValue) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Portfolio Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Overview of your holdings and investment metrics
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Includes cash and positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Invested Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${totalInvested.toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {((totalInvested / totalValue) * 100).toFixed(1)}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">
              Cash Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${(portfolio?.cash_amount || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {cashRatio.toFixed(1)}% of portfolio
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Holdings</CardTitle>
          <CardDescription>
            Your current stock and ETF positions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HoldingsTable holdings={holdings} isLoading={isLoading} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={handleRunAnalysis}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          Run Analysis
        </Button>
        <Button
          onClick={() => navigate("/onboarding")}
          variant="outline"
          className="flex-1"
        >
          Edit Portfolio
        </Button>
      </div>
    </div>
  );
}
