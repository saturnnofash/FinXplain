---
title: "Synthetic Data Generation and Validation Documentation"
subtitle: "FinXplain: An Explainable AI-Based Philippine Fintech Product Recommender System"
author: "System Generated"
date: "April 2025"
version: "1.0"
project: "FinXplain"
---

# Synthetic Data Generation and Validation Documentation

**FinXplain: An Explainable AI-Based Philippine Fintech Product Recommender System**

---

## Table of Contents

1. [Overview and Rationale](#1-overview-and-rationale)
   - 1.1 [Purpose of Synthetic Data](#11-purpose-of-synthetic-data)
   - 1.2 [Academic Precedent](#12-academic-precedent)
   - 1.3 [Regulatory Context](#13-regulatory-context)
   - 1.4 [Scope and Limitations of This Document](#14-scope-and-limitations-of-this-document)
2. [Data Generation Method](#2-data-generation-method)
   - 2.1 [Technical Environment](#21-technical-environment)
   - 2.2 [Feature Distributions and Parameters](#22-feature-distributions-and-parameters)
   - 2.3 [Conditional Dependency Structure](#23-conditional-dependency-structure)
   - 2.4 [Preprocessing and Derived Features](#24-preprocessing-and-derived-features)
3. [Label Generation Logic](#3-label-generation-logic)
   - 3.1 [Multi-Factor Scoring System](#31-multi-factor-scoring-system)
   - 3.2 [Scoring Dimensions](#32-scoring-dimensions)
   - 3.3 [Platform Preference Modeling](#33-platform-preference-modeling)
   - 3.4 [Stochastic Selection and Noise](#34-stochastic-selection-and-noise)
   - 3.5 [Product Class Definitions](#35-product-class-definitions)
4. [Feature-to-Outcome Relationships](#4-feature-to-outcome-relationships)
   - 4.1 [Input Features](#41-input-features)
   - 4.2 [Derived Features](#42-derived-features)
5. [Data Reliability and Limitations](#5-data-reliability-and-limitations)
   - 5.1 [Internal Validity](#51-internal-validity)
   - 5.2 [Reproducibility](#52-reproducibility)
   - 5.3 [External Validity](#53-external-validity)
   - 5.4 [Known Limitations](#54-known-limitations)
   - 5.5 [Mitigation Strategies](#55-mitigation-strategies)
6. [References](#6-references)

---

## 1. Overview and Rationale

### 1.1 Purpose of Synthetic Data

The FinXplain system employs a synthetic dataset of **n = 5,000 observations** to train and evaluate an Explainable Boosting Machine (EBM) that recommends one of eight Philippine financial products. Synthetic data generation was selected as the primary data strategy for the following reasons:

1. **Data Privacy Compliance.** Real financial consumer data in the Philippines is protected under the Data Privacy Act of 2012 (Republic Act No. 10173), which imposes stringent requirements on the collection, processing, and storage of personal and sensitive personal information. Acquiring a sufficiently large and representative dataset of Filipino consumers' financial profiles, savings behavior, and product holdings would require institutional data-sharing agreements and National Privacy Commission (NPC) approval — processes that exceed the feasibility constraints of this study.

2. **Domain Control.** Synthetic generation permits precise control over marginal and conditional distributions, enabling the researcher to encode known demographic and economic relationships from authoritative Philippine statistical sources into the data-generating process (DGP). This ensures that the training data reflects empirically grounded patterns rather than arbitrary assumptions.

3. **Reproducibility.** A deterministic seed (`np.random.seed(42)`) guarantees that the dataset is fully reproducible, a requirement for academic transparency and peer review.

### 1.2 Academic Precedent

The use of synthetic data in machine learning research is well-established in the literature:

> "Synthetic data generation provides a viable path for developing and testing machine learning models when access to real-world data is constrained by privacy, cost, or availability."
> — Jordon, Szpruch, Houssiau, Sherborne, & van der Schaar (2022)

Jordon et al. (2022) provide a comprehensive survey of synthetic data methodologies, arguing that when the data-generating process faithfully encodes domain knowledge, synthetic data can serve as a valid proxy for model development and evaluation. In the financial domain specifically, Assefa, Dervovic, Mahber, Tillman, Reddy, and Veloso (2020) demonstrate the utility of synthetic financial data for training and benchmarking models where real transactional data is inaccessible due to regulatory constraints.

The present study follows a **parametric simulation** approach rather than a generative adversarial or copula-based method. This choice is deliberate: parametric simulation allows each feature distribution and inter-feature dependency to be explicitly documented and justified against Philippine national statistics, providing a transparent audit trail from source data to synthetic output.

### 1.3 Regulatory Context

The Philippine Data Privacy Act (RA 10173) defines personal information as "any information, whether recorded in a material form or not, from which the identity of an individual is apparent or can be reasonably and directly ascertained" (Section 3(g)). Financial profile data — including income, savings, and product holdings — constitutes sensitive personal information under Section 3(l). The use of synthetic data eliminates the need to process any personal information of real individuals, thereby obviating the consent, notification, and data protection officer requirements that would otherwise apply under Sections 12–16 of the Act.

### 1.4 Scope and Limitations of This Document

This document describes the synthetic data generation pipeline as implemented in `data/generate_synthetic_data.py` and the preprocessing pipeline in `data/preprocess.py`. It does not cover model training, hyperparameter selection, or SHAP explanation generation, which are documented separately.

---

## 2. Data Generation Method

### 2.1 Technical Environment

| Parameter        | Value                                  |
|------------------|----------------------------------------|
| Script           | `data/generate_synthetic_data.py`      |
| Libraries        | `numpy`, `pandas`                      |
| Random Seed      | `42` (via `np.random.seed(42)`)        |
| Sample Size      | n = 5,000                              |
| Output File      | `data/synthetic_filipino_fintech.csv`  |

The preprocessing script (`data/preprocess.py`) performs schema validation, null/duplicate checks, categorical value validation, numerical range validation, derives four additional features, casts categorical columns to the `category` dtype (required by the EBM implementation), and outputs `data/clean_data.csv`.

### 2.2 Feature Distributions and Parameters

The following table documents the exact statistical distribution, parameters, and justification for each of the 13 input features generated in the synthetic dataset.

| # | Feature | Distribution | Parameters | Justification | Source |
|---|---------|-------------|------------|---------------|--------|
| 1 | `age` | Gaussian mixture (4 components), clipped [18, 65] | Component 1 (30%): μ=24, σ=3; Component 2 (30%): μ=30, σ=5; Component 3 (25%): μ=40, σ=7; Component 4 (15%): μ=53, σ=6 | Philippine median age ~25.7 years; the mixture captures the labor force composition from young workers/students through senior professionals. The dominant modes at 24 and 30 reflect the youthful Philippine demographic pyramid. | CIA World Factbook (Philippines); PSA 2020 Census of Population and Housing |
| 2 | `location_type` | Categorical (3 levels) | Metro Manila: 13%, Urban: 45%, Rural: 42% | Metro Manila accounts for ~13% of the national population; total urbanization is ~54% (Urban + Metro Manila). The split between urban and rural outside Metro Manila approximates PSA classification proportions. | PSA 2020 Census of Population and Housing |
| 3 | `employment_status` | Conditional categorical (5 levels), conditioned on `age` and `location_type` | Age ≤ 22: [Emp=0.15, Self=0.05, Free=0.10, Stu=0.60, Unemp=0.10]; Age 23–30: location-dependent (Metro Manila: Emp=0.65; Rural: Self-emp=0.30 elevated); Age 31–45: similar location adjustment; Age 46+: [0.40, 0.25, 0.10, 0.01, 0.24] | Young Filipinos (≤22) are predominantly students; urban centers have higher formal employment rates while rural areas show elevated self-employment and agricultural work. The freelancer category reflects the Philippines' status as a major freelancing hub globally. | PSA Labor Force Survey (2023); Payoneer Global Freelancing Index |
| 4 | `num_dependents` | Conditional categorical, conditioned on `age` | Age <25: P([0,1,2])=[0.70, 0.20, 0.10]; Age 25–34: P([0..4])=[0.20, 0.30, 0.30, 0.15, 0.05]; Age 35–49: P([0..5])=[0.10, 0.15, 0.25, 0.25, 0.15, 0.10]; Age 50+: P([0..4])=[0.25, 0.25, 0.25, 0.15, 0.10] | Philippine average household size is ~4.1 persons (PSA 2020). Younger individuals have fewer dependents; mid-career adults peak due to child-rearing and extended family obligations common in Filipino households. | PSA 2020 Census; Philippine Demographic and Health Survey (2022) |
| 5 | `monthly_income` | Lognormal with employment-based parameters, scaled by age and location multipliers | Base (mean, σ): Student=(5000, 0.5), Unemployed=(3000, 0.8), Freelancer=(20000, 0.6), Self-employed=(22000, 0.7), Employed=(25000, 0.5). Formula: `lognormal(log(base_mean), σ) × age_mult × loc_mult`. Age multipliers: <25→0.70, <35→1.00, <45→1.30, <55→1.40, ≥55→1.20. Location multipliers: Metro Manila→1.40, Urban→1.10, Rural→0.75 | PSA FIES 2023 reports average annual family income of PHP 353,230 (~PHP 29,436/month). Metro Manila incomes are substantially higher than provincial averages. The lognormal distribution captures the well-documented right skew in income distributions. | PSA Family Income and Expenditure Survey (FIES) 2023; Bangko Sentral ng Pilipinas (BSP) |
| 6 | `monthly_expenses` | Income × expense ratio; ratio from Beta distribution | `expense_ratio = clip(Beta(α=5, β=2) × 0.5 + 0.4, 0.40, 0.95) + (num_dependents × 0.03)`, final clip [0.40, 0.98]. `monthly_expenses = monthly_income × expense_ratio` | Filipino households typically spend 60–90% of income on consumption. The Beta(5,2) distribution is left-skewed, concentrating ratios in the upper range. Each dependent adds ~3 percentage points to the expense ratio. | PSA FIES 2023; Browning & Lusardi (1996) |
| 7 | `existing_savings` | Exponential-scaled disposable income with Gaussian noise | `savings_months = clip(Exponential(scale=6), 0, 60)`; `disposable = monthly_income − monthly_expenses`; `savings = clip(disposable × savings_months + N(0, 5000), 0, ∞)` | Most Filipino households have minimal savings buffers; the exponential distribution concentrates savings duration at low values with a long right tail, consistent with BSP Financial Inclusion Survey findings. | BSP Financial Inclusion Survey (2021); Demirgüç-Kunt, Klapper, Singer, Ansar, & Hess (2018) |
| 8 | `digital_savviness` | Conditional ordinal (1–5 scale), conditioned on `age` and `location_type` | Age <30: [0.02, 0.08, 0.20, 0.40, 0.30]; Age 30–39: [0.05, 0.10, 0.30, 0.35, 0.20]; Age 40–49: [0.10, 0.20, 0.35, 0.25, 0.10]; Age 50+: [0.20, 0.30, 0.30, 0.15, 0.05]. Metro Manila adjusts upward; Rural adjusts downward. | Younger Filipinos demonstrate higher digital literacy and smartphone adoption. The urban-rural digital divide in the Philippines is well-documented; Metro Manila has significantly higher internet penetration than provincial areas. | We Are Social & Hootsuite Digital 2023 (Philippines); BSP Financial Inclusion Survey (2021) |
| 9 | `has_bank_account` | Conditional Bernoulli, conditioned on `employment_status`, `location_type`, `monthly_income` | Base probability: 0.56. Adjustments: Employed +0.15, Student −0.20, Unemployed −0.25; Metro Manila +0.10, Rural −0.15; Income >50K +0.15, Income <15K −0.10. Final clip [0.10, 0.95]. | BSP reports ~56% bank account ownership nationally. Formal employment, urban residence, and higher income are strongly associated with bank account possession in developing economies. | BSP Financial Inclusion Survey (2021); Demirgüç-Kunt et al. (2018) Global Findex Database |
| 10 | `has_ewallet` | Conditional Bernoulli, conditioned on `age`, `location_type`, `digital_savviness` | Base probability: 0.55. Adjustments: Age <30 +0.20, Age >50 −0.15; location adjustments; digital_savviness ±0.08 per unit from 3. Final clip [0.10, 0.95]. | BSP reports >50% e-wallet adoption post-pandemic. Adoption is strongly age-dependent and correlates with digital literacy. | BSP Financial Inclusion Survey (2021); We Are Social Digital 2023 (Philippines) |
| 11 | `savings_goal` | Conditional categorical (7 levels), conditioned on `age` and `employment_status` | Five profiles (student, young, mid-career, mature, senior) mapping to seven goals: Emergency Fund, Education, Retirement, Travel, Home/Property, General Savings, Business Capital. Probabilities shift across life stages (e.g., students favor Education; mid-career favors Home/Property and Retirement). | Savings goals follow predictable life-cycle patterns consistent with the Life-Cycle Hypothesis (Modigliani & Brumberg, 1954). Filipino-specific priorities reflect cultural norms around family obligations and homeownership. | Modigliani & Brumberg (1954); BSP Consumer Expectations Survey |
| 12 | `risk_tolerance` | Conditional categorical (3 levels: Conservative, Moderate, Aggressive), conditioned on `age`, `monthly_income`, `num_dependents` | Young high-income: [Con=0.20, Mod=0.40, Agg=0.40]; Young low-income: [0.30, 0.45, 0.25]; Mid-career high-income: [0.25, 0.45, 0.30]; Mid-career low-income: [0.35, 0.45, 0.20]; Older: [0.50, 0.35, 0.15]. If dependents ≥ 3: Conservative +0.10, Aggressive −0.10. | Risk tolerance declines with age and family obligations, consistent with Prospect Theory (Kahneman & Tversky, 1979) and empirical findings on risk aversion among financially constrained households. | Kahneman & Tversky (1979); Dohmen, Falk, Huffman, Sunde, Schupp, & Wagner (2011) |
| 13 | `investment_horizon` | Conditional categorical (3 levels: Short-term, Medium-term, Long-term), conditioned on `savings_goal` | Emergency Fund: [S=0.60, M=0.30, L=0.10]; Education: [0.25, 0.50, 0.25]; Retirement: [0.05, 0.25, 0.70]; Travel: [0.60, 0.30, 0.10]; Home/Property: [0.10, 0.45, 0.45]; General Savings: [0.35, 0.40, 0.25]; Business Capital: [0.15, 0.45, 0.40] | Investment horizon is fundamentally determined by savings goal, which in turn reflects life-cycle position. Emergency and travel goals demand liquidity; retirement and property goals align with long-term instruments. | Friedman (1957); Modigliani & Brumberg (1954) |

### 2.3 Conditional Dependency Structure

The synthetic data generation process encodes a directed acyclic graph (DAG) of conditional dependencies that mirrors real-world causal relationships in Philippine financial behavior:

```
age ──────────────┬──── employment_status (also depends on location_type)
                  ├──── num_dependents
                  ├──── digital_savviness (also depends on location_type)
                  ├──── risk_tolerance (also depends on monthly_income, num_dependents)
                  └──── savings_goal (also depends on employment_status)

location_type ────┬──── employment_status
                  ├──── monthly_income (also depends on employment_status, age)
                  ├──── digital_savviness
                  ├──── has_bank_account (also depends on employment_status, monthly_income)
                  └──── has_ewallet (also depends on age, digital_savviness)

monthly_income ───┬──── monthly_expenses (also depends on num_dependents)
                  └──── existing_savings (also depends on monthly_expenses)

savings_goal ─────┬──── investment_horizon
```

This dependency structure ensures that inter-feature correlations in the synthetic data are not artifacts of independent sampling but reflect the conditional relationships documented in Philippine statistical sources. For example, a young Metro Manila resident is more likely to be formally employed, have higher income, higher digital savviness, and an e-wallet — a coherent profile that mirrors empirical reality.

### 2.4 Preprocessing and Derived Features

The preprocessing script (`data/preprocess.py`) validates the generated data and computes four derived features that capture financial ratios important for recommendation logic:

| Derived Feature | Formula | Interpretation |
|----------------|---------|----------------|
| `disposable_income` | `monthly_income − monthly_expenses` | Absolute monthly surplus available for savings/investment |
| `expense_ratio` | `monthly_expenses / monthly_income` | Proportion of income consumed by expenses |
| `savings_to_income_ratio` | `existing_savings / monthly_income` | Savings buffer expressed as months of income equivalent |
| `income_per_dependent` | `monthly_income / (num_dependents + 1)` | Per-capita income proxy; +1 includes the individual |

These derived features are computed deterministically from the input features and serve to provide the EBM model with pre-computed financial ratios that are standard in personal finance assessment. Categorical columns are cast to the pandas `category` dtype to ensure compatibility with the InterpretML EBM implementation.

---

## 3. Label Generation Logic

### 3.1 Multi-Factor Scoring System

The target variable (`recommended_product`) is assigned through a **multi-factor additive scoring system**, not through simple threshold-based rules. For each of the 5,000 observations, the system computes a score vector of length 8 (one score per product) across eight orthogonal scoring dimensions. The product with the highest cumulative score is selected as the recommendation.

This approach models the decision logic of a financial advisor who weighs multiple client characteristics simultaneously — no single feature deterministically maps to a product. The scoring system produces a realistic multi-class distribution where class boundaries are soft and context-dependent, reflecting the genuine complexity of financial product suitability assessment.

### 3.2 Scoring Dimensions

The eight scoring dimensions, with their contribution logic, are documented below:

#### Dimension 1: Digital Preference

Evaluates the user's affinity for digital-first versus traditional banking channels.

- **High digital savviness (≥4) + has e-wallet:** Boosts GCash GSave, GInvest, Maya Savings, Maya Personal Goals, and Maya Time Deposit.
- **Low digital savviness (≤2) or bank-account-only (no e-wallet):** Boosts BPI Savings, BPI #SaveUp, and BPI Time Deposit.
- **Rationale:** Users with strong digital literacy and existing e-wallet adoption face lower friction when onboarding to app-native financial products.

#### Dimension 2: Income Level

Segments users by monthly income into tiers reflecting product accessibility and suitability.

- **Income < PHP 15,000:** Boosts GCash GSave and Maya Savings (zero/low minimum balance, high accessibility).
- **Income PHP 15,000–30,000:** Boosts Maya Personal Goals and BPI #SaveUp (structured savings with modest commitments).
- **Income PHP 30,000–60,000:** Boosts Maya Time Deposit and GCash GInvest (medium-commitment instruments).
- **Income > PHP 60,000:** Boosts BPI Time Deposit and GCash GInvest (higher minimum balances, longer lock-in periods tolerable).

#### Dimension 3: Existing Savings

Assesses current savings buffer to determine product appropriateness.

- **Savings ≥ PHP 50,000:** Boosts BPI Time Deposit (PHP 50K minimum), GInvest, and Maya Time Deposit.
- **Savings < PHP 5,000:** Boosts GCash GSave and Maya Savings (no minimum); penalizes BPI Time Deposit.
- **Rationale:** Products with minimum balance requirements are only suitable for users with sufficient existing capital.

#### Dimension 4: Risk Tolerance

Aligns product risk profile with user preference.

- **Conservative:** Boosts BPI Savings, BPI #SaveUp, BPI Time Deposit (deposit-insured, fixed returns); penalizes GInvest.
- **Moderate:** Moderate scores across products.
- **Aggressive:** Strongly boosts GCash GInvest (+4 score) as the only investment (non-deposit) product in the set.
- **Rationale:** Conservative investors prioritize capital preservation; aggressive investors seek higher returns via market-linked instruments.

#### Dimension 5: Investment Horizon

Matches product lock-in periods and liquidity profiles to user time preferences.

- **Short-term:** Boosts liquid products (GCash GSave, Maya Savings, BPI Savings) that permit instant withdrawals.
- **Medium-term:** Boosts Maya Personal Goals and BPI #SaveUp (goal-based with flexible timelines).
- **Long-term:** Boosts BPI Time Deposit (5-year lock-in) and GCash GInvest (wealth accumulation over time).

#### Dimension 6: Savings Goal

Maps specific financial goals to product features.

- **Emergency Fund:** Boosts high-liquidity products (GSave, Maya Savings, BPI Savings).
- **Retirement:** Boosts long-term instruments (BPI Time Deposit, GInvest).
- **Education / Home/Property:** Boosts goal-based products (Maya Personal Goals, BPI #SaveUp).
- **Business Capital:** Boosts medium-to-long-term products with competitive rates.
- **Travel / General Savings:** Boosts liquid, moderate-return products.

#### Dimension 7: Location

Reflects infrastructure and channel availability differences.

- **Rural:** Boosts digital-first products (GCash GSave, Maya Savings) due to limited bank branch access.
- **Metro Manila:** Boosts BPI products due to dense branch network and established banking relationships.

#### Dimension 8: Age

Captures generational preferences and life-stage financial behavior.

- **Age < 25:** Boosts digital-native products (GCash GSave, GInvest, Maya Savings).
- **Age > 50:** Boosts traditional BPI products aligned with established banking habits and conservative preferences.

### 3.3 Platform Preference Modeling

To simulate real-world brand affinity — a significant factor in Philippine fintech adoption — a **platform preference** is randomly assigned to each user from the following distribution:

| Platform | Probability | Products Affected |
|----------|-------------|-------------------|
| GCash    | 0.40        | GCash GSave, GCash GInvest |
| Maya     | 0.35        | Maya Savings, Maya Personal Goals, Maya Time Deposit |
| BPI      | 0.25        | BPI Savings, BPI #SaveUp, BPI Time Deposit |

The preferred platform's products receive a **+2 score bonus**, reflecting the tendency of Filipino consumers to consolidate financial products within a single ecosystem they already trust and use. The GCash probability (0.40) reflects its market-leading position in Philippine mobile payments; Maya (0.35) reflects its strong post-rebrand growth; BPI (0.25) reflects its position as a leading traditional bank with digital channels.

### 3.4 Stochastic Selection and Noise

To prevent the dataset from exhibiting unrealistically deterministic label assignments, an **8% noise factor** is applied:

- For 92% of observations, the product with the highest cumulative score is selected.
- For 8% of observations, the recommendation is randomly drawn from the **top 3 scoring products** instead of strictly selecting the highest scorer.

This noise injection serves two purposes:

1. **Realism:** Real-world financial product adoption involves idiosyncratic preferences, marketing exposure, peer influence, and other unmodeled factors that introduce stochasticity.
2. **Model regularization:** Slight label noise prevents the EBM from overfitting to deterministic decision boundaries, promoting better generalization to the soft boundaries expected in real-world deployment.

The resulting class distribution is emergent from the scoring logic and demographic composition of the synthetic population — it is not manually specified. Exact class counts are not logged in the generation script but are a consequence of the interaction between feature distributions and scoring weights.

### 3.5 Product Class Definitions

The eight recommendation classes correspond to real Philippine financial products with the following specifications:

| Class Label | Product Name | Provider | Interest Rate | Minimum Balance | Lock-in | Risk Level | Liquidity | Key Feature |
|-------------|-------------|----------|--------------|-----------------|---------|------------|-----------|-------------|
| `gcash_gsave` | GSave (via CIMB) | GCash | 2.6% p.a. | None | None | Low | High | Digital savings account accessible via GCash app; PDIC-insured up to PHP 500K |
| `gcash_ginvest` | GInvest UITFs | GCash | Variable (market-linked) | PHP 50 | None (but recommended hold) | Medium-High | Medium | Unit Investment Trust Funds accessible via GCash; diversified fund options |
| `bpi_savings` | BPI Regular Savings | BPI | 0.0925% p.a. | PHP 3,000 | None | Low | High | Traditional bank savings account; branch + digital access; PDIC-insured |
| `bpi_save_up` | BPI #SaveUp | BPI | 0.0925% p.a. | None | None | Low | High | Digital auto-save feature with goal tracking; requires BPI account |
| `bpi_time_deposit` | BPI Plan Ahead (Time Deposit) | BPI | ~3–5% p.a. (fixed) | PHP 50,000 | 5 years | Low | Low | Fixed-term deposit with higher guaranteed returns; early withdrawal penalties; PDIC-insured |
| `maya_savings` | Maya Savings | Maya | 3.0% base (up to 15% promo) | None | None | Low | High | High-interest digital savings; instant transfers; competitive base rate |
| `maya_personal_goals` | Maya Personal Goals | Maya | 4–8% tiered | None | None | Low | High | Goal-based savings with tiered interest rates; gamified saving experience |
| `maya_time_deposit` | Maya Time Deposit Plus | Maya | 5.25–5.75% p.a. | Varies | 3–12 months | Low | Low | Digital time deposit with competitive fixed rates; shorter lock-in than BPI |

> **Note:** Product specifications are based on publicly available information as of the study period and are subject to change by the respective providers. Interest rates, minimum balances, and promotional terms may differ from current offerings.

---

## 4. Feature-to-Outcome Relationships

This section documents the theoretical basis and expected contribution direction for each of the 17 features (13 input + 4 derived) used by the EBM model. Understanding these relationships is critical for validating that the model's learned patterns (as revealed by SHAP values and EBM global explanations) align with established financial theory.

### 4.1 Input Features

#### 4.1.1 Age

- **Definition:** Respondent age in years, range [18, 65].
- **Role in Recommendation:** Primary demographic segmenter. Younger users are steered toward digital-first, low-barrier products; older users toward traditional banking products and conservative instruments.
- **Theoretical Basis:** The Life-Cycle Hypothesis (Modigliani & Brumberg, 1954) predicts that financial behavior — including savings rates, risk tolerance, and product preferences — follows a hump-shaped pattern over the life cycle. Younger individuals accumulate assets and tolerate higher risk; older individuals shift toward capital preservation and decumulation.
- **Expected EBM/SHAP Direction:** Higher age → increased probability of BPI products and conservative instruments; lower age → increased probability of GCash/Maya digital products.

#### 4.1.2 Location Type

- **Definition:** Categorical — Metro Manila, Urban, or Rural.
- **Role in Recommendation:** Captures channel accessibility (branch vs. digital), income differentials, and digital infrastructure availability.
- **Theoretical Basis:** Financial inclusion research consistently identifies geographic remoteness as a barrier to formal financial services (Demirgüç-Kunt et al., 2018). The Philippines exhibits a pronounced urban-rural divide in both bank branch density and internet connectivity.
- **Expected EBM/SHAP Direction:** Metro Manila → BPI products; Rural → GCash/Maya digital-first products; Urban → mixed.

#### 4.1.3 Employment Status

- **Definition:** Categorical — Employed, Self-employed, Freelancer, Student, Unemployed.
- **Role in Recommendation:** Proxy for income stability, financial literacy, and product eligibility. Formally employed users have more predictable cash flows suitable for structured savings; freelancers and self-employed users may prefer flexible digital products.
- **Theoretical Basis:** Friedman's Permanent Income Hypothesis (1957) distinguishes between permanent and transitory income components; employment status is a key determinant of income stability and thus consumption/savings behavior.
- **Expected EBM/SHAP Direction:** Employed → BPI products (stable income, likely banked); Student/Unemployed → low-barrier digital savings; Freelancer/Self-employed → flexible digital products.

#### 4.1.4 Number of Dependents

- **Definition:** Integer count of financial dependents, range [0, 5].
- **Role in Recommendation:** Increases expense burden, reduces disposable income, and shifts risk tolerance toward conservatism. Higher dependents favor liquid, low-risk products.
- **Theoretical Basis:** Household size is a primary determinant of consumption needs and savings capacity (Browning & Lusardi, 1996). In the Philippine context, extended family support obligations amplify this effect.
- **Expected EBM/SHAP Direction:** Higher dependents → conservative, liquid products (GSave, Maya Savings, BPI Savings); lower dependents → greater tolerance for illiquid or higher-risk products.

#### 4.1.5 Monthly Income

- **Definition:** Monthly income in PHP, lognormally distributed with employment, age, and location adjustments.
- **Role in Recommendation:** Primary economic constraint. Determines which products are accessible (minimum balance requirements) and appropriate (risk capacity).
- **Theoretical Basis:** Income level is the foundational variable in both the Life-Cycle Hypothesis (Modigliani & Brumberg, 1954) and the Permanent Income Hypothesis (Friedman, 1957) for predicting savings and consumption behavior. Higher-income individuals have greater capacity for risk-bearing and long-term investment.
- **Expected EBM/SHAP Direction:** Low income → GCash GSave, Maya Savings (no minimum); high income → BPI Time Deposit, GInvest (higher minimums, greater risk capacity).

#### 4.1.6 Monthly Expenses

- **Definition:** Monthly expenses in PHP, derived as income × expense ratio.
- **Role in Recommendation:** Determines available surplus for savings/investment. High expenses relative to income constrain product choice to low-commitment, high-liquidity options.
- **Theoretical Basis:** Consumption expenditure is the complement of savings in the national income identity. Browning and Lusardi (1996) review the extensive literature linking consumption patterns to savings behavior across the life cycle.
- **Expected EBM/SHAP Direction:** Higher expenses (given income) → liquid, low-commitment products; lower expenses → greater product flexibility.

#### 4.1.7 Existing Savings

- **Definition:** Cumulative savings in PHP.
- **Role in Recommendation:** Determines eligibility for products with minimum balance requirements (e.g., BPI Time Deposit at PHP 50K) and indicates financial buffer adequacy.
- **Theoretical Basis:** Existing wealth is a key state variable in lifecycle optimization models. The precautionary savings motive (Carroll, 1997) suggests that individuals with low savings buffers prioritize liquidity over returns.
- **Expected EBM/SHAP Direction:** High savings → BPI Time Deposit, GInvest, Maya Time Deposit; low savings → GSave, Maya Savings.

#### 4.1.8 Digital Savviness

- **Definition:** Ordinal scale 1–5, where 5 indicates highest digital literacy.
- **Role in Recommendation:** Determines comfort with app-based financial products versus preference for branch-based services.
- **Theoretical Basis:** Digital literacy is a critical mediator of fintech adoption. The Technology Acceptance Model (Davis, 1989) posits that perceived ease of use — closely related to digital savviness — is a primary driver of technology adoption. In the Philippine context, the We Are Social Digital 2023 report documents significant variation in digital engagement across demographics.
- **Expected EBM/SHAP Direction:** High digital savviness → GCash/Maya products; low digital savviness → BPI traditional products.

#### 4.1.9 Has Bank Account

- **Definition:** Binary indicator of formal bank account ownership.
- **Role in Recommendation:** Prerequisite for BPI products; absence indicates potential digital-only user.
- **Theoretical Basis:** Bank account ownership is the foundational metric of financial inclusion (Demirgüç-Kunt et al., 2018). The Global Findex Database documents that ~56% of Filipino adults hold a formal bank account, with significant variation by income, employment, and geography.
- **Expected EBM/SHAP Direction:** Has bank account → BPI products become viable; no bank account → GCash/Maya digital-only products.

#### 4.1.10 Has E-Wallet

- **Definition:** Binary indicator of e-wallet (GCash or Maya) ownership.
- **Role in Recommendation:** Prerequisite for app-native financial products; indicates existing digital financial behavior.
- **Theoretical Basis:** E-wallet adoption in the Philippines accelerated dramatically during COVID-19 (BSP, 2021). The BSP Financial Inclusion Survey reports >50% e-wallet penetration, making it a critical channel for financial product distribution.
- **Expected EBM/SHAP Direction:** Has e-wallet → GCash/Maya products; no e-wallet → BPI traditional products.

#### 4.1.11 Savings Goal

- **Definition:** Categorical — Emergency Fund, Education, Retirement, Travel, Home/Property, General Savings, Business Capital.
- **Role in Recommendation:** Directly maps to product features (liquidity, returns, lock-in period, goal-tracking capability).
- **Theoretical Basis:** Goal-based saving is a well-documented behavioral finance phenomenon. Mental accounting theory (Thaler, 1999) explains why individuals partition savings into goal-specific "accounts." The Life-Cycle Hypothesis (Modigliani & Brumberg, 1954) predicts systematic goal evolution across life stages.
- **Expected EBM/SHAP Direction:** Emergency Fund → high-liquidity products; Retirement → long-term instruments; Education/Home → goal-based products (Maya Personal Goals, BPI #SaveUp).

#### 4.1.12 Risk Tolerance

- **Definition:** Categorical — Conservative, Moderate, Aggressive.
- **Role in Recommendation:** Primary filter for investment-grade products (GInvest) versus deposit products.
- **Theoretical Basis:** Prospect Theory (Kahneman & Tversky, 1979) demonstrates that individuals are loss-averse and that risk preferences are reference-dependent. Empirical research by Dohmen et al. (2011) confirms that risk tolerance varies systematically with age, income, and cognitive ability.
- **Expected EBM/SHAP Direction:** Aggressive → GInvest (strongest signal); Conservative → BPI deposit products; Moderate → balanced across options.

#### 4.1.13 Investment Horizon

- **Definition:** Categorical — Short-term, Medium-term, Long-term.
- **Role in Recommendation:** Determines tolerance for lock-in periods and preference for liquidity versus return optimization.
- **Theoretical Basis:** Time preference is a fundamental parameter in intertemporal choice theory (Friedman, 1957). Longer horizons permit greater risk-taking and reduce the need for liquidity premiums.
- **Expected EBM/SHAP Direction:** Short-term → liquid products (GSave, Maya Savings); Long-term → BPI Time Deposit, GInvest.

### 4.2 Derived Features

#### 4.2.1 Disposable Income

- **Definition:** `monthly_income − monthly_expenses`. Absolute monthly surplus in PHP.
- **Role in Recommendation:** Measures actual capacity to save or invest. More informative than raw income because it accounts for expense burden.
- **Theoretical Basis:** Disposable income (income net of necessary consumption) is the direct determinant of savings in Keynesian consumption theory and the Life-Cycle Hypothesis (Modigliani & Brumberg, 1954).
- **Expected EBM/SHAP Direction:** Higher disposable income → higher-commitment products (time deposits, investment funds); near-zero → liquid emergency savings.

#### 4.2.2 Expense Ratio

- **Definition:** `monthly_expenses / monthly_income`. Proportion of income consumed, range [0.40, 0.98].
- **Role in Recommendation:** Identifies financially constrained users. High expense ratios indicate minimal savings capacity.
- **Theoretical Basis:** The savings rate (1 − expense ratio) is a central variable in lifecycle models. Browning and Lusardi (1996) identify the savings rate as a key predictor of financial behavior and product engagement.
- **Expected EBM/SHAP Direction:** High expense ratio → low-barrier, liquid products; low expense ratio → greater product flexibility.

#### 4.2.3 Savings-to-Income Ratio

- **Definition:** `existing_savings / monthly_income`. Savings buffer expressed as income-months equivalent.
- **Role in Recommendation:** Normalizes savings by income level, enabling cross-income comparison of financial preparedness. A user earning PHP 15K with PHP 45K saved (ratio = 3.0) is better positioned than one earning PHP 100K with PHP 45K saved (ratio = 0.45).
- **Theoretical Basis:** The wealth-to-income ratio is a standard measure of financial buffer adequacy in household finance literature (Carroll, 1997). Financial planning guidelines typically recommend 3–6 months of emergency savings.
- **Expected EBM/SHAP Direction:** High ratio → products with lock-in acceptable (time deposits, GInvest); low ratio → liquidity-prioritizing products.

#### 4.2.4 Income per Dependent

- **Definition:** `monthly_income / (num_dependents + 1)`. Per-capita income proxy.
- **Role in Recommendation:** Captures the interaction between income and family obligations. A user earning PHP 50K with 4 dependents (PHP 10K/person) has fundamentally different product needs than a single user earning PHP 50K (PHP 50K/person).
- **Theoretical Basis:** Equivalence scales in welfare economics adjust household income by household composition to obtain a more accurate measure of economic well-being (Browning & Lusardi, 1996). Per-capita income is the simplest such adjustment.
- **Expected EBM/SHAP Direction:** Lower income per dependent → conservative, liquid products; higher → greater capacity for risk and commitment.

---

## 5. Data Reliability and Limitations

### 5.1 Internal Validity

The synthetic data generation process ensures internal validity through the following mechanisms:

1. **Conditional Dependencies.** Features are generated in topological order respecting the causal DAG (Section 2.3), ensuring that downstream features (e.g., `monthly_expenses`) are conditioned on upstream features (e.g., `monthly_income`, `num_dependents`) rather than generated independently.

2. **Range Constraints.** All features are clipped to realistic ranges (e.g., age [18, 65], expense ratio [0.40, 0.98], probabilities [0.10, 0.95]) to prevent physically or economically implausible values.

3. **Schema Validation.** The preprocessing script (`data/preprocess.py`) performs comprehensive validation: null checks, duplicate detection, categorical value verification against allowed sets, and numerical range validation. Any violation would halt processing and flag the offending records.

4. **Distribution Calibration.** Each feature distribution is parameterized using official Philippine government statistics (PSA, BSP) or internationally recognized sources (CIA World Factbook, Global Findex), ensuring that marginal distributions approximate real-world population characteristics.

### 5.2 Reproducibility

Full reproducibility is guaranteed by:

- **Deterministic Seed:** `np.random.seed(42)` is set at the start of the generation script, fixing the entire pseudorandom number sequence.
- **Version-Pinned Libraries:** The generation relies only on `numpy` and `pandas`, both stable and backward-compatible for the operations used.
- **Single Output Artifact:** The generated dataset is saved as a single CSV file (`data/synthetic_filipino_fintech.csv`), which can be regenerated deterministically from the script.

### 5.3 External Validity

External validity — the extent to which findings generalize to real-world Filipino fintech consumers — is the primary concern with synthetic data. The following measures support external validity:

1. **Source Alignment.** Feature distributions are calibrated against the most recent available Philippine national statistics: PSA Census (2020), PSA FIES (2023), BSP Financial Inclusion Survey (2021), and We Are Social Digital 2023 (Philippines).

2. **Conditional Structure.** The dependency DAG encodes empirically documented relationships (e.g., urban-rural income gaps, age-dependent digital literacy) rather than assuming feature independence.

3. **Multi-Factor Label Logic.** The scoring-based label assignment avoids simplistic rule-based labels that would produce trivially learnable patterns, instead producing soft boundaries that approximate the nuanced nature of real financial advisory decisions.

### 5.4 Known Limitations

1. **No Real-World Validation.** The synthetic data has not been validated against a held-out sample of real Filipino fintech users. Model performance metrics (accuracy ≈ 0.654, AUC-ROC ≈ 0.911) reflect the model's ability to learn the synthetic data-generating process, not its predictive validity on real consumers.

2. **Simplified Behavioral Model.** The generation process models a rational agent whose financial preferences are fully determined by observable demographic and economic characteristics. Real consumer behavior is influenced by marketing exposure, peer effects, trust in specific institutions, prior product experience, and cultural factors that are not modeled.

3. **Static Point-in-Time.** The dataset represents a single cross-section and does not capture temporal dynamics such as income growth, goal evolution, product switching, or macroeconomic changes (inflation, interest rate shifts) that affect product suitability.

4. **Limited Product Universe.** Only 8 products across 3 platforms are represented. The actual Philippine fintech landscape includes dozens of additional products (e.g., Tonik, CIMB direct, UnionBank, RCBC) that may be more suitable for certain user profiles.

5. **Absent Interaction Effects.** While features are conditionally generated, some higher-order interaction effects (e.g., the combined effect of being a rural freelancer with high digital savviness and aggressive risk tolerance) may not be adequately captured by the parametric generation process, which primarily models pairwise dependencies.

### 5.5 Mitigation Strategies

The following strategies mitigate the limitations identified above:

| Limitation | Mitigation |
|-----------|------------|
| No real-world validation | The model is positioned as a proof-of-concept with explainability as the primary contribution; future work should validate against real user data from partner institutions. |
| Simplified behavioral model | The multi-factor scoring system with 8 dimensions and stochastic noise partially addresses this by preventing overly deterministic labels; XAI explanations are validated against domain knowledge rather than assumed correct. |
| Static cross-section | The EBM model architecture supports retraining on updated data; the generation script can be re-parameterized with updated statistics. |
| Limited product universe | The system architecture is extensible; adding products requires only updating the scoring logic and retraining. |
| Absent interaction effects | The EBM model explicitly learns pairwise interaction terms, potentially compensating for interaction effects not present in the generation process. |

---

## 6. References

### Philippine Government and Institutional Sources

Bangko Sentral ng Pilipinas (BSP). (2021). *Financial Inclusion Survey 2021*. BSP. https://www.bsp.gov.ph/Pages/InclusiveFinance/Financial-Inclusion-Survey.aspx

Central Intelligence Agency (CIA). (2024). *The World Factbook: Philippines*. CIA. https://www.cia.gov/the-world-factbook/countries/philippines/

National Privacy Commission (NPC). (2012). *Republic Act No. 10173: Data Privacy Act of 2012*. Official Gazette of the Republic of the Philippines.

Philippine Statistics Authority (PSA). (2020). *2020 Census of Population and Housing*. PSA. https://psa.gov.ph/population-and-housing

Philippine Statistics Authority (PSA). (2023). *Family Income and Expenditure Survey (FIES) 2023*. PSA. https://psa.gov.ph/income-expenditure/fies

### Peer-Reviewed Articles

Assefa, S. A., Dervovic, D., Mahber, M., Tillman, R. E., Reddy, P., & Veloso, M. (2020). Generating synthetic data in finance: Opportunities, challenges and pitfalls. *Proceedings of the First ACM International Conference on AI in Finance*, 1–8. https://doi.org/10.1145/3383455.3422554

Carroll, C. D. (1997). Buffer-stock saving and the life cycle/permanent income hypothesis. *The Quarterly Journal of Economics*, *112*(1), 1–55. https://doi.org/10.1162/003355397555109

Davis, F. D. (1989). Perceived usefulness, perceived ease of use, and user acceptance of information technology. *MIS Quarterly*, *13*(3), 319–340. https://doi.org/10.2307/249008

Dohmen, T., Falk, A., Huffman, D., Sunde, U., Schupp, J., & Wagner, G. G. (2011). Individual risk attitudes: Measurement, determinants, and behavioral consequences. *Journal of the European Economic Association*, *9*(3), 522–550. https://doi.org/10.1111/j.1542-4774.2011.01015.x

Jordon, J., Szpruch, L., Houssiau, F., Sherborne, N., & van der Schaar, M. (2022). Synthetic data — what, why and how? *arXiv preprint arXiv:2205.03257*. https://doi.org/10.48550/arXiv.2205.03257

### Behavioral Finance and Economic Theory

Browning, M., & Lusardi, A. (1996). Household saving: Micro theories and micro facts. *Journal of Economic Literature*, *34*(4), 1797–1855. https://www.jstor.org/stable/2729595

Friedman, M. (1957). *A Theory of the Consumption Function*. Princeton University Press.

Kahneman, D., & Tversky, A. (1979). Prospect theory: An analysis of decision under risk. *Econometrica*, *47*(2), 263–292. https://doi.org/10.2307/1914185

Modigliani, F., & Brumberg, R. (1954). Utility analysis and the consumption function: An interpretation of cross-section data. In K. K. Kurihara (Ed.), *Post-Keynesian Economics* (pp. 388–436). Rutgers University Press.

Thaler, R. H. (1999). Mental accounting matters. *Journal of Behavioral Decision Making*, *12*(3), 183–206. https://doi.org/10.1002/(SICI)1099-0771(199909)12:3<183::AID-BDM318>3.0.CO;2-F

### Digital Financial Inclusion

Demirgüç-Kunt, A., Klapper, L., Singer, D., Ansar, S., & Hess, J. (2018). *The Global Findex Database 2017: Measuring Financial Inclusion and the Fintech Revolution*. World Bank. https://doi.org/10.1596/978-1-4648-1259-0

We Are Social & Meltwater. (2023). *Digital 2023: The Philippines*. We Are Social. https://wearesocial.com/digital-2023

### Product Documentation

BPI. (2024). *BPI Savings Account, #SaveUp, and Plan Ahead Time Deposit*. Bank of the Philippine Islands. https://www.bpi.com.ph

GCash. (2024). *GSave and GInvest*. Mynt — Globe Fintech Innovations, Inc. https://www.gcash.com

Maya. (2024). *Maya Savings, Personal Goals, and Time Deposit Plus*. Maya Philippines, Inc. https://www.maya.ph

---

*This document was generated to support the academic evaluation of the FinXplain system's synthetic data pipeline. All statistical sources, citations, and product specifications referenced herein are based on publicly available information and are provided for academic purposes.*
