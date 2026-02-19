/*
  # Stock Picker Schema

  1. New Tables
    - `portfolios`
      - `id` (uuid, primary key)
      - `user_id` (uuid, user reference)
      - `cash_amount` (numeric)
      - `monthly_contribution` (numeric)
      - `risk_tolerance` (integer 0-100)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `positions`
      - `id` (uuid, primary key)
      - `portfolio_id` (uuid, portfolio reference)
      - `ticker` (text)
      - `quantity` (numeric)
      - `avg_cost` (numeric, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `recommendations`
      - `id` (uuid, primary key)
      - `portfolio_id` (uuid, portfolio reference)
      - `strategy` (text: GROWTH, HOLD, DIVERSIFY)
      - `action` (text: INVEST_NOW, PARTIAL_DEPLOY, WAIT, REBALANCE)
      - `amount` (numeric)
      - `allocation` (jsonb: {equities, defensive, cash})
      - `confidence` (numeric 0-1)
      - `recession_probability` (numeric, optional)
      - `explanation_summary` (text)
      - `triggered_rules` (jsonb array)
      - `invalidated_if` (jsonb array)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Note: Currently mocking auth - in production add auth.uid() checks

  3. Indexes
    - Portfolio lookups by user_id
    - Position lookups by portfolio_id
    - Recommendation lookups by portfolio_id, sorted by created_at
*/

CREATE TABLE IF NOT EXISTS portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  cash_amount numeric NOT NULL DEFAULT 0,
  monthly_contribution numeric NOT NULL DEFAULT 0,
  risk_tolerance integer NOT NULL DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  quantity numeric NOT NULL,
  avg_cost numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  strategy text NOT NULL,
  action text NOT NULL,
  amount numeric NOT NULL,
  allocation jsonb NOT NULL,
  confidence numeric NOT NULL,
  recession_probability numeric,
  explanation_summary text NOT NULL,
  triggered_rules jsonb NOT NULL DEFAULT '[]',
  invalidated_if jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_portfolio_id ON recommendations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own portfolio"
  ON portfolios FOR ALL
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Users can manage own positions"
  ON positions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = positions.portfolio_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = positions.portfolio_id
    )
  );

CREATE POLICY "Users can manage own recommendations"
  ON recommendations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = recommendations.portfolio_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = recommendations.portfolio_id
    )
  );
