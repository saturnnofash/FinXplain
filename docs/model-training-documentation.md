# FinXplain: Model Training and Explainability Documentation

| Field       | Detail                                              |
|-------------|-----------------------------------------------------|
| **Title**   | Model Training, Evaluation, and Explainability Documentation |
| **Author**  | System Generated                                    |
| **Date**    | April 2025                                          |
| **Version** | 1.0                                                 |
| **Project** | FinXplain — Philippine Fintech AI Recommender System |

---

## Table of Contents

1. [Overview of the ML Pipeline](#1-overview-of-the-ml-pipeline)
2. [Explainable Boosting Machine (EBM)](#2-explainable-boosting-machine-ebm)
3. [XGBoost (Benchmark Model)](#3-xgboost-benchmark-model)
4. [EBM vs XGBoost Comparison](#4-ebm-vs-xgboost-comparison)
5. [Evaluation Metrics](#5-evaluation-metrics)
6. [SHAP Explanations](#6-shap-explanations)
7. [LIME Explanations](#7-lime-explanations)
8. [Counterfactual Explanations](#8-counterfactual-explanations)
9. [Training Data and Testing Data Split](#9-training-data-and-testing-data-split)
10. [References](#10-references)

---

## 1. Overview of the ML Pipeline

### 1.1 Pipeline Architecture

The FinXplain machine learning pipeline follows a structured, reproducible workflow that transforms preprocessed survey-derived data into a deployable product recommendation model. The pipeline is implemented in `notebooks/train_ebm.py` (production) and `notebooks/train_model.py` (benchmark analysis), and proceeds through the following stages:

1. **Data Loading** — Ingest the cleaned dataset (`data/clean_data.csv`) produced by an upstream preprocessing script.
2. **Type Restoration** — Re-cast five columns (`employment_status`, `location_type`, `savings_goal`, `risk_tolerance`, `investment_horizon`) to the pandas `category` dtype, ensuring that the training algorithm and downstream serialization treat them as categorical rather than free-text features.
3. **Target Encoding** — Apply `sklearn.preprocessing.LabelEncoder` to transform the string-valued target column (`recommended_product`) into contiguous integer labels suitable for multiclass classification.
4. **Feature–Target Separation** — Split the DataFrame into a feature matrix **X** (17 columns) and a target vector **y** (8 classes).
5. **Train / Test Split** — Partition the data with `train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)`, yielding 4,000 training and 1,000 test observations.
6. **Model Training** — Fit the Explainable Boosting Classifier on the training partition.
7. **Evaluation** — Compute accuracy, weighted precision, weighted recall, weighted F1-score, and weighted one-vs-rest AUC-ROC on the held-out test set. Generate a full classification report and confusion matrix.
8. **Cross-Validation** — Run 5-fold stratified cross-validation on the entire dataset to assess generalization stability.
9. **Artifact Serialization** — Persist the trained model (`ebm_model.pkl`), the label encoder (`label_encoder.pkl`), and a metadata record (`model_metadata.json`) via `joblib`.

### 1.2 Feature Engineering

The feature set comprises 13 input features captured from user profiles and 4 derived features computed during preprocessing (`preprocess.py`):

| # | Feature | Type | Source |
|---|---------|------|--------|
| 1 | `age` | Numerical | Input |
| 2 | `monthly_income` | Numerical | Input |
| 3 | `monthly_expenses` | Numerical | Input |
| 4 | `existing_savings` | Numerical | Input |
| 5 | `employment_status` | Categorical | Input |
| 6 | `num_dependents` | Numerical | Input |
| 7 | `location_type` | Categorical | Input |
| 8 | `digital_savviness` | Numerical | Input |
| 9 | `has_bank_account` | Numerical (binary) | Input |
| 10 | `has_ewallet` | Numerical (binary) | Input |
| 11 | `savings_goal` | Categorical | Input |
| 12 | `risk_tolerance` | Categorical | Input |
| 13 | `investment_horizon` | Categorical | Input |
| 14 | `disposable_income` | Numerical | Derived: `monthly_income − monthly_expenses` |
| 15 | `expense_ratio` | Numerical | Derived: `monthly_expenses / (monthly_income + 1)` |
| 16 | `savings_to_income_ratio` | Numerical | Derived: `existing_savings / (monthly_income + 1)` |
| 17 | `income_per_dependent` | Numerical | Derived: `monthly_income / (num_dependents + 1)` |

The denominator offset of +1 in the three ratio features guards against division-by-zero. These derived features encode domain-relevant financial relationships—disposable income, expense burden, savings buffer, and per-dependent earning capacity—that improve the model's capacity to discriminate among the eight product classes (Géron, 2019).

### 1.3 Target Classes

The system recommends one of eight Philippine savings and investment products:

| Label | Product |
|-------|---------|
| 0 | BPI Save-Up |
| 1 | BPI Savings |
| 2 | BPI Time Deposit |
| 3 | GCash GInvest |
| 4 | GCash GSave |
| 5 | Maya Personal Goals |
| 6 | Maya Savings |
| 7 | Maya Time Deposit |

### 1.4 Preprocessing Differences Between Models

An important distinction exists in how the two models consume features:

- **EBM** handles raw categorical and numerical features natively. No feature scaling or one-hot encoding is required because the algorithm builds univariate shape functions on each feature independently (Nori et al., 2019).
- **XGBoost** requires explicit preprocessing: `OrdinalEncoder` for the five categorical columns and `StandardScaler` for the twelve numerical columns. These transformations are applied within the benchmark script (`train_model.py`) only and are not part of the production pipeline (Pedregosa et al., 2011).

---

## 2. Explainable Boosting Machine (EBM)

### 2.1 Library and Implementation

The production model is trained with InterpretML's `ExplainableBoostingClassifier`:

```python
from interpret.glassbox import ExplainableBoostingClassifier

ebm = ExplainableBoostingClassifier(
    feature_names=feature_names,   # list of 17 feature column names
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
```

### 2.2 Hyperparameter Documentation

| Hyperparameter | Value | Meaning |
|----------------|-------|---------|
| `feature_names` | 17 column names | Explicit feature identity; ensures interpretability artifacts reference human-readable labels. |
| `max_bins` | 256 | Maximum number of bins for discretizing continuous features into histogram buckets. A higher value increases resolution of learned shape functions at the cost of training time. |
| `interactions` | 10 | Number of pairwise interaction terms the model is allowed to learn. Interaction detection is performed automatically; the top 10 pairs are retained. |
| `outer_bags` | 8 | Number of outer bagging iterations. Each outer bag trains on a bootstrap sample of the data, and predictions are averaged, reducing variance. |
| `inner_bags` | 0 | Number of inner bagging iterations within each outer bag. Set to 0 to disable inner bagging, reducing training time while relying on outer bags for regularization. |
| `learning_rate` | 0.01 | Step size for each boosting round. A small learning rate combined with a large `max_rounds` allows fine-grained shape function estimation. |
| `max_rounds` | 5000 | Maximum number of boosting iterations per feature per outer bag. Acts as the primary capacity control; early stopping within the library may halt earlier. |
| `min_samples_leaf` | 2 | Minimum number of samples in each leaf of the constituent boosting trees. Prevents overfitting to individual observations. |
| `random_state` | 42 | Seed for reproducibility across bagging, interaction detection, and internal randomization. |

### 2.3 Algorithmic Foundation

The Explainable Boosting Machine is an implementation of the Generalized Additive Model with pairwise interactions (GA²M), introduced by Lou et al. (2013) as an extension of the classical GAM framework. The model takes the following form:

> **g(E[y]) = β₀ + Σ fⱼ(xⱼ) + Σ fᵢⱼ(xᵢ, xⱼ)**

where *g* is the link function (softmax for multiclass), *fⱼ* are learned univariate shape functions, and *fᵢⱼ* are learned bivariate interaction functions. Each shape function is estimated via a cyclic gradient-boosting procedure: in each round the algorithm visits features one at a time, fitting a small tree to the residual and adding its contribution to that feature's shape function. This round-robin approach prevents any single feature from dominating early training and yields smooth, interpretable per-feature contributions (Lou et al., 2012).

Key properties that classify EBM as a **glass-box** model (Nori et al., 2019):

1. **Decomposability** — The prediction is an additive sum of individually inspectable shape functions, enabling exact attribution of each feature's contribution to any single prediction.
2. **Visualizability** — Each *fⱼ* can be plotted as a one-dimensional graph (feature value → contribution), making model behavior transparent to non-technical stakeholders.
3. **Pairwise Interaction Detection** — The algorithm uses the FAST algorithm to rank all \(\binom{p}{2}\) candidate pairs and retains only the top-*k* interactions, balancing expressiveness with parsimony.
4. **Bagging for Stability** — Outer bagging reduces variance without sacrificing interpretability; the averaged shape functions remain additive.

### 2.4 Suitability for Financial Recommendations

The choice of EBM for FinXplain is motivated by several considerations specific to the financial technology domain:

- **Regulatory Transparency** — The Philippine Data Privacy Act (Republic Act No. 10173) establishes the right of data subjects to be informed of the logic involved in automated decision-making that significantly affects them (National Privacy Commission, 2012). A glass-box model whose contributions can be decomposed feature-by-feature satisfies this requirement more directly than post-hoc explanation methods applied to opaque models (Arrieta et al., 2020).
- **Auditability** — Financial regulators and compliance officers can inspect shape functions to verify that the model does not encode prohibited bases for discrimination (e.g., geography serving as a proxy for socioeconomic status).
- **Trust Calibration** — Research on human-AI decision-making shows that inherently interpretable models engender more calibrated trust compared to black-box models with post-hoc explanations, because users can verify the reasoning chain rather than relying on a separate approximation (Caruana et al., 2015).
- **Performance Competitiveness** — EBMs have been demonstrated to achieve accuracy comparable to gradient-boosted ensembles on tabular data while retaining full interpretability (Nori et al., 2019).

---

## 3. XGBoost (Benchmark Model)

### 3.1 Role and Scope

> **Important:** XGBoost serves exclusively as a benchmark for comparative analysis. It is trained in `notebooks/train_model.py` but is **not** deployed in the production API. The production system uses only the EBM model.

### 3.2 Library and Implementation

```python
from xgboost import XGBClassifier

xgb_model = XGBClassifier(
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
    num_class=8,
    eval_metric="mlogloss",
    random_state=42,
    use_label_encoder=False,
)
xgb_model.fit(X_train_processed, y_train)
```

### 3.3 Preprocessing Pipeline

Unlike EBM, XGBoost requires explicit feature transformation:

- **Categorical Features** — `OrdinalEncoder` maps the five categorical columns to integer codes.
- **Numerical Features** — `StandardScaler` centers and scales the twelve numerical columns to zero mean and unit variance.

These transformations are applied within the benchmark script and are not shared with the production pipeline.

### 3.4 Hyperparameter Documentation

| Hyperparameter | Value | Meaning |
|----------------|-------|---------|
| `n_estimators` | 300 | Number of boosting rounds (trees). |
| `max_depth` | 6 | Maximum depth of each constituent tree. Controls model complexity. |
| `learning_rate` | 0.1 | Shrinkage factor applied to each tree's contribution. |
| `subsample` | 0.8 | Fraction of training instances sampled per tree (row subsampling). Reduces variance. |
| `colsample_bytree` | 0.8 | Fraction of features sampled per tree (column subsampling). Acts as regularization. |
| `min_child_weight` | 3 | Minimum sum of instance weight in a child node. Prevents overfitting to rare patterns. |
| `gamma` | 0.1 | Minimum loss reduction required to make a further partition. Prunes low-gain splits. |
| `reg_alpha` | 0.1 | L1 regularization term on weights. Encourages sparsity. |
| `reg_lambda` | 1.0 | L2 regularization term on weights. Penalizes large leaf values. |
| `objective` | `multi:softprob` | Multiclass classification with softmax probability output. |
| `num_class` | 8 | Number of target classes. |
| `eval_metric` | `mlogloss` | Multiclass log loss, used for early-stopping evaluation. |
| `random_state` | 42 | Seed for reproducibility. |
| `use_label_encoder` | `False` | Disables XGBoost's deprecated internal label encoder. |

### 3.5 Algorithmic Foundation

XGBoost (eXtreme Gradient Boosting) implements a scalable, regularized variant of gradient tree boosting (Chen & Guestrin, 2016). The algorithm minimizes a regularized objective:

> **L(φ) = Σ l(yᵢ, ŷᵢ) + Σ Ω(fₖ)**

where *l* is a differentiable loss function (multiclass log-loss in this case) and *Ω(f) = γT + ½λ‖w‖²* penalizes tree complexity via the number of leaves (*T*) and the magnitude of leaf weights (*w*). Trees are added sequentially, each fitting the negative gradient of the loss with respect to the current ensemble's predictions (Friedman, 2001).

Key algorithmic features:

- **Second-Order Approximation** — XGBoost uses a second-order Taylor expansion of the loss function to find optimal split points and leaf weights, yielding faster convergence than first-order methods.
- **Column and Row Subsampling** — Stochastic sampling of features and instances per tree reduces correlation among trees and improves generalization.
- **Regularization** — The combined L1 (`reg_alpha`) and L2 (`reg_lambda`) penalties, along with `gamma` pruning, control model complexity directly in the objective function.

### 3.6 Black-Box Nature

Despite its strong predictive performance on tabular data, XGBoost is classified as a **black-box** model for the following reasons:

1. **Non-Additive Structure** — The prediction is the sum of 300 trees, each of depth up to 6, yielding up to 300 × 2⁶ = 19,200 leaf nodes. No single tree or feature contribution can be meaningfully inspected in isolation.
2. **Feature Interaction Entanglement** — Trees encode arbitrary higher-order interactions via their branching structure, making it impossible to attribute a prediction to individual features without resorting to post-hoc methods such as SHAP.
3. **Opaque Decision Boundaries** — The ensemble's decision surface is a piecewise-constant function over the joint feature space, which cannot be visualized or summarized concisely for non-technical stakeholders.

These properties motivate the project's choice of EBM for production deployment, reserving XGBoost as a performance benchmark against which the interpretability–accuracy trade-off can be assessed.

---

## 4. EBM vs XGBoost Comparison

### 4.1 Comparative Summary

| Dimension | EBM (Production) | XGBoost (Benchmark) |
|-----------|-------------------|---------------------|
| **Model Type** | Generalized Additive Model (GA²M) | Gradient-Boosted Decision Tree Ensemble |
| **Interpretability** | Glass-box; additive shape functions per feature | Black-box; requires post-hoc explanation (SHAP/LIME) |
| **Training Speed** | Slower (cyclic round-robin over features, 5000 max rounds) | Faster (parallel tree construction, 300 estimators) |
| **Accuracy** | 0.654 | *Not persisted in metadata — requires re-running `train_model.py`* |
| **Weighted F1-Score** | 0.6088 | *Not persisted in metadata — requires re-running `train_model.py`* |
| **Weighted AUC-ROC** | 0.9114 | *Not persisted in metadata — requires re-running `train_model.py`* |
| **Feature Interactions** | Explicit pairwise (10 interaction terms) | Implicit arbitrary-order (via tree depth) |
| **Overfitting Control** | Outer bagging, min_samples_leaf, low learning rate | L1/L2 regularization, gamma pruning, subsampling |
| **Preprocessing** | None required (native categorical/numerical handling) | OrdinalEncoder + StandardScaler |
| **Production Role** | Deployed in API | Not deployed; analysis only |

### 4.2 Interpretability–Accuracy Trade-Off

A central argument in the responsible AI literature is that the perceived trade-off between interpretability and accuracy is frequently overstated, particularly for tabular datasets. Rudin (2019) argues that practitioners should prefer inherently interpretable models over post-hoc explanations of black-box models, because:

1. Post-hoc explanations are themselves approximations and can be unfaithful to the model's true decision process.
2. For structured, tabular data—as opposed to images or text—glass-box models such as GAMs often achieve performance within a small margin of black-box ensembles.
3. In high-stakes domains (healthcare, finance, criminal justice), the cost of an opaque error substantially exceeds the marginal accuracy gain from a black-box model.

The FinXplain results are consistent with this position. The EBM achieves an AUC-ROC of 0.9114, indicating strong discriminative ability across the eight product classes, while providing fully decomposable per-feature explanations that satisfy regulatory and user-trust requirements. The modest accuracy of 0.654 in an 8-class problem (where random baseline would be 0.125) reflects the inherent difficulty of fine-grained product differentiation from survey-derived features, rather than a limitation of the model family.

### 4.3 Note on XGBoost Metrics

XGBoost evaluation metrics (accuracy, precision, recall, F1, AUC-ROC) were computed and printed to console during the execution of `train_model.py` but were **not persisted** to `model_metadata.json`. To obtain these values for direct numerical comparison, the benchmark script would need to be re-executed and its output captured. This documentation therefore reports XGBoost metrics as unavailable in the current artifact set.

---

## 5. Evaluation Metrics

This section documents the five evaluation metrics used to assess model performance. All metrics are computed on the held-out test set (n = 1,000) using scikit-learn implementations (Pedregosa et al., 2011).

### 5.1 Accuracy

**A. Formula**

\[
\text{Accuracy} = \frac{\text{Number of Correct Predictions}}{\text{Total Number of Predictions}} = \frac{1}{N}\sum_{i=1}^{N} \mathbf{1}(\hat{y}_i = y_i)
\]

**B. Implementation**

```python
from sklearn.metrics import accuracy_score
accuracy = accuracy_score(y_test, y_pred)
```

**C. Appropriateness for Multiclass**

Accuracy provides a single, intuitive summary of overall correctness across all eight classes. However, it can be misleading when class distributions are imbalanced, as it weights all classes equally regardless of their prevalence. In this study, stratified splitting mitigates severe imbalance, making accuracy a reasonable top-level indicator.

**D. Plain Language Interpretation**

Accuracy answers: "Of all recommendations the model made, what fraction were correct?"

**E. EBM Value: 0.654**

The model correctly recommends the appropriate financial product for 65.4% of test-set users—approximately 5.2× the performance of a random baseline (12.5% for 8 equiprobable classes).

---

### 5.2 Precision (Weighted)

**A. Formula**

\[
\text{Precision}_{\text{weighted}} = \sum_{c=1}^{C} \frac{n_c}{N} \cdot \frac{TP_c}{TP_c + FP_c}
\]

where \(n_c\) is the number of true instances of class \(c\), \(N\) is the total number of instances, \(TP_c\) is true positives for class \(c\), and \(FP_c\) is false positives for class \(c\).

**B. Implementation**

```python
from sklearn.metrics import precision_score
precision = precision_score(y_test, y_pred, average='weighted')
```

**C. Appropriateness for Multiclass**

Weighted averaging accounts for class prevalence, ensuring that precision for larger classes contributes proportionally more to the aggregate. This is preferable to macro averaging when class sizes differ, as it reflects the metric's expected value over a randomly drawn test instance (Sokolova & Lapalme, 2009).

**D. Plain Language Interpretation**

Precision answers: "When the model recommends a particular product, how often is that recommendation correct?" Weighted precision considers each class's share of the test set.

**E. EBM Value: 0.6298**

Across all product classes (weighted by class frequency), 63.0% of the model's recommendations for any given product are correct.

---

### 5.3 Recall (Weighted)

**A. Formula**

\[
\text{Recall}_{\text{weighted}} = \sum_{c=1}^{C} \frac{n_c}{N} \cdot \frac{TP_c}{TP_c + FN_c}
\]

**B. Implementation**

```python
from sklearn.metrics import recall_score
recall = recall_score(y_test, y_pred, average='weighted')
```

**C. Appropriateness for Multiclass**

Weighted recall measures the model's sensitivity to each class, aggregated by prevalence. It captures the model's ability to identify all users who should receive a given product, which is critical in a recommendation context where missing the correct product erodes user trust (Powers, 2011).

**D. Plain Language Interpretation**

Recall answers: "Of all users who should have received a particular product recommendation, how many did the model correctly identify?"

**E. EBM Value: 0.654**

The model successfully identifies 65.4% of users for their correct product (weighted across classes). Note that weighted recall equals accuracy when every instance receives exactly one predicted label.

---

### 5.4 F1-Score (Weighted)

**A. Formula**

\[
F_{1,\text{weighted}} = \sum_{c=1}^{C} \frac{n_c}{N} \cdot \frac{2 \cdot \text{Precision}_c \cdot \text{Recall}_c}{\text{Precision}_c + \text{Recall}_c}
\]

**B. Implementation**

```python
from sklearn.metrics import f1_score
f1 = f1_score(y_test, y_pred, average='weighted')
```

**C. Appropriateness for Multiclass**

The F1-score is the harmonic mean of precision and recall, penalizing models that sacrifice one for the other. In a product recommendation setting, both false positives (recommending the wrong product) and false negatives (failing to recommend the right product) carry costs, making the F1-score a balanced performance indicator (Sokolova & Lapalme, 2009).

**D. Plain Language Interpretation**

F1 answers: "How well does the model balance the correctness of its recommendations (precision) with its ability to find all appropriate users for each product (recall)?"

**E. EBM Value: 0.6088**

The weighted F1-score of 0.6088 is slightly below accuracy (0.654), indicating that precision and recall are not perfectly balanced across all classes—some products are predicted more precisely than others.

---

### 5.5 AUC-ROC (Weighted, One-vs-Rest)

**A. Formula**

For each class \(c\), the ROC curve plots True Positive Rate vs. False Positive Rate at varying classification thresholds. AUC is the area under this curve:

\[
\text{AUC-ROC}_{\text{weighted}} = \sum_{c=1}^{C} \frac{n_c}{N} \cdot \text{AUC}_c
\]

where each \(\text{AUC}_c\) is computed via the one-vs-rest (OvR) strategy.

**B. Implementation**

```python
from sklearn.metrics import roc_auc_score
auc = roc_auc_score(y_test, y_prob, multi_class='ovr', average='weighted')
```

**C. Appropriateness for Multiclass**

AUC-ROC evaluates the model's ability to rank the correct class higher than incorrect alternatives across all possible decision thresholds. Unlike accuracy, it is threshold-invariant and reflects discriminative power independent of the decision boundary. The one-vs-rest strategy decomposes the multiclass problem into eight binary classification tasks, each measuring how well the model separates one product from the remaining seven (Fawcett, 2006).

**D. Plain Language Interpretation**

AUC-ROC answers: "If we randomly pick one user who should receive product A and one who should not, what is the probability that the model assigns a higher score to the correct user?"

**E. EBM Value: 0.9114**

An AUC-ROC of 0.9114 indicates excellent discriminative ability—the model's predicted probabilities strongly separate the correct product from alternatives, even when the hard classification (argmax) is not always correct. This high AUC relative to the moderate accuracy (0.654) suggests that the model's probability rankings are well-calibrated, and that many "incorrect" predictions involve assigning high probability to closely related products.

---

## 6. SHAP Explanations

### 6.1 Role Clarification

> **Critical Distinction:**
> - **(a) Analysis/Research:** SHAP is used in `train_model.py` for offline analysis of the XGBoost benchmark model. It is employed to validate feature importance rankings and to provide research-level understanding of the black-box model's behavior.
> - **(b) Production API:** The production API (`explainability.py`) does **not** use SHAP. Instead, it relies on EBM's native `explain_local()` method, which provides exact additive feature contributions without requiring any post-hoc approximation library.

### 6.2 Implementation in `train_model.py`

```python
import shap

explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test[:100])
```

The implementation applies `TreeExplainer` to the XGBoost model on the first 100 test samples. The resulting SHAP values have shape `(n_samples, n_features, n_classes)` for multiclass problems; the script normalizes this output to extract per-class feature attributions. For each class, mean absolute SHAP values are computed across the 100 samples, and the top 5 features are printed.

### 6.3 Theoretical Foundation

SHAP (SHapley Additive exPlanations) unifies several existing feature attribution methods under a single framework grounded in cooperative game theory (Lundberg & Lee, 2017). The core concept derives from Shapley values (Shapley, 1953), which allocate the "payout" of a cooperative game (here, the model's prediction) among the "players" (features) according to their marginal contributions across all possible coalitions.

For a model *f* and input *x*, the SHAP value of feature *j* is:

> **φⱼ(f, x) = Σ_{S⊆N\{j}} [ |S|!(|N|-|S|-1)! / |N|! ] · [ f(S ∪ {j}) − f(S) ]**

where *N* is the full feature set and *S* ranges over all subsets excluding *j*. This formulation satisfies three desirable axiomatic properties (Lundberg & Lee, 2017):

1. **Local Accuracy (Efficiency)** — The sum of all SHAP values plus the expected prediction equals the model's output for the given instance.
2. **Missingness** — Features that are absent from the model receive zero attribution.
3. **Consistency** — If a model changes such that a feature's marginal contribution increases (or remains the same) across all coalitions, its SHAP value does not decrease.

`TreeExplainer` exploits the tree structure of XGBoost to compute exact SHAP values in polynomial time, avoiding the exponential cost of enumerating all coalitions (Lundberg et al., 2020).

### 6.4 Distinction Between SHAP and EBM Native Explanations

It is important to clarify that SHAP and EBM's native explanations serve different purposes within the project:

| Aspect | SHAP (Analysis) | EBM explain_local() (Production) |
|--------|------------------|-----------------------------------|
| **Model** | XGBoost | EBM |
| **Method** | Post-hoc Shapley value approximation | Exact additive decomposition from glass-box structure |
| **Faithfulness** | Approximation (though exact for trees) | Exact by construction |
| **Runtime** | Not used at inference time | Called per prediction in the API |
| **Purpose** | Research validation of feature importance | User-facing explanation of recommendations |

### 6.5 Contribution to the Study

SHAP analysis of the XGBoost benchmark serves two research objectives:

1. **Cross-Model Validation** — Comparing SHAP-derived feature importances from XGBoost with EBM's native shape-function importances provides evidence that both models attend to similar financial indicators, strengthening confidence in the EBM's learned representations (Molnar, 2022).
2. **Methodological Completeness** — Including SHAP analysis demonstrates awareness of the broader XAI landscape and enables the research to position EBM's native interpretability within the taxonomy of explanation methods.

---

## 7. LIME Explanations

### 7.1 Role Clarification

> **Critical Distinction:**
> - **(a) Analysis/Research:** LIME is used in `train_model.py` for offline analysis of the XGBoost benchmark model. It generates local explanations for individual predictions to complement the global perspective provided by SHAP.
> - **(b) Production API:** The production API (`explainability.py`) does **not** use LIME. Human-readable explanations in production are generated by a custom template-based system that converts EBM's native per-feature contributions into plain-English sentences via the `_describe_feature()` function.

### 7.2 Implementation in `train_model.py`

```python
from lime.lime_tabular import LimeTabularExplainer

lime_explainer = LimeTabularExplainer(
    training_data=X_train,
    feature_names=feature_names,
    class_names=class_names,
    categorical_features=cat_indices,
    mode='classification',
    random_state=42,
)

explanation = lime_explainer.explain_instance(
    X_test[i],
    xgb_model.predict_proba,
    num_features=10,
    top_labels=3,
)
```

The configuration specifies `num_features=10` (number of features in the local explanation) and `top_labels=3` (number of top-predicted classes to explain). The explainer is initialized with the full training data to establish the perturbation distribution, and categorical feature indices are provided to ensure semantically meaningful perturbations for discrete variables.

### 7.3 Theoretical Foundation

LIME (Local Interpretable Model-agnostic Explanations) explains individual predictions by constructing a locally faithful linear surrogate model in the neighborhood of the instance being explained (Ribeiro et al., 2016). The procedure operates as follows:

1. **Perturbation Sampling** — Generate a set of perturbed instances *z'* around the instance of interest *x* by randomly modifying feature values according to the training data distribution.
2. **Black-Box Querying** — Obtain the black-box model's predictions for each perturbed instance.
3. **Proximity Weighting** — Weight each perturbed instance by its proximity to *x* using an exponential kernel.
4. **Local Surrogate Fitting** — Fit an interpretable model (typically a sparse linear regression with L1 penalty) to the weighted perturbed data, optimizing:

> **ξ(x) = argmin_{g ∈ G} L(f, g, πₓ) + Ω(g)**

where *L* measures fidelity of the surrogate *g* to the black-box *f* in the locality defined by πₓ, and *Ω(g)* penalizes complexity.

Key theoretical properties and limitations (Garreau & von Luxburg, 2020):

- **Model Agnosticism** — LIME treats the model as a black box, requiring only query access to the prediction function.
- **Locality** — Explanations are faithful only in a neighborhood of the explained instance; they may diverge from global model behavior.
- **Instability** — The random perturbation process introduces variance; different runs may yield different explanations for the same instance.

### 7.4 Production Explanation System

The production API implements human-readable explanations through a fundamentally different mechanism:

- **Source of Contributions:** EBM's `explain_local(df)` provides exact per-feature additive scores for the predicted class.
- **Template-Based Rendering:** The `_describe_feature()` function maps each feature name and value to a plain-English phrase (e.g., `"your monthly income of PHP 35,000"`).
- **Output Structure:**
  - `summary`: A single sentence combining the top 2 supporting features.
  - `top_reasons`: Up to 3 supporting factors as natural-language sentences.
  - `against_reasons`: Up to 2 opposing factors as natural-language sentences.
- **Impact Tiers:** Each factor is categorized by the absolute magnitude of its contribution: |c| ≥ 1.5 → "high", |c| ≥ 0.5 → "medium", otherwise "low".
- **Directionality:** Contributions > 0 are labeled "supports"; contributions ≤ 0 are labeled "opposes."

This approach avoids the instability and computational overhead of perturbation-based methods while providing deterministic, exact explanations grounded in the model's actual learned structure.

### 7.5 Contribution to the Study

LIME analysis of the XGBoost benchmark contributes to the research by:

1. **Local Explanation Validation** — Comparing LIME explanations of XGBoost predictions with EBM's native local explanations allows assessment of whether different explanation methodologies converge on similar reasoning patterns (Molnar, 2022).
2. **Methodological Breadth** — Including LIME alongside SHAP and EBM-native explanations demonstrates a comprehensive treatment of the XAI taxonomy—global vs. local, model-specific vs. model-agnostic, exact vs. approximate.

---

## 8. Counterfactual Explanations

### 8.1 Role and Implementation

> **Important:** The counterfactual system in FinXplain is a **custom implementation** built directly into the production API (`explainability.py`). It does **not** use external libraries such as DiCE (Mothilal et al., 2020) or Alibi. The design employs a perturbation-based search strategy that iterates over controllable features to identify minimal changes that flip the model's recommendation.

### 8.2 Feature Controllability Classification

The counterfactual system categorizes features based on whether a user can reasonably act on them:

| Category | Features | Rationale |
|----------|----------|-----------|
| **Controllable Numerical** | `existing_savings`, `monthly_income`, `monthly_expenses` | Users can feasibly change these financial values through behavior modification. |
| **Controllable Categorical** | `risk_tolerance`, `investment_horizon`, `savings_goal` | Users can adjust their stated preferences. |
| **Fixed (Non-Actionable)** | `age`, `location_type`, `employment_status`, `has_bank_account`, `has_ewallet`, `num_dependents`, `digital_savviness` | These features are either immutable (age) or difficult to change in the short term (employment status, location). |

This distinction ensures that counterfactual suggestions are **actionable**—they describe changes users can actually make, rather than hypothetical scenarios involving immutable attributes (Ustun et al., 2019).

### 8.3 Search Strategy

**Numerical Features:**

For each controllable numerical feature, the system applies a sequence of multiplicative perturbations to the current value:

- **Non-zero values:** Try multipliers `[1.25, 1.5, 2.0, 2.5, 3.0, 0.75, 0.5]` in order.
- **Zero values:** Since multiplication would yield zero, try absolute values `[10000, 25000, 50000, 100000, 200000]` instead.

After each perturbation, the modified feature vector is passed through the EBM model. If the predicted class changes (a "flip"), the counterfactual is recorded and the search moves to the next feature.

**Categorical Features:**

For each controllable categorical feature, the system exhaustively tests every alternative value in the feature's domain. The first alternative that causes a prediction flip is recorded.

**Termination Criteria:**

- At most **one flip per feature** is recorded (first-found).
- At most **3 counterfactuals** are returned to the user.
- The search proceeds feature-by-feature and stops collecting once 3 counterfactuals are found.

### 8.4 Theoretical Foundation

Counterfactual explanations answer the question: "What would need to change for the model to recommend a different product?" They are grounded in the seminal framework of Wachter et al. (2017), who formalized counterfactual explanations as the solution to:

> **argmin_{x'} max_λ ( λ · (f(x') − y')² + d(x, x') )**

where *x'* is the counterfactual instance, *y'* is the desired outcome, and *d(x, x')* is a distance measure capturing the magnitude of change. The key desiderata for counterfactual explanations include:

1. **Proximity** — The counterfactual should be minimally different from the original instance. FinXplain's ordered multiplier sequence (starting from 1.25×) reflects this preference for small changes.
2. **Actionability** — Changes should involve only features the user can control. The fixed/controllable classification directly enforces this constraint (Ustun et al., 2019).
3. **Algorithmic Recourse** — Counterfactuals serve as actionable guidance for users who wish to qualify for a different product, connecting explanation to concrete behavioral change (Karimi et al., 2021).
4. **Diversity** — Presenting multiple counterfactuals across different features gives users alternative paths to achieve a different recommendation. The one-flip-per-feature design ensures diversity across the returned set (Mothilal et al., 2020).

### 8.5 Design Rationale

The custom implementation was chosen over established libraries (e.g., DiCE) for several reasons:

- **EBM Integration** — The perturbation-and-repredict loop interfaces directly with the EBM model, avoiding the overhead of library-specific model wrappers.
- **Domain Constraints** — The fixed/controllable partition and the financial-domain multiplier sequence encode domain knowledge that generic counterfactual libraries do not provide out of the box.
- **Deterministic Output** — Unlike optimization-based methods, the fixed multiplier sequence produces deterministic counterfactuals for the same input, ensuring reproducibility.
- **Computational Efficiency** — The sequential search with early stopping (one flip per feature, max 3 total) keeps inference-time latency low for the production API.

---

## 9. Training Data and Testing Data Split

### 9.1 Split Configuration

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)
```

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Total samples | 5,000 | Full cleaned dataset |
| Training set | 4,000 (80%) | Used for model fitting |
| Test set | 1,000 (20%) | Held out for final evaluation |
| `random_state` | 42 | Ensures reproducibility |
| `stratify` | `y` | Preserves class distribution across splits |

The 80/20 split is a widely accepted default for medium-sized datasets (Géron, 2019). Stratification ensures that each of the 8 product classes is represented proportionally in both partitions, preventing evaluation bias from uneven class distribution.

### 9.2 Cross-Validation

```python
from sklearn.model_selection import StratifiedKFold, cross_val_score

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(ebm, X, y, cv=cv, scoring='accuracy')
```

**Results:**

| Fold | Accuracy |
|------|----------|
| 1 | 0.644 |
| 2 | 0.639 |
| 3 | 0.632 |
| 4 | 0.626 |
| 5 | 0.639 |
| **Mean** | **≈ 0.636** |
| **Std** | **≈ 0.006** |

The low standard deviation (0.006) across folds indicates that the model's performance is stable and not sensitive to the particular partition of the data. The mean cross-validated accuracy (0.636) is close to the test-set accuracy (0.654), suggesting that the single train/test split evaluation is representative (Kohavi, 1995).

### 9.3 Validity Assessment

**Internal Reliability**

The narrow cross-validation spread (σ ≈ 0.006) demonstrates high internal reliability. The model produces consistent performance estimates across different data partitions, indicating that the learned patterns are robust rather than artifacts of a particular split. The concordance between the 5-fold mean (0.636) and the held-out test accuracy (0.654) further supports this finding.

**Construct Validity**

Construct validity concerns whether the model measures what it claims to measure—in this case, whether the 17 features adequately capture the constructs that determine product suitability. The feature set includes direct financial indicators (income, savings, expenses), behavioral proxies (digital savviness, e-wallet/bank account ownership), and stated preferences (risk tolerance, investment horizon, savings goal). The derived features (disposable income, expense ratio, savings-to-income ratio, income per dependent) encode domain-relevant financial constructs that strengthen the model's connection to the underlying recommender task.

**External Validity**

External validity—the degree to which findings generalize beyond the study sample—is constrained by the use of synthetic data. While the synthetic generation process was designed to reflect Philippine financial demographics, the model's performance on real-world user data remains to be validated. The documentation should note this limitation transparently, consistent with best practices for model cards (Mitchell et al., 2019).

**Cross-Validation as Generalization Estimate**

Five-fold stratified cross-validation provides a nearly unbiased estimate of the model's expected accuracy on unseen data drawn from the same distribution (Kohavi, 1995). The stratification ensures that each fold mirrors the overall class distribution, preventing folds with atypical class proportions from skewing the estimate. The use of the full dataset (5,000 samples) for cross-validation, separate from the final train/test evaluation, provides two complementary views of generalization.

### 9.4 Sample Size Considerations

With 5,000 total observations and 8 target classes, the effective sample size per class averages 625 (assuming balanced distribution). Harrell (2015) recommends a minimum of 10–20 events per predictor variable per class for stable multiclass classification. With 17 features and approximately 625 samples per class, the ratio of approximately 37 samples per feature per class satisfies this heuristic, though it is noted that class-specific sample sizes may vary due to natural imbalance.

---

## 10. References

### Machine Learning and Model Training

Chen, T., & Guestrin, C. (2016). XGBoost: A scalable tree boosting system. In *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 785–794). ACM. https://doi.org/10.1145/2939672.2939785

Friedman, J. H. (2001). Greedy function approximation: A gradient boosting machine. *Annals of Statistics*, *29*(5), 1189–1232. https://doi.org/10.1214/aos/1013203451

Géron, A. (2019). *Hands-on machine learning with Scikit-Learn, Keras, and TensorFlow* (2nd ed.). O'Reilly Media.

Kohavi, R. (1995). A study of cross-validation and bootstrap for accuracy estimation and model selection. In *Proceedings of the 14th International Joint Conference on Artificial Intelligence (IJCAI)* (Vol. 2, pp. 1137–1143). Morgan Kaufmann.

Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., Blondel, M., Prettenhofer, P., Weiss, R., Dubourg, V., Vanderplas, J., Passos, A., Cournapeau, D., Brucher, M., Perrot, M., & Duchesnay, É. (2011). Scikit-learn: Machine learning in Python. *Journal of Machine Learning Research*, *12*, 2825–2830.

### Explainability — EBM and GAMs

Caruana, R., Lou, Y., Gehrke, J., Koch, P., Sturm, M., & Elhadad, N. (2015). Intelligible models for healthcare: Predicting pneumonia risk and hospital 30-day readmission. In *Proceedings of the 21st ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 1721–1730). ACM. https://doi.org/10.1145/2783258.2788613

Lou, Y., Caruana, R., & Gehrke, J. (2012). Intelligible models for classification and regression. In *Proceedings of the 18th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 150–158). ACM. https://doi.org/10.1145/2339530.2339556

Lou, Y., Caruana, R., Gehrke, J., & Hooker, G. (2013). Accurate intelligible models with pairwise interactions. In *Proceedings of the 19th ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 623–631). ACM. https://doi.org/10.1145/2487575.2487579

Nori, H., Jenkins, S., Koch, P., & Caruana, R. (2019). InterpretML: A unified framework for machine learning interpretability. *arXiv preprint arXiv:1909.09223*. https://arxiv.org/abs/1909.09223

### Explainability — SHAP

Lundberg, S. M., & Lee, S.-I. (2017). A unified approach to interpreting model predictions. In *Advances in Neural Information Processing Systems 30 (NeurIPS)* (pp. 4765–4774). https://papers.nips.cc/paper/7062-a-unified-approach-to-interpreting-model-predictions

Lundberg, S. M., Erion, G., Chen, H., DeGrave, A., Prutkin, J. M., Nair, B., Katz, R., Himmelfarb, J., Bansal, N., & Lee, S.-I. (2020). From local explanations to global understanding with explainable AI for trees. *Nature Machine Intelligence*, *2*(1), 56–67. https://doi.org/10.1038/s42256-019-0138-9

Shapley, L. S. (1953). A value for n-person games. In H. W. Kuhn & A. W. Tucker (Eds.), *Contributions to the Theory of Games* (Vol. II, pp. 307–317). Princeton University Press.

### Explainability — LIME

Garreau, D., & von Luxburg, U. (2020). Explaining the explainer: A first theoretical analysis of LIME. In *Proceedings of the 23rd International Conference on Artificial Intelligence and Statistics (AISTATS)* (pp. 1287–1296). PMLR.

Ribeiro, M. T., Singh, S., & Guestrin, C. (2016). "Why should I trust you?": Explaining the predictions of any classifier. In *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (pp. 1135–1144). ACM. https://doi.org/10.1145/2939672.2939778

### Explainability — Counterfactuals and Recourse

Karimi, A.-H., Schölkopf, B., & Valera, I. (2021). Algorithmic recourse: From counterfactual explanations to interventions. In *Proceedings of the 2021 ACM Conference on Fairness, Accountability, and Transparency (FAccT)* (pp. 353–362). ACM. https://doi.org/10.1145/3442188.3445899

Mothilal, R. K., Sharma, A., & Tan, C. (2020). Explaining machine learning classifiers through diverse counterfactual explanations. In *Proceedings of the 2020 ACM Conference on Fairness, Accountability, and Transparency (FAT\*)* (pp. 607–617). ACM. https://doi.org/10.1145/3351095.3372850

Ustun, B., Spangher, A., & Liu, Y. (2019). Actionable recourse in linear classification. In *Proceedings of the 2019 ACM Conference on Fairness, Accountability, and Transparency (FAT\*)* (pp. 10–19). ACM. https://doi.org/10.1145/3287560.3287566

Wachter, S., Mittelstadt, B., & Russell, C. (2017). Counterfactual explanations without opening the black box: Automated decisions and the GDPR. *Harvard Journal of Law & Technology*, *31*(2), 841–887.

### Explainability — General

Arrieta, A. B., Díaz-Rodríguez, N., Del Ser, J., Bennetot, A., Tabik, S., Barbado, A., García, S., Gil-López, S., Molina, D., Benjamins, R., Chatila, R., & Herrera, F. (2020). Explainable Artificial Intelligence (XAI): Concepts, taxonomies, opportunities and challenges toward responsible AI. *Information Fusion*, *58*, 82–115. https://doi.org/10.1016/j.inffus.2019.12.012

Molnar, C. (2022). *Interpretable Machine Learning: A Guide for Making Black Box Models Explainable* (2nd ed.). https://christophm.github.io/interpretable-ml-book/

Rudin, C. (2019). Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead. *Nature Machine Intelligence*, *1*(5), 206–215. https://doi.org/10.1038/s42256-019-0048-x

### Evaluation Metrics

Fawcett, T. (2006). An introduction to ROC analysis. *Pattern Recognition Letters*, *27*(8), 861–874. https://doi.org/10.1016/j.patrec.2005.10.010

Powers, D. M. W. (2011). Evaluation: From precision, recall and F-measure to ROC, informedness, markedness and correlation. *Journal of Machine Learning Technologies*, *2*(1), 37–63.

Sokolova, M., & Lapalme, G. (2009). A systematic analysis of performance measures for classification tasks. *Information Processing & Management*, *45*(4), 427–437. https://doi.org/10.1016/j.ipm.2009.03.002

### Financial AI, Responsible AI, and Regulatory Context

Harrell, F. E. (2015). *Regression Modeling Strategies: With Applications to Linear Models, Logistic and Ordinal Regression, and Survival Analysis* (2nd ed.). Springer. https://doi.org/10.1007/978-3-319-19425-7

Mitchell, M., Wu, S., Zaldivar, A., Barnes, P., Vasserman, L., Hutchinson, B., Spitzer, E., Raji, I. D., & Gebru, T. (2019). Model cards for model reporting. In *Proceedings of the Conference on Fairness, Accountability, and Transparency (FAT\*)* (pp. 220–229). ACM. https://doi.org/10.1145/3287560.3287596

National Privacy Commission. (2012). *Republic Act No. 10173 — Data Privacy Act of 2012*. Official Gazette of the Republic of the Philippines. https://www.privacy.gov.ph/data-privacy-act/

### Philippine Financial Context

Bangko Sentral ng Pilipinas. (2021). *Financial Inclusion Survey 2021*. BSP. https://www.bsp.gov.ph/Pages/InclusiveFinance/FIS.aspx

Bangko Sentral ng Pilipinas. (2022). *National Strategy for Financial Inclusion 2022–2028*. BSP. https://www.bsp.gov.ph/Pages/InclusiveFinance/NSFI.aspx

---

*End of Document*
