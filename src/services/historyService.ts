import { supabase } from "@/lib/supabase";
import { Recommendation, EngineResult } from "@/types/models";

export const historyService = {
  async saveRecommendation(
    portfolioId: string,
    engineResult: EngineResult
  ): Promise<Recommendation> {
    const { data, error } = await supabase
      .from("recommendations")
      .insert({
        portfolio_id: portfolioId,
        strategy: engineResult.strategy,
        action: engineResult.action,
        amount: engineResult.amount,
        allocation: engineResult.allocation,
        confidence: engineResult.confidence,
        recession_probability: engineResult.recession_probability || null,
        explanation_summary: engineResult.explanation_summary,
        triggered_rules: engineResult.triggered_rules,
        invalidated_if: engineResult.invalidated_if,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getRecommendations(portfolioId: string): Promise<Recommendation[]> {
    const { data, error } = await supabase
      .from("recommendations")
      .select()
      .eq("portfolio_id", portfolioId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getRecommendation(id: string): Promise<Recommendation | null> {
    const { data, error } = await supabase
      .from("recommendations")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },
};
