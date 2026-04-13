export interface RecommendRequest {
  age: number;
  monthly_income: number;
  monthly_expenses: number;
  existing_savings: number;
  employment_status:
    | "Employed"
    | "Self-employed"
    | "Freelancer"
    | "Student"
    | "Unemployed";
  num_dependents: number;
  location_type: "Metro Manila" | "Urban" | "Rural";
  digital_savviness: number;
  has_bank_account: 0 | 1;
  has_ewallet: 0 | 1;
  savings_goal:
    | "Emergency Fund"
    | "Education"
    | "Retirement"
    | "Travel"
    | "Home/Property"
    | "General Savings"
    | "Business Capital";
  risk_tolerance: "Conservative" | "Moderate" | "Aggressive";
  investment_horizon: "Short-term" | "Medium-term" | "Long-term";
}

export interface KeyFactor {
  feature: string;
  label: string;
  value: string | number;
  contribution: number;
  direction: "supports" | "opposes";
  impact: "high" | "medium" | "low";
}

export interface TopProduct {
  product: string;
  product_name: string;
  provider: string;
  score: number;
}

export interface Counterfactual {
  suggestion: string;
  feature: string;
  feature_label: string;
  current_value: string | number;
  suggested_value: string | number;
  alternative_product: string;
  alternative_product_name: string;
  alternative_provider: string;
}

export interface RecommendResponse {
  product: string;
  product_name: string;
  provider: string;
  confidence: number;
  interest_rate: string;
  min_balance: number;
  product_type: string;
  risk_level: string;
  liquidity: string;
  requires_bank: boolean;
  top_products: TopProduct[];
  summary: string;
  top_reasons: string[];
  against_reasons: string[];
  key_factors: KeyFactor[];
  counterfactuals: Counterfactual[];
}
