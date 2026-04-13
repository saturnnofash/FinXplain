"""
Model Training Pipeline for Philippine Fintech Recommendation System
====================================================================

Trains two models:
  1. EBM (Explainable Boosting Machine) - Primary, inherently interpretable model
  2. XGBoost - Benchmark high-performance model

Includes:
  - Feature engineering with derived financial metrics
  - Stratified train/test split with cross-validation
  - Comprehensive evaluation (accuracy, precision, recall, F1, AUC)
  - SHAP explanations for XGBoost
  - LIME explanations for both models
  - Counterfactual generation
  - Model & preprocessor artifact saving

Usage:
  python notebooks/train_model.py
"""

import sys
import os
import json
import warnings
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder, OrdinalEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    classification_report, confusion_matrix, roc_auc_score,
)
from interpret.glassbox import ExplainableBoostingClassifier
from xgboost import XGBClassifier
import shap
from lime.lime_tabular import LimeTabularExplainer

warnings.filterwarnings("ignore")

# Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "synthetic_filipino_fintech.csv"
MODELS_DIR = PROJECT_ROOT / "models"
MODELS_DIR.mkdir(exist_ok=True)


# ============================================================================
# 1. DATA LOADING & FEATURE ENGINEERING
# ============================================================================

def load_data(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"Loaded {len(df)} samples from {path}")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Create derived financial features that carry domain meaning."""
    df = df.copy()

    df["disposable_income"] = df["monthly_income"] - df["monthly_expenses"]

    df["expense_ratio"] = df["monthly_expenses"] / (df["monthly_income"] + 1)

    # How many months of income have been saved
    df["savings_to_income_ratio"] = df["existing_savings"] / (df["monthly_income"] + 1)

    df["income_per_dependent"] = df["monthly_income"] / (df["num_dependents"] + 1)

    return df


def prepare_datasets(df: pd.DataFrame):
    """
    Prepare separate datasets for EBM and XGBoost.

    EBM handles categorical features natively (no encoding needed).
    XGBoost requires all features to be numeric.
    """
    target_col = "recommended_product"
    feature_cols = [c for c in df.columns if c != target_col]

    X = df[feature_cols].copy()
    y = df[target_col].copy()

    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y)

    cat_cols = X.select_dtypes(include=["object"]).columns.tolist()
    num_cols = X.select_dtypes(include=["number"]).columns.tolist()

    print(f"\nFeature breakdown:")
    print(f"  Categorical ({len(cat_cols)}): {cat_cols}")
    print(f"  Numerical   ({len(num_cols)}): {num_cols}")
    print(f"  Target classes ({len(label_encoder.classes_)}): {list(label_encoder.classes_)}")

    # EBM dataset: keep original (EBM handles mixed types)
    X_ebm = X.copy()

    # XGBoost dataset: encode categoricals + scale numericals
    X_xgb = X.copy()
    ordinal_encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    X_xgb[cat_cols] = ordinal_encoder.fit_transform(X_xgb[cat_cols])

    scaler = StandardScaler()
    X_xgb[num_cols] = scaler.fit_transform(X_xgb[num_cols])

    return (X_ebm, X_xgb, y_encoded, label_encoder,
            ordinal_encoder, scaler, cat_cols, num_cols, feature_cols)


# ============================================================================
# 2. MODEL TRAINING
# ============================================================================

def train_ebm(X_train, y_train, feature_names, cat_cols):
    """Train Explainable Boosting Machine (primary model)."""
    print("\n" + "=" * 60)
    print("TRAINING: Explainable Boosting Machine (EBM)")
    print("=" * 60)

    X_train_ebm = X_train.copy()
    for col in cat_cols:
        if col in X_train_ebm.columns:
            X_train_ebm[col] = X_train_ebm[col].astype("category")

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

    ebm.fit(X_train_ebm, y_train)
    print("  EBM training complete.")
    return ebm


def train_xgboost(X_train, y_train, num_classes):
    """Train XGBoost classifier (benchmark model)."""
    print("\n" + "=" * 60)
    print("TRAINING: XGBoost Classifier")
    print("=" * 60)

    xgb = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        objective="multi:softprob",
        num_class=num_classes,
        eval_metric="mlogloss",
        random_state=42,
        use_label_encoder=False,
    )

    xgb.fit(X_train, y_train, verbose=False)
    print("  XGBoost training complete.")
    return xgb


# ============================================================================
# 3. EVALUATION
# ============================================================================

def _cast_categories(X, cat_cols):
    """Cast object columns to category dtype for EBM compatibility."""
    X = X.copy()
    for col in cat_cols:
        if col in X.columns and X[col].dtype == object:
            X[col] = X[col].astype("category")
    return X


def evaluate_model(model, X_test, y_test, label_encoder, model_name="Model"):
    """Comprehensive model evaluation."""
    sep = "-" * 55
    print(f"\n{sep}")
    print(f"EVALUATION: {model_name}")
    print(sep)

    y_pred = model.predict(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    print(f"\n  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f} (weighted)")
    print(f"  Recall:    {rec:.4f} (weighted)")
    print(f"  F1 Score:  {f1:.4f} (weighted)")

    try:
        if hasattr(model, "predict_proba"):
            y_proba = model.predict_proba(X_test)
        else:
            y_proba = model.predict_proba(X_test)
        auc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
        print(f"  AUC-ROC:   {auc:.4f} (weighted OVR)")
    except Exception:
        auc = None
        print("  AUC-ROC:   N/A")

    print(f"\n  Classification Report:")
    target_names = label_encoder.classes_
    report = classification_report(y_test, y_pred, target_names=target_names, zero_division=0)
    for line in report.split("\n"):
        print(f"    {line}")

    cm = confusion_matrix(y_test, y_pred)

    return {
        "accuracy": acc,
        "precision": prec,
        "recall": rec,
        "f1": f1,
        "auc_roc": auc,
        "confusion_matrix": cm.tolist(),
    }


def cross_validate(model, X, y, model_name="Model", cv=5):
    """Stratified K-Fold cross-validation."""
    print(f"\n  Cross-validation ({cv}-fold) for {model_name}...")
    skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=42)
    scores = cross_val_score(model, X, y, cv=skf, scoring="accuracy", n_jobs=-1)
    print(f"    CV Accuracy: {scores.mean():.4f} +/- {scores.std():.4f}")
    print(f"    Per fold:    {[f'{s:.4f}' for s in scores]}")
    return scores


# ============================================================================
# 4. EXPLAINABILITY
# ============================================================================

def explain_with_shap(xgb_model, X_test, feature_names, label_encoder, n_samples=100):
    """Generate SHAP explanations for the XGBoost model."""
    print("\n" + "=" * 60)
    print("SHAP EXPLANATIONS (XGBoost)")
    print("=" * 60)

    explainer = shap.TreeExplainer(xgb_model)
    X_sample = X_test[:n_samples] if len(X_test) > n_samples else X_test
    raw_shap = explainer.shap_values(X_sample)

    # Normalize SHAP output to list-of-arrays-per-class format
    sv = np.array(raw_shap)
    if sv.ndim == 3 and sv.shape[0] == len(X_sample):
        # Shape: (n_samples, n_features, n_classes) -> per-class list
        n_classes = sv.shape[2]
        shap_by_class = [sv[:, :, c] for c in range(n_classes)]
    elif isinstance(raw_shap, list):
        shap_by_class = raw_shap
        n_classes = len(raw_shap)
    else:
        shap_by_class = [sv]
        n_classes = 1

    print(f"\n  SHAP values computed for {len(X_sample)} samples, {n_classes} classes")

    print("\n  Top feature importances (mean |SHAP|) per class:")
    for class_idx in range(min(n_classes, len(label_encoder.classes_))):
        class_name = label_encoder.classes_[class_idx]
        mean_abs_shap = np.abs(shap_by_class[class_idx]).mean(axis=0)
        top_indices = np.argsort(mean_abs_shap)[-5:][::-1]
        top_features = [(feature_names[j], mean_abs_shap[j]) for j in top_indices]
        print(f"\n    {class_name}:")
        for fname, importance in top_features:
            print(f"      {fname:30s} {importance:.4f}")

    return explainer, shap_by_class


def explain_with_lime(model, X_train_np, X_test_np, feature_names, label_encoder,
                      cat_indices, sample_idx=0):
    """Generate LIME explanation for a single prediction."""
    print("\n" + "=" * 60)
    print("LIME EXPLANATION (Sample Prediction)")
    print("=" * 60)

    lime_explainer = LimeTabularExplainer(
        training_data=X_train_np,
        feature_names=feature_names,
        class_names=list(label_encoder.classes_),
        categorical_features=cat_indices,
        mode="classification",
        random_state=42,
    )

    explanation = lime_explainer.explain_instance(
        X_test_np[sample_idx],
        model.predict_proba,
        num_features=10,
        top_labels=3,
    )

    print(f"\n  Sample index: {sample_idx}")
    predicted_class = label_encoder.classes_[model.predict(X_test_np[sample_idx:sample_idx+1])[0]]
    print(f"  Predicted product: {predicted_class}")
    print(f"\n  Top contributing features:")

    for label in explanation.available_labels()[:3]:
        class_name = label_encoder.classes_[label]
        print(f"\n    Class: {class_name}")
        for feature, weight in explanation.as_list(label=label)[:5]:
            direction = "-> supports" if weight > 0 else "-> opposes"
            print(f"      {feature:45s} {weight:+.4f}  {direction}")

    return lime_explainer, explanation


def generate_counterfactuals(model, X_test, feature_names, label_encoder,
                             cat_cols, sample_idx=0, n_changes=3):
    """
    Generate simple counterfactual explanations.

    Finds minimal feature changes that would alter the recommendation.
    """
    print("\n" + "=" * 60)
    print("COUNTERFACTUAL EXPLANATIONS")
    print("=" * 60)

    sample = X_test.iloc[sample_idx:sample_idx+1].copy() if isinstance(X_test, pd.DataFrame) else X_test[sample_idx:sample_idx+1].copy()
    original_pred = model.predict(sample)[0]
    original_class = label_encoder.classes_[original_pred]

    print(f"\n  Original prediction: {original_class}")
    print(f"\n  Counterfactual scenarios ('What if...'):")

    num_features = [f for f in feature_names if f not in cat_cols]
    counterfactuals = []

    for feat in num_features:
        if isinstance(sample, pd.DataFrame):
            original_val = sample[feat].values[0]
        else:
            feat_idx = feature_names.index(feat)
            original_val = sample[0, feat_idx]

        for multiplier in [0.5, 1.5, 2.0, 0.25, 3.0]:
            modified = sample.copy()
            new_val = original_val * multiplier

            if isinstance(modified, pd.DataFrame):
                modified[feat] = new_val
            else:
                modified[0, feat_idx] = new_val

            new_pred = model.predict(modified)[0]
            if new_pred != original_pred:
                new_class = label_encoder.classes_[new_pred]
                counterfactuals.append({
                    "feature": feat,
                    "original_value": round(original_val, 2),
                    "new_value": round(new_val, 2),
                    "change": f"{(multiplier - 1) * 100:+.0f}%",
                    "original_recommendation": original_class,
                    "new_recommendation": new_class,
                })
                break

    if counterfactuals:
        for cf in counterfactuals[:n_changes]:
            print(f"\n    If '{cf['feature']}' changed from {cf['original_value']:,.2f} "
                  f"to {cf['new_value']:,.2f} ({cf['change']}):")
            print(f"      Recommendation changes: {cf['original_recommendation']} -> {cf['new_recommendation']}")
    else:
        print("    No simple single-feature counterfactuals found.")

    return counterfactuals


# ============================================================================
# 5. SAVE ARTIFACTS
# ============================================================================

def save_artifacts(ebm, xgb, label_encoder, ordinal_encoder, scaler,
                   feature_cols, cat_cols, num_cols, metrics):
    """Save all model and preprocessing artifacts."""
    print("\n" + "=" * 60)
    print("SAVING ARTIFACTS")
    print("=" * 60)

    joblib.dump(ebm, MODELS_DIR / "ebm_model.pkl")
    print(f"  Saved: {MODELS_DIR / 'ebm_model.pkl'}")

    joblib.dump(xgb, MODELS_DIR / "xgb_model.pkl")
    print(f"  Saved: {MODELS_DIR / 'xgb_model.pkl'}")

    joblib.dump(label_encoder, MODELS_DIR / "label_encoder.pkl")
    joblib.dump(ordinal_encoder, MODELS_DIR / "ordinal_encoder.pkl")
    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")
    print(f"  Saved: preprocessors (label_encoder, ordinal_encoder, scaler)")

    metadata = {
        "feature_columns": feature_cols,
        "categorical_columns": cat_cols,
        "numerical_columns": num_cols,
        "target_classes": list(label_encoder.classes_),
        "n_features": len(feature_cols),
        "n_classes": len(label_encoder.classes_),
        "metrics": {k: v for k, v in metrics.items() if k != "confusion_matrix"},
    }
    with open(MODELS_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2, default=str)
    print(f"  Saved: {MODELS_DIR / 'model_metadata.json'}")


# ============================================================================
# MAIN PIPELINE
# ============================================================================

def main():
    print("=" * 65)
    print(" PHILIPPINE FINTECH RECOMMENDATION - MODEL TRAINING PIPELINE")
    print("=" * 65)

    # ── Load & Engineer ─────────────────────────────────────────────
    df = load_data(DATA_PATH)
    df = engineer_features(df)

    # ── Prepare datasets ────────────────────────────────────────────
    (X_ebm, X_xgb, y, label_encoder,
     ordinal_encoder, scaler, cat_cols, num_cols, feature_cols) = prepare_datasets(df)

    all_feature_cols = list(X_ebm.columns)
    num_classes = len(label_encoder.classes_)

    # ── Train/test split (stratified) ───────────────────────────────
    (X_ebm_train, X_ebm_test,
     X_xgb_train, X_xgb_test,
     y_train, y_test) = train_test_split(
        X_ebm, X_xgb, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTrain size: {len(y_train)} | Test size: {len(y_test)}")

    # ── Train models ────────────────────────────────────────────────
    ebm = train_ebm(X_ebm_train, y_train, all_feature_cols, cat_cols)
    xgb = train_xgboost(X_xgb_train, y_train, num_classes)

    # ── Evaluate ────────────────────────────────────────────────────
    X_ebm_test_cat = _cast_categories(X_ebm_test, cat_cols)
    ebm_metrics = evaluate_model(ebm, X_ebm_test_cat, y_test, label_encoder, "EBM")
    xgb_metrics = evaluate_model(xgb, X_xgb_test, y_test, label_encoder, "XGBoost")

    # ── Cross-validation ────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("CROSS-VALIDATION")
    print("=" * 60)
    cross_validate(xgb, X_xgb, y, "XGBoost", cv=5)

    # ── SHAP (XGBoost) ─────────────────────────────────────────────
    explain_with_shap(xgb, X_xgb_test, all_feature_cols, label_encoder)

    # ── LIME (XGBoost) ─────────────────────────────────────────────
    cat_indices = [all_feature_cols.index(c) for c in cat_cols if c in all_feature_cols]
    explain_with_lime(
        xgb,
        X_xgb_train.values if isinstance(X_xgb_train, pd.DataFrame) else X_xgb_train,
        X_xgb_test.values if isinstance(X_xgb_test, pd.DataFrame) else X_xgb_test,
        all_feature_cols, label_encoder, cat_indices,
    )

    # ── Counterfactuals (EBM) ──────────────────────────────────────
    generate_counterfactuals(ebm, X_ebm_test_cat, all_feature_cols, label_encoder, cat_cols)

    # ── Save everything ─────────────────────────────────────────────
    all_metrics = {
        "ebm": ebm_metrics,
        "xgboost": xgb_metrics,
    }
    save_artifacts(
        ebm, xgb, label_encoder, ordinal_encoder, scaler,
        all_feature_cols, cat_cols, num_cols, all_metrics,
    )

    # ── Summary comparison ──────────────────────────────────────────
    print("\n" + "=" * 60)
    print("MODEL COMPARISON SUMMARY")
    print("=" * 60)
    print(f"\n  {'Metric':<15} {'EBM':>10} {'XGBoost':>10}")
    print(f"  {'-'*35}")
    for metric in ["accuracy", "precision", "recall", "f1"]:
        e = ebm_metrics[metric]
        x = xgb_metrics[metric]
        winner = " <-" if e >= x else ""
        winner_x = " <-" if x > e else ""
        print(f"  {metric:<15} {e:>9.4f}{winner} {x:>9.4f}{winner_x}")

    if ebm_metrics.get("auc_roc") and xgb_metrics.get("auc_roc"):
        e = ebm_metrics["auc_roc"]
        x = xgb_metrics["auc_roc"]
        winner = " <-" if e >= x else ""
        winner_x = " <-" if x > e else ""
        print(f"  {'AUC-ROC':<15} {e:>9.4f}{winner} {x:>9.4f}{winner_x}")

    print("\n  <- = better\n")
    print("Pipeline complete! All artifacts saved to:", MODELS_DIR)


if __name__ == "__main__":
    main()
