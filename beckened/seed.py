from sqlalchemy.orm import Session

from auth import ensure_admin_user


def run_seed(db: Session) -> None:
    ensure_admin_user(db)
