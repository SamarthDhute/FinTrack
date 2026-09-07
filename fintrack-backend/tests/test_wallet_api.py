from datetime import date
from decimal import Decimal
from app.core.security import generate_email_verification_token


def _register_and_login(client, email, password):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "display_name": "Wallet Tester"},
    )
    token = generate_email_verification_token(email)
    client.post("/api/v1/auth/verify-email", json={"token": token})
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    access_token = res.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_wallet_seed_and_crud(client):
    headers = _register_and_login(client, "wallet_user1@example.com", "Password123!")

    # 1. Listing wallets seeds default "Main Bank Account" and "Cash in Hand"
    res = client.get("/api/v1/wallets", headers=headers)
    assert res.status_code == 200
    wallets = res.json()
    assert len(wallets) >= 2
    names = [w["name"] for w in wallets]
    assert "Main Bank Account" in names
    assert "Cash in Hand" in names

    # 2. Create custom wallet (HDFC Salary Account)
    create_res = client.post(
        "/api/v1/wallets",
        json={
            "name": "HDFC Salary",
            "wallet_type": "BANK",
            "balance": 50000.00,
            "currency": "INR",
            "color": "#3B82F6",
            "icon": "Building2",
            "is_default": True,
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    wallet = create_res.json()
    assert wallet["name"] == "HDFC Salary"
    assert float(wallet["balance"]) == 50000.00
    assert wallet["is_default"] is True
    wallet_id = wallet["id"]

    # 3. Check Summary
    summary_res = client.get("/api/v1/wallets/summary", headers=headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert float(summary["total_liquid_balance"]) >= 50000.00
    assert summary["wallets_count"] >= 3

    # 4. Update Wallet
    update_res = client.put(
        f"/api/v1/wallets/{wallet_id}",
        json={"name": "HDFC Primary Salary", "balance": 55000.00},
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "HDFC Primary Salary"
    assert float(update_res.json()["balance"]) == 55000.00

    # 5. Delete Wallet
    del_res = client.delete(f"/api/v1/wallets/{wallet_id}", headers=headers)
    assert del_res.status_code == 204


def test_wallet_transfer_funds(client):
    headers = _register_and_login(client, "wallet_user2@example.com", "Password123!")

    # 1. Create two wallets: Bank (₹20,000) and Cash (₹1,000)
    bank_res = client.post(
        "/api/v1/wallets",
        json={"name": "Axis Bank", "wallet_type": "BANK", "balance": 20000.00},
        headers=headers,
    )
    bank_id = bank_res.json()["id"]

    cash_res = client.post(
        "/api/v1/wallets",
        json={"name": "Pocket Cash", "wallet_type": "CASH", "balance": 1000.00},
        headers=headers,
    )
    cash_id = cash_res.json()["id"]

    # 2. Transfer ₹5,000 from Bank to Cash
    tx_res = client.post(
        "/api/v1/wallets/transfer",
        json={
            "from_wallet_id": bank_id,
            "to_wallet_id": cash_id,
            "amount": 5000.00,
            "transfer_date": str(date.today()),
            "notes": "ATM Cash Withdrawal",
        },
        headers=headers,
    )
    assert tx_res.status_code == 201

    # 3. Check updated balances
    b_updated = client.get(f"/api/v1/wallets/{bank_id}", headers=headers).json()
    c_updated = client.get(f"/api/v1/wallets/{cash_id}", headers=headers).json()

    assert float(b_updated["balance"]) == 15000.00
    assert float(c_updated["balance"]) == 6000.00

    # 4. Check Transaction Ledger
    logs_res = client.get("/api/v1/wallets/transactions/all", headers=headers)
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert logs["total_count"] >= 2


def test_expense_with_wallet_deduction(client):
    headers = _register_and_login(client, "wallet_user3@example.com", "Password123!")

    # 1. Create a Wallet with ₹10,000
    w_res = client.post(
        "/api/v1/wallets",
        json={"name": "Spend Wallet", "wallet_type": "WALLET", "balance": 10000.00},
        headers=headers,
    )
    w_id = w_res.json()["id"]

    # 2. Get categories and payment methods
    cats = client.get("/api/v1/categories", headers=headers).json()
    cat_id = cats[0]["id"]
    pms = client.get("/api/v1/payment-methods", headers=headers).json()
    pm_id = pms[0]["id"]

    # 3. Create an expense of ₹1,500 linked to this wallet
    exp_res = client.post(
        "/api/v1/expenses",
        json={
            "title": "Grocery Shopping",
            "amount": 1500.00,
            "category_id": cat_id,
            "payment_method_id": pm_id,
            "wallet_id": w_id,
            "date": str(date.today()),
        },
        headers=headers,
    )
    assert exp_res.status_code == 201
    exp_data = exp_res.json()
    assert exp_data["wallet_id"] == w_id
    assert exp_data["wallet_name"] == "Spend Wallet"
    exp_id = exp_data["id"]

    # 4. Check that wallet balance decreased from ₹10,000 to ₹8,500
    w_after = client.get(f"/api/v1/wallets/{w_id}", headers=headers).json()
    assert float(w_after["balance"]) == 8500.00

    # 5. Delete expense and verify ₹1,500 refund back to wallet
    del_res = client.delete(f"/api/v1/expenses/{exp_id}", headers=headers)
    assert del_res.status_code == 200

    w_refunded = client.get(f"/api/v1/wallets/{w_id}", headers=headers).json()
    assert float(w_refunded["balance"]) == 10000.00
