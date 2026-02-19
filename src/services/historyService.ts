import { Recommendation, EngineResult } from "@/types/models";

const RECOMMENDATIONS_STORAGE_KEY = "stock-picker-recommendations";

type StoredRecommendations = Recommendation[];

function readRecommendations(): StoredRecommendations {
  const raw = localStorage.getItem(RECOMMENDATIONS_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as StoredRecommendations;
  } catch {
    return [];
  }
}

function writeRecommendations(recommendations: StoredRecommendations) {
  localStorage.setItem(RECOMMENDATIONS_STORAGE_KEY, JSON.stringify(recommendations));
}

export const historyService = {
  async saveRecommendation(
    portfolioId: string,
    engineResult: EngineResult
  ): Promise<Recommendation> {
    const recommendation: Recommendation = {
      id: crypto.randomUUID(),
      portfolio_id: portfolioId,
      strategy: engineResult.strategy,
      action: engineResult.action,
      amount: engineResult.amount,
      allocation: engineResult.allocation,
      confidence: engineResult.confidence,
      recession_probability: engineResult.recession_probability,
      explanation_summary: engineResult.explanation_summary,
      triggered_rules: engineResult.triggered_rules,
      invalidated_if: engineResult.invalidated_if,
      created_at: new Date().toISOString(),
    };

    const recommendations = readRecommendations();
    recommendations.push(recommendation);
    writeRecommendations(recommendations);

    return recommendation;
  },

  async getRecommendations(portfolioId: string): Promise<Recommendation[]> {
    const recommendations = readRecommendations();
    return recommendations
      .filter((rec) => rec.portfolio_id === portfolioId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getRecommendation(id: string): Promise<Recommendation | null> {
    const recommendations = readRecommendations();
    return recommendations.find((rec) => rec.id === id) || null;
  },
};
