"""
Analysis script for paper: computes XGBoost metrics and dataset descriptive statistics.
"""

import json
import warnings
from pathlib import Path
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score,
)
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "clean_data.csv"

TARGET_COL = "recommended_product"
CATEGORICAL_COLS = [
    "employment_status", "location_type", "savings_goal",
    "risk_tolerance", "investment_horizon",
]

print("Loading data from", DATA_PATH)
df = pd.read_csv(DATA_PATH)
print(f"Total rows: {len(df)}")
print(f"Columns ({len(df.columns)}):", list(df.columns))

# Descriptive statistics
num_cols_raw = ["age", "monthly_income", "monthly_expenses", "existing_savings",
                "num_dependents", "digital_savviness", "has_bank_account", "has_ewallet",
                "disposable_income", "expense_ratio", "savings_to_income_ratio",
                "income_per_dependent"]
print("\n=== Descriptive Statistics ===")
desc = df[num_cols_raw].describe().T
print(desc.round(2).to_string())
print("\n=== Skewness ===")
print(df[num_cols_raw].skew().round(3).to_string())

# Categorical distributions
print("\n=== Categorical Features ===")
for c in CATEGORICAL_COLS:
    print(f"\n{c}:")
    vc = df[c].value_counts(normalize=True).sort_index()
    for val, pct in vc.items():
        print(f"  {val}: {pct*100:.1f}%")

# Product label distribution
print("\n=== Class Distribution ===")
label_dist = df[TARGET_COL].value_counts().sort_index()
label_pct = df[TARGET_COL].value_counts(normalize=True).sort_index()
for p in label_dist.index:
    print(f"  {p}: {label_dist[p]} ({label_pct[p]*100:.2f}%)")

print("\n=== Digital Ownership ===")
print(f"Bank account ownership: {df['has_bank_account'].mean()*100:.2f}%")
print(f"E-wallet ownership:     {df['has_ewallet'].mean()*100:.2f}%")

# XGBoost training
feature_cols = [c for c in df.columns if c != TARGET_COL]
X = df[feature_cols].copy()
y = df[TARGET_COL].copy()

le = LabelEncoder()
y_enc = le.fit_transform(y)
print(f"\nClasses: {list(le.classes_)}")

num_cols_all = [c for c in feature_cols if c not in CATEGORICAL_COLS]

# Ordinal + scale for XGBoost
X_xgb = X.copy()
ord_enc = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
X_xgb[CATEGORICAL_COLS] = ord_enc.fit_transform(X_xgb[CATEGORICAL_COLS])
scaler = StandardScaler()
X_xgb[num_cols_all] = scaler.fit_transform(X_xgb[num_cols_all])

X_train, X_test, y_train, y_test = train_test_split(
    X_xgb, y_enc, test_size=0.2, random_state=42, stratify=y_enc,
)
print(f"\nTrain size: {len(y_train)} | Test size: {len(y_test)}")

# Train/test class counts
print("\n=== Train/Test Class Counts ===")
train_counts = pd.Series(y_train).value_counts().sort_index()
test_counts = pd.Series(y_test).value_counts().sort_index()
for i, cls in enumerate(le.classes_):
    tr = int(train_counts.get(i, 0))
    te = int(test_counts.get(i, 0))
    print(f"  {cls}: train={tr} ({tr/len(y_train)*100:.2f}%), test={te} ({te/len(y_test)*100:.2f}%)")

# Train XGBoost
print("\n=== Training XGBoost ===")
xgb = XGBClassifier(
    n_estimators=300, max_depth=6, learning_rate=0.1,
    subsample=0.8, colsample_bytree=0.8, min_child_weight=3,
    gamma=0.1, reg_alpha=0.1, reg_lambda=1.0,
    objective="multi:softprob", num_class=len(le.classes_),
    eval_metric="mlogloss", random_state=42, use_label_encoder=False,
)
xgb.fit(X_train, y_train, verbose=False)

y_pred = xgb.predict(X_test)
y_proba = xgb.predict_proba(X_test)
acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")

print(f"\n=== XGBoost Test Metrics ===")
print(f"Accuracy:  {acc:.4f}")
print(f"Precision: {prec:.4f} (weighted)")
print(f"Recall:    {rec:.4f} (weighted)")
print(f"F1:        {f1:.4f} (weighted)")
print(f"AUC-ROC:   {auc:.4f} (weighted OvR)")

print("\n=== XGBoost Per-Class Report ===")
print(classification_report(y_test, y_pred, target_names=le.classes_, digits=4, zero_division=0))

cm = confusion_matrix(y_test, y_pred)
print("Confusion matrix (rows=true, cols=pred):")
print("Classes:", list(le.classes_))
print(cm)

# Save all results
results = {
    "n_total": len(df),
    "n_train": len(y_train),
    "n_test": len(y_test),
    "classes": list(le.classes_),
    "xgboost": {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "auc_roc": round(auc, 4),
    },
    "class_distribution": {k: int(v) for k, v in label_dist.items()},
    "train_class_counts": {le.classes_[i]: int(train_counts.get(i, 0)) for i in range(len(le.classes_))},
    "test_class_counts": {le.classes_[i]: int(test_counts.get(i, 0)) for i in range(len(le.classes_))},
    "confusion_matrix": cm.tolist(),
    "bank_account_rate": round(df['has_bank_account'].mean(), 4),
    "ewallet_rate": round(df['has_ewallet'].mean(), 4),
    "avg_digital_savviness": round(df['digital_savviness'].mean(), 2),
}

out = PROJECT_ROOT / "notebooks" / "paper_results.json"
with open(out, "w") as f:
    json.dump(results, f, indent=2)
print(f"\nSaved {out}")
