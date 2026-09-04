from datetime import date
from decimal import Decimal
from app.core.security import generate_email_verification_token


def _register_and_login(client, email, password):
    client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "display_name": "Debt Tester"},
    )
    token = generate_email_verification_token(email)
    client.post("/api/v1/auth/verify-email", json={"token": token})
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    access_token = res.json()["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


def test_debt_crud_and_partial_repayments(client):
    headers = _register_and_login(client, "debt_user1@example.com", "Password123!")

    # 1. Create a Lent Debt (Gave ₹5000 to Rahul)
    create_res = client.post(
        "/api/v1/debts",
        json={
            "person_name": "Rahul Sharma",
            "debt_type": "LENT",
            "initial_amount": 5000.00,
            "due_date": "2026-10-15",
            "notes": "Lent for Goa trip tickets",
        },
        headers=headers,
    )
    assert create_res.status_code == 201
    debt = create_res.json()
    assert debt["person_name"] == "Rahul Sharma"
    assert debt["debt_type"] == "LENT"
    assert float(debt["initial_amount"]) == 5000.0
    assert float(debt["remaining_amount"]) == 5000.0
    assert float(debt["total_repaid"]) == 0.0
    assert debt["status"] == "PENDING"
    debt_id = debt["id"]

    # 2. Check Summary
    summary_res = client.get("/api/v1/debts/summary", headers=headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert float(summary["total_lent_pending"]) == 5000.0
    assert summary["active_count"] == 1
    assert summary["settled_count"] == 0

    # 3. Add Partial Repayment 1 (Rahul returns ₹2,000 via UPI)
    rep1_res = client.post(
        f"/api/v1/debts/{debt_id}/repayments",
        json={
            "amount": 2000.00,
            "payment_date": str(date.today()),
            "payment_method": "UPI",
            "notes": "Paid first installment on GPay",
        },
        headers=headers,
    )
    assert rep1_res.status_code == 201
    updated_debt1 = rep1_res.json()
    assert float(updated_debt1["remaining_amount"]) == 3000.0
    assert float(updated_debt1["total_repaid"]) == 2000.0
    assert updated_debt1["status"] == "PARTIALLY_PAID"
    assert len(updated_debt1["repayments"]) == 1
    assert updated_debt1["repayments"][0]["payment_method"] == "UPI"

    # 4. Attempt to overpay (Repaying ₹4,000 when only ₹3,000 remains -> should fail 400)
    overpay_res = client.post(
        f"/api/v1/debts/{debt_id}/repayments",
        json={
            "amount": 4000.00,
            "payment_date": str(date.today()),
            "payment_method": "Cash",
        },
        headers=headers,
    )
    assert overpay_res.status_code == 400
    assert "exceeds remaining balance" in overpay_res.json()["detail"].lower()

    # 5. Add Final Repayment (Rahul returns remaining ₹3,000 via Cash)
    rep2_res = client.post(
        f"/api/v1/debts/{debt_id}/repayments",
        json={
            "amount": 3000.00,
            "payment_date": str(date.today()),
            "payment_method": "Cash",
            "notes": "Final settlement in cash",
        },
        headers=headers,
    )
    assert rep2_res.status_code == 201
    settled_debt = rep2_res.json()
    assert float(settled_debt["remaining_amount"]) == 0.0
    assert float(settled_debt["total_repaid"]) == 5000.0
    assert settled_debt["status"] == "SETTLED"
    assert len(settled_debt["repayments"]) == 2

    # 6. Check Summary after settlement
    summary_res2 = client.get("/api/v1/debts/summary", headers=headers)
    summary2 = summary_res2.json()
    assert float(summary2["total_lent_pending"]) == 0.0
    assert summary2["active_count"] == 0
    assert summary2["settled_count"] == 1

    # 7. Attempting to add repayment to settled debt fails (400)
    already_settled_res = client.post(
        f"/api/v1/debts/{debt_id}/repayments",
        json={
            "amount": 500.00,
            "payment_date": str(date.today()),
        },
        headers=headers,
    )
    assert already_settled_res.status_code == 400
    assert "already fully settled" in already_settled_res.json()["detail"].lower()

    # 8. Delete a repayment and verify remaining amount & status revert to PARTIALLY_PAID
    # Find the 3000 repayment to delete so remaining becomes 5000 - 2000 = 3000
    rep_3000 = next(r for r in settled_debt["repayments"] if float(r["amount"]) == 3000.0)
    delete_rep_res = client.delete(
        f"/api/v1/debts/{debt_id}/repayments/{rep_3000['id']}",
        headers=headers,
    )
    assert delete_rep_res.status_code == 200
    reverted_debt = delete_rep_res.json()
    assert float(reverted_debt["remaining_amount"]) == 3000.0
    assert float(reverted_debt["total_repaid"]) == 2000.0
    assert reverted_debt["status"] == "PARTIALLY_PAID"

    # 9. Delete Debt
    del_debt_res = client.delete(f"/api/v1/debts/{debt_id}", headers=headers)
    assert del_debt_res.status_code == 204


def test_debt_user_isolation(client):
    headers_user1 = _register_and_login(client, "user_iso1@example.com", "Password123!")
    headers_user2 = _register_and_login(client, "user_iso2@example.com", "Password123!")

    # User 1 creates a Borrowed Debt
    res = client.post(
        "/api/v1/debts",
        json={
            "person_name": "Aman",
            "debt_type": "BORROWED",
            "initial_amount": 10000.00,
        },
        headers=headers_user1,
    )
    assert res.status_code == 201
    debt_id = res.json()["id"]

    # User 2 cannot read or modify User 1's debt
    get_res = client.get(f"/api/v1/debts/{debt_id}", headers=headers_user2)
    assert get_res.status_code == 404

    repay_res = client.post(
        f"/api/v1/debts/{debt_id}/repayments",
        json={"amount": 1000.00, "payment_date": str(date.today())},
        headers=headers_user2,
    )
    assert repay_res.status_code == 404
