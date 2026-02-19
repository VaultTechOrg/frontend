import {
  Portfolio,
  Position,
  PortfolioSnapshot,
} from "@/types/models";

const PORTFOLIO_SESSION_KEY = "stock-picker-portfolio-id";
const PORTFOLIOS_STORAGE_KEY = "stock-picker-portfolios";
const POSITIONS_STORAGE_KEY = "stock-picker-positions";

type StoredPositions = Record<string, Position[]>;

function readPortfolios(): Portfolio[] {
  const raw = localStorage.getItem(PORTFOLIOS_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Portfolio[];
  } catch {
    return [];
  }
}

function writePortfolios(portfolios: Portfolio[]) {
  localStorage.setItem(PORTFOLIOS_STORAGE_KEY, JSON.stringify(portfolios));
}

function readPositions(): StoredPositions {
  const raw = localStorage.getItem(POSITIONS_STORAGE_KEY);
  if (!raw) return {};

  try {
    return JSON.parse(raw) as StoredPositions;
  } catch {
    return {};
  }
}

function writePositions(positions: StoredPositions) {
  localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(positions));
}

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
    const now = new Date().toISOString();
    const portfolio: Portfolio = {
      id: crypto.randomUUID(),
      cash_amount,
      monthly_contribution,
      risk_tolerance,
      created_at: now,
      updated_at: now,
    };

    const portfolios = readPortfolios();
    portfolios.push(portfolio);
    writePortfolios(portfolios);

    const allPositions = readPositions();
    allPositions[portfolio.id] = positions;
    writePositions(allPositions);

    this.setCurrentPortfolioId(portfolio.id);
    return portfolio;
  },

  async getPortfolio(id: string): Promise<Portfolio | null> {
    const portfolios = readPortfolios();
    return portfolios.find((portfolio) => portfolio.id === id) || null;
  },

  async getPositions(portfolioId: string): Promise<Position[]> {
    const allPositions = readPositions();
    return allPositions[portfolioId] || [];
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
    const portfolios = readPortfolios();
    const index = portfolios.findIndex((portfolio) => portfolio.id === id);

    if (index < 0) {
      throw new Error("Portfolio not found");
    }

    const current = portfolios[index];
    const updatedPortfolio: Portfolio = {
      ...current,
      cash_amount: updates.cash_amount ?? current.cash_amount,
      monthly_contribution: updates.monthly_contribution ?? current.monthly_contribution,
      risk_tolerance: updates.risk_tolerance ?? current.risk_tolerance,
      updated_at: new Date().toISOString(),
    };

    portfolios[index] = updatedPortfolio;
    writePortfolios(portfolios);

    if (updates.positions) {
      const allPositions = readPositions();
      allPositions[id] = updates.positions;
      writePositions(allPositions);
    }

    return updatedPortfolio;
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
