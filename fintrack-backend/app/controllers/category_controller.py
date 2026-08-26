from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.category_schema import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.category_service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return CategoryService.get_all_categories(db)


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    return CategoryService.get_category_by_id(db, category_id)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    return CategoryService.create_category(db, payload)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    return CategoryService.update_category(db, category_id, payload)


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    return CategoryService.delete_category(db, category_id)
