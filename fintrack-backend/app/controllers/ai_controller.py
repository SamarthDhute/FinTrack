from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.schemas.ai_schema import (
    AIInsightsResponse,
    AICategorizeRequest,
    AICategorizeResponse,
    AIChatRequest,
    AIChatResponse,
    AIScanReceiptRequest,
    AIScanReceiptResponse,
    AISubscriptionsResponse,
    AIForecastResponse,
    AIGoalPlanRequest,
    AIGoalPlanResponse,
)
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["AI Recommendations & Insights"])


@router.post(
    "/insights",
    response_model=AIInsightsResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate personalized AI financial recommendations and insights",
)
def get_financial_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AIService.generate_financial_insights(db=db, user=current_user)


@router.post(
    "/categorize",
    response_model=AICategorizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Smart Auto-Categorization for expense descriptions",
)
def auto_categorize_expense(
    data: AICategorizeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AIService.categorize_expense(
        db=db, user=current_user, title=data.title, amount=data.amount
    )


@router.post(
    "/chat",
    response_model=AIChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Natural Language Financial Chat Assistant",
)
def chat_with_advisor(
    data: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    history_dicts = [
        {
            "role": h.get("role", "user") if isinstance(h, dict) else getattr(h, "role", "user"),
            "content": h.get("content", "") if isinstance(h, dict) else getattr(h, "content", ""),
        }
        for h in (data.history or [])
    ]
    return AIService.chat_with_advisor(
        db=db, user=current_user, message=data.message, history=history_dicts
    )


@router.post(
    "/scan-receipt",
    response_model=AIScanReceiptResponse,
    status_code=status.HTTP_200_OK,
    summary="Receipt / Bill OCR Image Scanner",
)
def scan_receipt(
    data: AIScanReceiptRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AIService.scan_receipt(
        db=db, user=current_user, image_base64=data.image_base64, mime_type=data.mime_type
    )


@router.get(
    "/subscriptions",
    response_model=AISubscriptionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect active recurring subscriptions and monthly commitments",
)
def get_detected_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AIService.detect_subscriptions(db=db, user=current_user)


@router.get(
    "/forecast",
    response_model=AIForecastResponse,
    status_code=status.HTTP_200_OK,
    summary="Predictive month-end spending forecast",
)
def get_spending_forecast(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AIService.calculate_forecast(db=db, user=current_user)


@router.post(
    "/goal-plan",
    response_model=AIGoalPlanResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate personalized goal-based savings cutback strategy",
)
def generate_goal_savings_plan(
    data: AIGoalPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return AIService.generate_goal_plan(
        db=db, user=current_user, target_amount=data.target_amount, target_months=data.target_months
    )


@router.get(
    "/provider-status",
    status_code=status.HTTP_200_OK,
    summary="Get active AI provider status",
)
def get_provider_status(
    current_user: User = Depends(get_current_user),
):
    provider = settings.AI_PROVIDER.lower().strip() if settings.AI_PROVIDER else "auto"
    has_gemini = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    has_openai = bool(settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip())

    active_engine = "Rule-based Engine (Offline)"
    if provider == "gemini" and has_gemini:
        active_engine = f"Google Gemini ({settings.AI_MODEL_NAME})"
    elif provider in ("openai", "groq", "deepseek", "ollama"):
        active_engine = f"{provider.capitalize()} ({settings.AI_MODEL_NAME})"
    elif provider == "auto":
        if has_gemini:
            active_engine = f"Google Gemini ({settings.AI_MODEL_NAME})"
        elif has_openai:
            active_engine = f"OpenAI Compatible ({settings.AI_MODEL_NAME})"

    return {
        "configured_provider": provider,
        "active_engine": active_engine,
        "model_name": settings.AI_MODEL_NAME,
        "is_ai_enabled": has_gemini or has_openai or bool(settings.AI_BASE_URL),
    }
