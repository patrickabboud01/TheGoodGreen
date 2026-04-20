/**
 * Plan Business Logic
 * Handles plan type detection, category restrictions, and day/week calculations
 */

/**
 * Resolve items per day from plan name
 */
function resolvePlanTypeItemsPerDay(planName) {
    const name = planName.toUpperCase();
    if(name.includes("SOLO")) return 1;
    if(name.includes("DUO")) return 2;
    if(name.includes("TRIO")) return 3;
    if(name.includes("FULL")) return 5;
    if(name.includes("PROTEIN")) return 1;
    return 3; // Default
}

/**
 * Calculate day offset for 24-day plan weeks
 * Week 1 (0) = days 1-6, Week 2 (1) = days 7-12, etc.
 */
function calculateDayOffset(currentPlanWeek) {
    return currentPlanWeek * 6;
}

/**
 * Get category restrictions for a given plan type
 */
function getCategoryRestrictions(planName) {
    const cleanPlanName = planName.toLowerCase().trim();
    const restrictions = {
        "solo": ["snack", "snacks", "protein", "extra pro"],
        "duo": ["snack", "snacks", "protein", "extra pro"],
        "trio": ["protein", "extra pro"],
        "protein": ["breakfast", "snack", "snacks", "main meals"]
    };

    // Find which plan type applies
    for (const plan in restrictions) {
        if (cleanPlanName.includes(plan)) {
            return restrictions[plan];
        }
    }
    return []; // No restrictions for custom plans
}

/**
 * Apply category button restrictions to DOM
 */
function applyCategoryRestrictions(planName) {
    const restrictedCategories = getCategoryRestrictions(planName);

    document.querySelectorAll('.cat-btn').forEach(btn => {
        const btnText = btn.innerText.toLowerCase().trim();

        const isRestricted = restrictedCategories.some(restricted =>
            btnText.includes(restricted)
        );

        if (isRestricted) {
            btn.classList.add('unavailable');
            btn.style.opacity = "0.3";
            btn.style.pointerEvents = "none";
        }
    });

    // Click the first allowed button
    const firstAllowed = Array.from(document.querySelectorAll('.cat-btn'))
        .find(b => !b.classList.contains('unavailable'));
    if (firstAllowed) firstAllowed.click();
}

/**
 * Determine if plan is eligible for 24-day continuation
 */
function checkPlanEligibility(profileData, requestedPlan, totalDaysRequested) {
    if (!profileData || !profileData.plan24days) return false;

    const isAttempting24Day = (totalDaysRequested >= 24);
    if (!isAttempting24Day) return false;

    // User can only continue if requesting the same plan they're subscribed to
    return requestedPlan === profileData.active_package_name;
}

/**
 * Returns count of breakfast/main meal items in a day's selection
 */
function getMainMealCount(dayItems) {
    return dayItems.filter(i =>
        i.category === 'breakfast' ||
        i.category === 'lunch' ||
        i.category === 'dinner'
    ).length;
}

/**
 * Returns true if adding this category would violate the FULL plan rule
 * (max 3 breakfast/main meals out of 5 total)
 */
function isFullPlanMainLimitReached(dayItems, newItemCategory) {
    const isMain = ['breakfast', 'lunch', 'dinner'].includes(newItemCategory);
    if (!isMain) return false;
    return getMainMealCount(dayItems) >= 3;
}
