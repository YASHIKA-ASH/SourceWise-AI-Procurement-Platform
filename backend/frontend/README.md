# SourceWise — AI Procurement Decision Support Platform

## Problem statement

Procurement teams at mid-size and enterprise manufacturers routinely juggle multiple supplier quotations for the same raw material or component, each with a different unit cost, lead time, and delivery risk profile. In practice, this comparison is done manually in spreadsheets: a planner pulls quotes, eyeballs which supplier looks "good enough," and makes a call under time pressure — often without factoring in how a longer lead time compounds against current inventory and daily consumption to create a stockout.

This creates three recurring problems:

1. **No unified scoring** — cost, lead time, and risk are compared informally instead of on a single, defensible scale, so two planners can look at the same quotes and reach different conclusions.
2. **Stockout risk is invisible until it happens** — inventory, daily usage, and supplier lead time are rarely modeled together, so the true risk of a production delay isn't visible until it's already too late to act.
3. **No audit trail for the decision** — when a supplier choice is questioned later (by finance, by an auditor, by a new team member), there's often no record of *why* that supplier was chosen over the alternatives.

**SourceWise solves this** by turning ad-hoc spreadsheet comparisons into a repeatable simulation: enter required quantity, current inventory, and daily usage, and the platform models each supplier's cost, lead time, and delay risk, scores them on a weighted formula, and produces a decision summary with the reasoning attached — so the recommendation is explainable, not just a black box.

---

## Overview

SourceWise is an AI-assisted procurement decision support platform for comparing suppliers, quantifying procurement risk, and recommending the best sourcing option using a transparent, weighted scoring model — instead of manual spreadsheet comparisons.

---

## Features

- AI-assisted supplier recommendation
- Procurement risk analysis (stockout days, delay days, risk tiering)
- Supplier comparison dashboard
- Interactive procurement simulation (quantity / inventory / daily usage)
- Executive decision summary with plain-language reasoning
- PDF procurement report
- Analytics dashboard
- Procurement score comparison chart
- Cost and lead-time visualization

---

## Technology stack

**Frontend**
- React.js
- Axios
- Recharts

**Backend**
- FastAPI
- SQLAlchemy
- PostgreSQL

**AI / decision logic**
- Rule-based, weighted procurement scoring
- AI-assisted quotation parsing

---

## Architecture

```
Frontend (React)
      |
FastAPI backend
      |
Decision engine (weighted scoring)
      |
PostgreSQL database
      |
Analytics & reports
```

---

## Challenges I faced and how I solved them

Building the simulation dashboard surfaced a handful of real problems beyond just "wire up the UI to the API." Here's what came up and how each was resolved:

**1. The scoring model needed to be explainable, not just accurate.**
An early version returned a single "best supplier" number with no reasoning, which defeats the point of a *decision support* tool — a planner won't trust a black box. I broke the score into three weighted components (cost efficiency, lead time, risk), tuned the weights (40/35/25) based on which factor procurement leads said they cared about most, and surfaced each component separately in the executive summary so the recommendation can be sanity-checked at a glance instead of taken on faith.

**2. Stockout risk was being computed from lead time alone, ignoring current inventory.**
Early logic compared suppliers purely on cost and lead time, which meant a supplier with a short lead time but low inventory buffer could look artificially safe. I fixed this by modeling "days of cover" (`inventory / daily usage`) and comparing it against each supplier's lead time to compute a real delay estimate — the platform now flags when a shortfall will outlast the delivery window, not just when a supplier is objectively slow.

**3. Frontend state and API contracts drifted out of sync during development.**
As the response shape evolved (adding fields like `supplier_reliability` and `cost_efficiency`), the frontend kept referencing state variables and response fields that no longer existed on one side or the other, causing silent runtime errors. I standardized the response contract early (documented under **APIs** below) and made sure every field the UI reads is explicitly set on the backend response — no assumed or optional fields the frontend renders without a fallback.

**4. Duplicate/conflicting imports and malformed JSX crept in during rapid iteration.**
Because the UI grew feature-by-feature (cards, then a table, then three separate charts), a few merge/copy-paste mistakes slipped in — a duplicated `recharts` import and an unclosed conditional block that broke the build. I went through the component tree from the JSX root down, made sure every conditional block opens and closes exactly once, and added a lint pass before each feature branch merges to catch this earlier next time.

**5. Local development required a live backend just to see the UI.**
Testing frontend changes was blocked any time the FastAPI server wasn't running locally, which slowed iteration. I decoupled the simulation logic so it can run as a pure function against the same input shape the API expects, letting the frontend be developed and demoed against a local model before the real backend call is wired back in.

---

## APIs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/simulate` | Runs the procurement simulation for a given quantity, inventory, and daily usage |
| `GET` | `/analytics` | Returns aggregate procurement analytics |
| `GET` | `/report` | Generates and downloads the PDF procurement report |
| `GET` | `/suppliers` | Returns the list of registered suppliers and base quote data |

---

## Installation

### Backend
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
npm install
npm run dev
```

---

## Future improvements

- Machine learning–based supplier ranking (replacing fixed weights with a trained model)
- Real-time ERP integration for live inventory and usage data
- Multi-user authentication and role-based approval workflows
- Predictive procurement forecasting
- Supplier performance trends over time

---

## Dashboard

![Dashboard](docs/images/dashboard.png)

---

## Procurement Simulation

![Simulation](docs/images/simulation.png)

---

## Executive Decision Summary

![Summary](docs/images/summary.png)

---

## Supplier Comparison

![Comparison](docs/images/comparison_simulation.png)

---

## Procurement Charts

![Charts](docs/images/chart_simulation.png)

---

## API Documentation (Swagger)

![Swagger](docs/images/API endpoints.png)
![APIs](docs/images/api's.png)

---

## Downloaded Procurement Report

![Report](docs/images/download_file.png)

---