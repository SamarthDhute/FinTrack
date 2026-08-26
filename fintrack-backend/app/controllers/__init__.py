from app.controllers.category_controller import router as category_router
from app.controllers.payment_method_controller import router as payment_method_router
from app.controllers.budget_controller import router as budget_router
from app.controllers.expense_controller import router as expense_router
from app.controllers.dashboard_controller import router as dashboard_router

__all__ = [
    "category_router",
    "payment_method_router",
    "budget_router",
    "expense_router",
    "dashboard_router",
]
