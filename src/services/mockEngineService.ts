import {
  EngineResult,
  PortfolioSnapshot,
  Strategy,
  Action,
} from "@/types/models";

const RULES_DATABASE = {
  RISK_ASSESSMENT: {
    rule_id: "risk_001",
    name: "Risk Tolerance Alignment",
    weight: 0.25,
    direction: "positive",
  },
  CASH_RATIO: {
    rule_id: "cash_001",
    name: "Cash Reserve Adequacy",
    weight: 0.2,
    direction: "positive",
  },
  DIVERSIFICATION: {
    rule_id: "div_001",
    name: "Portfolio Diversification Score",
    weight: 0.25,
    direction: "positive",
  },
  MOMENTUM: {
    rule_id: "mom_001",
    name: "Market Momentum Indicator",
    weight: 0.15,
    direction: "variable",
  },
  VOLATILITY: {
    rule_id: "vol_001",
    name: "Volatility Assessment",
    weight: 0.15,
    direction: "negative",
  },
};

function generateConfidence(riskTolerance: number): number {
  const baseConfidence = 0.65 + (riskTolerance / 100) * 0.25;
  const variance = (Math.random() - 0.5) * 0.1;
  return Math.min(0.95, Math.max(0.5, baseConfidence + variance));
}

function generateRecessionProbability(): number | undefined {
  if (Math.random() > 0.6) return undefined;
  return Math.random() * 0.4 + 0.1;
}

function generateAllocation(riskTolerance: number) {
  const equitiesBase = 0.3 + (riskTolerance / 100) * 0.6;
  const defensiveBase = 0.5 - (riskTolerance / 100) * 0.3;
  const cashBase = 0.2 - (riskTolerance / 100) * 0.1;

  const variance = 0.05;
  return {
    equities: Math.min(
      0.9,
      Math.max(0.1, equitiesBase + (Math.random() - 0.5) * variance)
    ),
    defensive: Math.min(
      0.8,
      Math.max(0.05, defensiveBase + (Math.random() - 0.5) * variance)
    ),
    cash: Math.min(
      0.3,
      Math.max(0.05, cashBase + (Math.random() - 0.5) * variance)
    ),
  };
}

export const mockEngineService = {
  async evaluatePortfolio(
    snapshot: PortfolioSnapshot
  ): Promise<EngineResult> {
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const { risk_tolerance, positions, cash_amount } = snapshot;

    let strategy: Strategy;
    let action: Action;
    let amount: number;

    const diversificationScore = Math.min(positions.length / 10, 1);
    const cashRatio =
      cash_amount / (positions.reduce((sum, p) => sum + (p.avg_cost || 0), 0) || 1);

    if (cashRatio > 0.3 && risk_tolerance >= 60) {
      strategy = "GROWTH";
      action = "INVEST_NOW";
      amount = cash_amount * 0.7;
    } else if (cashRatio > 0.15 && risk_tolerance >= 40) {
      strategy = "GROWTH";
      action = "PARTIAL_DEPLOY";
      amount = cash_amount * 0.4;
    } else if (diversificationScore < 0.3 && risk_tolerance >= 50) {
      strategy = "DIVERSIFY";
      action = "INVEST_NOW";
      amount = cash_amount * 0.5;
    } else if (positions.some((p) => p.quantity > 100)) {
      strategy = "HOLD";
      action = "REBALANCE";
      amount = 0;
    } else {
      strategy = "HOLD";
      action = "WAIT";
      amount = 0;
    }

    const confidence = generateConfidence(risk_tolerance);
    const allocation = generateAllocation(risk_tolerance);
    const recessionProb = generateRecessionProbability();

    const triggeredRules = [];

    triggeredRules.push({
      ...RULES_DATABASE.RISK_ASSESSMENT,
      inputs_used: {
        risk_tolerance: risk_tolerance,
        portfolio_concentration: (1 - diversificationScore).toFixed(2),
      },
      rationale_key: "risk_aligned",
    });

    triggeredRules.push({
      ...RULES_DATABASE.CASH_RATIO,
      inputs_used: {
        cash_amount: cash_amount,
        total_invested:
          positions.reduce((sum, p) => sum + (p.avg_cost || 0), 0) || 0,
        cash_ratio: cashRatio.toFixed(2),
      },
      rationale_key: "cash_adequate",
    });

    if (diversificationScore > 0.3) {
      triggeredRules.push({
        ...RULES_DATABASE.DIVERSIFICATION,
        inputs_used: {
          unique_positions: positions.length,
          diversification_score: diversificationScore.toFixed(2),
        },
        rationale_key: "well_diversified",
      });
    }

    if (Math.random() > 0.4) {
      triggeredRules.push({
        ...RULES_DATABASE.MOMENTUM,
        inputs_used: {
          market_sentiment: "bullish",
          volatility_regime: "moderate",
        },
        rationale_key: "positive_momentum",
      });
    }

    const invalidatedIf = [
      {
        metric: "VIX",
        op: ">" as const,
        threshold: 35,
      },
      {
        metric: "portfolio_drawdown",
        op: ">" as const,
        threshold: 15,
      },
      {
        metric: "unemployment_change",
        op: ">" as const,
        threshold: 0.5,
      },
    ];

    let explanationSummary = `Based on your risk tolerance (${risk_tolerance}/100), we recommend a ${strategy.toLowerCase()} strategy. `;

    if (action === "INVEST_NOW") {
      explanationSummary += `Deploy ${amount.toFixed(0)} in new positions to capture current market opportunities while maintaining portfolio balance.`;
    } else if (action === "PARTIAL_DEPLOY") {
      explanationSummary += `Gradually deploy ${amount.toFixed(0)} over the next 2-4 weeks to average into positions and reduce timing risk.`;
    } else if (action === "REBALANCE") {
      explanationSummary += `Rebalance existing positions to maintain target allocation and reduce concentration risk.`;
    } else {
      explanationSummary += `Hold current positions and continue monthly contributions. Market conditions warrant caution at this time.`;
    }

    if (recessionProb) {
      explanationSummary += ` Current recession probability stands at ${(recessionProb * 100).toFixed(0)}%, suggesting defensive positioning may be prudent.`;
    }

    return {
      strategy,
      action,
      amount,
      allocation,
      confidence,
      invalidated_if: invalidatedIf,
      explanation_summary: explanationSummary,
      triggered_rules: triggeredRules,
      recession_probability: recessionProb,
    };
  },
};
