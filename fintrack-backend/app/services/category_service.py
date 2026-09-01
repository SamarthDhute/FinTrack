from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.category_repository import CategoryRepository
from app.schemas.category_schema import CategoryCreate, CategoryUpdate, CategoryResponse


class CategoryService:
    @staticmethod
    def get_all_categories(db: Session, user_id: int) -> List[CategoryResponse]:
        results = CategoryRepository.get_all(db, user_id=user_id)
        return [
            CategoryResponse(
                id=cat.id,
                name=cat.name,
                created_at=cat.created_at,
                expense_count=count
            )
            for cat, count in results
        ]

    @staticmethod
    def get_category_by_id(db: Session, category_id: int, user_id: int) -> CategoryResponse:
        category = CategoryRepository.get_by_id(db, category_id, user_id=user_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {category_id} not found"
            )
        count = CategoryRepository.count_expenses(db, category_id, user_id=user_id)
        return CategoryResponse(
            id=category.id,
            name=category.name,
            created_at=category.created_at,
            expense_count=count
        )

    @staticmethod
    def create_category(db: Session, data: CategoryCreate, user_id: int) -> CategoryResponse:
        existing = CategoryRepository.get_by_name(db, data.name, user_id=user_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category '{data.name}' already exists"
            )
        category = CategoryRepository.create(db, data.name, user_id=user_id)
        return CategoryResponse(
            id=category.id,
            name=category.name,
            created_at=category.created_at,
            expense_count=0
        )

    @staticmethod
    def update_category(db: Session, category_id: int, data: CategoryUpdate, user_id: int) -> CategoryResponse:
        category = CategoryRepository.get_by_id(db, category_id, user_id=user_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {category_id} not found"
            )

        existing = CategoryRepository.get_by_name(db, data.name, user_id=user_id)
        if existing and existing.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another category named '{data.name}' already exists"
            )

        updated = CategoryRepository.update(db, category, data.name)
        count = CategoryRepository.count_expenses(db, category_id, user_id=user_id)
        return CategoryResponse(
            id=updated.id,
            name=updated.name,
            created_at=updated.created_at,
            expense_count=count
        )

    @staticmethod
    def delete_category(db: Session, category_id: int, user_id: int) -> dict:
        category = CategoryRepository.get_by_id(db, category_id, user_id=user_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with ID {category_id} not found"
            )

        CategoryRepository.delete(db, category)
        return {"message": f"Category '{category.name}' deleted successfully"}
