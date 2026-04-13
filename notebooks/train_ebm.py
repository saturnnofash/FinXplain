"""
EBM Training Pipeline
======================
Trains an Explainable Boosting Machine on the preprocessed dataset.
EBM is the ONLY model -- no XGBoost, no SHAP, no LIME.

Input:  data/clean_data.csv
Output: models/ebm_model.pkl
        models/label_encoder.pkl
        models/model_metadata.json

Run:    python notebooks/train_ebm.py
"""

import json
import warnings
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score,
)
from interpret.glassbox import ExplainableBoostingClassifier

warnings.filterwarnings("ignore")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "clean_data.csv"
MODELS_DIR = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)

TARGET_COL = "recommended_product"

CATEGORICAL_COLS = [
    "employment_status", "location_type", "savings_goal",
    "risk_tolerance", "investment_horizon",
]


# =============================================================================
# 1. LOAD DATA
# =============================================================================

def load_clean_data(path: Path):
    """Load preprocessed data and split into features / target."""
    df = pd.read_csv(path)

    # Restore category dtype (lost during CSV save)
    for col in CATEGORICAL_COLS:
        df[col] = df[col].astype("category")

    feature_cols = [c for c in df.columns if c != TARGET_COL]
    X = df[feature_cols]
    y = df[TARGET_COL]

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    print(f"Loaded {len(df)} samples, {len(feature_cols)} features, "
          f"{len(label_encoder.classes_)} classes")
    print(f"Classes: {list(label_encoder.classes_)}")

    return X, y_encoded, label_encoder, feature_cols


# =============================================================================
# 2. TRAIN
# =============================================================================

def train(X_train, y_train, feature_names):
    """Train the EBM classifier."""
    print("\nTraining EBM...")

    ebm = ExplainableBoostingClassifier(
        feature_names=feature_names,
        max_bins=256,
        interactions=10,
        outer_bags=8,
        inner_bags=0,
        learning_rate=0.01,
        max_rounds=5000,
        min_samples_leaf=2,
        random_state=42,
    )
    ebm.fit(X_train, y_train)

    print("Training complete.")
    return ebm


# =============================================================================
# 3. EVALUATE
# =============================================================================

def evaluate(model, X_test, y_test, label_encoder):
    """Compute classification metrics."""
    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    auc = None
    try:
        y_proba = model.predict_proba(X_test)
        auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
    except Exception:
        pass

    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "auc_roc": round(auc, 4) if auc else None,
    }

    print(f"\n  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    if auc:
        print(f"  AUC-ROC:   {auc:.4f}")

    print(f"\n  Classification Report:")
    report = classification_report(
        y_test, y_pred,
        target_names=label_encoder.classes_,
        zero_division=0,
    )
    for line in report.split("\n"):
        print(f"    {line}")

    return metrics


def cross_validate(model, X, y, cv=5):
    """Stratified K-Fold cross-validation."""
    print(f"\nCross-validation ({cv}-fold)...")
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    scores = cross_val_score(model, X, y, cv=skf, scoring="accuracy", n_jobs=-1)
    print(f"  CV Accuracy: {scores.mean():.4f} +/- {scores.std():.4f}")
    return scores.tolist()


# =============================================================================
# 4. SAVE
# =============================================================================

def save(model, label_encoder, feature_cols, metrics, cv_scores):
    """Save model + metadata. No extra encoders needed -- EBM handles raw data."""
    joblib.dump(model, MODELS_DIR / "ebm_model.pkl")
    joblib.dump(label_encoder, MODELS_DIR / "label_encoder.pkl")

    cat_cols = CATEGORICAL_COLS
    num_cols = [c for c in feature_cols if c not in cat_cols]

    metadata = {
        "feature_columns": feature_cols,
        "categorical_columns": cat_cols,
        "numerical_columns": num_cols,
        "target_classes": list(label_encoder.classes_),
        "n_features": len(feature_cols),
        "n_classes": len(label_encoder.classes_),
        "metrics": metrics,
        "cv_scores": cv_scores,
    }
    with open(MODELS_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nSaved:")
    print(f"  {MODELS_DIR / 'ebm_model.pkl'}")
    print(f"  {MODELS_DIR / 'label_encoder.pkl'}")
    print(f"  {MODELS_DIR / 'model_metadata.json'}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 55)
    print(" EBM TRAINING PIPELINE")
    print("=" * 55)

    X, y, label_encoder, feature_cols = load_clean_data(DATA_PATH)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y,
    )
    print(f"Train: {len(y_train)} | Test: {len(y_test)}")

    ebm = train(X_train, y_train, feature_cols)

    print("\n--- Test Set Evaluation ---")
    metrics = evaluate(ebm, X_test, y_test, label_encoder)

    cv_scores = cross_validate(ebm, X, y)

    save(ebm, label_encoder, feature_cols, metrics, cv_scores)

    print("\nDone.")


if __name__ == "__main__":
    main()
