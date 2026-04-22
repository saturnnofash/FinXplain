**Explainable AI for Financial Product Recommendations in Philippine Financial Technology Platforms**

CMSC 190 Special Problem · Institute of Computer Science, University of the Philippines Los Baños
Author: Ashton Stephonie T. Matias · Adviser: Rachel Edita O. Roxas

FinXplain is a web-based prototype that recommends savings and investment products from GCash, Maya, and BPI and explains every recommendation in plain language. It pairs an Explainable Boosting Machine (EBM) with an XGBoost black-box benchmark to demonstrate that a glass-box model can match, and on this dataset exceed, the predictive performance of a post-hoc-explained black box.

**Live prototype:** https://finxplain-rho.vercel.app/

## Key results

On a stratified 20% held-out test set (*n* = 1,000, 8 classes):

| Metric | EBM | XGBoost | Diff |
|---|---|---|---|
| Weighted F1 | 0.6088 | 0.5839 | +2.49 pp |
| Weighted OvR AUC-ROC | 0.9114 | 0.8917 | +1.97 pp |

The EBM exceeds XGBoost on both headline metrics, satisfying the paper's two-percentage-point parity criterion (Objective 4).

## Repository layout

| Path | Purpose |
|---|---|
| `backend/` | FastAPI service: `main.py` (API), `explainability.py` (XAI), `models/` (trained EBM + metadata) |
| `frontend/` | Next.js 14 user interface (App Router, Tailwind, Zustand) |
| `data/` | Synthetic dataset generator, preprocessor, and 5,000-profile CSV |
| `notebooks/` | Training and evaluation scripts, confusion-matrix figures, paper-result JSONs |
| `docs/` | Methodology, synthetic-data, and provider-selection documentation |
| `SP2_Matias_journal.tex` | IEEE-style journal paper (LaTeX source) |

## Running locally

```powershell
# Backend (from repo root)
python -m uvicorn backend.main:app --reload --port 8000

# Frontend (in a second terminal)
cd frontend
npm install
npm run dev
```

If port 8000 is occupied:

```powershell
netstat -ano | findstr ":8000"
taskkill /PID <pid> /F
```

The frontend reads the backend base URL from `frontend/.env.local` (see `.env.example`).

## Reproducing the paper results

```powershell
# 1. Regenerate the synthetic dataset
python data/generate_synthetic_data.py
python data/preprocess.py

# 2. Train and evaluate
python notebooks/train_ebm.py
python notebooks/evaluate_ebm_for_paper.py
python notebooks/evaluate_xgb_for_paper.py

# 3. Render confusion-matrix figures (cm_ebm.png, cm_xgb.png)
python notebooks/ebm_confusion-matrix.py
python notebooks/xgboost_confusion-matrix.py
```

All scripts use a fixed random seed (`random_state=42`) for reproducibility.

## Dataset

A synthetic dataset of 5,000 Filipino fintech user profiles across 13 features, parameterized from the PSA Family Income and Expenditure Survey 2023, PSA Labor Force Survey 2023, PSA 2020 Census, and BSP Financial Inclusion Survey 2021. Labels are assigned by rule-based conditional logic aligned to the eligibility criteria of eight products from GCash, Maya, and BPI. See `docs/synthetic-data-documentation.md` for full parameterization.

## Paper

The full write-up (problem statement, methodology, results, discussion, and bibliography) is in `SP2_Matias_journal.tex`. Compile with any standard `pdflatex` toolchain; the custom class files are under `IEEE/`.
