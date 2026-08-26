from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.schemas.payment_method_schema import PaymentMethodResponse
from app.services.payment_method_service import PaymentMethodService

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


@router.get("", response_model=List[PaymentMethodResponse])
def get_payment_methods(db: Session = Depends(get_db)):
    return PaymentMethodService.get_all_payment_methods(db)


@router.get("/{payment_method_id}", response_model=PaymentMethodResponse)
def get_payment_method(payment_method_id: int, db: Session = Depends(get_db)):
    return PaymentMethodService.get_payment_method_by_id(db, payment_method_id)
