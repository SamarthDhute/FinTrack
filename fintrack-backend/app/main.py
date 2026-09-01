from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.controllers.auth_controller import limiter, router as auth_router
from app.controllers.category_controller import router as category_router
from app.controllers.payment_method_controller import router as payment_method_router
from app.controllers.budget_controller import router as budget_router
from app.controllers.expense_controller import router as expense_router
from app.controllers.dashboard_controller import router as dashboard_router

app = FastAPI(
    title="FinTrack API",
    description="Personal Expense Tracker REST API - Built with FastAPI & SQLAlchemy 2.x",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# SlowAPI rate limiting state and exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
def health_check():
    """
    Health check endpoint for container and uptime monitoring.
    """
    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "version": "2.0.0",
    }


# Mount feature controllers under /api/v1
app.include_router(auth_router, prefix="/api/v1")
app.include_router(category_router, prefix="/api/v1")
app.include_router(payment_method_router, prefix="/api/v1")
app.include_router(budget_router, prefix="/api/v1")
app.include_router(expense_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
