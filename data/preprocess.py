"""
Data Preprocessing Pipeline
============================
Validates, cleans, and engineers features on the raw synthetic dataset.

Input:  data/synthetic_filipino_fintech.csv
Output: data/clean_data.csv

Run:    python data/preprocess.py
"""

import pandas as pd
import numpy as np
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = PROJECT_ROOT / "data" / "synthetic_filipino_fintech.csv"
CLEAN_PATH = PROJECT_ROOT / "data" / "clean_data.csv"

# -- Expected schema ----------------------------------------------------------

EXPECTED_COLUMNS = [
    "age", "monthly_income", "monthly_expenses", "existing_savings",
    "employment_status", "num_dependents", "location_type",
    "digital_savviness", "has_bank_account", "has_ewallet",
    "savings_goal", "risk_tolerance", "investment_horizon",
    "recommended_product",
]

CATEGORICAL_COLS = [
    "employment_status", "location_type", "savings_goal",
    "risk_tolerance", "investment_horizon",
]

VALID_CATEGORIES = {
    "employment_status": {"Employed", "Self-employed", "Freelancer", "Student", "Unemployed"},
    "location_type": {"Metro Manila", "Urban", "Rural"},
    "savings_goal": {"Emergency Fund", "Education", "Retirement", "Travel",
                     "Home/Property", "General Savings", "Business Capital"},
    "risk_tolerance": {"Conservative", "Moderate", "Aggressive"},
    "investment_horizon": {"Short-term", "Medium-term", "Long-term"},
}

NUMERICAL_RANGES = {
    "age": (18, 65),
    "monthly_income": (0, None),
    "monthly_expenses": (0, None),
    "existing_savings": (0, None),
    "num_dependents": (0, 10),
    "digital_savviness": (1, 5),
    "has_bank_account": (0, 1),
    "has_ewallet": (0, 1),
}


# -- Step 1: Validate --------------------------------------------------------

def validate(df: pd.DataFrame) -> pd.DataFrame:
    """Check schema, nulls, duplicates, value ranges. Drop invalid rows."""
    n_before = len(df)

    # Column check
    missing = set(EXPECTED_COLUMNS) - set(df.columns)
    extra = set(df.columns) - set(EXPECTED_COLUMNS)
    if missing:
        raise ValueError(f"Missing columns: {missing}")
    if extra:
        print(f"  Dropping unexpected columns: {extra}")
        df = df[EXPECTED_COLUMNS]

    # Nulls
    null_count = df.isnull().sum().sum()
    if null_count > 0:
        df = df.dropna()
        print(f"  Dropped {null_count} null values -> {len(df)} rows")

    # Duplicates
    dupe_count = df.duplicated().sum()
    if dupe_count > 0:
        df = df.drop_duplicates()
        print(f"  Dropped {dupe_count} duplicates -> {len(df)} rows")

    # Categorical values
    for col, valid_set in VALID_CATEGORIES.items():
        bad_mask = ~df[col].isin(valid_set)
        n_bad = bad_mask.sum()
        if n_bad > 0:
            df = df[~bad_mask]
            print(f"  Dropped {n_bad} invalid values in '{col}'")

    # Numerical ranges
    for col, (lo, hi) in NUMERICAL_RANGES.items():
        if lo is not None:
            df = df[df[col] >= lo]
        if hi is not None:
            df = df[df[col] <= hi]

    n_after = len(df)
    if n_before != n_after:
        print(f"  Validation dropped {n_before - n_after} rows total")
    else:
        print("  Validation passed: 0 issues found")

    return df.reset_index(drop=True)


# -- Step 2: Feature Engineering ----------------------------------------------

def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Add financially meaningful derived features.

    These capture relationships that a financial advisor would consider:
      - disposable_income:       how much is left after expenses
      - expense_ratio:           what fraction of income goes to expenses
      - savings_to_income_ratio: months of income already saved
      - income_per_dependent:    earning power per household member
    """
    df = df.copy()

    df["disposable_income"] = df["monthly_income"] - df["monthly_expenses"]

    df["expense_ratio"] = (
        df["monthly_expenses"] / (df["monthly_income"] + 1)
    )

    df["savings_to_income_ratio"] = (
        df["existing_savings"] / (df["monthly_income"] + 1)
    )

    df["income_per_dependent"] = (
        df["monthly_income"] / (df["num_dependents"] + 1)
    )

    return df


# -- Step 3: Type Casting ----------------------------------------------------

def cast_types(df: pd.DataFrame) -> pd.DataFrame:
    """Cast columns to proper dtypes. EBM needs 'category' for categoricals."""
    df = df.copy()
    for col in CATEGORICAL_COLS:
        df[col] = df[col].astype("category")
    return df


# -- Main ---------------------------------------------------------------------

def main():
    print("=" * 55)
    print(" DATA PREPROCESSING PIPELINE")
    print("=" * 55)

    print(f"\n[1/4] Loading raw data from {RAW_PATH}")
    df = pd.read_csv(RAW_PATH)
    print(f"  Shape: {df.shape}")

    print("\n[2/4] Validating data integrity")
    df = validate(df)

    print("\n[3/4] Engineering derived features")
    df = add_derived_features(df)
    print(f"  Added 4 derived features -> {df.shape[1]} total columns")

    print("\n[4/4] Casting types")
    df = cast_types(df)

    # Summary
    print(f"\n{'='*55}")
    print(" PREPROCESSING COMPLETE")
    print(f"{'='*55}")
    print(f"  Rows:     {len(df)}")
    print(f"  Columns:  {df.shape[1]}")
    print(f"  Features: {df.shape[1] - 1}")
    print(f"  Target:   recommended_product ({df['recommended_product'].nunique()} classes)")
    print(f"\n  Columns: {list(df.columns)}")
    print(f"\n  Dtypes:")
    for col in df.columns:
        print(f"    {col:30s} {str(df[col].dtype)}")

    df.to_csv(CLEAN_PATH, index=False)
    print(f"\n  Saved to: {CLEAN_PATH}")


if __name__ == "__main__":
    main()
