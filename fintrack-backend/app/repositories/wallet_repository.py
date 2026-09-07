from datetime import date
from decimal import Decimal
from typing import List, Optional, Tuple
from sqlalchemy import select, func, and_, desc, or_
from sqlalchemy.orm import Session, selectinload
from app.models.wallet import Wallet, WalletTransaction


class WalletRepository:
    @staticmethod
    def get_by_id(db: Session, wallet_id: int, user_id: int) -> Optional[Wallet]:
        stmt = (
            select(Wallet)
            .where(and_(Wallet.id == wallet_id, Wallet.user_id == user_id))
        )
        return db.scalar(stmt)

    @staticmethod
    def get_all(db: Session, user_id: int) -> List[Wallet]:
        stmt = (
            select(Wallet)
            .where(Wallet.user_id == user_id)
            .order_by(desc(Wallet.is_default), Wallet.created_at)
        )
        return list(db.scalars(stmt).all())

    @staticmethod
    def get_default(db: Session, user_id: int) -> Optional[Wallet]:
        stmt = (
            select(Wallet)
            .where(and_(Wallet.user_id == user_id, Wallet.is_default.is_(True)))
        )
        return db.scalar(stmt)

    @staticmethod
    def clear_defaults(db: Session, user_id: int) -> None:
        wallets = db.scalars(select(Wallet).where(and_(Wallet.user_id == user_id, Wallet.is_default.is_(True)))).all()
        for w in wallets:
            w.is_default = False
        db.flush()

    @staticmethod
    def create(
        db: Session,
        user_id: int,
        name: str,
        wallet_type: str = "BANK",
        balance: Decimal = Decimal("0.00"),
        currency: str = "INR",
        color: str = "#10B981",
        icon: str = "Wallet",
        is_default: bool = False,
    ) -> Wallet:
        wallet = Wallet(
            user_id=user_id,
            name=name,
            wallet_type=wallet_type,
            balance=balance,
            currency=currency,
            color=color,
            icon=icon,
            is_default=is_default,
        )
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
        return wallet

    @staticmethod
    def update(
        db: Session,
        wallet: Wallet,
        name: Optional[str] = None,
        wallet_type: Optional[str] = None,
        balance: Optional[Decimal] = None,
        currency: Optional[str] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None,
        is_default: Optional[bool] = None,
    ) -> Wallet:
        if name is not None:
            wallet.name = name
        if wallet_type is not None:
            wallet.wallet_type = wallet_type
        if balance is not None:
            wallet.balance = balance
        if currency is not None:
            wallet.currency = currency
        if color is not None:
            wallet.color = color
        if icon is not None:
            wallet.icon = icon
        if is_default is not None:
            wallet.is_default = is_default

        db.commit()
        db.refresh(wallet)
        return wallet

    @staticmethod
    def delete(db: Session, wallet: Wallet) -> None:
        db.delete(wallet)
        db.commit()

    @staticmethod
    def adjust_balance(db: Session, wallet: Wallet, delta: Decimal) -> Wallet:
        wallet.balance = wallet.balance + delta
        db.commit()
        db.refresh(wallet)
        return wallet

    @staticmethod
    def create_transaction(
        db: Session,
        wallet_id: int,
        user_id: int,
        transaction_type: str,
        amount: Decimal,
        destination_wallet_id: Optional[int] = None,
        description: Optional[str] = None,
        transaction_date: Optional[date] = None,
    ) -> WalletTransaction:
        tx = WalletTransaction(
            wallet_id=wallet_id,
            user_id=user_id,
            transaction_type=transaction_type,
            amount=amount,
            destination_wallet_id=destination_wallet_id,
            description=description,
            transaction_date=transaction_date or date.today(),
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)
        return tx

    @staticmethod
    def get_transactions_by_wallet(
        db: Session,
        wallet_id: int,
        user_id: int,
        limit: int = 50,
        skip: int = 0
    ) -> Tuple[List[WalletTransaction], int]:
        conditions = [
            WalletTransaction.user_id == user_id,
            or_(
                WalletTransaction.wallet_id == wallet_id,
                WalletTransaction.destination_wallet_id == wallet_id
            )
        ]
        count_stmt = select(func.count()).select_from(WalletTransaction).where(and_(*conditions))
        total = db.scalar(count_stmt) or 0

        stmt = (
            select(WalletTransaction)
            .where(and_(*conditions))
            .order_by(desc(WalletTransaction.transaction_date), desc(WalletTransaction.id))
            .offset(skip)
            .limit(limit)
        )
        items = list(db.scalars(stmt).all())
        return items, total

    @staticmethod
    def get_all_transactions(
        db: Session,
        user_id: int,
        limit: int = 50,
        skip: int = 0
    ) -> Tuple[List[WalletTransaction], int]:
        conditions = [WalletTransaction.user_id == user_id]
        count_stmt = select(func.count()).select_from(WalletTransaction).where(and_(*conditions))
        total = db.scalar(count_stmt) or 0

        stmt = (
            select(WalletTransaction)
            .where(and_(*conditions))
            .order_by(desc(WalletTransaction.transaction_date), desc(WalletTransaction.id))
            .offset(skip)
            .limit(limit)
        )
        items = list(db.scalars(stmt).all())
        return items, total
