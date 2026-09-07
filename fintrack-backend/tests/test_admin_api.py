from datetime import date
from decimal import Decimal
from app.core.security import generate_email_verification_token


def _register_and_login(client, email, password, display_name="User"):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "display_name": display_name},
    )
    token = generate_email_verification_token(email)
    client.post("/api/v1/auth/verify-email", json={"token": token})
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    access_token = res.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_admin_access_control(client):
    # Regular user
    regular_headers = _register_and_login(client, "regular_user@example.com", "Password123!", "Regular User")
    
    # Superadmin user (dhutesamarth@gmail.com)
    admin_headers = _register_and_login(client, "dhutesamarth@gmail.com", "Password123!", "Samarth Dhute")

    # Regular user gets 403 Forbidden
    res = client.get("/api/v1/admin/stats", headers=regular_headers)
    assert res.status_code == 403

    res = client.get("/api/v1/admin/users", headers=regular_headers)
    assert res.status_code == 403

    # Superadmin gets 200 OK
    res = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total_users"] >= 2
    assert "total_spend_amount" in stats


def test_admin_users_and_activity(client):
    admin_headers = _register_and_login(client, "dhutesamarth@gmail.com", "Password123!", "Samarth Dhute")
    
    # Create another user with an expense
    user_headers = _register_and_login(client, "alice_shopper@example.com", "Password123!", "Alice Shopper")
    
    cat_res = client.get("/api/v1/categories", headers=user_headers)
    cat_id = cat_res.json()[0]["id"]

    pm_res = client.get("/api/v1/payment-methods", headers=user_headers)
    pm_id = pm_res.json()[0]["id"]

    exp_res = client.post(
        "/api/v1/expenses",
        json={
            "title": "Nike Sneakers",
            "amount": 4999.00,
            "category_id": cat_id,
            "payment_method_id": pm_id,
            "date": str(date.today()),
            "notes": "Admin test shopping",
        },
        headers=user_headers,
    )
    assert exp_res.status_code == 201

    # 1. Admin lists all users
    res = client.get("/api/v1/admin/users?search=alice", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 1
    alice = next((u for u in users if u["email"] == "alice_shopper@example.com"), None)
    assert alice is not None
    assert alice["expense_count"] >= 1
    assert float(alice["total_spent"]) >= 4999.00

    # 2. Admin inspects user detail
    detail_res = client.get(f"/api/v1/admin/users/{alice['id']}", headers=admin_headers)
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["user"]["email"] == "alice_shopper@example.com"
    assert len(detail["expenses"]) >= 1
    assert detail["expenses"][0]["title"] == "Nike Sneakers"

    # 3. Admin views platform expenses feed
    exp_feed = client.get("/api/v1/admin/expenses", headers=admin_headers)
    assert exp_feed.status_code == 200
    all_exp = exp_feed.json()
    assert any(e["title"] == "Nike Sneakers" for e in all_exp)
