export type Strategy = "GROWTH" | "HOLD" | "DIVERSIFY";
export type Action = "INVEST_NOW" | "PARTIAL_DEPLOY" | "WAIT" | "REBALANCE";

export interface Position {
  ticker: string;
  quantity: number;
  avg_cost?: number;
}

export interface AllocationBreakdown {
  equities: number;
  defensive: number;
  cash: number;
}

export interface InvalidationCondition {
  metric: string;
  op: ">" | "<" | ">=" | "<=";
  threshold: number;
}

export interface TriggeredRule {
  rule_id: string;
  name: string;
  weight: number;
  direction: string;
  inputs_used: Record<string, number | string>;
  rationale_key: string;
}

export interface EngineResult {
  strategy: Strategy;
  action: Action;
  amount: number;
  allocation: AllocationBreakdown;
  confidence: number;
  invalidated_if: InvalidationCondition[];
  explanation_summary: string;
  triggered_rules: TriggeredRule[];
  recession_probability?: number;
}

export interface PortfolioSnapshot {
  cash_amount: number;
  monthly_contribution?: number;
  risk_tolerance: number;
  positions: Position[];
}

export interface Portfolio {
  id: string;
  user_id?: string;
  cash_amount: number;
  monthly_contribution: number;
  risk_tolerance: number;
  created_at: string;
  updated_at: string;
}

export interface PositionDB {
  id: string;
  portfolio_id: string;
  ticker: string;
  quantity: number;
  avg_cost?: number;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: string;
  portfolio_id: string;
  strategy: Strategy;
  action: Action;
  amount: number;
  allocation: AllocationBreakdown;
  confidence: number;
  recession_probability?: number;
  explanation_summary: string;
  triggered_rules: TriggeredRule[];
  invalidated_if: InvalidationCondition[];
  created_at: string;
}

export interface ImportPreviewRow {
  ticker: string;
  quantity: number;
  avg_cost?: number;
  raw_row?: string[];
  error?: string;
}

export interface ImportValidationResult {
  valid_rows: ImportPreviewRow[];
  invalid_rows: { row_number: number; error: string }[];
  total_imported: number;
  total_skipped: number;
}
