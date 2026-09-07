from decimal import Decimal
from typing import List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.wallet import Wallet, WalletTransaction
from app.repositories.wallet_repository import WalletRepository
from app.schemas.wallet_schema import (
    WalletCreate,
    WalletUpdate,
    WalletResponse,
    WalletTransferCreate,
    WalletTransactionResponse,
    WalletSummaryResponse,
)


class WalletService:
    @staticmethod
    def _format_wallet_response(wallet: Wallet) -> WalletResponse:
        return WalletResponse(
            id=wallet.id,
            user_id=wallet.user_id,
            name=wallet.name,
            wallet_type=wallet.wallet_type,
            balance=Decimal(str(wallet.balance)),
            currency=wallet.currency,
            color=wallet.color,
            icon=wallet.icon,
            is_default=wallet.is_default,
            created_at=wallet.created_at,
            updated_at=wallet.updated_at,
        )

    @staticmethod
    def _format_transaction_response(tx: WalletTransaction) -> WalletTransactionResponse:
        return WalletTransactionResponse(
            id=tx.id,
            wallet_id=tx.wallet_id,
            transaction_type=tx.transaction_type,
            amount=Decimal(str(tx.amount)),
            destination_wallet_id=tx.destination_wallet_id,
            description=tx.description,
            transaction_date=tx.transaction_date,
            created_at=tx.created_at,
        )

    @classmethod
    def ensure_default_wallets(cls, db: Session, user_id: int) -> None:
        """Seed default wallets if user has no wallets yet."""
        existing = WalletRepository.get_all(db, user_id)
        if not existing:
            # 1. Main Bank Account
            WalletRepository.create(
                db=db,
                user_id=user_id,
                name="Main Bank Account",
                wallet_type="BANK",
                balance=Decimal("0.00"),
                currency="INR",
                color="#3B82F6",
                icon="Building2",
                is_default=True,
            )
            # 2. Cash in Hand
            WalletRepository.create(
                db=db,
                user_id=user_id,
                name="Cash in Hand",
                wallet_type="CASH",
                balance=Decimal("0.00"),
                currency="INR",
                color="#10B981",
                icon="Banknote",
                is_default=False,
            )

    @classmethod
    def get_all_wallets(cls, db: Session, user_id: int) -> List[WalletResponse]:
        cls.ensure_default_wallets(db, user_id)
        wallets = WalletRepository.get_all(db, user_id)
        return [cls._format_wallet_response(w) for w in wallets]

    @classmethod
    def get_wallet_summary(cls, db: Session, user_id: int) -> WalletSummaryResponse:
        cls.ensure_default_wallets(db, user_id)
        wallets = WalletRepository.get_all(db, user_id)
        
        total_liquid = Decimal("0.00")
        total_credit = Decimal("0.00")

        wallet_responses = []
        for w in wallets:
            amt = Decimal(str(w.balance))
            if w.wallet_type == "CREDIT_CARD":
                # If credit card balance is negative or represents debt
                if amt < 0:
                    total_credit += abs(amt)
                else:
                    total_liquid += amt
            else:
                total_liquid += amt
            wallet_responses.append(cls._format_wallet_response(w))

        net_worth = total_liquid - total_credit

        return WalletSummaryResponse(
            total_liquid_balance=total_liquid,
            total_credit_debt=total_credit,
            net_worth=net_worth,
            wallets_count=len(wallets),
            wallets=wallet_responses,
        )

    @classmethod
    def get_wallet_by_id(cls, db: Session, wallet_id: int, user_id: int) -> WalletResponse:
        wallet = WalletRepository.get_by_id(db, wallet_id, user_id)
        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wallet with ID {wallet_id} not found"
            )
        return cls._format_wallet_response(wallet)

    @classmethod
    def create_wallet(cls, db: Session, user_id: int, data: WalletCreate) -> WalletResponse:
        if data.is_default:
            WalletRepository.clear_defaults(db, user_id)

        wallet = WalletRepository.create(
            db=db,
            user_id=user_id,
            name=data.name.strip(),
            wallet_type=data.wallet_type,
            balance=data.balance,
            currency=data.currency,
            color=data.color,
            icon=data.icon,
            is_default=data.is_default,
        )

        # If starting balance > 0, log initial deposit transaction
        if data.balance != Decimal("0.00"):
            WalletRepository.create_transaction(
                db=db,
                wallet_id=wallet.id,
                user_id=user_id,
                transaction_type="DEPOSIT" if data.balance > 0 else "WITHDRAWAL",
                amount=abs(data.balance),
                description="Initial Account Balance",
            )

        return cls._format_wallet_response(wallet)

    @classmethod
    def update_wallet(cls, db: Session, wallet_id: int, user_id: int, data: WalletUpdate) -> WalletResponse:
        wallet = WalletRepository.get_by_id(db, wallet_id, user_id)
        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wallet with ID {wallet_id} not found"
            )

        if data.is_default:
            WalletRepository.clear_defaults(db, user_id)

        updated = WalletRepository.update(
            db=db,
            wallet=wallet,
            name=data.name.strip() if data.name is not None else None,
            wallet_type=data.wallet_type,
            balance=data.balance,
            currency=data.currency,
            color=data.color,
            icon=data.icon,
            is_default=data.is_default,
        )
        return cls._format_wallet_response(updated)

    @classmethod
    def delete_wallet(cls, db: Session, wallet_id: int, user_id: int) -> None:
        wallet = WalletRepository.get_by_id(db, wallet_id, user_id)
        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wallet with ID {wallet_id} not found"
            )
        WalletRepository.delete(db, wallet)

    @classmethod
    def transfer_funds(cls, db: Session, user_id: int, data: WalletTransferCreate) -> WalletTransactionResponse:
        from_wallet = WalletRepository.get_by_id(db, data.from_wallet_id, user_id)
        if not from_wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source wallet with ID {data.from_wallet_id} not found"
            )

        to_wallet = WalletRepository.get_by_id(db, data.to_wallet_id, user_id)
        if not to_wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Target wallet with ID {data.to_wallet_id} not found"
            )

        # Deduct from source and deposit to destination
        WalletRepository.adjust_balance(db, from_wallet, -data.amount)
        WalletRepository.adjust_balance(db, to_wallet, data.amount)

        desc = data.notes.strip() if data.notes else f"Transfer from {from_wallet.name} to {to_wallet.name}"

        # Record Transfer Out from source
        tx_out = WalletRepository.create_transaction(
            db=db,
            wallet_id=from_wallet.id,
            user_id=user_id,
            transaction_type="TRANSFER_OUT",
            amount=data.amount,
            destination_wallet_id=to_wallet.id,
            description=desc,
            transaction_date=data.transfer_date,
        )

        # Record Transfer In to destination
        WalletRepository.create_transaction(
            db=db,
            wallet_id=to_wallet.id,
            user_id=user_id,
            transaction_type="TRANSFER_IN",
            amount=data.amount,
            destination_wallet_id=from_wallet.id,
            description=desc,
            transaction_date=data.transfer_date,
        )

        return cls._format_transaction_response(tx_out)

    @classmethod
    def get_wallet_transactions(
        cls, db: Session, wallet_id: int, user_id: int, limit: int = 50, skip: int = 0
    ) -> Tuple[List[WalletTransactionResponse], int]:
        wallet = WalletRepository.get_by_id(db, wallet_id, user_id)
        if not wallet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Wallet with ID {wallet_id} not found"
            )
        items, total = WalletRepository.get_transactions_by_wallet(db, wallet_id, user_id, limit, skip)
        return [cls._format_transaction_response(tx) for tx in items], total

    @classmethod
    def get_all_transactions(
        cls, db: Session, user_id: int, limit: int = 50, skip: int = 0
    ) -> Tuple[List[WalletTransactionResponse], int]:
        items, total = WalletRepository.get_all_transactions(db, user_id, limit, skip)
        return [cls._format_transaction_response(tx) for tx in items], total
