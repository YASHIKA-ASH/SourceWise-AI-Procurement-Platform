# Upgrade the Existing SourceWise Project

This update adds manual product/BOM/supplier/quotation entry, editable product targets, and custom scenario simulations.

## Apply the update on Windows

1. Stop the frontend and backend terminals with `Ctrl+C`.
2. Back up `backend\procurement.db` if you have entered data that you want to preserve.
3. Extract `sourcewise-manual-entry-update.zip` directly inside your existing `procurement-intelligence` folder.
4. Choose **Replace the files in the destination** when Windows asks.
5. Restart the backend:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m fastapi dev app/main.py
```

6. Restart the frontend in another terminal:

```powershell
cd frontend
npm run dev
```

7. Open `http://localhost:5173` and press `Ctrl+F5` once.

No database migration is required because this update does not add or remove database columns.
