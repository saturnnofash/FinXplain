"""
FastAPI Backend for Philippine Fintech Recommendation System
=============================================================

Single endpoint: POST /recommend
Takes user financial profile, returns explainable recommendation.

Run:  uvicorn backend.main:app --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path

from backend.explainability import RecommendationExplainer

# -- Init ---------------------------------------------------------------------

MODEL_DIR = Path(__file__).resolve().parent.parent / "models"
explainer = None
explainer_init_error = None

try:
    explainer = RecommendationExplainer(str(MODEL_DIR))
except Exception as e:
    # Keep API bootable even if model artifacts are missing in deployment.
    explainer_init_error = str(e)

app = FastAPI(
    title="PH Fintech Recommender",
    description="Explainable AI savings plan recommendations for GCash, BPI, and Maya",
    version="1.0.0",
)

# CORS: allow Next.js frontend (typically localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -- Schema -------------------------------------------------------------------

class UserInput(BaseModel):
    age: int = Field(..., ge=18, le=65, description="Age in years")
    monthly_income: float = Field(..., ge=0, description="Monthly income in PHP")
    monthly_expenses: float = Field(..., ge=0, description="Monthly expenses in PHP")
    existing_savings: float = Field(..., ge=0, description="Current savings in PHP")
    employment_status: str = Field(..., description="Employed | Self-employed | Freelancer | Student | Unemployed")
    num_dependents: int = Field(..., ge=0, le=10, description="Number of dependents")
    location_type: str = Field(..., description="Metro Manila | Urban | Rural")
    digital_savviness: int = Field(..., ge=1, le=5, description="Digital comfort (1-5)")
    has_bank_account: int = Field(..., ge=0, le=1, description="0 or 1")
    has_ewallet: int = Field(..., ge=0, le=1, description="0 or 1")
    savings_goal: str = Field(..., description="Emergency Fund | Education | Retirement | Travel | Home/Property | General Savings | Business Capital")
    risk_tolerance: str = Field(..., description="Conservative | Moderate | Aggressive")
    investment_horizon: str = Field(..., description="Short-term | Medium-term | Long-term")

    model_config = {
        "json_schema_extra": {
            "examples": [
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
                    "investment_horizon": "Long-term",
                }
            ]
        }
    }


# -- Endpoints ----------------------------------------------------------------

@app.get("/")
def root():
    return {"status": "ok", "message": "PH Fintech Recommender API"}


@app.get("/health")
def health():
    if explainer is None:
        return {
            "status": "degraded",
            "model_loaded": False,
            "classes": [],
            "detail": explainer_init_error or "Model is not loaded.",
        }

    return {
        "status": "ok",
        "model_loaded": explainer.model is not None,
        "classes": explainer.classes,
    }


@app.post("/recommend")
def recommend(user_input: UserInput):
    """
    Generate an explainable savings plan recommendation.

    Returns prediction, feature contributions, human-readable explanation,
    and counterfactual suggestions -- all in one JSON response.
    """
    if explainer is None:
        raise HTTPException(
            status_code=503,
            detail=explainer_init_error or "Model is not loaded.",
        )

    try:
        result = explainer.explain(user_input.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
