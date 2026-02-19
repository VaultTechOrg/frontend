import { supabase } from "@/lib/supabase";
import {
  Portfolio,
  PositionDB,
  Position,
  PortfolioSnapshot,
} from "@/types/models";

const PORTFOLIO_SESSION_KEY = "stock-picker-portfolio-id";

export const portfolioService = {
  setCurrentPortfolioId: (id: string) => {
    sessionStorage.setItem(PORTFOLIO_SESSION_KEY, id);
  },

  getCurrentPortfolioId: (): string | null => {
    return sessionStorage.getItem(PORTFOLIO_SESSION_KEY);
  },

  async createPortfolio(
    cash_amount: number,
    monthly_contribution: number,
    risk_tolerance: number,
    positions: Position[]
  ): Promise<Portfolio> {
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .insert({
        cash_amount,
        monthly_contribution,
        risk_tolerance,
      })
      .select()
      .single();

    if (portfolioError) throw portfolioError;

    if (positions.length > 0) {
      const positionsData = positions.map((p) => ({
        portfolio_id: portfolio.id,
        ticker: p.ticker,
        quantity: p.quantity,
        avg_cost: p.avg_cost || null,
      }));

      const { error: positionsError } = await supabase
        .from("positions")
        .insert(positionsData);

      if (positionsError) throw positionsError;
    }

    this.setCurrentPortfolioId(portfolio.id);
    return portfolio;
  },

  async getPortfolio(id: string): Promise<Portfolio | null> {
    const { data, error } = await supabase
      .from("portfolios")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getPositions(portfolioId: string): Promise<Position[]> {
    const { data, error } = await supabase
      .from("positions")
      .select()
      .eq("portfolio_id", portfolioId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((p: PositionDB) => ({
      ticker: p.ticker,
      quantity: p.quantity,
      avg_cost: p.avg_cost || undefined,
    }));
  },

  async updatePortfolio(
    id: string,
    updates: Partial<{
      cash_amount: number;
      monthly_contribution: number;
      risk_tolerance: number;
      positions: Position[];
    }>
  ): Promise<Portfolio> {
    const updateData: any = {};

    if (updates.cash_amount !== undefined) {
      updateData.cash_amount = updates.cash_amount;
    }
    if (updates.monthly_contribution !== undefined) {
      updateData.monthly_contribution = updates.monthly_contribution;
    }
    if (updates.risk_tolerance !== undefined) {
      updateData.risk_tolerance = updates.risk_tolerance;
    }
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date().toISOString();
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from("portfolios")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
    }

    if (updates.positions) {
      await supabase.from("positions").delete().eq("portfolio_id", id);

      if (updates.positions.length > 0) {
        const positionsData = updates.positions.map((p) => ({
          portfolio_id: id,
          ticker: p.ticker,
          quantity: p.quantity,
          avg_cost: p.avg_cost || null,
        }));

        const { error } = await supabase
          .from("positions")
          .insert(positionsData);

        if (error) throw error;
      }
    }

    const { data, error } = await supabase
      .from("portfolios")
      .select()
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async getPortfolioSnapshot(portfolioId: string): Promise<PortfolioSnapshot> {
    const portfolio = await this.getPortfolio(portfolioId);
    if (!portfolio) throw new Error("Portfolio not found");

    const positions = await this.getPositions(portfolioId);

    return {
      cash_amount: portfolio.cash_amount,
      monthly_contribution: portfolio.monthly_contribution,
      risk_tolerance: portfolio.risk_tolerance,
      positions,
    };
  },
};
