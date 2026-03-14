/**
 * THE GOOD GREEN - COMPLETE UNIFIED LOGIC (MOBILE OPTIMIZED)
 * FEATURES: Multi-Choice Windows, Auto-Category Sorting, Ingredient Removals, Toast Alerts
 */

let menuData = []; 
let currentDay = 1;
let fullState = {};
let pendingItem = null; 
let editingItem = null; 
let currentChoiceStep = 0; // NEW: Tracks multi-choice sequence

// 1. Read Plan Settings from URL
const params = new URLSearchParams(window.location.search);
const planName = params.get('plan') || "Custom Plan";
const itemsPerDay = parseInt(params.get('items')) || 3;
const totalDays = parseInt(params.get('days')) || 1;
const planPrice = params.get('price') || "0"; 

// 2. Initialize the Month (State)
for(let i = 1; i <= totalDays; i++) {
    fullState[i] = [];
}

/**
 * LOAD DATA & PARSE MULTI-CHOICES
 */
function loadMenu() {
    if (typeof rawMenuData === 'undefined') {
        console.error("Data file (menu-data.js) missing or incorrect.");
        return;
    }

    menuData = rawMenuData.map((item, index) => {
        let choicesArray = [];
        
        // Parse First Choice
        if (item.choice_options && item.choice_options.trim() !== "") {
            choicesArray.push({
                title: item.choice_title || "Selection Required",
                options: item.choice_options.split(';').map(o => o.trim())
            });
        }
        
        // Parse Second Choice (If exists in your data)
        if (item.choice_options_2 && item.choice_options_2.trim() !== "") {
            choicesArray.push({
                title: item.choice_title_2 || "Second Selection",
                options: item.choice_options_2.split(';').map(o => o.trim())
            });
        }

        return {
            id: index,
            category: item.category.toLowerCase(),
            name: item.name,
            protein: item.protein,
            ingredients: item.ingredients ? item.ingredients.split(';') : [],
            multiChoices: choicesArray // Replaces single choice object
        };
    });
    init();
}

/**
 * INITIALIZATION & CATEGORY SORTING
 */
function init() {
    document.getElementById('plan-name-display').innerText = planName;
    document.getElementById('display-total-days').innerText = totalDays;

    renderCalendar();

    const cleanPlanName = planName.toLowerCase().trim();
    const restrictions = {
        "solo": ["snack", "snacks", "protein", "extra pro"],
        "duo": ["snack", "snacks", "protein", "extra pro"],
        "trio": ["protein", "extra pro"],
        "protein": ["breakfast", "snack", "snacks", "main meals"]
    };

    const nav = document.querySelector('.category-nav');
    const buttons = Array.from(nav.querySelectorAll('.cat-btn'));
    let firstAllowedBtn = null;

    buttons.forEach(btn => {
        const btnText = btn.innerText.toLowerCase().trim();
        let isRestricted = false;

        for (const plan in restrictions) {
            if (cleanPlanName.includes(plan) && restrictions[plan].includes(btnText)) {
                isRestricted = true;
                break;
            }
        }

        if (isRestricted) {
            btn.classList.add('unavailable');
            btn.style.order = "2"; 
            btn.style.pointerEvents = "none";
        } else {
            btn.classList.remove('unavailable');
            btn.style.order = "1"; 
            btn.style.pointerEvents = "auto";
            if (!firstAllowedBtn) firstAllowedBtn = btn;
        }
    });

    if (firstAllowedBtn) firstAllowedBtn.click();
    else renderMenu('breakfast');
    
    updateUI();
}

/**
 * MENU RENDERING
 */
function renderMenu(cat) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = "";
    const cleanCat = cat.toLowerCase().trim();

    document.querySelectorAll('.cat-btn').forEach(b => {
        const btnText = b.innerText.toLowerCase().trim();
        const btnCategory = btnText === "main meals" ? "lunch/dinner" : (btnText === "extra pro" ? "protein" : btnText);
        b.classList.toggle('active', (cleanCat === btnCategory));
    });

    const itemsToShow = menuData.filter(m => {
        if (cat === 'lunch/dinner') return m.category === 'lunch' || m.category === 'dinner';
        return m.category === cat;
    });

    if (itemsToShow.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #999;">No items found.</div>`;
    }

    itemsToShow.forEach(item => {
        grid.innerHTML += `
            <div class="menu-item-card">
                <h4>${item.name}</h4>
                <p style="font-size:0.8rem; color:#888;">${item.protein}g Protein</p>
                <button class="btn-confirm-mini" style="width:100%; margin-top:10px;" onclick="addItem(${item.id})">Add</button>
            </div>`;
    });
}

/**
 * ADD ITEM & MULTI-STEP CHOICE LOGIC
 */
function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) {
        showToast("Day " + currentDay + " is full!", 'error');
        return;
    }
    
    const item = menuData.find(i => i.id === id);
    pendingItem = JSON.parse(JSON.stringify(item)); 
    pendingItem.selectedChoices = []; // Array for multiple selections
    currentChoiceStep = 0; 

    if (pendingItem.multiChoices && pendingItem.multiChoices.length > 0) {
        showChoicePopup(); 
    } else {
        confirmAdd();
        showToast("Added to Day " + currentDay, 'success');
    }
}

function showChoicePopup() {
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    const choiceObj = pendingItem.multiChoices[currentChoiceStep];

    container.innerHTML = `
        <h3 style="color:var(--forest);">${choiceObj.title}</h3>
        <p style="font-size:0.75rem; color:#888; margin-bottom:15px;">Selection ${currentChoiceStep + 1} of ${pendingItem.multiChoices.length}</p>
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${choiceObj.options.map(opt => `
                <button class="btn-confirm-mini" style="background:var(--forest); color:white; padding:15px;" onclick="finalizeChoice('${opt}')">
                    ${opt}
                </button>
            `).join('')}
        </div>
    `;
    modal.style.display = "flex";
}

function finalizeChoice(selection) {
    pendingItem.selectedChoices.push(selection);
    currentChoiceStep++;

    if (currentChoiceStep < pendingItem.multiChoices.length) {
        showChoicePopup(); // Show next step
    } else {
        confirmAdd();
        document.getElementById('editModal').style.display = "none";
        showToast("Selection complete!", 'success');
    }
}

function confirmAdd() {
    pendingItem.instanceId = Date.now() + Math.random();
    pendingItem.removedIngredients = [];
    fullState[currentDay].push(pendingItem);
    pendingItem = null;
    updateUI();
}

/**
 * UI UPDATES & CALENDAR
 */
function updateUI() {
    const list = document.getElementById('selection-list');
    const itemsCountDisplay = document.getElementById('day-items-count');
    list.innerHTML = "";

    fullState[currentDay].forEach(item => {
        // Handle multiple selections in the display
        const choiceText = (item.selectedChoices && item.selectedChoices.length > 0) 
            ? `<br><small style="color:var(--forest); font-weight:600;">Selection: ${item.selectedChoices.join(' + ')}</small>` 
            : '';
        
        const removedText = (item.removedIngredients && item.removedIngredients.length > 0) 
            ? `<br><small style="color:#d97706;">No: ${item.removedIngredients.join(', ')}</small>` 
            : '';
        
        list.innerHTML += `
            <li style="font-size: 0.85rem; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex-grow: 1;">
                        <strong style="display: block; color: #333;">${item.name}</strong>
                        ${choiceText}
                        ${removedText}
                        <div style="margin-top: 5px;">
                            <button class="edit-btn" onclick="openEditModal(${item.instanceId})" 
                                    style="background: #f0f4f0; color: var(--forest); border: 1px solid var(--forest); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700;">
                                Edit Ingredients
                            </button>
                        </div>
                    </div>
                    <button onclick="removeItem(${item.instanceId})" style="color:#ff4d4d; border:none; background:none; font-weight:bold; font-size: 1.1rem;">✕</button>
                </div>
            </li>`;
    });

    if(itemsCountDisplay) itemsCountDisplay.innerText = `${fullState[currentDay].length} / ${itemsPerDay} Items Selected`;

    const hasAnySelections = Object.values(fullState).some(dayArray => dayArray.length > 0);
    const confirmBtn = document.getElementById('confirm-all-btn');
    if (confirmBtn) {
        confirmBtn.disabled = !hasAnySelections;
        confirmBtn.style.opacity = hasAnySelections ? "1" : "0.5";
    }

    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = "";
    for(let i = 1; i <= totalDays; i++) {
        const isFull = (fullState[i] && fullState[i].length === itemsPerDay);
        const isActive = currentDay === i;
        grid.innerHTML += `<div class="day-dot ${isActive ? 'active' : ''} ${isFull ? 'complete' : ''}" onclick="switchDay(${i})">${i}</div>`;
    }
}

function switchDay(d) { 
    currentDay = d; 
    document.getElementById('active-day-num').innerText = d; 
    updateUI(); 
    const activeTab = document.querySelector('.cat-btn.active');
    if (activeTab) {
        const btnText = activeTab.innerText.toLowerCase().trim();
        const cat = btnText === "main meals" ? "lunch/dinner" : (btnText === "extra pro" ? "protein" : btnText);
        renderMenu(cat);
    }
}

function removeItem(id) { 
    fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id); 
    updateUI(); 
}

/**
 * MODALS & TOASTS
 */
function openEditModal(instanceId) {
    editingItem = fullState[currentDay].find(i => i.instanceId === instanceId);
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    container.innerHTML = `<h3>Customize ${editingItem.name}</h3>`;
    editingItem.ingredients.forEach(ing => {
        const isRemoved = editingItem.removedIngredients.includes(ing);
        container.innerHTML += `<label style="display:block; margin: 10px 0;"><input type="checkbox" ${isRemoved ? '' : 'checked'} onchange="toggleIngredient('${ing}')"> ${ing}</label>`;
    });
    modal.style.display = "flex";
}

function toggleIngredient(ing) {
    if (editingItem.removedIngredients.includes(ing)) {
        editingItem.removedIngredients = editingItem.removedIngredients.filter(i => i !== ing);
    } else {
        editingItem.removedIngredients.push(ing);
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = "none";
    editingItem = null;
    updateUI();
}

function showToast(message, type = 'error') {
    const oldToast = document.querySelector('.toast-notice');
    if (oldToast) oldToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerText = message;
    toast.style.background = (type === 'success') ? '#2e7d32' : '#ce4242';
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}

/**
 * FINALIZATION
 */
async function handleFinalOrder() {
    for (let i = 1; i <= totalDays; i++) {
        if (fullState[i].length < itemsPerDay) {
            showToast(`Day ${i} is not complete!`, 'error');
            switchDay(i);
            return;
        }
    }

    const flattenedMeals = [];
    for (let day in fullState) {
        fullState[day].forEach(item => {
            flattenedMeals.push({
                day_number: parseInt(day),
                meal_name: item.name,
                choice: item.selectedChoices ? item.selectedChoices.join(' + ') : null,
                removals: item.removedIngredients.join(', ')
            });
        });
    }

    const orderSummary = {
        plan_details: { name: planName, days: totalDays, price: planPrice },
        meals: flattenedMeals
    };

    localStorage.setItem('finalOrder', JSON.stringify(orderSummary));
    window.location.href = "checkout.html";
}

loadMenu();