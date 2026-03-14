/**
 * THE GOOD GREEN - COMPLETE UNIFIED LOGIC (MOBILE OPTIMIZED)
 */

let menuData = []; 
let currentDay = 1;
let fullState = {};
let pendingItem = null; 
let editingItem = null; 

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
 * LOAD DATA
 */
function loadMenu() {
    if (typeof rawMenuData === 'undefined') {
        console.error("Data file (menu-data.js) missing or incorrect.");
        return;
    }

    menuData = rawMenuData.map((item, index) => ({
        id: index,
        category: item.category.toLowerCase(),
        name: item.name,
        protein: item.protein,
        ingredients: item.ingredients ? item.ingredients.split(';') : [],
        choices: (item.choice_options && item.choice_options.trim() !== "") ? {
            title: item.choice_title,
            options: item.choice_options.split(';').map(o => o.trim())
        } : null
    }));
    init();
}

/**
 * INITIALIZATION
 */
/**
 * INITIALIZATION
 */
function init() {
    // 1. Set Header Info
    document.getElementById('plan-name-display').innerText = planName;
    document.getElementById('display-total-days').innerText = totalDays;

    renderCalendar();

    // 2. Identify and Sort Categories
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

    // Determine which buttons stay and which are restricted
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
            btn.style.order = "2"; // Move to back
            btn.style.pointerEvents = "none";
        } else {
            btn.classList.remove('unavailable');
            btn.style.order = "1"; // Move to front
            btn.style.pointerEvents = "auto";
            if (!firstAllowedBtn) firstAllowedBtn = btn;
        }
    });

    // 3. Auto-click the first valid category
    if (firstAllowedBtn) {
        firstAllowedBtn.click();
    } else {
        // Fallback if no specific plan match found
        renderMenu('breakfast');
    }
    
    updateUI();
}
/**
 * MENU RENDERING & RESTRICTIONS (GREYED OUT LOGIC)
 */
function renderMenu(cat) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = "";
    
    const cleanPlanName = planName.toLowerCase().trim();
    const cleanCat = cat.toLowerCase().trim();

    // Define restrictions
    const restrictions = {
        "solo": ["snack", "snacks", "protein", "extra pro"],
        "duo": ["snack", "snacks", "protein", "extra pro"],
        "trio": ["protein", "extra pro"],
        "protein": ["breakfast", "snack", "snacks" , "main meals"]
    };

    // Tabs UI Update - GREEN BACKGROUND FOR ACTIVE / GREY FOR UNAVAILABLE
    document.querySelectorAll('.cat-btn').forEach(b => {
        const btnText = b.innerText.toLowerCase().trim();
        const btnCategory = btnText === "main meals" ? "lunch/dinner" : (btnText === "extra pro" ? "protein" : btnText);
        
        // Match active state
        const isActive = (cleanCat === btnCategory);
        b.classList.toggle('active', isActive);

        // Check if restricted
        let tabDisabled = false;
        for (const plan in restrictions) {
            if (cleanPlanName.includes(plan) && restrictions[plan].includes(btnText)) {
                tabDisabled = true;
                break;
            }
        }

        if (tabDisabled) {
            b.classList.add('unavailable');
            b.style.pointerEvents = "none";
        } else {
            b.classList.remove('unavailable');
            b.style.pointerEvents = "auto";
        }
    });

    // Filter and Show Items
    const itemsToShow = menuData.filter(m => {
        if (cat === 'lunch/dinner') return m.category === 'lunch' || m.category === 'dinner';
        return m.category === cat;
    });

    if (itemsToShow.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #999;">No items found in this category.</div>`;
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

function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) {
        // Updated to use the custom toast
        showToast("   Day " + currentDay + " 's items are full!", 'error');
        return;
    }
    
    const item = menuData.find(i => i.id === id);
    pendingItem = JSON.parse(JSON.stringify(item)); 
    
    if (item.choices) {
        showChoicePopup(item.choices); 
    } else {
        confirmAdd();
        // Optional: show success toast when added
        showToast("Added to Day " + currentDay, 'success');
    }
}

function showChoicePopup(choiceObj) {
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    container.innerHTML = `<h3>Selection Required</h3><div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">${choiceObj.options.map(opt => `<button class="btn-confirm-mini" style="background:var(--forest); color:white; padding:12px;" onclick="finalizeChoice('${opt}')">${opt}</button>`).join('')}</div>`;
    modal.style.display = "flex";
}

function finalizeChoice(selection) {
    pendingItem.selectedChoice = selection;
    confirmAdd();
    document.getElementById('editModal').style.display = "none";
}
function showToast(message, type = 'error') {
    // Create element
    const oldToast = document.querySelector('.toast-notice');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notice';
    toast.innerText = message;
    
    // Color Logic
    if (type === 'success') {
        toast.style.background = '#2e7d32'; // The Good Green Forest color
    } else {
        toast.style.background = '#ce4242'; // Alert Red
    }
    
    document.body.appendChild(toast);

    // Small delay to trigger the CSS transition
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 2500);
}
function confirmAdd() {
    pendingItem.instanceId = Date.now() + Math.random();
    pendingItem.removedIngredients = [];
    fullState[currentDay].push(pendingItem);
    pendingItem = null;
    updateUI();
}

function updateUI() {
    const list = document.getElementById('selection-list');
    const dayProteinDisplay = document.getElementById('day-protein');
    const itemsCountDisplay = document.getElementById('day-items-count');
    
    list.innerHTML = "";
    let prot = 0;

    fullState[currentDay].forEach(item => {
        prot += item.protein;
        
        // 1. Prepare Choice and Removed Ingredients text
        const choiceText = item.selectedChoice ? `<br><small style="color:var(--forest); font-weight:600;">Selection: ${item.selectedChoice}</small>` : '';
        const removedText = (item.removedIngredients && item.removedIngredients.length > 0) 
            ? `<br><small style="color:#d97706;">No: ${item.removedIngredients.join(', ')}</small>` 
            : '';
        
        // 2. Build the list item with Edit and Remove buttons
        list.innerHTML += `
            <li style="font-size: 0.85rem; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex-grow: 1;">
                        <strong style="display: block; color: #333;">${item.name}</strong>
                        ${choiceText}
                        ${removedText}
                        <div style="margin-top: 5px;">
                            <button class="edit-btn" onclick="openEditModal(${item.instanceId})" 
                                    style="background: #f0f4f0; color: var(--forest); border: 1px solid var(--forest); border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; font-weight: 700; cursor: pointer;">
                                Edit Ingredients
                            </button>
                        </div>
                    </div>
                    <button onclick="removeItem(${item.instanceId})" style="color:#ff4d4d; border:none; background:none; font-weight:bold; font-size: 1.1rem; padding: 0 5px; cursor:pointer;">✕</button>
                </div>
            </li>`;
    });

    // Update Totals
    if(dayProteinDisplay) dayProteinDisplay.innerText = prot;
    if(itemsCountDisplay) itemsCountDisplay.innerText = `${fullState[currentDay].length} / ${itemsPerDay} Items Selected`;

    // Confirm Button State
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

async function handleFinalOrder() {
    for (let i = 1; i <= totalDays; i++) {
        if (fullState[i].length < itemsPerDay) {
            alert(`Day ${i} is not complete yet!`);
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
                choice: item.selectedChoice || null,
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