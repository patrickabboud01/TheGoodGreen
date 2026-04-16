/**
 * Checkout Business Logic
 * Pricing, order building, promo validation, and order submission
 */

// Email JS initialization
(function() {
    if (typeof emailjs !== 'undefined') {
        emailjs.init("O38XtdcMyAkWnvsoU");
    }
})();

// Plan pricing table
const PLAN_PRICE_BOOK = {
    "THE SOLO": { "1": 8.5, "6": 42, "24": 200 },
    "THE DUO": { "1": 17, "6": 85, "24": 300 },
    "THE TRIO": { "1": 22, "6": 100, "24": 340 },
    "THE FULL PLAN": { "1": 25, "6": 110, "24": 400 }
};

/**
 * Determine plan name from order composition
 */
function determinePlanName(mealsPerDay) {
    if (mealsPerDay > 3.5) return "THE FULL PLAN";
    if (mealsPerDay > 2.5) return "THE TRIO";
    if (mealsPerDay > 1.5) return "THE DUO";
    return "THE SOLO";
}

/**
 * Determine duration key (1, 6, or 24 days)
 */
function determineDurationKey(requestedDays) {
    if (requestedDays >= 24) return "24";
    if (requestedDays >= 2) return "6";
    return "1";
}

/**
 * Calculate final price for plan
 */
function calculatePlanPrice(finalName, durationKey) {
    return PLAN_PRICE_BOOK[finalName]?.[durationKey] || 0;
}

/**
 * Validate promo code
 */
async function validatePromoCode(code, userEmail, userPhone, durationKey) {
    // Only valid for 1-day and 6-day plans, not 24-day
    if (durationKey === "24") {
        return {
            valid: false,
            message: "Promo codes are not valid for 24-day plans."
        };
    }

    // Code must be TGG20
    if (code !== "TGG20") {
        return {
            valid: false,
            message: "Invalid promo code."
        };
    }

    // User must be logged in
    if (!userEmail) {
        return {
            valid: false,
            message: "Please login to use a promo code.",
            requiresLogin: true
        };
    }

    // User must be new (no previous orders)
    try {
        const { count } = await getOrderCount(userPhone);
        if (count && count > 0) {
            return {
                valid: false,
                message: "This code is for new customers only."
            };
        }
    } catch (error) {
        console.error("Error checking order history:", error);
        return {
            valid: false,
            message: "Error validating promo code."
        };
    }

    // Code is valid
    return {
        valid: true,
        message: "Promo code applied!",
        discountPercent: 0.20
    };
}

/**
 * Calculate discount amount
 */
function calculateDiscount(basePrice, discountPercent) {
    return Math.round(basePrice * discountPercent * 10) / 10;
}

/**
 * Build order items from cart
 */
function buildOrderItemsFromSingleCart(singleOrderCart, orderId) {
    return singleOrderCart.map(item => ({
        order_id: orderId,
        day_number: 1,
        meal_name: item.name,
        choice: `Qty: ${item.qty}`,
        removed_ingredients: '',
        special_instructions: "Single Menu Order"
    }));
}

/**
 * Build order items from meal plan
 */
function buildOrderItemsFromMealPlan(fullState, orderId) {
    const items = [];

    Object.keys(fullState).forEach(day => {
        fullState[day].forEach(m => {
            items.push({
                order_id: orderId,
                day_number: parseInt(day),
                meal_name: m.name,
                choice: m.selectedChoices?.join(', ') || '',
                removed_ingredients: m.removedIngredients?.join(', ') || '',
                special_instructions: m.instructions || m.specialInstructions || ""
            });
        });
    });

    return items;
}

/**
 * Submit order to Supabase
 */
async function submitOrder(orderData, itemsData) {
    try {
        // Create order
        const orderResult = await createOrder(orderData);
        if (!orderResult) throw new Error("Failed to create order");

        const orderId = orderResult.id;

        // Add order items
        const itemsToInsert = itemsData.map(item => ({
            ...item,
            order_id: orderId
        }));

        const itemsResult = await createOrderItems(itemsToInsert);
        if (!itemsResult || itemsResult.length === 0) {
            throw new Error("Failed to create order items");
        }

        return orderId;
    } catch (error) {
        console.error("Order submission error:", error);
        throw error;
    }
}

/**
 * Send email notification to kitchen
 */
async function sendKitchenNotification(orderDetails) {
    try {
        if (typeof emailjs === 'undefined') {
            console.warn("EmailJS not loaded, skipping notification");
            return;
        }

        await emailjs.send("service_rfcp52l", "template_oglmmp8", {
            customer_name: orderDetails.customer_name,
            customer_phone: orderDetails.customer_phone,
            customer_address: orderDetails.customer_address,
            plan_name: orderDetails.plan_name,
            total_price: orderDetails.total_price,
            order_id: orderDetails.order_id
        });
    } catch (error) {
        console.error("Failed to send kitchen notification:", error);
        // Don't throw - notification failure shouldn't block checkout completion
    }
}

/**
 * Update 24-day subscription progress
 */
async function update24DayProgress(userEmail, profile, isSubscriptionRefill, finalName) {
    try {
        let currentWeek = isSubscriptionRefill ? (profile?.["24planweek"] || 0) : 0;
        let nextWeek = currentWeek + 1;
        let stillActive = nextWeek < 4; // 4 weeks in a 24-day plan

        await updateProfile(userEmail, {
            "plan24days": stillActive,
            "24planweek": stillActive ? nextWeek : 0,
            "active_package_name": stillActive ? (profile?.active_package_name || finalName) : null
        });
    } catch (error) {
        console.error("Failed to update 24-day progress:", error);
        throw error;
    }
}
