from __future__ import annotations

# Import both model modules before create_all().
# This registers every table, including products, users,
# procurement_documents, refresh_tokens and audit_events.
from app import models as procurement_models  # noqa: F401
from app import models_enterprise as enterprise_models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.services.auth_service import bootstrap_initial_admin


def main() -> None:
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        admin = bootstrap_initial_admin(db)

    print("Enterprise schema is ready.")

    if admin:
        print(f"Initial administrator created: {admin.email}")
    else:
        print(
            "No administrator created. An existing user may already be present, "
            "or the initial administrator settings are missing."
        )


if __name__ == "__main__":
    main()
