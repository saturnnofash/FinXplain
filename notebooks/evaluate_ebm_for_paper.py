"""Load saved EBM model and compute per-class metrics on the same test split."""

import json
import warnings
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score,
)

warnings.filterwarnings("ignore")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "clean_data.csv"
MODEL_PATH = PROJECT_ROOT / "backend" / "models" / "ebm_model.pkl"
LE_PATH = PROJECT_ROOT / "backend" / "models" / "label_encoder.pkl"

TARGET_COL = "recommended_product"
CATEGORICAL_COLS = [
    "employment_status", "location_type", "savings_goal",
    "risk_tolerance", "investment_horizon",
]

df = pd.read_csv(DATA_PATH)
for c in CATEGORICAL_COLS:
    df[c] = df[c].astype("category")

feature_cols = [c for c in df.columns if c != TARGET_COL]
X = df[feature_cols]
y = df[TARGET_COL]

le = joblib.load(LE_PATH)
y_enc = le.transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)

ebm = joblib.load(MODEL_PATH)

y_pred = ebm.predict(X_test)
y_proba = ebm.predict_proba(X_test)

acc = accuracy_score(y_test, y_pred)
prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")

print("=== EBM Test Metrics (reproduced) ===")
print(f"Accuracy:  {acc:.4f}")
print(f"Precision: {prec:.4f}")
print(f"Recall:    {rec:.4f}")
print(f"F1:        {f1:.4f}")
print(f"AUC-ROC:   {auc:.4f}")

print("\n=== EBM Per-Class Report ===")
print(classification_report(y_test, y_pred, target_names=le.classes_, digits=4, zero_division=0))

cm = confusion_matrix(y_test, y_pred)
print("Confusion matrix (rows=true, cols=pred):")
print("Classes:", list(le.classes_))
print(cm)

out = PROJECT_ROOT / "notebooks" / "paper_ebm_results.json"
with open(out, "w") as f:
    json.dump({
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "auc_roc": round(auc, 4),
        "confusion_matrix": cm.tolist(),
        "classes": list(le.classes_),
    }, f, indent=2)
print(f"\nSaved {out}")
