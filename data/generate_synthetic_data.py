"""
Synthetic Financial Dataset Generator for Philippine Fintech Recommendations
============================================================================

Generates realistic Filipino financial profiles grounded in:
- PSA Family Income and Expenditure Survey (FIES) 2023 distributions
- BSP Financial Inclusion Survey 2021-2024 data
- Actual GCash, BPI, and Maya product specifications (as of 2026)

Target Products (8 classes):
───────────────────────────────────────────────────────────────────────
1. gcash_gsave        │ GSave (CIMB) - 2.6% p.a., no min balance, digital
2. gcash_ginvest      │ GInvest UITFs - min PHP 50, variable returns, digital
3. bpi_savings        │ BPI Regular Savings - 0.0925% p.a., PHP 3K maintaining
4. bpi_save_up        │ BPI #SaveUp - digital auto-save, no maintaining balance
5. bpi_time_deposit   │ BPI Plan Ahead Time Deposit - 5yr, min PHP 50K, fixed
6. maya_savings       │ Maya Savings - 3.0% base (up to 15% boosted), digital
7. maya_personal_goals│ Maya Personal Goals - goal-based, tiered up to 8% p.a.
8. maya_time_deposit  │ Maya Time Deposit Plus - 3/6/12mo, ~5.25-5.75% p.a.
───────────────────────────────────────────────────────────────────────

Data Sources & References:
- PSA FIES 2023: Average annual family income PHP 353,230
- BSP 2021: 56% formal account ownership, 50%+ e-wallet adoption
- BSP 2024: 57.4% digital payment volume share
- PH Median Age: ~25.7 years (young population)
- Middle class threshold: ~PHP 25,000-145,000/month (family of 5)
"""

import numpy as np
import pandas as pd
import os

np.random.seed(42)

# ============================================================================
# PRODUCT AND FEATURE CONSTANTS
# ============================================================================

PRODUCTS = [
    "gcash_gsave",
    "gcash_ginvest",
    "bpi_savings",
    "bpi_save_up",
    "bpi_time_deposit",
    "maya_savings",
    "maya_personal_goals",
    "maya_time_deposit",
]

PRODUCT_INFO = {
    "gcash_gsave": {
        "provider": "GCash", "name": "GSave (CIMB)",
        "interest": "2.6% p.a.", "min_balance": 0, "type": "Digital Savings",
        "risk": "Low", "liquidity": "High", "requires_bank": False,
    },
    "gcash_ginvest": {
        "provider": "GCash", "name": "GInvest (UITFs)",
        "interest": "Variable (market-dependent)", "min_balance": 50, "type": "Investment",
        "risk": "Medium-High", "liquidity": "Medium", "requires_bank": False,
    },
    "bpi_savings": {
        "provider": "BPI", "name": "BPI Regular Savings",
        "interest": "0.0925% p.a.", "min_balance": 3000, "type": "Traditional Savings",
        "risk": "Low", "liquidity": "High", "requires_bank": True,
    },
    "bpi_save_up": {
        "provider": "BPI", "name": "BPI #SaveUp",
        "interest": "0.0925% p.a.", "min_balance": 0, "type": "Digital Auto-Save",
        "risk": "Low", "liquidity": "High", "requires_bank": True,
    },
    "bpi_time_deposit": {
        "provider": "BPI", "name": "BPI Plan Ahead Time Deposit",
        "interest": "~3-5% p.a. (fixed)", "min_balance": 50000, "type": "Time Deposit",
        "risk": "Low", "liquidity": "Low (5-year lock)", "requires_bank": True,
    },
    "maya_savings": {
        "provider": "Maya", "name": "Maya Savings",
        "interest": "3.0% base, up to 15% boosted", "min_balance": 0, "type": "Digital Savings",
        "risk": "Low", "liquidity": "High", "requires_bank": False,
    },
    "maya_personal_goals": {
        "provider": "Maya", "name": "Maya Personal Goals",
        "interest": "4-8% tiered p.a.", "min_balance": 0, "type": "Goal-Based Savings",
        "risk": "Low", "liquidity": "High", "requires_bank": False,
    },
    "maya_time_deposit": {
        "provider": "Maya", "name": "Maya Time Deposit Plus",
        "interest": "5.25-5.75% p.a.", "min_balance": 0, "type": "Digital Time Deposit",
        "risk": "Low", "liquidity": "Low (3-12mo lock)", "requires_bank": False,
    },
}

EMPLOYMENT_STATUSES = ["Employed", "Self-employed", "Freelancer", "Student", "Unemployed"]
SAVINGS_GOALS = [
    "Emergency Fund", "Education", "Retirement", "Travel",
    "Home/Property", "General Savings", "Business Capital",
]
RISK_TOLERANCES = ["Conservative", "Moderate", "Aggressive"]
INVESTMENT_HORIZONS = ["Short-term", "Medium-term", "Long-term"]
LOCATION_TYPES = ["Metro Manila", "Urban", "Rural"]


# ============================================================================
# DATA GENERATION FUNCTIONS
# ============================================================================

def generate_demographics(n: int) -> pd.DataFrame:
    """
    Generate demographic features based on Philippine population data.

    Sources:
    - PSA 2020 Census: Metro Manila ~13%, urbanization ~54%
    - PH median age ~25.7 years (CIA World Factbook)
    - Employment by sector from PSA Labor Force Survey
    """
    # Age: Philippines has a young population, median ~25.7
    age = np.clip(
        np.concatenate([
            np.random.normal(24, 3, int(n * 0.30)),    # Young workers/students
            np.random.normal(30, 5, int(n * 0.30)),    # Early career
            np.random.normal(40, 7, int(n * 0.25)),    # Mid-career
            np.random.normal(53, 6, n - int(n * 0.85)) # Senior workers
        ]),
        18, 65
    ).astype(int)
    np.random.shuffle(age)

    # Location distribution (PSA 2020 Census)
    location_type = np.random.choice(
        LOCATION_TYPES, size=n, p=[0.13, 0.45, 0.42]
    )

    # Employment: conditional on age and location
    employment_status = np.empty(n, dtype=object)
    for i in range(n):
        if age[i] <= 22:
            probs = [0.15, 0.05, 0.10, 0.60, 0.10]
        elif age[i] <= 30:
            loc_probs = {
                "Metro Manila": [0.65, 0.10, 0.15, 0.05, 0.05],
                "Urban":        [0.55, 0.15, 0.15, 0.05, 0.10],
                "Rural":        [0.40, 0.30, 0.10, 0.05, 0.15],
            }
            probs = loc_probs[location_type[i]]
        elif age[i] <= 45:
            loc_probs = {
                "Metro Manila": [0.60, 0.15, 0.15, 0.02, 0.08],
                "Urban":        [0.50, 0.20, 0.15, 0.02, 0.13],
                "Rural":        [0.35, 0.35, 0.10, 0.02, 0.18],
            }
            probs = loc_probs[location_type[i]]
        else:
            probs = [0.40, 0.25, 0.10, 0.01, 0.24]
        employment_status[i] = np.random.choice(EMPLOYMENT_STATUSES, p=probs)

    # Dependents: correlated with age
    num_dependents = np.zeros(n, dtype=int)
    for i in range(n):
        if age[i] < 25:
            num_dependents[i] = np.random.choice([0, 1, 2], p=[0.70, 0.20, 0.10])
        elif age[i] < 35:
            num_dependents[i] = np.random.choice(range(5), p=[0.20, 0.30, 0.30, 0.15, 0.05])
        elif age[i] < 50:
            num_dependents[i] = np.random.choice(range(6), p=[0.10, 0.15, 0.25, 0.25, 0.15, 0.10])
        else:
            num_dependents[i] = np.random.choice(range(5), p=[0.25, 0.25, 0.25, 0.15, 0.10])

    return pd.DataFrame({
        "age": age,
        "location_type": location_type,
        "employment_status": employment_status,
        "num_dependents": num_dependents,
    })


def generate_financial_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate financial features conditional on demographics.

    Income distributions based on PSA FIES 2023:
    - Average annual family income: PHP 353,230 (~PHP 29,436/month)
    - Individual incomes modeled lower than household
    - Metro Manila premium: ~30-50% above national average
    - Rural discount: ~25% below national average
    """
    n = len(df)
    monthly_income = np.zeros(n)

    income_params = {
        "Student":       (5000,  0.5),
        "Unemployed":    (3000,  0.8),
        "Freelancer":    (20000, 0.6),
        "Self-employed": (22000, 0.7),
        "Employed":      (25000, 0.5),
    }

    age_multipliers = [
        (25, 0.70), (35, 1.00), (45, 1.30), (55, 1.40), (100, 1.20)
    ]
    location_multipliers = {"Metro Manila": 1.40, "Urban": 1.10, "Rural": 0.75}

    for i in range(n):
        emp = df.iloc[i]["employment_status"]
        base_mean, base_sigma = income_params[emp]
        base = np.random.lognormal(np.log(base_mean), base_sigma)

        age_val = df.iloc[i]["age"]
        age_mult = next(m for threshold, m in age_multipliers if age_val < threshold)
        loc_mult = location_multipliers[df.iloc[i]["location_type"]]

        monthly_income[i] = max(0, base * age_mult * loc_mult)

    df["monthly_income"] = np.round(monthly_income, 2)

    # Expenses: typically 60-90% of income; more dependents = higher ratio
    expense_ratio = np.clip(np.random.beta(5, 2, n) * 0.5 + 0.4, 0.40, 0.95)
    expense_ratio += df["num_dependents"].values * 0.03
    expense_ratio = np.clip(expense_ratio, 0.40, 0.98)
    df["monthly_expenses"] = np.round(df["monthly_income"] * expense_ratio, 2)

    # Existing savings: accumulated disposable income over time
    savings_months = np.clip(np.random.exponential(6, n), 0, 60)
    disposable = df["monthly_income"] - df["monthly_expenses"]
    noise = np.random.normal(0, 5000, n)
    df["existing_savings"] = np.round(np.clip(disposable * savings_months + noise, 0, None), 2)

    return df


def generate_behavioral_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate behavioral & preference features.

    Digital adoption based on BSP Financial Inclusion Survey:
    - 56% formal bank account ownership (2021)
    - 50%+ e-wallet adoption
    - 72.2% of person-originated transactions are digital (2024)
    """
    n = len(df)

    # --- Digital savviness (1-5 scale) ---
    digital_savviness = np.zeros(n, dtype=int)
    age_digital_probs = {
        "young":  [0.02, 0.08, 0.20, 0.40, 0.30],
        "mid":    [0.05, 0.10, 0.30, 0.35, 0.20],
        "mature": [0.10, 0.20, 0.35, 0.25, 0.10],
        "senior": [0.20, 0.30, 0.30, 0.15, 0.05],
    }
    for i in range(n):
        age = df.iloc[i]["age"]
        if age < 30:
            probs = age_digital_probs["young"][:]
        elif age < 40:
            probs = age_digital_probs["mid"][:]
        elif age < 50:
            probs = age_digital_probs["mature"][:]
        else:
            probs = age_digital_probs["senior"][:]

        loc = df.iloc[i]["location_type"]
        if loc == "Metro Manila":
            probs[3] += 0.05
            probs[4] += 0.05
            probs[0] -= 0.03
            probs[1] -= 0.03
        elif loc == "Rural":
            probs[0] += 0.05
            probs[1] += 0.05
            probs[3] -= 0.03
            probs[4] -= 0.03

        probs = np.clip(probs, 0.01, None)
        probs = np.array(probs) / sum(probs)
        digital_savviness[i] = np.random.choice([1, 2, 3, 4, 5], p=probs)

    df["digital_savviness"] = digital_savviness

    # --- Bank account ownership (BSP: ~56% nationally) ---
    has_bank_account = np.zeros(n, dtype=int)
    for i in range(n):
        p = 0.56
        emp = df.iloc[i]["employment_status"]
        if emp == "Employed":       p += 0.15
        elif emp == "Student":      p -= 0.20
        elif emp == "Unemployed":   p -= 0.25

        loc = df.iloc[i]["location_type"]
        if loc == "Metro Manila":   p += 0.10
        elif loc == "Rural":        p -= 0.15

        if df.iloc[i]["monthly_income"] > 50000:  p += 0.15
        elif df.iloc[i]["monthly_income"] < 15000: p -= 0.10

        has_bank_account[i] = int(np.random.random() < np.clip(p, 0.10, 0.95))

    df["has_bank_account"] = has_bank_account

    # --- E-wallet ownership (BSP: ~50%+, growing rapidly) ---
    has_ewallet = np.zeros(n, dtype=int)
    for i in range(n):
        p = 0.55
        age = df.iloc[i]["age"]
        if age < 30:    p += 0.20
        elif age > 50:  p -= 0.15

        loc = df.iloc[i]["location_type"]
        if loc == "Metro Manila":   p += 0.10
        elif loc == "Rural":        p -= 0.15

        p += (df.iloc[i]["digital_savviness"] - 3) * 0.08
        has_ewallet[i] = int(np.random.random() < np.clip(p, 0.10, 0.95))

    df["has_ewallet"] = has_ewallet

    # --- Savings goal (conditional on age & employment) ---
    savings_goal = np.empty(n, dtype=object)
    goal_probs_by_profile = {
        "student":    [0.25, 0.30, 0.02, 0.15, 0.03, 0.20, 0.05],
        "young":      [0.30, 0.10, 0.05, 0.15, 0.10, 0.20, 0.10],
        "mid_career": [0.20, 0.15, 0.10, 0.10, 0.20, 0.10, 0.15],
        "mature":     [0.15, 0.20, 0.20, 0.05, 0.15, 0.10, 0.15],
        "senior":     [0.15, 0.10, 0.35, 0.05, 0.10, 0.15, 0.10],
    }
    for i in range(n):
        emp = df.iloc[i]["employment_status"]
        age = df.iloc[i]["age"]
        if emp == "Student":
            probs = goal_probs_by_profile["student"]
        elif age < 30:
            probs = goal_probs_by_profile["young"]
        elif age < 40:
            probs = goal_probs_by_profile["mid_career"]
        elif age < 50:
            probs = goal_probs_by_profile["mature"]
        else:
            probs = goal_probs_by_profile["senior"]
        savings_goal[i] = np.random.choice(SAVINGS_GOALS, p=probs)

    df["savings_goal"] = savings_goal

    # --- Risk tolerance (conditional on age, income, dependents) ---
    risk_tolerance = np.empty(n, dtype=object)
    for i in range(n):
        age = df.iloc[i]["age"]
        income = df.iloc[i]["monthly_income"]
        deps = df.iloc[i]["num_dependents"]

        if age < 30 and income > 30000:
            probs = [0.20, 0.40, 0.40]
        elif age < 30:
            probs = [0.30, 0.45, 0.25]
        elif age < 45 and income > 50000:
            probs = [0.25, 0.45, 0.30]
        elif age < 45:
            probs = [0.35, 0.45, 0.20]
        else:
            probs = [0.50, 0.35, 0.15]

        if deps >= 3:
            probs[0] += 0.10
            probs[2] = max(0.05, probs[2] - 0.10)

        probs = np.array(probs) / sum(probs)
        risk_tolerance[i] = np.random.choice(RISK_TOLERANCES, p=probs)

    df["risk_tolerance"] = risk_tolerance

    # --- Investment horizon (conditional on goal) ---
    investment_horizon = np.empty(n, dtype=object)
    horizon_by_goal = {
        "Emergency Fund":   [0.60, 0.30, 0.10],
        "Education":        [0.25, 0.50, 0.25],
        "Retirement":       [0.05, 0.25, 0.70],
        "Travel":           [0.60, 0.30, 0.10],
        "Home/Property":    [0.10, 0.45, 0.45],
        "General Savings":  [0.35, 0.40, 0.25],
        "Business Capital": [0.15, 0.45, 0.40],
    }
    for i in range(n):
        goal = df.iloc[i]["savings_goal"]
        probs = horizon_by_goal[goal]
        investment_horizon[i] = np.random.choice(INVESTMENT_HORIZONS, p=probs)

    df["investment_horizon"] = investment_horizon

    return df


def assign_product_recommendations(df: pd.DataFrame) -> pd.DataFrame:
    """
    Assign product recommendations using multi-factor scoring rules
    based on actual product eligibility and financial planning principles.

    Scoring dimensions:
    1. Digital preference  - Platform accessibility match
    2. Income level        - Product affordability/suitability
    3. Existing savings    - Minimum balance eligibility
    4. Risk tolerance      - Risk-return profile match
    5. Investment horizon  - Term/liquidity match
    6. Savings goal        - Product-goal alignment
    7. Location            - Physical vs digital access
    8. Age                 - Life-stage appropriateness
    """
    n = len(df)
    recommendations = np.empty(n, dtype=object)

    # Platform preference: in reality people tend to favor one platform
    # GCash ~67M users, Maya ~60M users, BPI ~10M digital (approx 2024-2025)
    platform_pref = np.random.choice(
        ["gcash", "maya", "bpi"], size=n, p=[0.40, 0.35, 0.25]
    )

    for i in range(n):
        row = df.iloc[i]
        scores = {p: 0.0 for p in PRODUCTS}

        income = row["monthly_income"]
        savings = row["existing_savings"]
        age = row["age"]
        digital = row["digital_savviness"]
        has_bank = row["has_bank_account"]
        has_ew = row["has_ewallet"]
        risk = row["risk_tolerance"]
        horizon = row["investment_horizon"]
        goal = row["savings_goal"]
        location = row["location_type"]
        deps = row["num_dependents"]
        expenses = row["monthly_expenses"]
        pref = platform_pref[i]

        # ── Platform Preference Bonus ───────────────────────────────
        pref_bonus = 2
        for p in PRODUCTS:
            if p.startswith(pref):
                scores[p] += pref_bonus

        # ── Digital Preference ──────────────────────────────────────
        if digital >= 4 and has_ew:
            scores["gcash_gsave"] += 2
            scores["maya_savings"] += 2
            scores["maya_personal_goals"] += 2
            scores["gcash_ginvest"] += 2
            scores["maya_time_deposit"] += 1
        elif digital >= 3:
            scores["gcash_gsave"] += 1
            scores["maya_savings"] += 1
            scores["bpi_save_up"] += 2
            scores["maya_personal_goals"] += 1

        if digital <= 2 or (not has_ew and has_bank):
            scores["bpi_savings"] += 3
            scores["bpi_time_deposit"] += 2
            scores["bpi_save_up"] += 2

        if has_bank and not has_ew:
            scores["bpi_savings"] += 3
            scores["bpi_time_deposit"] += 2
            scores["bpi_save_up"] += 1

        # ── Income Level ────────────────────────────────────────────
        if income < 15000:
            scores["gcash_gsave"] += 2
            scores["maya_savings"] += 2
            scores["maya_personal_goals"] += 1
        elif income < 30000:
            scores["maya_personal_goals"] += 2
            scores["bpi_save_up"] += 2
            scores["gcash_gsave"] += 1
            scores["maya_savings"] += 1
        elif income < 60000:
            scores["maya_personal_goals"] += 1
            scores["bpi_save_up"] += 2
            scores["maya_time_deposit"] += 2
            scores["gcash_ginvest"] += 2
        else:
            scores["bpi_time_deposit"] += 3
            scores["gcash_ginvest"] += 3
            scores["maya_time_deposit"] += 2

        # ── Existing Savings (Eligibility) ──────────────────────────
        if savings >= 50000:
            scores["bpi_time_deposit"] += 3
            scores["gcash_ginvest"] += 2
            scores["maya_time_deposit"] += 2
        elif savings >= 20000:
            scores["maya_time_deposit"] += 2
            scores["maya_personal_goals"] += 1
            scores["bpi_save_up"] += 1
        elif savings >= 5000:
            scores["maya_personal_goals"] += 1
            scores["bpi_save_up"] += 1
            scores["gcash_gsave"] += 1
        else:
            scores["gcash_gsave"] += 2
            scores["maya_savings"] += 2
            scores["bpi_time_deposit"] -= 3

        # ── Risk Tolerance ──────────────────────────────────────────
        if risk == "Conservative":
            scores["bpi_savings"] += 2
            scores["bpi_time_deposit"] += 2
            scores["maya_savings"] += 1
            scores["gcash_gsave"] += 1
            scores["gcash_ginvest"] -= 3
        elif risk == "Moderate":
            scores["maya_personal_goals"] += 2
            scores["maya_time_deposit"] += 2
            scores["bpi_save_up"] += 1
        else:  # Aggressive
            scores["gcash_ginvest"] += 4
            scores["maya_time_deposit"] += 1
            scores["bpi_time_deposit"] += 1

        # ── Investment Horizon ──────────────────────────────────────
        if horizon == "Short-term":
            scores["gcash_gsave"] += 2
            scores["maya_savings"] += 2
            scores["bpi_savings"] += 1
            scores["bpi_time_deposit"] -= 2
            scores["gcash_ginvest"] -= 1
        elif horizon == "Medium-term":
            scores["maya_personal_goals"] += 2
            scores["maya_time_deposit"] += 2
            scores["bpi_save_up"] += 2
            scores["gcash_ginvest"] += 1
        else:  # Long-term
            scores["bpi_time_deposit"] += 3
            scores["gcash_ginvest"] += 3
            scores["maya_time_deposit"] += 1

        # ── Savings Goal ────────────────────────────────────────────
        if goal == "Emergency Fund":
            scores["gcash_gsave"] += 2
            scores["maya_savings"] += 2
            scores["bpi_savings"] += 1
            scores["bpi_time_deposit"] -= 2
        elif goal in ("Education", "Home/Property"):
            scores["maya_personal_goals"] += 3
            scores["bpi_save_up"] += 2
            scores["maya_time_deposit"] += 1
        elif goal == "Retirement":
            scores["bpi_time_deposit"] += 3
            scores["gcash_ginvest"] += 3
            scores["maya_time_deposit"] += 1
        elif goal == "Travel":
            scores["maya_personal_goals"] += 2
            scores["gcash_gsave"] += 1
            scores["maya_savings"] += 1
        elif goal == "Business Capital":
            scores["maya_time_deposit"] += 2
            scores["gcash_ginvest"] += 2
            scores["bpi_time_deposit"] += 1
        elif goal == "General Savings":
            scores["gcash_gsave"] += 1
            scores["maya_savings"] += 1
            scores["bpi_save_up"] += 1

        # ── Location ────────────────────────────────────────────────
        if location == "Rural":
            scores["gcash_gsave"] += 1
            scores["maya_savings"] += 1
            scores["bpi_savings"] -= 1
            scores["bpi_time_deposit"] -= 1
        elif location == "Metro Manila":
            scores["bpi_savings"] += 1
            scores["bpi_time_deposit"] += 1

        # ── Age ─────────────────────────────────────────────────────
        if age < 25:
            scores["gcash_gsave"] += 1
            scores["maya_savings"] += 1
            scores["gcash_ginvest"] += 1
        elif age > 50:
            scores["bpi_savings"] += 1
            scores["bpi_time_deposit"] += 1
            scores["gcash_ginvest"] -= 1

        # ── Select best product (with 8% noise for realism) ────────
        sorted_products = sorted(scores, key=scores.get, reverse=True)
        if np.random.random() < 0.08:
            recommendations[i] = np.random.choice(sorted_products[:3])
        else:
            recommendations[i] = sorted_products[0]

    df["recommended_product"] = recommendations
    return df


def generate_dataset(n: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generate the complete synthetic dataset."""
    np.random.seed(seed)
    print(f"Generating {n} synthetic Filipino financial profiles...")
    print(f"  Random seed: {seed}")

    df = generate_demographics(n)
    print("  [1/4] Demographics generated")

    df = generate_financial_features(df)
    print("  [2/4] Financial features generated")

    df = generate_behavioral_features(df)
    print("  [3/4] Behavioral features generated")

    df = assign_product_recommendations(df)
    print("  [4/4] Product recommendations assigned")

    column_order = [
        "age", "monthly_income", "monthly_expenses", "existing_savings",
        "employment_status", "num_dependents", "location_type",
        "digital_savviness", "has_bank_account", "has_ewallet",
        "savings_goal", "risk_tolerance", "investment_horizon",
        "recommended_product",
    ]
    return df[column_order]


def print_dataset_summary(df: pd.DataFrame):
    """Print comprehensive summary statistics."""
    sep = "=" * 65
    print(f"\n{sep}")
    print("DATASET SUMMARY")
    print(sep)

    print(f"\nTotal samples:  {len(df)}")
    print(f"Features:       {len(df.columns) - 1}")
    print(f"Target classes: {df['recommended_product'].nunique()}")

    print(f"\n{'-'*40}")
    print("TARGET DISTRIBUTION")
    print(f"{'-'*40}")
    dist = df["recommended_product"].value_counts().sort_index()
    for product, count in dist.items():
        bar = "#" * int(count / len(df) * 50)
        print(f"  {product:25s} {count:5d} ({count/len(df)*100:5.1f}%) {bar}")

    print(f"\n{'-'*40}")
    print("NUMERICAL FEATURES")
    print(f"{'-'*40}")
    num_cols = ["age", "monthly_income", "monthly_expenses", "existing_savings"]
    stats = df[num_cols].describe().round(2)
    print(stats.to_string())

    print(f"\n{'-'*40}")
    print("CATEGORICAL FEATURES")
    print(f"{'-'*40}")
    cat_cols = ["employment_status", "location_type", "savings_goal",
                "risk_tolerance", "investment_horizon"]
    for col in cat_cols:
        print(f"\n  {col}:")
        for val, count in df[col].value_counts().items():
            print(f"    {val:20s} {count:5d} ({count/len(df)*100:5.1f}%)")

    print(f"\n{'-'*40}")
    print("DIGITAL FEATURES")
    print(f"{'-'*40}")
    print(f"  Bank account ownership: {df['has_bank_account'].mean()*100:.1f}%")
    print(f"  E-wallet ownership:     {df['has_ewallet'].mean()*100:.1f}%")
    print(f"  Avg digital savviness:  {df['digital_savviness'].mean():.2f} / 5.00")

    print(f"\n{'-'*40}")
    print("INCOME BY EMPLOYMENT STATUS (PHP/month)")
    print(f"{'-'*40}")
    income_by_emp = df.groupby("employment_status")["monthly_income"].agg(["mean", "median", "std"])
    print(income_by_emp.round(0).to_string())

    print(f"\n{'-'*40}")
    print("PRODUCT DISTRIBUTION BY PROVIDER")
    print(f"{'-'*40}")
    for provider in ["gcash", "bpi", "maya"]:
        provider_products = [p for p in PRODUCTS if p.startswith(provider)]
        count = df[df["recommended_product"].isin(provider_products)].shape[0]
        print(f"  {provider.upper():10s} {count:5d} ({count/len(df)*100:.1f}%)")


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    df = generate_dataset(n=5000, seed=42)
    print_dataset_summary(df)

    os.makedirs("data", exist_ok=True)
    output_path = "data/synthetic_filipino_fintech.csv"
    df.to_csv(output_path, index=False)
    print(f"\nDataset saved to: {output_path}")

    import json
    product_info_path = "data/product_info.json"
    with open(product_info_path, "w") as f:
        json.dump(PRODUCT_INFO, f, indent=2)
    print(f"Product info saved to: {product_info_path}")
