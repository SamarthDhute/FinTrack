from datetime import date
from decimal import Decimal


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_auth_registration_and_login(client):
    # 1. Register new user
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "display_name": "Test User",
            "email": "test@example.com",
            "password": "Password123!",
        },
    )
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert "csrf_token" in data
    assert "refresh_token" in reg_res.cookies

    # 2. Duplicate registration fails
    dup_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "password": "Password123!",
        },
    )
    assert dup_res.status_code == 409

    # 3. Login with correct credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Login with wrong password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "test@example.com", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # 5. Access /me profile
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test@example.com"
    assert me_res.json()["display_name"] == "Test User"


def test_token_refresh_and_logout(client):
    # Register user
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"email": "refresh_test@example.com", "password": "Password123!"},
    )
    csrf_token = reg_res.json()["csrf_token"]
    raw_rt = reg_res.cookies.get("refresh_token")

    # 1. Refresh token with CSRF header
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        headers={"X-CSRF-Token": csrf_token},
        cookies={"refresh_token": raw_rt, "csrf_token": csrf_token},
    )
    assert refresh_res.status_code == 200
    new_token = refresh_res.json()["access_token"]
    assert new_token is not None
    new_rt = refresh_res.cookies.get("refresh_token")
    new_csrf = refresh_res.json()["csrf_token"]

    # 2. Old refresh token should now be revoked (rotation)
    revoked_res = client.post(
        "/api/v1/auth/refresh",
        headers={"X-CSRF-Token": csrf_token},
        cookies={"refresh_token": raw_rt, "csrf_token": csrf_token},
    )
    assert revoked_res.status_code == 401

    # 3. Logout
    logout_res = client.post(
        "/api/v1/auth/logout",
        cookies={"refresh_token": new_rt},
    )
    assert logout_res.status_code == 200

    # 4. Refresh after logout should fail
    after_logout_res = client.post(
        "/api/v1/auth/refresh",
        headers={"X-CSRF-Token": new_csrf},
        cookies={"refresh_token": new_rt, "csrf_token": new_csrf},
    )
    assert after_logout_res.status_code == 401


def test_password_management_flow(client):
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={"email": "pw_test@example.com", "password": "Password123!"},
    )

    # 1. Forgot password
    forgot_res = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "pw_test@example.com"},
    )
    assert forgot_res.status_code == 200

    # 2. Change password when authenticated
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "pw_test@example.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]

    change_res = client.post(
        "/api/v1/auth/change-password",
        headers={"Authorization": f"Bearer {token}"},
        json={"current_password": "Password123!", "new_password": "NewPassword456!"},
    )
    assert change_res.status_code == 200

    # 3. Old password fails
    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": "pw_test@example.com", "password": "Password123!"},
    )
    assert old_login.status_code == 401

    # 4. New password succeeds
    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": "pw_test@example.com", "password": "NewPassword456!"},
    )
    assert new_login.status_code == 200


def test_user_data_isolation(client):
    # Register User A
    user_a = client.post(
        "/api/v1/auth/register",
        json={"email": "usera@example.com", "password": "Password123!"},
    ).json()
    token_a = user_a["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register User B
    user_b = client.post(
        "/api/v1/auth/register",
        json={"email": "userb@example.com", "password": "Password123!"},
    ).json()
    token_b = user_b["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 1. User A creates custom category "A Private Category"
    cat_a = client.post(
        "/api/v1/categories",
        headers=headers_a,
        json={"name": "A Private Category"},
    ).json()
    cat_a_id = cat_a["id"]

    # 2. User B creates custom category with the same name (allowed per-user)
    cat_b = client.post(
        "/api/v1/categories",
        headers=headers_b,
        json={"name": "A Private Category"},
    )
    assert cat_b.status_code == 201

    # 3. User B cannot see User A's category by ID
    get_cat_b = client.get(f"/api/v1/categories/{cat_a_id}", headers=headers_b)
    assert get_cat_b.status_code == 404

    # 4. User A logs an expense
    pm_id = client.get("/api/v1/payment-methods").json()[0]["id"]
    exp_a = client.post(
        "/api/v1/expenses",
        headers=headers_a,
        json={
            "title": "User A Secret Spend",
            "category_id": cat_a_id,
            "payment_method_id": pm_id,
            "amount": 999.00,
            "date": date.today().isoformat(),
        },
    ).json()
    exp_a_id = exp_a["id"]

    # 5. User B cannot see User A's expense in list
    exp_list_b = client.get("/api/v1/expenses", headers=headers_b).json()
    assert exp_list_b["total"] == 0

    # 6. User B cannot access User A's expense by ID (403 Forbidden)
    exp_detail_b = client.get(f"/api/v1/expenses/{exp_a_id}", headers=headers_b)
    assert exp_detail_b.status_code == 403

    # 7. User B's dashboard summary shows 0 spend
    dash_b = client.get("/api/v1/dashboard/summary", headers=headers_b).json()
    assert float(dash_b["total_spend"]) == 0.00


def test_authenticated_expense_and_budget_crud(client):
    # 1. Register User
    reg_res = client.post(
        "/api/v1/auth/register",
        json={"email": "crud_user@example.com", "password": "Password123!"},
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check 10 default categories are seeded
    cats_res = client.get("/api/v1/categories", headers=headers)
    assert cats_res.status_code == 200
    cats = cats_res.json()
    assert len(cats) >= 10
    groceries_cat = next(c for c in cats if c["name"] == "Groceries")

    # 3. Create Budget
    budget_res = client.post(
        "/api/v1/budgets",
        headers=headers,
        json={
            "category_id": groceries_cat["id"],
            "amount_limit": 5000.00,
            "period": "monthly",
        },
    )
    assert budget_res.status_code == 201

    # 4. Log Expense
    pm_id = client.get("/api/v1/payment-methods").json()[0]["id"]
    exp_res = client.post(
        "/api/v1/expenses",
        headers=headers,
        json={
            "title": "Weekly Groceries",
            "category_id": groceries_cat["id"],
            "payment_method_id": pm_id,
            "amount": 1500.00,
            "date": date.today().isoformat(),
            "notes": "Vegetables and fruits",
        },
    )
    assert exp_res.status_code == 201
    exp_id = exp_res.json()["id"]

    # 5. Check dashboard reflection
    dash_res = client.get("/api/v1/dashboard/summary", headers=headers)
    assert dash_res.status_code == 200
    assert float(dash_res.json()["current_month_spend"]) == 1500.00

    # 6. Delete expense
    del_res = client.delete(f"/api/v1/expenses/{exp_id}", headers=headers)
    assert del_res.status_code == 200


def test_unauthenticated_requests_blocked(client):
    # All protected endpoints return 401 when no token is supplied
    assert client.get("/api/v1/categories").status_code == 401
    assert client.get("/api/v1/expenses").status_code == 401
    assert client.get("/api/v1/budgets").status_code == 401
    assert client.get("/api/v1/dashboard/summary").status_code == 401
    assert client.get("/api/v1/auth/me").status_code == 401
