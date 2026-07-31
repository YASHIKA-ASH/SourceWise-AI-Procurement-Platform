# 🚀 SourceWise - AI Procurement Decision Support Platform

An AI-powered cloud-native procurement platform that automates supplier evaluation, quotation processing, procurement analytics, and supplier optimization using explainable AI.

---

## 📌 Overview

SourceWise enables organizations to make data-driven procurement decisions by combining AI, cloud technologies, and optimization algorithms.

The platform automates supplier onboarding, quotation processing, procurement simulations, and intelligent supplier recommendations while providing transparent decision explanations.

---

## ✨ Key Features

- AI-powered Supplier Recommendation Engine
- Procurement Cost Optimization
- AI-based PDF Quotation Parsing
- Supplier Performance Analytics
- Procurement Simulation Dashboard
- JWT Authentication & Role-Based Access Control
- Redis Caching
- AWS S3 Contract Storage
- CloudWatch Logging
- Dockerized Deployment
- GitHub Actions CI/CD

---

## 🛠 Tech Stack

### Backend

- FastAPI
- Python
- SQLAlchemy
- PostgreSQL (Neon)
- Redis
- JWT Authentication

### Frontend

- React.js
- Tailwind CSS
- Axios
- Recharts

### AI

- Google Gemini
- Explainable AI Supplier Ranking

### Cloud

- AWS EC2
- AWS S3
- AWS CloudWatch
- IAM

### DevOps

- Docker
- GitHub Actions

---

# 🏗 System Architecture

```
                React Frontend
                      │
                      ▼
              FastAPI Backend
      ┌──────────┼────────────┐
      │          │            │
      ▼          ▼            ▼
 PostgreSQL    Redis      Gemini AI
      │                       │
      ▼                       ▼
 Procurement DB      AI Recommendation
      │
      ▼
 AWS S3 + CloudWatch
```

---

# 🧠 AI Supplier Optimization

SourceWise ranks suppliers using a weighted procurement score based on:

- Cost
- Lead Time
- Quality
- Delivery Reliability
- Sustainability
- Defect Rate

The recommendation engine generates:

- Supplier Score
- Confidence Indicator
- Decision Breakdown
- Recommendation Explanation

---

# 📊 Procurement Benchmark

The optimization engine was evaluated against a traditional rule-based procurement strategy.

## Benchmark Setup

- 100 Synthetic Suppliers
- 500 Procurement Scenarios
- Multi-factor Supplier Optimization
- Inventory-aware Procurement Simulation

## Results

| Metric | Improvement |
|---------|------------:|
| Projected Procurement Cost | Up to **30%** |
| Supplier Lead Time | **60%+** |
| Stockout Events | **60%+** |
| Defect-related Procurement Loss | **35%+** |

---

# 🔐 Security

- JWT Authentication
- Role-Based Access Control
- Protected APIs
- Password Hashing
- Secure AWS IAM Integration

---

# ☁️ Cloud Features

- Amazon EC2 Deployment
- Amazon S3 Document Storage
- CloudWatch Logging
- Dockerized Deployment
- GitHub Actions CI/CD

---

# 📈 Performance Optimizations

- Redis Caching
- Explainable AI
- Procurement Benchmark Engine
- Automated Supplier Ranking
- AI-powered PDF Parsing

---

# 📂 Project Structure

```
SourceWise
│
├── backend
├── frontend
├── .github
│   └── workflows
├── README.md
```

---

# 🚀 Running Locally

## Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

## Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# 📸 API Documentation

```
http://localhost:8000/docs
```

---

# 🎯 Resume Highlights

- Developed **20+ REST APIs** for procurement management and AI recommendations.
- Built an explainable AI supplier optimization engine evaluated across **500 simulated procurement scenarios**.
- Achieved **up to 30% projected procurement cost reduction**, **60%+ improvement in supplier lead time**, and **60%+ reduction in projected stockout events**.
- Integrated AWS S3, EC2, CloudWatch, Redis, Docker, and GitHub Actions CI/CD.
- Designed a scalable cloud-native procurement platform with AI-assisted quotation processing.

---

# 👩‍💻 Author

**Yashika Sharma**

AI | Backend | Cloud | Data Engineering