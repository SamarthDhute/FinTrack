from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.wallet_schema import (
    WalletCreate,
    WalletUpdate,
    WalletResponse,
    WalletTransferCreate,
    WalletDepositCreate,
    WalletTransactionResponse,
    WalletSummaryResponse,
)
from app.services.wallet_service import WalletService

router = APIRouter(prefix="/wallets", tags=["Wallets & Accounts"])


@router.get("/summary", response_model=WalletSummaryResponse)
def get_wallet_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated balances across all wallets, total liquid worth, credit liabilities, and wallet list.
    """
    return WalletService.get_wallet_summary(db=db, user_id=current_user.id)


@router.get("", response_model=List[WalletResponse])
def get_wallets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all accounts/wallets for the authenticated user (seeds default wallets on first call).
    """
    return WalletService.get_all_wallets(db=db, user_id=current_user.id)


@router.post("", response_model=WalletResponse, status_code=status.HTTP_201_CREATED)
def create_wallet(
    data: WalletCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new account/wallet (Bank, Cash, UPI, Credit Card, Savings, etc.).
    """
    return WalletService.create_wallet(db=db, user_id=current_user.id, data=data)


@router.get("/transactions/all")
def get_all_transactions(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get all ledger transaction logs across all wallets.
    """
    items, total = WalletService.get_all_transactions(db=db, user_id=current_user.id, limit=limit, skip=skip)
    return {
        "items": [item.model_dump() for item in items],
        "total_count": total,
        "limit": limit,
        "skip": skip,
    }


@router.get("/{wallet_id}", response_model=WalletResponse)
def get_wallet(
    wallet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve single wallet by ID.
    """
    return WalletService.get_wallet_by_id(db=db, wallet_id=wallet_id, user_id=current_user.id)


@router.put("/{wallet_id}", response_model=WalletResponse)
def update_wallet(
    wallet_id: int,
    data: WalletUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update wallet attributes (name, balance, color, default flag).
    """
    return WalletService.update_wallet(db=db, wallet_id=wallet_id, user_id=current_user.id, data=data)


@router.delete("/{wallet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wallet(
    wallet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a wallet and all its ledger history.
    """
    WalletService.delete_wallet(db=db, wallet_id=wallet_id, user_id=current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/transfer", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
def transfer_funds(
    data: WalletTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Transfer funds between two wallets with atomic balance updates and paired ledger logs.
    """
    return WalletService.transfer_funds(db=db, user_id=current_user.id, data=data)


@router.post("/{wallet_id}/deposit", response_model=WalletTransactionResponse, status_code=status.HTTP_201_CREATED)
def deposit_funds(
    wallet_id: int,
    data: WalletDepositCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Add funds / top up existing balance in a wallet with automatic ledger recording.
    """
    return WalletService.deposit_funds(db=db, user_id=current_user.id, wallet_id=wallet_id, data=data)


@router.get("/{wallet_id}/transactions")
def get_wallet_transactions(
    wallet_id: int,
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Get transactions associated with a specific wallet.
    """
    items, total = WalletService.get_wallet_transactions(
        db=db, wallet_id=wallet_id, user_id=current_user.id, limit=limit, skip=skip
    )
    return {
        "items": [item.model_dump() for item in items],
        "total_count": total,
        "limit": limit,
        "skip": skip,
    }
