from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.payment_method_repository import PaymentMethodRepository
from app.schemas.payment_method_schema import PaymentMethodResponse


class PaymentMethodService:
    @staticmethod
    def get_all_payment_methods(db: Session) -> List[PaymentMethodResponse]:
        results = PaymentMethodRepository.get_all(db)
        return [
            PaymentMethodResponse(
                id=method.id,
                name=method.name,
                is_predefined=method.is_predefined,
                usage_count=count
            )
            for method, count in results
        ]

    @staticmethod
    def get_payment_method_by_id(db: Session, payment_method_id: int) -> PaymentMethodResponse:
        method = PaymentMethodRepository.get_by_id(db, payment_method_id)
        if not method:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment method with ID {payment_method_id} not found"
            )
        return PaymentMethodResponse(
            id=method.id,
            name=method.name,
            is_predefined=method.is_predefined,
            usage_count=0
        )
