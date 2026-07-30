from __future__ import annotations

from app.database import Base, SessionLocal, engine
from app.models_enterprise import AuditEvent, ProcurementDocument, RefreshToken, User  # noqa: F401
from app.services.auth_service import bootstrap_initial_admin


def main() -> None:
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        admin = bootstrap_initial_admin(db)
    print("Enterprise schema is ready.")
    if admin:
        print(f"Initial administrator created: {admin.email}")
    else:
        print("No administrator created. Existing users were preserved or admin environment values are missing.")


if __name__ == "__main__":
    main()
