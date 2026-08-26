from datetime import date
from decimal import Decimal


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_categories_crud(client):
    # 1. Create category
    response = client.post("/api/v1/categories", json={"name": "Groceries"})
    assert response.status_code == 201
    cat = response.json()
    assert cat["name"] == "Groceries"
    cat_id = cat["id"]

    # 2. Duplicate category validation
    dup_res = client.post("/api/v1/categories", json={"name": "Groceries"})
    assert dup_res.status_code == 400

    # 3. List categories
    list_res = client.get("/api/v1/categories")
    assert list_res.status_code == 200
    categories = list_res.json()
    assert len(categories) == 1

    # 4. Update category
    upd_res = client.put(f"/api/v1/categories/{cat_id}", json={"name": "Supermarket"})
    assert upd_res.status_code == 200
    assert upd_res.json()["name"] == "Supermarket"

    # 5. Delete category
    del_res = client.delete(f"/api/v1/categories/{cat_id}")
    assert del_res.status_code == 200


def test_payment_methods_list(client):
    response = client.get("/api/v1/payment-methods")
    assert response.status_code == 200
    methods = response.json()
    assert len(methods) >= 5
    names = [m["name"] for m in methods]
    assert "UPI" in names
    assert "Cash" in names


def test_budgets_and_expenses_integration(client):
    # 1. Create a category
    cat_res = client.post("/api/v1/categories", json={"name": "Dining Out"})
    cat_id = cat_res.json()["id"]

    # 2. Get payment method ID (UPI)
    pm_res = client.get("/api/v1/payment-methods")
    pm_id = pm_res.json()[0]["id"]

    # 3. Create Budget for Dining Out
    budget_res = client.post("/api/v1/budgets", json={
        "category_id": cat_id,
        "amount_limit": 5000.00,
        "period": "monthly"
    })
    assert budget_res.status_code == 201
    budget_id = budget_res.json()["id"]

    # 4. Create an Expense
    today_str = date.today().isoformat()
    exp_res = client.post("/api/v1/expenses", json={
        "title": "Dinner at Restaurant",
        "category_id": cat_id,
        "payment_method_id": pm_id,
        "amount": 1200.50,
        "date": today_str,
        "notes": "Team dinner"
    })
    assert exp_res.status_code == 201
    exp_id = exp_res.json()["id"]

    # 5. Verify Budget calculations updated
    budgets_res = client.get("/api/v1/budgets")
    assert budgets_res.status_code == 200
    budget_list = budgets_res.json()
    assert len(budget_list) == 1
    assert float(budget_list[0]["spent_amount"]) == 1200.50
    assert float(budget_list[0]["remaining_amount"]) == 3799.50
    assert budget_list[0]["status"] == "on_track"

    # 6. Verify Dashboard Summary & Charts
    dash_res = client.get("/api/v1/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert float(dash_data["current_month_spend"]) == 1200.50
    assert len(dash_data["recent_expenses"]) == 1

    breakdown_res = client.get("/api/v1/dashboard/charts/category")
    assert breakdown_res.status_code == 200
    breakdown_data = breakdown_res.json()
    assert len(breakdown_data) == 1
    assert breakdown_data[0]["category_name"] == "Dining Out"

    trend_res = client.get("/api/v1/dashboard/charts/trend")
    assert trend_res.status_code == 200

    # 7. Update Expense
    upd_exp = client.put(f"/api/v1/expenses/{exp_id}", json={"amount": 1500.00})
    assert upd_exp.status_code == 200
    assert float(upd_exp.json()["amount"]) == 1500.00

    # 8. Delete Expense & Budget
    del_exp = client.delete(f"/api/v1/expenses/{exp_id}")
    assert del_exp.status_code == 200

    del_bud = client.delete(f"/api/v1/budgets/{budget_id}")
    assert del_bud.status_code == 200


def test_expense_validations(client):
    # Setup category and payment method
    cat_res = client.post("/api/v1/categories", json={"name": "Travel"})
    cat_id = cat_res.json()["id"]
    pm_res = client.get("/api/v1/payment-methods")
    pm_id = pm_res.json()[0]["id"]

    # 1. Negative amount validation
    res = client.post("/api/v1/expenses", json={
        "title": "Taxi",
        "category_id": cat_id,
        "payment_method_id": pm_id,
        "amount": -50.0,
        "date": date.today().isoformat()
    })
    assert res.status_code == 422

    # 2. Future date validation
    future_date = "2099-01-01"
    res2 = client.post("/api/v1/expenses", json={
        "title": "Future Flight",
        "category_id": cat_id,
        "payment_method_id": pm_id,
        "amount": 200.0,
        "date": future_date
    })
    assert res2.status_code == 422
