"""
Explainability Module for Philippine Fintech Recommendations
=============================================================

Pipeline: raw user input -> prediction -> feature contributions
                         -> human explanation -> counterfactuals
                         -> flat JSON output (frontend-ready)

Design decisions:
  - Only top 5 main features returned (no interaction noise)
  - Interaction term weights folded into parent features
  - Counterfactuals use ONLY user-controllable features
  - Output is a single flat dict (no deep nesting)
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path


# =============================================================================
# CONSTANTS
# =============================================================================

# Features the user can realistically change → valid for counterfactuals
CONTROLLABLE_NUM = ["existing_savings", "monthly_income", "monthly_expenses"]
CONTROLLABLE_CAT = ["risk_tolerance", "investment_horizon", "savings_goal"]

# Valid category values (used in counterfactual search)
VALID_CATEGORIES = {
    "savings_goal": [
        "Emergency Fund", "Education", "Retirement",
        "Travel", "Home/Property", "General Savings", "Business Capital",
    ],
    "risk_tolerance": ["Conservative", "Moderate", "Aggressive"],
    "investment_horizon": ["Short-term", "Medium-term", "Long-term"],
}

# Human-friendly labels for features shown on the frontend
FEATURE_LABELS = {
    "age":                     "Age",
    "monthly_income":          "Monthly Income",
    "monthly_expenses":        "Monthly Expenses",
    "existing_savings":        "Existing Savings",
    "employment_status":       "Employment Status",
    "num_dependents":          "Number of Dependents",
    "location_type":           "Location",
    "digital_savviness":       "Digital Comfort",
    "has_bank_account":        "Has Bank Account",
    "has_ewallet":             "Has E-Wallet",
    "savings_goal":            "Savings Goal",
    "risk_tolerance":          "Risk Tolerance",
    "investment_horizon":      "Investment Horizon",
    "disposable_income":       "Disposable Income",
    "expense_ratio":           "Expense Ratio",
    "savings_to_income_ratio": "Savings-to-Income Ratio",
    "income_per_dependent":    "Income per Dependent",
}


# =============================================================================
# HELPERS
# =============================================================================

def _format_value(value) -> str | float | int:
    """Normalise numpy scalars to plain Python types for JSON."""
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return round(float(value), 4)
    return value


def _describe_feature(name: str, value) -> str:
    """
    Turn a feature name + value into a plain-English phrase.
    Used to build top_reasons and against_reasons sentences.
    """
    templates = {
        "monthly_income":          lambda v: f"your monthly income of PHP {float(v):,.0f}",
        "monthly_expenses":        lambda v: f"your monthly expenses of PHP {float(v):,.0f}",
        "existing_savings":        lambda v: f"your existing savings of PHP {float(v):,.0f}",
        "employment_status":       lambda v: f"being {v}",
        "num_dependents":          lambda v: f"having {int(float(v))} dependent{'s' if int(float(v)) != 1 else ''}",
        "location_type":           lambda v: (
            "living in Metro Manila" if v == "Metro Manila"
            else f"living in an {v.lower()} area" if v == "Urban"
            else f"living in a {v.lower()} area"
        ),
        "digital_savviness":       lambda v: f"your digital comfort level of {int(float(v))}/5",
        "has_bank_account":        lambda v: "having a bank account" if int(float(v)) else "not having a bank account",
        "has_ewallet":             lambda v: "having an e-wallet" if int(float(v)) else "not having an e-wallet",
        "savings_goal":            lambda v: f"your savings goal of {v}",
        "risk_tolerance":          lambda v: f"your {v.lower()} risk tolerance",
        "investment_horizon":      lambda v: f"your {v.lower()} investment horizon",
        "disposable_income":       lambda v: f"your disposable income of PHP {float(v):,.0f}/month",
        "expense_ratio":           lambda v: f"your expense ratio of {float(v):.0%}",
        "savings_to_income_ratio": lambda v: f"your savings being {float(v):.1f}x your monthly income",
        "income_per_dependent":    lambda v: f"your income per dependent of PHP {float(v):,.0f}",
    }
    fn = templates.get(name)
    if fn:
        try:
            return fn(value)
        except (ValueError, TypeError):
            return f"{FEATURE_LABELS.get(name, name)}: {value}"
    return f"{FEATURE_LABELS.get(name, name)}: {value}"


def _build_counterfactual_sentence(feature, old_val, new_val, product_name) -> str:
    """Return a single clear sentence describing the counterfactual change."""
    direction = "increase" if new_val > old_val else "decrease"

    if feature == "existing_savings":
        return (
            f"If you {direction} your savings to PHP {new_val:,.0f}, "
            f"you could qualify for {product_name}."
        )
    if feature == "monthly_income":
        return (
            f"If your monthly income {direction}d to PHP {new_val:,.0f}, "
            f"{product_name} would be recommended."
        )
    if feature == "monthly_expenses":
        return (
            f"If you {direction} your monthly expenses to PHP {new_val:,.0f}, "
            f"{product_name} would be a better fit."
        )
    if feature == "risk_tolerance":
        return (
            f"If you changed your risk tolerance to '{new_val}', "
            f"{product_name} would be recommended instead."
        )
    if feature == "investment_horizon":
        return (
            f"If you changed your investment horizon to '{new_val}', "
            f"{product_name} would be the better match."
        )
    if feature == "savings_goal":
        return (
            f"If your primary savings goal were '{new_val}' instead of '{old_val}', "
            f"{product_name} would be recommended."
        )
    return (
        f"Changing your {FEATURE_LABELS.get(feature, feature).lower()} to {new_val} "
        f"would lead to {product_name} being recommended."
    )


# =============================================================================
# MAIN CLASS
# =============================================================================

class RecommendationExplainer:
    """
    End-to-end explainable recommendation engine.

    Usage:
        explainer = RecommendationExplainer("models/")
        result = explainer.explain({ "age": 28, "monthly_income": 35000, ... })
        # result is a flat, JSON-serialisable dict
    """

    def __init__(self, model_dir: str):
        model_dir = Path(model_dir)
        self.model = joblib.load(model_dir / "ebm_model.pkl")
        self.label_encoder = joblib.load(model_dir / "label_encoder.pkl")

        with open(model_dir / "model_metadata.json") as f:
            self.metadata = json.load(f)

        with open(model_dir.parent / "data" / "product_info.json") as f:
            self.product_info = json.load(f)

        self.feature_cols = self.metadata["feature_columns"]
        self.cat_cols = self.metadata["categorical_columns"]
        self.classes = self.metadata["target_classes"]

    # ─────────────────────────────────────────────────────────────────────────
    # Step 1: Preprocess
    # ─────────────────────────────────────────────────────────────────────────

    def _preprocess(self, raw: dict) -> pd.DataFrame:
        """Build a model-ready single-row DataFrame from raw user input."""
        row = {col: raw[col] for col in [
            "age", "monthly_income", "monthly_expenses", "existing_savings",
            "employment_status", "num_dependents", "location_type",
            "digital_savviness", "has_bank_account", "has_ewallet",
            "savings_goal", "risk_tolerance", "investment_horizon",
        ]}

        # Derived features — must match data/preprocess.py exactly
        row["disposable_income"] = row["monthly_income"] - row["monthly_expenses"]
        row["expense_ratio"] = row["monthly_expenses"] / (row["monthly_income"] + 1)
        row["savings_to_income_ratio"] = row["existing_savings"] / (row["monthly_income"] + 1)
        row["income_per_dependent"] = row["monthly_income"] / (row["num_dependents"] + 1)

        df = pd.DataFrame([row])
        for col in self.cat_cols:
            df[col] = df[col].astype("category")
        return df[self.feature_cols]

    # ─────────────────────────────────────────────────────────────────────────
    # Step 2: Predict
    # ─────────────────────────────────────────────────────────────────────────

    def _predict(self, df: pd.DataFrame) -> tuple[str, float, list[dict]]:
        """
        Returns:
            product_key  – e.g. "maya_personal_goals"
            confidence   – probability of predicted class (0–1)
            top_products – top 3 alternatives as list of dicts
        """
        class_idx = int(self.model.predict(df)[0])
        probas = self.model.predict_proba(df)[0]

        # Sort all classes by probability, descending
        ranked = sorted(
            enumerate(probas), key=lambda x: -x[1]
        )

        top_products = [
            {
                "product": self.classes[i],
                "product_name": self.product_info.get(self.classes[i], {}).get("name", self.classes[i]),
                "provider": self.product_info.get(self.classes[i], {}).get("provider", ""),
                "score": round(float(p), 4),
            }
            for i, p in ranked[:3]
        ]

        return self.classes[class_idx], round(float(probas[class_idx]), 4), top_products

    # ─────────────────────────────────────────────────────────────────────────
    # Step 3: Feature contributions — top 5, no interaction clutter
    # ─────────────────────────────────────────────────────────────────────────

    def _get_key_factors(self, df: pd.DataFrame, class_idx: int) -> list[dict]:
        """
        Extract the top 5 most impactful features for the predicted class.

        Strategy:
          1. Get all EBM local scores (including interaction terms)
          2. For interaction terms (e.g. "A & B"), add their weight to the
             higher-contribution parent so the total signal is preserved
          3. Keep only the top 5 main features
          4. Return them with a readable label and impact level
        """
        explanation = self.model.explain_local(df)
        data = explanation.data(0)

        names = data["names"]
        scores = data["scores"]

        # Accumulate contribution per main feature
        # Interaction terms (e.g. "digital_savviness & has_ewallet") are split
        # and their weight added to whichever parent feature has the higher
        # individual contribution.
        accumulated = {}  # feature_name -> total contribution for this class

        # First pass: collect main feature contributions
        main_scores = {}
        for name, score_array in zip(names, scores):
            if " & " not in name:
                main_scores[name] = float(np.array(score_array)[class_idx])

        # Second pass: fold interaction term weights into dominant parent
        for name, score_array in zip(names, scores):
            if " & " in name:
                parts = [p.strip() for p in name.split("&")]
                interaction_val = float(np.array(score_array)[class_idx])
                # Give the weight to whichever parent has the larger |contribution|
                dominant = max(
                    parts,
                    key=lambda p: abs(main_scores.get(p, 0)),
                )
                main_scores[dominant] = main_scores.get(dominant, 0) + interaction_val

        # Sort by absolute value, take top 5
        top5 = sorted(main_scores.items(), key=lambda x: abs(x[1]), reverse=True)[:5]

        key_factors = []
        for feature, contribution in top5:
            label = FEATURE_LABELS.get(feature, feature.replace("_", " ").title())
            abs_c = abs(contribution)

            # Map magnitude to a simple impact tier for the frontend
            if abs_c >= 1.5:
                impact = "high"
            elif abs_c >= 0.5:
                impact = "medium"
            else:
                impact = "low"

            key_factors.append({
                "feature":     feature,
                "label":       label,
                "value":       _format_value(df[feature].iloc[0]) if feature in df.columns else None,
                "contribution": round(contribution, 4),
                "direction":   "supports" if contribution > 0 else "opposes",
                "impact":      impact,
            })

        return key_factors

    # ─────────────────────────────────────────────────────────────────────────
    # Step 4: Human explanation
    # ─────────────────────────────────────────────────────────────────────────

    def _get_explanation(
        self, key_factors: list, product_name: str, provider: str, confidence: float, raw: dict
    ) -> tuple[str, list, list]:
        """
        Build a summary sentence, up to 3 supporting reasons,
        and up to 2 opposing reasons — all in plain English.

        Returns: (summary, top_reasons, against_reasons)
        """
        # Build a lookup of all values for _describe_feature
        all_vals = dict(raw)
        all_vals["disposable_income"]       = raw["monthly_income"] - raw["monthly_expenses"]
        all_vals["expense_ratio"]           = raw["monthly_expenses"] / (raw["monthly_income"] + 1)
        all_vals["savings_to_income_ratio"] = raw["existing_savings"] / (raw["monthly_income"] + 1)
        all_vals["income_per_dependent"]    = raw["monthly_income"] / (raw["num_dependents"] + 1)

        supporting = [f for f in key_factors if f["direction"] == "supports"]
        opposing   = [f for f in key_factors if f["direction"] == "opposes"]

        confidence_word = "high" if confidence > 0.6 else "moderate" if confidence > 0.3 else "low"

        # Summary sentence
        primary = _describe_feature(supporting[0]["feature"], all_vals.get(supporting[0]["feature"]))
        summary = (
            f"We recommend {product_name} by {provider} with {confidence_word} confidence "
            f"({confidence:.0%}), mainly because of {primary}"
        )
        if len(supporting) > 1:
            secondary = _describe_feature(supporting[1]["feature"], all_vals.get(supporting[1]["feature"]))
            summary += f" and {secondary}"
        summary += "."

        # Supporting reasons (max 3)
        top_reasons = []
        for f in supporting[:3]:
            val  = all_vals.get(f["feature"])
            desc = _describe_feature(f["feature"], val)
            strength = "strongly" if f["impact"] == "high" else "moderately"
            top_reasons.append(f"{desc.capitalize()} {strength} supports this recommendation.")

        # Opposing reasons (max 2)
        against_reasons = []
        for f in opposing[:2]:
            val  = all_vals.get(f["feature"])
            desc = _describe_feature(f["feature"], val)
            against_reasons.append(f"{desc.capitalize()} slightly reduces the fit for this product.")

        return summary, top_reasons, against_reasons

    # ─────────────────────────────────────────────────────────────────────────
    # Step 5: Counterfactuals — controllable features only
    # ─────────────────────────────────────────────────────────────────────────

    def _get_counterfactuals(self, raw: dict, current_product: str, max_results: int = 3) -> list:
        """
        Search for minimal changes to CONTROLLABLE features that flip the recommendation.

        Controllable numerical : existing_savings, monthly_income, monthly_expenses
        Controllable categorical: risk_tolerance, investment_horizon, savings_goal

        Features like age, location, or num_dependents are intentionally excluded
        because users cannot realistically change them.
        """
        results = []

        # --- Numerical: try small incremental steps ---
        multipliers = [1.25, 1.5, 2.0, 2.5, 3.0, 0.75, 0.5]

        for feat in CONTROLLABLE_NUM:
            current_val = raw[feat]

            if current_val == 0:
                # For zero-valued savings, try common target amounts
                test_values = [10000, 25000, 50000, 100000, 200000]
            else:
                test_values = [round(current_val * m, 2) for m in multipliers]

            for new_val in test_values:
                new_val = max(0.0, new_val)
                if new_val == current_val:
                    continue

                modified = dict(raw)
                modified[feat] = new_val
                new_pred    = int(self.model.predict(self._preprocess(modified))[0])
                new_product = self.classes[new_pred]

                if new_product != current_product:
                    info = self.product_info.get(new_product, {})
                    results.append({
                        "suggestion":              _build_counterfactual_sentence(feat, current_val, new_val, info.get("name", new_product)),
                        "feature":                 feat,
                        "feature_label":           FEATURE_LABELS[feat],
                        "current_value":           current_val,
                        "suggested_value":         new_val,
                        "alternative_product":     new_product,
                        "alternative_product_name": info.get("name", new_product),
                        "alternative_provider":    info.get("provider", ""),
                    })
                    break  # One flip per feature is enough

        # --- Categorical: try every alternative value ---
        for feat, valid_values in VALID_CATEGORIES.items():
            current_val = raw.get(feat)
            for new_val in valid_values:
                if new_val == current_val:
                    continue

                modified = dict(raw)
                modified[feat] = new_val
                new_pred    = int(self.model.predict(self._preprocess(modified))[0])
                new_product = self.classes[new_pred]

                if new_product != current_product:
                    info = self.product_info.get(new_product, {})
                    results.append({
                        "suggestion":              _build_counterfactual_sentence(feat, current_val, new_val, info.get("name", new_product)),
                        "feature":                 feat,
                        "feature_label":           FEATURE_LABELS[feat],
                        "current_value":           current_val,
                        "suggested_value":         new_val,
                        "alternative_product":     new_product,
                        "alternative_product_name": info.get("name", new_product),
                        "alternative_provider":    info.get("provider", ""),
                    })
                    break  # One flip per feature

        return results[:max_results]

    # ─────────────────────────────────────────────────────────────────────────
    # Public API: one call → one flat, frontend-ready JSON
    # ─────────────────────────────────────────────────────────────────────────

    def explain(self, raw: dict) -> dict:
        """
        Full pipeline. Returns a FLAT dict that maps directly to UI components.

        Output shape:
        {
            # ── Recommendation card ──────────────────────────────────
            "product":          "gcash_ginvest",
            "product_name":     "GInvest (UITFs)",
            "provider":         "GCash",
            "confidence":       0.91,
            "interest_rate":    "Variable (market-dependent)",
            "min_balance":      50,
            "product_type":     "Investment",
            "risk_level":       "Medium-High",
            "liquidity":        "Medium",
            "requires_bank":    false,

            # ── Alternative products ─────────────────────────────────
            "top_products":     [ { product, product_name, provider, score }, ... ],

            # ── Why this product ─────────────────────────────────────
            "summary":          "We recommend ... because ...",
            "top_reasons":      [ "...", "...", "..." ],
            "against_reasons":  [ "...", "..." ],

            # ── Key factors (chart / bar) ────────────────────────────
            "key_factors": [
                { feature, label, value, contribution, direction, impact },
                ...  # exactly 5 items
            ],

            # ── What-if suggestions ──────────────────────────────────
            "counterfactuals": [
                { suggestion, feature, feature_label,
                  current_value, suggested_value,
                  alternative_product, alternative_product_name,
                  alternative_provider },
                ...  # max 3 items
            ]
        }
        """
        df = self._preprocess(raw)

        product_key, confidence, top_products = self._predict(df)
        class_idx = self.classes.index(product_key)
        info      = self.product_info.get(product_key, {})

        key_factors = self._get_key_factors(df, class_idx)

        summary, top_reasons, against_reasons = self._get_explanation(
            key_factors, info.get("name", product_key), info.get("provider", ""),
            confidence, raw,
        )

        counterfactuals = self._get_counterfactuals(raw, product_key)

        # ── Flat output ───────────────────────────────────────────────────────
        return {
            # Recommendation card
            "product":       product_key,
            "product_name":  info.get("name", product_key),
            "provider":      info.get("provider", ""),
            "confidence":    confidence,
            "interest_rate": info.get("interest", ""),
            "min_balance":   info.get("min_balance", 0),
            "product_type":  info.get("type", ""),
            "risk_level":    info.get("risk", ""),
            "liquidity":     info.get("liquidity", ""),
            "requires_bank": info.get("requires_bank", False),

            # Alternatives (top 3 sorted by confidence score)
            "top_products":  top_products,

            # Plain-English explanation
            "summary":         summary,
            "top_reasons":     top_reasons,
            "against_reasons": against_reasons,

            # Key factors for chart / insight bar
            "key_factors": key_factors,

            # Actionable what-if suggestions
            "counterfactuals": counterfactuals,
        }
