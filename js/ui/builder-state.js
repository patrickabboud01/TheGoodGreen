/**
 * Builder State Management
 * Global state and core state-managing functions
 */

// ===== GLOBAL STATE =====
let menuData = [];
let currentDay = 1;
let fullState = {};
let pendingItem = null;
let editingItem = null;
let currentChoiceStep = 0;
let displayDays = 1;
let tempSelections = [];

// Parse URL parameters
const urlParams = new URLSearchParams(window.location.search);

// Plan-related state
let planName = urlParams.get('plan') || "Custom Plan";
let itemsPerDay = parseInt(urlParams.get('items')) || 3;
const totalDaysRequested = parseInt(urlParams.get('days')) || 1;
let isPlan24Progress = false;
let currentPlanWeek = 0;
let dayOffset = 0;

/**
 * Initialize state from URL params and user profile
 */
async function init() {
    const user = getCurrentUser();
    const isAttempting24Day = (totalDaysRequested >= 24);

    if (user) {
        const profile = await get24DayProfile(user.email);

        if (profile && profile.plan24days) {
            const requestedPlan = new URLSearchParams(window.location.search).get('plan') || "Custom Plan";
            if (checkPlanEligibility(profile, requestedPlan, totalDaysRequested)) {
                isPlan24Progress = true;
                currentPlanWeek = profile["24planweek"] || 0;
                planName = profile.active_package_name;
                itemsPerDay = resolvePlanTypeItemsPerDay(planName);
            }
            else if (isAttempting24Day && requestedPlan !== profile.active_package_name) {
                window.location.href = "plan-status.html";
                return;
            }
        }
    }

    // Set up display parameters
    displayDays = isAttempting24Day ? 6 : totalDaysRequested;
    dayOffset = isPlan24Progress ? calculateDayOffset(currentPlanWeek) : 0;

    // Update DOM elements
    const totalDaysEl = document.getElementById('display-total-days');
    if (totalDaysEl) totalDaysEl.innerText = totalDaysRequested;

    const planDisplay = document.getElementById('plan-name-display');
    if (planDisplay) planDisplay.innerText = planName;

    const weekLabel = document.getElementById('week-label');
    if (isAttempting24Day && weekLabel) {
        weekLabel.style.display = "inline-block";
        weekLabel.innerText = `Week ${currentPlanWeek + 1}`;
        const confirmBtn = document.getElementById('confirm-all-btn');
        if (confirmBtn) confirmBtn.innerText = `Confirm Week ${currentPlanWeek + 1}`;
    }

    // Initialize state for each day
    fullState = {};
    for (let i = 1; i <= displayDays; i++) {
        fullState[i + dayOffset] = [];
    }

    currentDay = 1 + dayOffset;
    updateActiveDayDisplay(1);

    // Apply plan restrictions and render
    applyCategoryRestrictions(planName);
    updateUI();
}

/**
 * Load menu data and initialize
 */
function loadMenu() {
    if (typeof rawMenuData === 'undefined') {
        console.error("rawMenuData not found!");
        return;
    }

    menuData = rawMenuData.map((item, index) => {
        let choices = [];

        if (item.choice_options && item.choice_options.trim() !== "") {
            choices.push({
                title: item.choice_title || "Step 1",
                options: item.choice_options.split(';').map(o => o.trim()),
                type: item.choice_type || "single"
            });
        }

        if (item.choice_options_2 && item.choice_options_2.trim() !== "") {
            choices.push({
                title: item.choice_title_2 || "Step 2",
                options: item.choice_options_2.split(';').map(o => o.trim()),
                type: item.choice_type_2 || "single"
            });
        }

        return {
            id: index,
            category: (item.category || "lunch").toLowerCase().trim(),
            name: item.name,
            protein: item.protein,
            Kcal: item.Kcal,
            image: item.image,
            fixedIngredients: item.fixed_ingredients ? item.fixed_ingredients.split(';') : [],
            removableIngredients: item.removable_ingredients ? item.removable_ingredients.split(';') : [],
            multiChoices: choices
        };
    });

    init();
}

/**
 * Add item to current day (with capacity check)
 */
function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) {
        showToast("Day full!");
        return;
    }

    // FULL plan: max 3 breakfast/main meals per day
    const upperPlan = planName.toUpperCase();
    if (upperPlan.includes("FULL")) {
        const item = menuData.find(i => i.id === id);
        if (item && isFullPlanMainLimitReached(fullState[currentDay], item.category)) {
            showToast("Max 3 main meals reached! Remaining slots are for snacks.");
            return;
        }
    }

    const item = menuData.find(i => i.id === id);
    if (!item) return;

    pendingItem = JSON.parse(JSON.stringify(item));
    pendingItem.selectedChoices = [];
    pendingItem.removedIngredients = [];
    pendingItem.specialInstructions = "";
    pendingItem.instanceId = Date.now();

    currentChoiceStep = 0;
    tempSelections = [];

    if (pendingItem.multiChoices && pendingItem.multiChoices.length > 0) {
        showChoicePopup();
    } else {
        openIngredientReview();
    }
}

/**
 * Remove item from current day
 */
function removeItem(id) {
    fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id);
    updateUI();
}

/**
 * Switch to a different day
 */
function switchDay(d) {
    currentDay = d;
    const relativeDay = d - dayOffset;
    updateActiveDayDisplay(relativeDay);
    updateUI();
}

/**
 * Update the displayed day number
 */
function updateActiveDayDisplay(dayNumber) {
    const dayElement = document.getElementById('active-day-num');
    if (dayElement) dayElement.textContent = dayNumber;
}

/**
 * Close the edit modal and reset state
 */
function closeEditModal() {
    document.getElementById('editModal').style.display = "none";
    pendingItem = null;
    editingItem = null;
}

/**
 * Handle final order submission (validation + checkout redirect)
 */
async function handleFinalOrder() {
    const loops = displayDays;
    for (let i = 1; i <= loops; i++) {
        const actualIdx = i + dayOffset;
        if (!fullState[actualIdx] || fullState[actualIdx].length < itemsPerDay) {
            showToast(`Day ${i} is incomplete!`);
            return;
        }
    }
    showOrderReview();
}

/**
 * Proceed to checkout with final order
 */
function proceedToCheckout() {
    localStorage.setItem('finalOrder', JSON.stringify(fullState));

    const subFlag = isPlan24Progress || totalDaysRequested >= 24 ? "&isSub=true" : "&isSub=false";
    window.location.href = `checkout.html?days=${totalDaysRequested}${subFlag}`;
}

// ===== MODAL BACKDROP LISTENER =====
window.addEventListener('click', function (event) {
    const editModal = document.getElementById('editModal');
    if (event.target === editModal) {
        closeEditModal();
    }
});

// Initialize on load
loadMenu();
