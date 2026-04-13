# PH Fintech Recommender — API Documentation

## Overview

| Property | Value |
|----------|-------|
| Base URL | `http://127.0.0.1:8000` |
| Protocol | HTTP/1.1 |
| Format | JSON (`application/json`) |
| CORS | Allowed from `http://localhost:3000` |
| Interactive Docs | `http://127.0.0.1:8000/docs` (Swagger UI) |

---

## Endpoints

### GET `/`
Health ping. Returns `{ "status": "ok" }`.

### GET `/health`
Returns model load status and available product classes.

### POST `/recommend`
Main endpoint. Accepts a user financial profile and returns a complete
explainable recommendation.

---

## POST `/recommend`

### Request Body

All 13 fields are **required**.

```json
{
  "age": 28,
  "monthly_income": 35000,
  "monthly_expenses": 22000,
  "existing_savings": 80000,
  "employment_status": "Employed",
  "num_dependents": 0,
  "location_type": "Metro Manila",
  "digital_savviness": 4,
  "has_bank_account": 1,
  "has_ewallet": 1,
  "savings_goal": "Retirement",
  "risk_tolerance": "Moderate",
  "investment_horizon": "Long-term"
}
```

#### Field Reference

| Field | Type | Constraints | Allowed Values |
|-------|------|-------------|----------------|
| `age` | int | 18 – 65 | — |
| `monthly_income` | float | ≥ 0 | PHP amount |
| `monthly_expenses` | float | ≥ 0 | PHP amount |
| `existing_savings` | float | ≥ 0 | PHP amount |
| `employment_status` | string | exact match | `Employed` `Self-employed` `Freelancer` `Student` `Unemployed` |
| `num_dependents` | int | 0 – 10 | — |
| `location_type` | string | exact match | `Metro Manila` `Urban` `Rural` |
| `digital_savviness` | int | 1 – 5 | 1 = low, 5 = high |
| `has_bank_account` | int | 0 or 1 | `0` = No, `1` = Yes |
| `has_ewallet` | int | 0 or 1 | `0` = No, `1` = Yes |
| `savings_goal` | string | exact match | `Emergency Fund` `Education` `Retirement` `Travel` `Home/Property` `General Savings` `Business Capital` |
| `risk_tolerance` | string | exact match | `Conservative` `Moderate` `Aggressive` |
| `investment_horizon` | string | exact match | `Short-term` `Medium-term` `Long-term` |

---

### Response Body

The response is a **single flat JSON object** — no nested wrappers.

```json
{
  "product":        "gcash_ginvest",
  "product_name":   "GInvest (UITFs)",
  "provider":       "GCash",
  "confidence":     0.9117,
  "interest_rate":  "Variable (market-dependent)",
  "min_balance":    50,
  "product_type":   "Investment",
  "risk_level":     "Medium-High",
  "liquidity":      "Medium",
  "requires_bank":  false,

  "top_products": [
    { "product": "gcash_ginvest",    "product_name": "GInvest (UITFs)",           "provider": "GCash", "score": 0.9117 },
    { "product": "bpi_time_deposit", "product_name": "BPI Plan Ahead Time Deposit","provider": "BPI",  "score": 0.0765 },
    { "product": "maya_time_deposit","product_name": "Maya Time Deposit Plus",     "provider": "Maya", "score": 0.0102 }
  ],

  "summary": "We recommend GInvest (UITFs) by GCash with high confidence (91%), mainly because of your aggressive risk tolerance and your long-term investment horizon.",

  "top_reasons": [
    "Your aggressive risk tolerance strongly supports this recommendation.",
    "Your long-term investment horizon strongly supports this recommendation.",
    "Your savings goal of retirement strongly supports this recommendation."
  ],

  "against_reasons": [
    "Having a bank account slightly reduces the fit for this product."
  ],

  "key_factors": [
    { "feature": "risk_tolerance",    "label": "Risk Tolerance",    "value": "Aggressive", "contribution":  3.448, "direction": "supports", "impact": "high"   },
    { "feature": "investment_horizon","label": "Investment Horizon", "value": "Long-term",  "contribution":  2.017, "direction": "supports", "impact": "high"   },
    { "feature": "savings_goal",      "label": "Savings Goal",       "value": "Retirement", "contribution":  1.943, "direction": "supports", "impact": "high"   },
    { "feature": "existing_savings",  "label": "Existing Savings",   "value": 250000.0,     "contribution":  1.309, "direction": "supports", "impact": "medium" },
    { "feature": "monthly_income",    "label": "Monthly Income",     "value": 90000.0,      "contribution":  1.291, "direction": "supports", "impact": "medium" }
  ],

  "counterfactuals": [
    {
      "suggestion":               "If you changed your risk tolerance to 'Conservative', BPI Plan Ahead Time Deposit would be recommended instead.",
      "feature":                  "risk_tolerance",
      "feature_label":            "Risk Tolerance",
      "current_value":            "Aggressive",
      "suggested_value":          "Conservative",
      "alternative_product":      "bpi_time_deposit",
      "alternative_product_name": "BPI Plan Ahead Time Deposit",
      "alternative_provider":     "BPI"
    }
  ]
}
```

---

### Response Field Reference

#### Recommendation Card

| Field | Type | Description |
|-------|------|-------------|
| `product` | string | Internal product key (e.g. `gcash_gsave`) |
| `product_name` | string | Display name (e.g. `GSave (CIMB)`) |
| `provider` | string | `GCash` / `BPI` / `Maya` |
| `confidence` | float | Model confidence 0.0 – 1.0 |
| `interest_rate` | string | Actual product interest (e.g. `2.6% p.a.`) |
| `min_balance` | int | Minimum balance in PHP |
| `product_type` | string | e.g. `Digital Savings`, `Investment`, `Time Deposit` |
| `risk_level` | string | `Low` / `Medium-High` |
| `liquidity` | string | `High` / `Medium` / `Low (5-year lock)` |
| `requires_bank` | bool | Whether a traditional bank account is needed |

#### Alternative Products

| Field | Type | Description |
|-------|------|-------------|
| `top_products` | array[3] | Top 3 products sorted by confidence score |
| `top_products[].product` | string | Internal key |
| `top_products[].product_name` | string | Display name |
| `top_products[].provider` | string | Provider name |
| `top_products[].score` | float | Confidence probability |

#### Explanation (Human-Readable)

| Field | Type | Description |
|-------|------|-------------|
| `summary` | string | 1-sentence plain-English explanation |
| `top_reasons` | array[≤3] | Why this product was recommended |
| `against_reasons` | array[≤2] | Features slightly reducing the match |

#### Key Factors (for Chart / Bar)

`key_factors` is always **exactly 5 items**, sorted by impact (strongest first). No interaction terms — only main features.

| Field | Type | Description |
|-------|------|-------------|
| `feature` | string | Internal feature name |
| `label` | string | Human-friendly label (e.g. `Risk Tolerance`) |
| `value` | string \| number | The user's actual value for this feature |
| `contribution` | float | EBM contribution score (positive = supports, negative = opposes) |
| `direction` | string | `"supports"` or `"opposes"` |
| `impact` | string | `"high"` (≥1.5) / `"medium"` (≥0.5) / `"low"` (<0.5) |

#### Counterfactuals (What-If Suggestions)

`counterfactuals` has **at most 3 items**. Only features the user can realistically change are included (`existing_savings`, `monthly_income`, `monthly_expenses`, `risk_tolerance`, `investment_horizon`, `savings_goal`).

| Field | Type | Description |
|-------|------|-------------|
| `suggestion` | string | Plain-English action sentence |
| `feature` | string | Internal feature name |
| `feature_label` | string | Display label |
| `current_value` | string \| number | User's current value |
| `suggested_value` | string \| number | The value that would flip the recommendation |
| `alternative_product` | string | The new product key |
| `alternative_product_name` | string | The new product display name |
| `alternative_provider` | string | The new product provider |

---

### Product Key Reference

| Key | Product Name | Provider |
|-----|-------------|----------|
| `gcash_gsave` | GSave (CIMB) | GCash |
| `gcash_ginvest` | GInvest (UITFs) | GCash |
| `bpi_savings` | BPI Regular Savings | BPI |
| `bpi_save_up` | BPI #SaveUp | BPI |
| `bpi_time_deposit` | BPI Plan Ahead Time Deposit | BPI |
| `maya_savings` | Maya Savings | Maya |
| `maya_personal_goals` | Maya Personal Goals | Maya |
| `maya_time_deposit` | Maya Time Deposit Plus | Maya |

---

### Error Response

```json
{ "detail": "Error message describing what went wrong." }
```

HTTP `422` — Validation error (missing or invalid field).
HTTP `500` — Internal server error (model/prediction failure).

---

## Frontend Usage (Next.js)

```javascript
const response = await fetch("http://localhost:8000/recommend", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    age: 28,
    monthly_income: 35000,
    monthly_expenses: 22000,
    existing_savings: 80000,
    employment_status: "Employed",
    num_dependents: 0,
    location_type: "Metro Manila",
    digital_savviness: 4,
    has_bank_account: 1,
    has_ewallet: 1,
    savings_goal: "Retirement",
    risk_tolerance: "Moderate",
    investment_horizon: "Long-term",
  }),
});

const data = await response.json();

// Direct field access — no nesting to unwrap
console.log(data.product_name);       // "GInvest (UITFs)"
console.log(data.confidence);         // 0.9117
console.log(data.summary);            // "We recommend..."
console.log(data.key_factors);        // [{label, value, contribution, direction, impact}, ...]
console.log(data.counterfactuals);    // [{suggestion, current_value, suggested_value, ...}, ...]
console.log(data.top_products);       // [{product_name, provider, score}, ...]
```
