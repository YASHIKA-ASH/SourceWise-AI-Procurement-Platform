# SourceWise Procurement Intelligence

A working full-stack foundation for BOM-based procurement planning, supplier scoring, landed-cost calculation, enterprise constraints, capacity-aware supplier allocation, delivery simulation, target-margin analysis, and scenario comparison.

## Included in this first build

- Create products and BOM components through REST APIs.
- Upload BOM files in CSV or XLSX format.
- Adjust purchase quantities using current, reserved, and safety-stock inventory.
- Store supplier quality, risk, certification, approval, capacity, fulfilment, and delivery performance.
- Store supplier offers and detailed landed-cost inputs.
- Calculate configurable weighted supplier scores.
- Apply lead-time, quality, ISO, risk, approval, MOQ, capacity, maximum-order, domestic, and supplier-share constraints.
- Generate balanced, lowest-cost, lowest-risk, and fastest-delivery allocations.
- Split quantities across suppliers when one supplier lacks capacity.
- Calculate part arrival dates, production start, completion date, and bottleneck component.
- Evaluate procurement cost, expected margin, budget, and target-cost variance.
- Simulate price, demand, lead-time, transport, supplier unavailability, domestic sourcing, and weight changes.
- React executive dashboard with BOM upload, allocation views, explanations, cost breakdowns, scenarios, and settings.
- Seeded demonstration data so the project is usable immediately.

## Technology

- Frontend: React and Vite
- Backend: Python, FastAPI, SQLAlchemy, and Pydantic
- Local database: SQLite
- Production-ready database option: PostgreSQL

FastAPI supports typed Python APIs and uploaded files, SQLAlchemy 2 provides the ORM layer, and Vite provides the React development/build workflow.

## Folder structure

```text
procurement-intelligence/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── seed.py
│   ├── tests/
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

## Run on Windows

### 1. Open the project

Extract the ZIP and open the `procurement-intelligence` folder in VS Code.

### 2. Start the backend

Open a VS Code terminal:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
fastapi dev app/main.py
```

The API runs at `http://localhost:8000`.

Open the interactive API documentation at:

```text
http://localhost:8000/docs
```

### 3. Start the frontend

Open a second VS Code terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## BOM upload columns

The CSV/XLSX header row must contain:

```text
part_name
category
required_quantity
current_inventory
reserved_inventory
safety_stock
minimum_order_quantity
required_delivery_date
is_critical
```

Dates use `YYYY-MM-DD`. A ready template is available from the dashboard and at `frontend/public/bom-template.csv`.

## Important calculation behavior

### Net requirement

```text
Net purchase requirement = Adjusted gross demand + Safety stock - Usable inventory
Usable inventory = Current inventory - Reserved inventory
```

### Weighted supplier score

```text
Supplier Score =
Cost Score × Cost Weight
+ Quality Score × Quality Weight
+ Lead-Time Score × Lead-Time Weight
+ Risk Desirability Score × Risk Weight
```

The database stores risk exposure from 0 to 100, where a higher number means higher risk. The scoring formula converts it to risk desirability using `100 - risk exposure`, so a safer supplier receives a higher score.

### Landed cost

The calculation includes material, transportation, customs/import duty, packaging, warehousing, taxes, and expected delay-related cost. Every recommendation exposes the complete breakdown.

## Main API routes

```text
GET    /products
POST   /products
GET    /products/{product_id}/bom
POST   /products/{product_id}/components
POST   /products/{product_id}/bom/upload
GET    /suppliers
POST   /suppliers
POST   /components/{component_id}/offers
GET    /settings
PUT    /settings
GET    /analysis/products/{product_id}/recommendation
POST   /analysis/products/{product_id}/scenario
GET    /dashboard/summary
```

## PostgreSQL option

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Then set:

```powershell
$env:DATABASE_URL="postgresql+psycopg://procurement:procurement@localhost:5432/procurement"
fastapi dev app/main.py
```

## Next implementation phase

The data model and calculation service are ready for the next modules:

1. Authentication, enterprise accounts, roles, factories, and business units.
2. Supplier risk-category records with operational, financial, geographic, compliance, and dependency evidence.
3. Purchase-order approval workflow and historical fulfilment ingestion.
4. User-defined allocation editor and optimization through linear programming.
5. AI recommendation explanations grounded only in calculated results.
6. Executive trend analytics using historical snapshots.
7. Automated tests for every hard constraint and allocation edge case.

## Manual data-entry workflow

The updated frontend includes a **Manual data entry** page. Users can now:

1. Create a finished product and SKU.
2. Enter or revise target manufacturing cost, selling price, minimum margin, procurement budget, and production duration.
3. Add BOM components manually with inventory, safety stock, MOQ, deadline, category, and criticality.
4. Register suppliers with quality, risk, certification, approval, fulfilment, and production-capacity data.
5. Enter complete supplier quotations, including unit price, transportation, customs, packaging, warehousing, taxes, delay cost, lead time, and MOQ.
6. Build custom scenario simulations with manual price, demand, transport, delay, domestic-only, supplier-unavailability, strategy, and scoring-weight assumptions.

After replacing an earlier version of the project, restart both servers. Existing SQLite data remains available because these changes do not require new database columns.
