import json
import re
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import httpx

from app.core.config import settings
from app.schemas.ai_schema import (
    AIInsightsResponse,
    AIFinancialHealthScore,
    AIInsightItem,
    AIBudgetRecommendation,
    AICategorizeResponse,
    AIChatResponse,
    AIScanReceiptResponse,
    AISubscriptionItem,
    AISubscriptionsResponse,
    AIForecastResponse,
    AIGoalPlanResponse,
    CategoryCutback,
)


class BaseAIProvider(ABC):
    """Abstract interface for all AI engines."""

    @abstractmethod
    def generate_insights(self, context: Dict[str, Any]) -> AIInsightsResponse:
        pass

    @abstractmethod
    def categorize_expense(self, title: str, amount: Optional[float], categories: List[Dict[str, Any]]) -> AICategorizeResponse:
        pass

    @abstractmethod
    def chat_with_advisor(self, message: str, history: List[Dict[str, str]], context: Dict[str, Any]) -> AIChatResponse:
        pass

    @abstractmethod
    def scan_receipt_image(self, image_base64: str, mime_type: str, categories: List[Dict[str, Any]]) -> AIScanReceiptResponse:
        pass


class RuleBasedAIProvider(BaseAIProvider):
    """
    Offline heuristic analyzer.
    Used when no external AI API key is configured or as an instant offline fallback.
    """

    # Keyword mappings for auto-categorization
    KEYWORD_MAP = {
        "Food & Dining": ["swiggy", "zomato", "restaurant", "cafe", "coffee", "starbucks", "mcdonald", "burger", "pizza", "biryani", "lunch", "dinner", "breakfast", "groceries", "blinkit", "zepto", "instamart", "supermarket", "subway", "tea", "chai"],
        "Transportation": ["uber", "ola", "rapido", "petrol", "fuel", "diesel", "metro", "bus", "train", "flight", "indigo", "parking", "toll", "cab", "auto", "taxi", "irctc"],
        "Shopping": ["amazon", "flipkart", "myntra", "zara", "h&m", "clothes", "shoes", "mall", "electronics", "croma", "apple", "nike", "reliancedigital"],
        "Entertainment": ["netflix", "spotify", "prime", "movie", "cinema", "pvr", "bookmyshow", "hotstar", "youtube", "concert", "game", "steam", "playstation"],
        "Utilities": ["electricity", "water", "gas", "wifi", "broadband", "jio", "airtel", "recharge", "bill", "maintenance", "mobile", "cylinder"],
        "Health & Fitness": ["gym", "doctor", "hospital", "pharmacy", "medicine", "apollo", "1mg", "cult", "protein", "clinic", "lab", "dental"],
        "Personal Care": ["salon", "spa", "haircut", "parlour", "cosmetics", "skincare", "massage"],
        "Education": ["books", "course", "udemy", "coursera", "college", "tuition", "school", "exam", "stationery"],
    }

    def generate_insights(self, context: Dict[str, Any]) -> AIInsightsResponse:
        category_totals = context.get("category_totals", {})
        budget_status = context.get("budget_status", [])
        total_spent = sum(category_totals.values())

        insights = []
        recommendations = []

        # 1. Calculate Health Score
        score = 85
        over_budget_count = sum(1 for b in budget_status if b.get("is_over_budget"))
        near_budget_count = sum(1 for b in budget_status if b.get("is_near_budget") and not b.get("is_over_budget"))

        score -= over_budget_count * 20
        score -= near_budget_count * 10
        score = max(20, min(100, score))

        if score >= 80:
            health_status = "Excellent"
            health_summary = "Your spending is well-controlled and within healthy budgetary limits."
        elif score >= 60:
            health_status = "Good"
            health_summary = "Overall good spending habits, but a few categories need closer monitoring."
        elif score >= 40:
            health_status = "Needs Attention"
            health_summary = "You have exceeded or are close to exceeding multiple budget limits."
        else:
            health_status = "Critical"
            health_summary = "High risk of persistent overspending. Immediate budget adjustments recommended."

        # 2. Top Category Analysis
        top_category = None
        if category_totals:
            top_category = max(category_totals, key=category_totals.get)
            top_amount = category_totals[top_category]
            top_pct = (top_amount / total_spent * 100) if total_spent > 0 else 0

            if top_pct > 40:
                insights.append(
                    AIInsightItem(
                        title=f"High Concentration in {top_category}",
                        description=f"{top_category} accounts for {top_pct:.1f}% of your total expenses (₹{top_amount:,.2f}). Consider diversifying and capping discretionary items.",
                        category=top_category,
                        impact_type="warning",
                        estimated_savings=top_amount * 0.15,
                    )
                )
            else:
                insights.append(
                    AIInsightItem(
                        title=f"{top_category} is your highest expense",
                        description=f"You have spent ₹{top_amount:,.2f} ({top_pct:.1f}%) on {top_category} this month.",
                        category=top_category,
                        impact_type="tip",
                        estimated_savings=top_amount * 0.10,
                    )
                )

        # 3. Budget Utilization Insights
        for b in budget_status:
            c_name = b.get("category_name", "General")
            spent = b.get("spent", 0.0)
            limit = b.get("limit", 0.0)
            pct = b.get("percentage", 0.0)

            if b.get("is_over_budget"):
                insights.append(
                    AIInsightItem(
                        title=f"Budget Exceeded for {c_name}",
                        description=f"You have spent ₹{spent:,.2f} against a limit of ₹{limit:,.2f} ({pct:.1f}%). Pause non-essential spends in this category.",
                        category=c_name,
                        impact_type="warning",
                        estimated_savings=spent - limit,
                    )
                )
            elif b.get("is_near_budget"):
                insights.append(
                    AIInsightItem(
                        title=f"Approaching Limit for {c_name}",
                        description=f"You have utilized {pct:.1f}% (₹{spent:,.2f} / ₹{limit:,.2f}) of your {c_name} budget.",
                        category=c_name,
                        impact_type="warning",
                        estimated_savings=None,
                    )
                )

            suggested = round(spent * 1.1 if spent > 0 else limit, -2)
            recommendations.append(
                AIBudgetRecommendation(
                    category_name=c_name,
                    current_spending=spent,
                    suggested_budget=suggested if suggested > 0 else limit,
                    reasoning=f"Based on recent ₹{spent:,.2f} spend, recommended target is ₹{suggested:,.2f}."
                )
            )

        if not insights:
            insights.append(
                AIInsightItem(
                    title="Start Logging Daily Expenses",
                    description="Log transactions to unlock real-time financial health monitoring, savings tips, and budget alerts.",
                    category=None,
                    impact_type="tip",
                    estimated_savings=None,
                )
            )

        return AIInsightsResponse(
            health_score=AIFinancialHealthScore(
                score=score,
                status=health_status,
                summary=health_summary,
            ),
            key_insights=insights,
            budget_recommendations=recommendations[:4],
            top_spending_category=top_category,
            total_analyzed_spend=total_spent,
            provider_used="rules (Offline Engine)",
        )

    def _find_best_category_match(self, group_name: str, categories: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Intelligently map a canonical group name to the user's category list."""
        if not categories:
            return None
        # 1. Exact match (case-insensitive)
        for c in categories:
            if c["name"].strip().lower() == group_name.strip().lower():
                return c
        # 2. Substring or word overlap
        target_words = set(re.findall(r"\w+", group_name.lower()))
        for c in categories:
            c_words = set(re.findall(r"\w+", c["name"].lower()))
            if target_words & c_words:
                return c
        # 3. Check if either is substring of other
        for c in categories:
            if c["name"].lower() in group_name.lower() or group_name.lower() in c["name"].lower():
                return c
        return None

    def categorize_expense(self, title: str, amount: Optional[float], categories: List[Dict[str, Any]]) -> AICategorizeResponse:
        title_lower = title.lower()

        # 1. Direct match against category name in title
        for cat in categories:
            c_name_lower = cat["name"].lower()
            if c_name_lower in title_lower or any(w in title_lower for w in c_name_lower.split()):
                if len(c_name_lower) > 3:  # avoid 1-2 char false positives
                    return AICategorizeResponse(
                        suggested_category_id=cat["id"],
                        category_name=cat["name"],
                        confidence=0.92,
                        suggested_payment_method="UPI" if any(u in title_lower for u in ["gpay", "phonepe", "paytm", "upi"]) else None,
                        provider_used="rules",
                    )

        # 2. Match against known keyword groups
        for cat_group, keywords in self.KEYWORD_MAP.items():
            if any(k in title_lower for k in keywords):
                matched = self._find_best_category_match(cat_group, categories)
                if matched:
                    return AICategorizeResponse(
                        suggested_category_id=matched["id"],
                        category_name=matched["name"],
                        confidence=0.90,
                        suggested_payment_method="UPI" if any(u in title_lower for u in ["gpay", "phonepe", "paytm", "upi"]) else None,
                        provider_used="rules",
                    )

        # 3. Default fallback
        fallback_cat = categories[0] if categories else {"id": None, "name": "General"}
        return AICategorizeResponse(
            suggested_category_id=fallback_cat.get("id"),
            category_name=fallback_cat.get("name", "General"),
            confidence=0.50,
            provider_used="rules",
        )

    def chat_with_advisor(self, message: str, history: List[Dict[str, str]], context: Dict[str, Any]) -> AIChatResponse:
        msg_lower = message.lower().strip()
        total_spend = context.get("total_spending_30d", 0.0)
        daily_avg = context.get("daily_average_spend", round(total_spend / 30.0, 2))
        cat_totals = context.get("category_totals", {})
        budget_status = context.get("budget_status", [])
        pm_totals = context.get("payment_method_totals", {})
        recent_samples = context.get("recent_sample_transactions", [])
        top_expenses = context.get("top_highest_expenses", [])
        user_name = context.get("user_name", "there")
        
        top_cat = max(cat_totals, key=cat_totals.get) if cat_totals else "General"
        top_val = cat_totals.get(top_cat, 0.0)

        # 1. "Where did I spend the most?" / "Sabse zyada kahan kharch kiya?"
        if any(w in msg_lower for w in ["highest", "max", "sabse zyada", "sabse jyada", "sabse bada", "bada kharcha", "most", "top category", "top spend", "peak"]):
            if total_spend > 0:
                pct = (top_val / total_spend * 100) if total_spend > 0 else 0
                top_exp_lines = ""
                if top_expenses:
                    top_exp_lines = "\n\n**Top individual expenses this month:**\n" + "\n".join(
                        [f"• **{e['title']}**: ₹{e['amount']:,.2f} ({e.get('category', 'Other')}, {e.get('date', '')})" for e in top_expenses[:3]]
                    )

                reply = (
                    f"Is mahine aapka sabse zyada kharcha **{top_cat}** category me hua hai! 📊\n\n"
                    f"• **Category:** {top_cat}\n"
                    f"• **Amount:** ₹{top_val:,.2f}\n"
                    f"• **Share of Total:** {pct:.1f}% (Total ₹{total_spend:,.2f} me se)\n"
                    f"• **Daily Average:** ₹{daily_avg:,.2f}/day"
                    f"{top_exp_lines}\n\n"
                    f"💡 *Savings Tip: Agar aap {top_cat} me 15% cutback karenge, toh har mahine lagbhag ₹{(top_val * 0.15):,.0f} bacha sakte hain.*"
                )
                followups = [
                    f"How to reduce spending on {top_cat}?",
                    "Am I over budget in any category?",
                    "Show all payment methods breakdown",
                ]
            else:
                reply = "Aapne is mahine abhi tak koi expense log nahi kiya hai. Pehla expense add karne ke baad main aapko detailed category analytics dikha sakta hoon!"
                followups = ["How to set up a budget?", "Give me savings tips"]

        # 2. Lowest spending category / "Sabse kam kahan kharcha hua?"
        elif any(w in msg_lower for w in ["lowest", "min", "least", "sabse kam", "kam kharcha"]):
            if cat_totals:
                low_cat = min(cat_totals, key=cat_totals.get)
                low_val = cat_totals[low_cat]
                reply = (
                    f"Pichle 30 dino me aapka sabse kam kharcha **{low_cat}** category me hua hai:\n\n"
                    f"• **Category:** {low_cat}\n"
                    f"• **Total Spent:** ₹{low_val:,.2f}\n"
                    f"• **Share:** {(low_val / total_spend * 100 if total_spend > 0 else 0):.1f}%"
                )
                followups = [
                    "Where did I spend the most?",
                    "Show total monthly spend",
                    "Am I over budget?"
                ]
            else:
                reply = "Abhi tak koi category spending records available nahi hain."
                followups = ["Where did I spend the most?"]

        # 3. Category-specific query (e.g. "Food pe kitna spend kiya?", "Shopping", "Transport")
        elif any(c.lower() in msg_lower for c in cat_totals.keys()) or any(k in msg_lower for k in ["food", "dining", "khana", "zomato", "swiggy", "travel", "transport", "petrol", "shopping", "clothes", "bills", "utilities", "entertainment", "groceries", "health", "gym"]):
            matched_cat = None
            for c in cat_totals.keys():
                if c.lower() in msg_lower:
                    matched_cat = c
                    break
            
            if not matched_cat:
                # Synonym matching
                if any(k in msg_lower for k in ["food", "dining", "khana", "zomato", "swiggy"]):
                    matched_cat = next((c for c in cat_totals.keys() if "food" in c.lower() or "dining" in c.lower() or "groceries" in c.lower()), None)
                elif any(k in msg_lower for k in ["travel", "transport", "petrol"]):
                    matched_cat = next((c for c in cat_totals.keys() if "trans" in c.lower() or "travel" in c.lower() or "fuel" in c.lower()), None)
                elif any(k in msg_lower for k in ["shopping", "clothes"]):
                    matched_cat = next((c for c in cat_totals.keys() if "shop" in c.lower()), None)

            if matched_cat and matched_cat in cat_totals:
                cat_val = cat_totals[matched_cat]
                pct = (cat_val / total_spend * 100) if total_spend > 0 else 0
                
                # Check if this category has an active budget
                matched_budget = next((b for b in budget_status if b.get("category_name", "").lower() == matched_cat.lower()), None)
                budget_info = ""
                if matched_budget:
                    b_limit = matched_budget["limit"]
                    b_spent = matched_budget["spent"]
                    b_pct = matched_budget["percentage"]
                    b_rem = matched_budget["remaining"]
                    status_emoji = "⚠️ Over Budget" if matched_budget["is_over_budget"] else ("⚡ Near Limit" if matched_budget["is_near_budget"] else "✅ On Track")
                    budget_info = f"\n\n**Budget Status:**\n• **Limit:** ₹{b_limit:,.2f}\n• **Utilized:** ₹{b_spent:,.2f} ({b_pct:.0f}%)\n• **Remaining:** ₹{b_rem:,.2f} ({status_emoji})"

                reply = (
                    f"Aapne pichle 30 dino me **{matched_cat}** par total **₹{cat_val:,.2f}** kharch kiye hain ({pct:.1f}% of total spend).{budget_info}"
                )
                followups = [
                    f"How to cut down on {matched_cat}?",
                    "Where did I spend the most?",
                    "Show total monthly spend"
                ]
            else:
                reply = f"Mujhe aapke records me matching category spending nahi mili. Pichle 30 dino me aapka total spend **₹{total_spend:,.2f}** raha hai."
                followups = ["Where did I spend the most?", "Show all category breakdown"]

        # 4. "Payment methods" / "UPI vs Card vs Cash"
        elif any(w in msg_lower for w in ["upi", "cash", "card", "payment method", "net banking", "wallet", "kisse pay"]):
            if pm_totals:
                pm_lines = [f"• **{k}:** ₹{v:,.2f} ({(v / total_spend * 100 if total_spend > 0 else 0):.1f}%)" for k, v in sorted(pm_totals.items(), key=lambda x: x[1], reverse=True)]
                reply = (
                    f"💳 **Payment Methods Breakdown (Last 30 Days):**\n\n" +
                    "\n".join(pm_lines) +
                    f"\n\n• **Total Transactions Spend:** ₹{total_spend:,.2f}"
                )
            else:
                reply = "Payment methods data abhi available nahi hai. Aap new expense add karte waqt payment method select kar sakte hain."
            followups = [
                "Where did I spend the most?",
                "Am I over budget?",
                "Show recent expenses"
            ]

        # 5. "Recent expenses" / "Last 5 transactions"
        elif any(w in msg_lower for w in ["recent", "latest", "last transaction", "aakhri kharche", "transactions", "pichle transaction", "history"]):
            if recent_samples:
                tx_lines = [
                    f"• **{tx['title']}** — ₹{tx['amount']:,.2f} ({tx.get('category', 'Other')} via {tx.get('payment_method', 'Cash')} on {tx['date']})"
                    for tx in recent_samples[:5]
                ]
                reply = (
                    f"🕒 **Recent Transactions (Last 5):**\n\n" +
                    "\n".join(tx_lines) +
                    f"\n\nTotal {context.get('transaction_count', len(recent_samples))} logged transactions in last 30 days."
                )
            else:
                reply = "Aapne abhi tak koi recent transaction log nahi kiya hai."
            followups = [
                "Where did I spend the most?",
                "What is my total spend?",
                "Give me savings tips"
            ]

        # 6. "Budget cross hua?" / "Over-budget" / "Limit"
        elif any(w in msg_lower for w in ["budget", "cross", "limit", "exceed", "overbudget", "over budget", "kya limit"]):
            over_budgets = [b for b in budget_status if b.get("is_over_budget")]
            near_budgets = [b for b in budget_status if b.get("is_near_budget") and not b.get("is_over_budget")]
            
            if over_budgets:
                over_lines = [f"• 🚨 **{b['category_name']}**: Spent ₹{b['spent']:,.2f} / Limit ₹{b['limit']:,.2f} ({b['percentage']:.0f}%)" for b in over_budgets]
                near_lines = [f"• ⚠️ **{b['category_name']}**: Spent ₹{b['spent']:,.2f} / Limit ₹{b['limit']:,.2f} ({b['percentage']:.0f}%)" for b in near_budgets]
                
                reply = (
                    f"⚠️ **Budget Alert!** Aapke **{len(over_budgets)}** category me budget limit exceed ho chuki hai:\n\n" +
                    "\n".join(over_lines) +
                    (("\n\n**Approaching Limit:**\n" + "\n".join(near_lines)) if near_lines else "") +
                    "\n\n💡 *Action: In categories me discretionary transactions ko pause karein taaki month-end deficit na ho.*"
                )
            elif near_budgets:
                near_lines = [f"• ⚠️ **{b['category_name']}**: Spent ₹{b['spent']:,.2f} / Limit ₹{b['limit']:,.2f} ({b['percentage']:.0f}%)" for b in near_budgets]
                reply = (
                    f"⚡ **Caution:** Koi budget exceed nahi hua hai, par aap **{len(near_budgets)}** category me limit ke kareeb (≥80%) hain:\n\n" +
                    "\n".join(near_lines)
                )
            elif budget_status:
                reply = f"✅ **Badhai ho!** Aapke saare **{len(budget_status)}** active category budgets control me hain aur koi bhi limit cross nahi hui hai."
            else:
                reply = "Aapne abhi tak koi monthly category budget set nahi kiya hai. Budget set karke aap overspending alerts pa sakte hain!"

            followups = [
                "Suggest new category budgets",
                "Where did I spend the most?",
                "How to save money?"
            ]

        # 7. "Total spend kitna hai?" / "Overall expenses"
        elif any(w in msg_lower for w in ["total", "spend", "kharcha", "kitna", "overall", "hisab", "kull"]):
            cat_summary_lines = [f"• **{k}:** ₹{v:,.2f} ({(v / total_spend * 100 if total_spend > 0 else 0):.1f}%)" for k, v in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:4]]
            breakdown_str = "\n".join(cat_summary_lines) if cat_summary_lines else "• Abhi tak koi spend data nahi hai."
            
            prev_total = context.get("total_spending_prev_period", 0.0)
            diff_str = ""
            if prev_total > 0:
                diff_pct = ((total_spend - prev_total) / prev_total) * 100
                diff_emoji = "🔺" if diff_pct > 0 else "🔻"
                diff_str = f"\n• **MoM Trend:** {diff_emoji} {abs(diff_pct):.1f}% vs previous period (₹{prev_total:,.2f})"

            reply = (
                f"📊 **Financial Overview (Last 30 Days):**\n\n"
                f"• **Total Spend:** ₹{total_spend:,.2f}\n"
                f"• **Daily Average:** ₹{daily_avg:,.2f}/day{diff_str}\n\n"
                f"**Top Categories Breakdown:**\n{breakdown_str}\n\n"
                f"Leading category **{top_cat}** par control rakhkar aap har mahine bachat badha sakte hain."
            )
            followups = [
                "Sabse zyada kahan kharch kiya?",
                "Am I over budget?",
                "Give me savings tips"
            ]

        # 8. "Save kaise karein?" / "Bachat tips" / "How to save"
        elif any(w in msg_lower for w in ["save", "saving", "bachat", "tip", "kam kaise", "cut", "reduce", "5000", "10000"]):
            potential_save = top_val * 0.15
            reply = (
                f"💰 **Personalized Savings Recommendations:**\n\n"
                f"1. **{top_cat} Optimization:** Yeh aapka sabse bada expense hai (₹{top_val:,.2f}). Isme 15% cut karke aap monthly **₹{potential_save:,.2f}** bacha sakte hain.\n"
                f"2. **50/30/20 Rule:** Apni income ka 50% Needs (Rent, Utilities, Food), 30% Wants (Shopping, Dining out), aur 20% Direct Savings/SIP me allocate karein.\n"
                f"3. **Daily Budget Cap:** Aapka current daily average ₹{daily_avg:,.0f} hai. Isko ₹{max(100, daily_avg * 0.85):,.0f} par target karein.\n"
                f"4. **Subscription Audit:** Har mahine unused OTT aur gym subscriptions audit karein."
            )
            followups = [
                "Where did I spend the most?",
                "Am I over budget?",
                "Show all category breakdown"
            ]

        # 9. Default conversational helper
        else:
            reply = (
                f"Namaste {user_name}! Main aapka **FinTrack AI Financial Advisor** hoon. 🤖\n\n"
                f"• **Last 30 Days Spend:** ₹{total_spend:,.2f}\n"
                f"• **Daily Average:** ₹{daily_avg:,.2f}/day\n"
                f"• **Top Expense Category:** {top_cat} (₹{top_val:,.2f})\n"
                f"• **Active Budgets:** {len(budget_status)}\n\n"
                f"Aap mujhse natural language me koi bhi question pooch sakte hain jaise: *'Is mahine maine sabse zyada kahan kharch kiya?'*, *'Food pe kitna spend hua?'* ya *'Bachat kaise karein?'*."
            )
            followups = [
                "Is mahine maine sabse zyada kahan kharch kiya?",
                "Am I over budget?",
                "How can I save ₹5,000 this month?"
            ]

        return AIChatResponse(reply=reply, quick_followups=followups, provider_used="rules (Offline Engine)")

    def scan_receipt_image(self, image_base64: str, mime_type: str, categories: List[Dict[str, Any]]) -> AIScanReceiptResponse:
        # Graceful fallback when vision API is unreachable
        default_cat = categories[0] if categories else {"id": None, "name": "Shopping"}
        return AIScanReceiptResponse(
            title="Receipt (Review & verify)",
            amount=None,
            date=None,
            category_id=default_cat.get("id"),
            category_name=default_cat.get("name", "Shopping"),
            merchant_name=None,
            payment_method_hint=None,
            confidence=0.0,
            provider_used="Manual Review Required",
        )


class GeminiAIProvider(BaseAIProvider):
    """Google Gemini AI integration (gemini-3.5-flash / gemini-3.5-flash-lite)."""

    def __init__(self, api_key: str, model_name: str = "gemini-3.5-flash"):
        self.api_key = api_key
        self.model_name = model_name or "gemini-3.5-flash"

    def _call_gemini_json(self, system_instruction: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        models_to_try = [self.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite"]
        for m in dict.fromkeys(models_to_try):
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_instruction}\n\n{user_prompt}"}]
                    }
                ],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
            }
            try:
                with httpx.Client(timeout=20.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code < 400:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                raw = parts[0].get("text", "")
                                clean_json = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
                                clean_json = re.sub(r"\s*```$", "", clean_json)
                                return json.loads(clean_json)
            except Exception as exc:
                print(f"[WARNING] Gemini API attempt ({m}) error: {exc}")
        return None

    def generate_insights(self, context: Dict[str, Any]) -> AIInsightsResponse:
        system_instruction = (
            "You are a senior personal finance advisor for FinTrack. "
            "Analyze the user's spending context and return STRICT VALID JSON matching this schema:\n"
            "{\n"
            '  "health_score": {"score": int (0-100), "status": "Excellent"|"Good"|"Needs Attention"|"Critical", "summary": "string"},\n'
            '  "key_insights": [{"title": "string", "description": "string", "category": "string or null", "impact_type": "saving"|"warning"|"tip"|"praise", "estimated_savings": float or null}],\n'
            '  "budget_recommendations": [{"category_name": "string", "current_spending": float, "suggested_budget": float, "reasoning": "string"}],\n'
            '  "top_spending_category": "string or null",\n'
            '  "total_analyzed_spend": float\n'
            "}\nCurrency is INR (₹)."
        )
        parsed = self._call_gemini_json(system_instruction, f"Financial Context:\n{json.dumps(context, indent=2)}")
        if parsed:
            parsed["provider_used"] = f"Gemini ({self.model_name})"
            return AIInsightsResponse(**parsed)
        return RuleBasedAIProvider().generate_insights(context)

    def categorize_expense(self, title: str, amount: Optional[float], categories: List[Dict[str, Any]]) -> AICategorizeResponse:
        cats_list = [{"id": c["id"], "name": c["name"]} for c in categories]
        system_prompt = (
            "You are a financial transaction categorizer. Given an expense description and available categories, "
            "select the single best matching category. Return STRICT JSON:\n"
            '{"suggested_category_id": int or null, "category_name": "string", "confidence": float (0.0-1.0), "suggested_payment_method": "Cash"|"Card"|"UPI"|"Net Banking"|"Wallet"|null}'
        )
        user_prompt = f"Description: '{title}', Amount: {amount}\nAvailable Categories: {json.dumps(cats_list)}"
        parsed = self._call_gemini_json(system_prompt, user_prompt)
        if parsed:
            parsed["provider_used"] = f"Gemini ({self.model_name})"
            return AICategorizeResponse(**parsed)
        return RuleBasedAIProvider().categorize_expense(title, amount, categories)

    def chat_with_advisor(self, message: str, history: List[Dict[str, str]], context: Dict[str, Any]) -> AIChatResponse:
        models_to_try = [self.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite"]
        system_text = (
            "You are FinTrack AI, a helpful, intelligent personal financial advisor. "
            "Answer the user's questions clearly using their live financial context below. "
            "Support English, Hindi, and Hinglish seamlessly. Keep answers concise, friendly, accurate, and actionable. "
            "Format responses cleanly with Markdown bold numbers, bullet points, and emojis. "
            "Return JSON matching schema: {'reply': 'markdown string with bold numbers', 'quick_followups': ['question1', 'question2']}\n\n"
            f"User Financial Data Context:\n{json.dumps(context, indent=2)}"
        )

        # Build valid multi-turn contents
        contents = []
        if history:
            for h in history[-4:]:
                role = "model" if h.get("role") == "assistant" else "user"
                content_text = h.get("content", "")
                if content_text:
                    contents.append({"role": role, "parts": [{"text": content_text}]})

        # Append current user question with system context
        if not contents:
            contents.append({"role": "user", "parts": [{"text": f"{system_text}\n\nUser Question: {message}"}]})
        else:
            contents.append({"role": "user", "parts": [{"text": f"Context: {json.dumps(context)}\n\nUser Question: {message}"}]})

        for m in dict.fromkeys(models_to_try):
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            try:
                with httpx.Client(timeout=20.0) as client:
                    resp = client.post(url, json={
                        "contents": contents,
                        "generationConfig": {"temperature": 0.3, "responseMimeType": "application/json"}
                    })
                    if resp.status_code < 400:
                        raw = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                        clean_json = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
                        clean_json = re.sub(r"\s*```$", "", clean_json)
                        parsed = json.loads(clean_json)
                        return AIChatResponse(
                            reply=parsed.get("reply", ""),
                            quick_followups=parsed.get("quick_followups", []),
                            provider_used=f"Gemini ({m})",
                        )
            except Exception as exc:
                print(f"[WARNING] Gemini chat attempt ({m}) error: {exc}")

        return RuleBasedAIProvider().chat_with_advisor(message, history, context)

    def scan_receipt_image(self, image_base64: str, mime_type: str, categories: List[Dict[str, Any]]) -> AIScanReceiptResponse:
        models_to_try = [self.model_name, "gemini-3.5-flash", "gemini-3.5-flash-lite"]
        cats_list = [{"id": c["id"], "name": c["name"]} for c in categories]

        prompt_text = (
            "You are an expert OCR receipt & invoice extractor for FinTrack. "
            "Analyze the image very carefully to identify the merchant/store, final total amount, transaction date, category, and payment method.\n\n"
            "Return STRICT VALID JSON matching this exact structure:\n"
            "{\n"
            '  "merchant_name": "Name of store/vendor/restaurant (e.g. Starbucks, Swiggy, DMart, Shell, Reliance)",\n'
            '  "title": "Clear concise expense title (e.g. Starbucks Coffee, Swiggy Order, Grocery Shopping)",\n'
            '  "amount": float (final total payable bill amount, e.g. 450.50. Extract Grand Total, Total, Net Payable, or Amount Paid. Exclude currency symbols),\n'
            '  "date": "YYYY-MM-DD" (Convert any receipt date like DD/MM/YYYY or 15-Aug-2025 to standard YYYY-MM-DD. Return null if no date),\n'
            '  "category_name": "Select the single closest matching category from the available categories list",\n'
            '  "category_id": int or null (matching id from available categories list),\n'
            '  "payment_method_hint": "Cash"|"Card"|"UPI"|"Net Banking"|"Wallet"|null (if payment type or UPI ID or Visa/Mastercard/Cash is mentioned on bill),\n'
            '  "confidence": float (0.0 to 1.0 based on clarity of receipt text)\n'
            "}\n\n"
            f"Available Categories: {json.dumps(cats_list)}"
        )

        clean_b64 = image_base64.split(",")[-1] if "," in image_base64 else image_base64
        # Remove any whitespace or newlines in base64
        clean_b64 = re.sub(r"\s+", "", clean_b64)

        # Standardize mime type
        valid_mime = mime_type if mime_type and mime_type.startswith("image/") else "image/jpeg"
        if "png" in valid_mime.lower():
            valid_mime = "image/png"
        elif "webp" in valid_mime.lower():
            valid_mime = "image/webp"
        else:
            valid_mime = "image/jpeg"

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text},
                        {
                            "inlineData": {
                                "mimeType": valid_mime,
                                "data": clean_b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }

        for m in dict.fromkeys(models_to_try):
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={self.api_key}"
            try:
                with httpx.Client(timeout=25.0) as client:
                    resp = client.post(url, json=payload)
                    if resp.status_code < 400:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts:
                                raw = parts[0].get("text", "")
                                clean_json = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.IGNORECASE)
                                clean_json = re.sub(r"\s*```$", "", clean_json)
                                parsed = json.loads(clean_json)

                                # 1. Clean and sanitize amount
                                raw_amt = parsed.get("amount")
                                parsed_amt = None
                                if raw_amt is not None:
                                    try:
                                        if isinstance(raw_amt, (int, float)):
                                            parsed_amt = float(raw_amt)
                                        else:
                                            cleaned_num = re.sub(r"[^\d.]", "", str(raw_amt))
                                            parsed_amt = float(cleaned_num) if cleaned_num else None
                                    except Exception:
                                        parsed_amt = None

                                # 2. Map and validate category
                                cat_id = parsed.get("category_id")
                                cat_name = parsed.get("category_name")
                                matched_cat = None

                                if cat_id:
                                    matched_cat = next((c for c in categories if c["id"] == cat_id), None)
                                if not matched_cat and cat_name:
                                    matched_cat = next((c for c in categories if c["name"].lower() == cat_name.lower()), None)
                                    if not matched_cat:
                                        matched_cat = next((c for c in categories if cat_name.lower() in c["name"].lower() or c["name"].lower() in cat_name.lower()), None)

                                if matched_cat:
                                    final_cat_id = matched_cat["id"]
                                    final_cat_name = matched_cat["name"]
                                elif categories:
                                    final_cat_id = categories[0]["id"]
                                    final_cat_name = categories[0]["name"]
                                else:
                                    final_cat_id = None
                                    final_cat_name = "Shopping"

                                # 3. Sanitize date (YYYY-MM-DD)
                                raw_date = parsed.get("date")
                                final_date = None
                                if raw_date and isinstance(raw_date, str):
                                    raw_date = raw_date.strip()
                                    if re.match(r"^\d{4}-\d{2}-\d{2}$", raw_date):
                                        final_date = raw_date
                                    else:
                                        # Try DD/MM/YYYY or DD-MM-YYYY
                                        dm = re.match(r"^(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})$", raw_date)
                                        if dm:
                                            d, mo, y = dm.group(1), dm.group(2), dm.group(3)
                                            final_date = f"{y}-{int(mo):02d}-{int(d):02d}"

                                # 4. Title & Merchant
                                merchant = parsed.get("merchant_name") or ""
                                title = parsed.get("title") or merchant or "Scanned Expense"

                                return AIScanReceiptResponse(
                                    title=title,
                                    amount=parsed_amt,
                                    date=final_date,
                                    category_id=final_cat_id,
                                    category_name=final_cat_name,
                                    merchant_name=merchant or None,
                                    payment_method_hint=parsed.get("payment_method_hint"),
                                    confidence=float(parsed.get("confidence", 0.9)),
                                    provider_used=f"Gemini Vision ({m})",
                                )
                    else:
                        print(f"[WARNING] Gemini Vision attempt ({m}) failed with HTTP {resp.status_code}: {resp.text[:200]}")
            except Exception as exc:
                print(f"[WARNING] Gemini Vision receipt scanning ({m}) error: {exc}")

        return RuleBasedAIProvider().scan_receipt_image(image_base64, mime_type, categories)


class OpenAICompatibleProvider(BaseAIProvider):
    """OpenAI, Groq, DeepSeek, or Ollama compatibility provider."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini", base_url: Optional[str] = None):
        self.api_key = api_key
        self.model_name = model_name or "gpt-4o-mini"
        self.base_url = (base_url.rstrip("/") if base_url else "https://api.openai.com/v1") + "/chat/completions"

    def _call_openai_json(self, system_prompt: str, user_prompt: str) -> Optional[Dict[str, Any]]:
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(self.base_url, headers=headers, json=payload)
                if resp.status_code < 400:
                    content = resp.json()["choices"][0]["message"]["content"]
                    return json.loads(content)
        except Exception as exc:
            print(f"[WARNING] OpenAI-compatible error: {exc}")
        return None

    def generate_insights(self, context: Dict[str, Any]) -> AIInsightsResponse:
        system_prompt = (
            "You are a certified senior personal finance advisor for FinTrack. "
            "Analyze spending data and return JSON matching: "
            "{health_score: {score: int, status: str, summary: str}, key_insights: [...], budget_recommendations: [...], top_spending_category: str, total_analyzed_spend: float}."
        )
        parsed = self._call_openai_json(system_prompt, f"Financial Context:\n{json.dumps(context, indent=2)}")
        if parsed:
            parsed["provider_used"] = f"OpenAI Compatible ({self.model_name})"
            return AIInsightsResponse(**parsed)
        return RuleBasedAIProvider().generate_insights(context)

    def categorize_expense(self, title: str, amount: Optional[float], categories: List[Dict[str, Any]]) -> AICategorizeResponse:
        cats_list = [{"id": c["id"], "name": c["name"]} for c in categories]
        system_prompt = "Return JSON matching: {suggested_category_id: int, category_name: str, confidence: float, suggested_payment_method: str|null}."
        user_prompt = f"Description: '{title}', Amount: {amount}\nCategories: {json.dumps(cats_list)}"
        parsed = self._call_openai_json(system_prompt, user_prompt)
        if parsed:
            parsed["provider_used"] = f"OpenAI Compatible ({self.model_name})"
            return AICategorizeResponse(**parsed)
        return RuleBasedAIProvider().categorize_expense(title, amount, categories)

    def chat_with_advisor(self, message: str, history: List[Dict[str, str]], context: Dict[str, Any]) -> AIChatResponse:
        system_prompt = f"You are FinTrack AI advisor. Answer user's question using their financial data: {json.dumps(context)}. Return JSON: {{'reply': 'markdown text', 'quick_followups': ['q1', 'q2']}}."
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-6:]:
            messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
        messages.append({"role": "user", "content": message})

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(self.base_url, headers=headers, json={
                    "model": self.model_name,
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": 0.4
                })
                if resp.status_code < 400:
                    parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                    return AIChatResponse(
                        reply=parsed.get("reply", ""),
                        quick_followups=parsed.get("quick_followups", []),
                        provider_used=f"OpenAI Compatible ({self.model_name})",
                    )
        except Exception as exc:
            print(f"[WARNING] OpenAI chat error: {exc}")
        return RuleBasedAIProvider().chat_with_advisor(message, history, context)

    def scan_receipt_image(self, image_base64: str, mime_type: str, categories: List[Dict[str, Any]]) -> AIScanReceiptResponse:
        cats_list = [{"id": c["id"], "name": c["name"]} for c in categories]
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        prompt_text = f"Extract receipt fields into JSON: {{title: str, amount: float, date: YYYY-MM-DD, category_id: int, category_name: str, merchant_name: str, payment_method_hint: str, confidence: float}}. Categories: {json.dumps(cats_list)}"

        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt_text},
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_base64}"}}
                    ]
                }
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        try:
            with httpx.Client(timeout=20.0) as client:
                resp = client.post(self.base_url, headers=headers, json=payload)
                if resp.status_code < 400:
                    parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                    parsed["provider_used"] = f"OpenAI Vision ({self.model_name})"
                    return AIScanReceiptResponse(**parsed)
        except Exception as exc:
            print(f"[WARNING] OpenAI vision error: {exc}")
        return RuleBasedAIProvider().scan_receipt_image(image_base64, mime_type, categories)


def get_ai_provider() -> BaseAIProvider:
    """Factory creating the configured AI provider based on environment settings."""
    provider_type = settings.AI_PROVIDER.lower().strip() if settings.AI_PROVIDER else "auto"

    if provider_type == "gemini":
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            return GeminiAIProvider(api_key=settings.GEMINI_API_KEY.strip(), model_name=settings.AI_MODEL_NAME)
        return RuleBasedAIProvider()

    if provider_type in ("openai", "groq", "deepseek", "ollama"):
        api_key = settings.OPENAI_API_KEY or "no-key"
        base_url = settings.AI_BASE_URL
        if provider_type == "groq" and not base_url:
            base_url = "https://api.groq.com/openai/v1"
        elif provider_type == "deepseek" and not base_url:
            base_url = "https://api.deepseek.com/v1"
        elif provider_type == "ollama" and not base_url:
            base_url = "http://localhost:11434/v1"

        return OpenAICompatibleProvider(api_key=api_key, model_name=settings.AI_MODEL_NAME, base_url=base_url)

    if provider_type == "auto":
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip():
            return GeminiAIProvider(api_key=settings.GEMINI_API_KEY.strip(), model_name=settings.AI_MODEL_NAME)
        if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.strip():
            return OpenAICompatibleProvider(api_key=settings.OPENAI_API_KEY.strip(), model_name=settings.AI_MODEL_NAME, base_url=settings.AI_BASE_URL)

    return RuleBasedAIProvider()
