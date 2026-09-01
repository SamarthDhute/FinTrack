from typing import Optional, List
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User

# Default categories seeded for every new user on registration
_DEFAULT_CATEGORY_NAMES = [
    "Food & Dining",
    "Transport",
    "Rent & Housing",
    "Groceries",
    "Healthcare",
    "Entertainment",
    "Shopping",
    "Education",
    "Utilities",
    "Others",
]


class UserRepository:
    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.scalar(select(User).where(User.id == user_id))

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.scalar(select(User).where(User.email == email.lower().strip()))

    @staticmethod
    def get_by_google_id(db: Session, google_id: str) -> Optional[User]:
        return db.scalar(select(User).where(User.google_id == google_id))

    @staticmethod
    def create(
        db: Session,
        email: str,
        hashed_password: Optional[str] = None,
        display_name: Optional[str] = None,
        google_id: Optional[str] = None,
        is_verified: bool = False,
    ) -> User:
        user = User(
            email=email.lower().strip(),
            hashed_password=hashed_password,
            display_name=display_name,
            google_id=google_id,
            is_verified=is_verified,
            is_active=True,
        )
        db.add(user)
        db.flush()  # get user.id without full commit yet
        return user

    @staticmethod
    def update_google_id(db: Session, user: User, google_id: str) -> User:
        user.google_id = google_id
        db.flush()
        return user

    @staticmethod
    def update_password(db: Session, user: User, new_hashed_password: str) -> User:
        user.hashed_password = new_hashed_password
        db.flush()
        return user

    @staticmethod
    def seed_default_categories(db: Session, user_id: int) -> None:
        """
        Insert the 10 default starter categories for a newly registered user.
        Imported inline to avoid circular imports with Category model.
        """
        from app.models.category import Category
        for name in _DEFAULT_CATEGORY_NAMES:
            db.add(Category(user_id=user_id, name=name))
        db.flush()
