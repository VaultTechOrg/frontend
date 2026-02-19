import { Position } from "@/types/models";

const STOCK_PICKER_RUN_URL =
  "http://internet-facing-863698164.eu-north-1.elb.amazonaws.com/api/stock-picker/run";

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

export const stockPickerRunService = {
  getStrategyFromRiskTolerance(riskTolerance: number): RunStrategy {
    if (riskTolerance >= 67) return "growth";
    if (riskTolerance >= 34) return "diversify";
    return "hold";
  },

  async runPortfolio(payload: StockPickerRunPayload, token: string): Promise<unknown> {
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

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
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
};
