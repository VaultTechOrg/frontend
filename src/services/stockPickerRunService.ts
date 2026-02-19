import {
  EngineResult,
  Position,
  StockPickerRunResponse,
  StockPickerStrategyResult,
  Strategy,
  Action,
  TriggeredRule,
  InvalidationCondition,
  AllocationBreakdown,
} from "@/types/models";

const STOCK_PICKER_PROXY_BASE_URL = "http://internet-facing-863698164.eu-north-1.elb.amazonaws.com/api/stock-picker/run";

function resolveRunUrl(baseOrUrl: string): string {
  if (baseOrUrl.endsWith("/stock-picker/run")) {
    return baseOrUrl;
  }

  return `${baseOrUrl.replace(/\/$/, "")}/stock-picker/run`;
}

const STOCK_PICKER_RUN_URL = resolveRunUrl(STOCK_PICKER_PROXY_BASE_URL);

export const LAST_STOCK_PICKER_RUN_KEY = "stock-picker-last-run-response";

type RunStrategy = "hold" | "diversify" | "growth";

interface StockPickerRunPayload {
  run_id: string;
  strategy: RunStrategy;
  cash: number;
  positions: Array<{
    ticker: string;
    quantity: number;
    avg_cost: number;
    cost_currency: string;
  }>;
}

function mapStrategy(value: string): Strategy {
  if (value.toLowerCase() === "growth") return "GROWTH";
  if (value.toLowerCase() === "diversify") return "DIVERSIFY";
  return "HOLD";
}

function mapAction(value: string | null): Action {
  const normalized = (value || "").toLowerCase();
  if (normalized === "invest_now") return "INVEST_NOW";
  if (normalized === "partial_deploy") return "PARTIAL_DEPLOY";
  if (normalized === "rebalance") return "REBALANCE";
  return "WAIT";
}

function mapAllocation(allocation: Record<string, number> | null): AllocationBreakdown {
  if (!allocation) {
    return { equities: 0, defensive: 0, cash: 0 };
  }

  return {
    equities: Number(allocation.equities || 0),
    defensive: Number(allocation.defensive || 0),
    cash: Number(allocation.cash || 0),
  };
}

function mapRuleTrace(ruleTrace: Record<string, unknown>[]): TriggeredRule[] {
  return ruleTrace.map((item, index) => ({
    rule_id: String(item.rule_id || `rule_${index + 1}`),
    name: String(item.name || item.rationale_key || "Rule"),
    weight: Number(item.weight || 0),
    direction: String(item.direction || "neutral"),
    inputs_used: (item.inputs_used as Record<string, number | string>) || {},
    rationale_key: String(item.rationale_key || "external_engine"),
  }));
}

function mapInvalidationConditions(): InvalidationCondition[] {
  return [];
}

function firstResult(results: Record<string, StockPickerStrategyResult>): StockPickerStrategyResult {
  const entries = Object.values(results);
  if (entries.length === 0) {
    throw new Error("Stock picker response did not include any strategy result");
  }
  return entries[0];
}

export const stockPickerRunService = {
  getStrategyFromRiskTolerance(riskTolerance: number): RunStrategy {
    if (riskTolerance >= 67) return "growth";
    if (riskTolerance >= 34) return "diversify";
    return "hold";
  },

  async runPortfolio(
    payload: StockPickerRunPayload,
    token: string
  ): Promise<StockPickerRunResponse> {
    const response = await fetch(STOCK_PICKER_RUN_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to run stock picker (${response.status}): ${errorBody}`);
    }

    return response.json() as Promise<StockPickerRunResponse>;
  },

  buildPayload(
    riskTolerance: number,
    cash: number,
    positions: Position[],
    currency: string
  ): StockPickerRunPayload {
    return {
      run_id: crypto.randomUUID(),
      strategy: this.getStrategyFromRiskTolerance(riskTolerance),
      cash,
      positions: positions.map((position) => ({
        ticker: position.ticker,
        quantity: position.quantity,
        avg_cost: position.avg_cost ?? 0,
        cost_currency: currency,
      })),
    };
  },

  toEngineResult(response: StockPickerRunResponse): EngineResult {
    const strategyResult = firstResult(response.results);

    return {
      strategy: mapStrategy(strategyResult.strategy),
      action: mapAction(strategyResult.decision),
      amount: 0,
      allocation: mapAllocation(strategyResult.allocation),
      confidence: Number(strategyResult.confidence ?? 0),
      invalidated_if: mapInvalidationConditions(),
      explanation_summary: `Strategy request ${strategyResult.request_id} completed with ${strategyResult.shortlist.length} shortlisted assets.`,
      triggered_rules: mapRuleTrace(strategyResult.rule_trace),
    };
  },

  saveLastRun(response: StockPickerRunResponse) {
    sessionStorage.setItem(LAST_STOCK_PICKER_RUN_KEY, JSON.stringify(response));
  },

  getLastRun(): StockPickerRunResponse | null {
    const raw = sessionStorage.getItem(LAST_STOCK_PICKER_RUN_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as StockPickerRunResponse;
    } catch {
      return null;
    }
  },
};
