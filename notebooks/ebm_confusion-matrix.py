"""Generate the EBM confusion-matrix figure (cm_ebm.png) for the paper.

Reads notebooks/paper_ebm_results.json (produced by evaluate_ebm_for_paper.py)
and writes notebooks/cm_ebm.png. Runs correctly from any working directory.
"""

import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

HERE = Path(__file__).resolve().parent
RESULTS_PATH = HERE / "paper_ebm_results.json"
OUTPUT_PATH = HERE / "cm_ebm.png"

PRETTY_LABELS = {
    "bpi_save_up": "BPI #SaveUp",
    "bpi_savings": "BPI Savings",
    "bpi_time_deposit": "BPI Time Deposit",
    "gcash_ginvest": "GCash GInvest",
    "gcash_gsave": "GCash GSave",
    "maya_personal_goals": "Maya Personal Goals",
    "maya_savings": "Maya Savings",
    "maya_time_deposit": "Maya Time Deposit",
}

with open(RESULTS_PATH, "r", encoding="utf-8") as f:
    d = json.load(f)

cm = np.array(d["confusion_matrix"])
raw_labels = d["classes"]
labels = [PRETTY_LABELS.get(c, c) for c in raw_labels]

fig, ax = plt.subplots(figsize=(9, 7))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=labels,
    yticklabels=labels,
    cbar_kws={"label": "Count"},
    ax=ax,
)
ax.set_xlabel("Predicted label")
ax.set_ylabel("True label")
ax.set_title("EBM Confusion Matrix on Held-Out Test Set (n = 1,000)")
plt.xticks(rotation=45, ha="right")
plt.yticks(rotation=0)
plt.tight_layout()
plt.savefig(OUTPUT_PATH, dpi=300, bbox_inches="tight")
plt.close(fig)
print(f"Saved {OUTPUT_PATH}")
