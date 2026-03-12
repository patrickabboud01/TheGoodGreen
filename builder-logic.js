/**
 * THE GOOD GREEN - COMPLETE UNIFIED LOGIC
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

// 2. Initialize the Month (State)
for(let i = 1; i <= totalDays; i++) {
    fullState[i] = [];
}

/**
 * LOAD DATA: Converts rawMenuData from menu-data.js into usable objects
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
 * INITIALIZATION: Grammar, Default Tabs, and Initial Renders
 */
function init() {
    const cleanPlan = planName.toLowerCase().trim();
    
    // 1. Singular/Plural Grammar Logic
    const dayLabel = totalDays === 1 ? "Day" : "Days";
    document.getElementById('plan-name-display').innerText = planName;
    document.getElementById('display-total-days').innerText = totalDays;
    
    const totalDaysContainer = document.getElementById('display-total-days').parentElement;
    totalDaysContainer.innerHTML = `<span id="display-total-days">${totalDays}</span> ${dayLabel} | <span id="display-items-per-day">${itemsPerDay}</span> Items/Day`;

    renderCalendar();

    // 2. Smart Start: Don't land on a restricted category
    if (cleanPlan.includes("solo") || cleanPlan.includes("protein")) {
        renderMenu('lunch/dinner');
    } else {
        renderMenu('breakfast');
    }
    
    updateUI();
    if (cleanPlan.includes("duo") || cleanPlan.includes("protein")) {
        renderMenu('lunch/dinner');
    } else {
        renderMenu('lunch/dinner');
    }
    
    updateUI();
}

/**
 * MENU RENDERING: Handles merged categories and plan-based restrictions
 */
function renderMenu(cat) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = "";
    
    const cleanPlanName = planName.toLowerCase().trim();
    const cleanCat = cat.toLowerCase().trim();

    // Restriction Map
    const restrictions = {
        "solo": ["breakfast", "snack", "snacks", "protein"],
        "duo": ["snack", "snacks", "breakfast", "protein"],
        "trio": ["snack", "snacks", "protein"],
        "protein": ["breakfast", "lunch", "dinner", "snack", "snacks", "lunch & dinner"]
    };

    // Check if category is blocked for current plan
    let isRestricted = false;
    for (const plan in restrictions) {
        if (cleanPlanName.includes(plan) && restrictions[plan].includes(cleanCat)) {
            isRestricted = true;
            break;
        }
    }

    // Update Tab Buttons UI
    document.querySelectorAll('.tab-btn').forEach(b => {
        const btnText = b.innerText.toLowerCase().trim();
        b.classList.toggle('active', btnText === cleanCat);
        
        let tabDisabled = false;
        for (const plan in restrictions) {
            if (cleanPlanName.includes(plan) && restrictions[plan].includes(btnText)) {
                tabDisabled = true;
                break;
            }
        }

        if (tabDisabled) {
            b.style.opacity = "0.3";
            b.style.pointerEvents = "none";
            b.style.backgroundColor = "#eee";
            b.style.textDecoration = "line-through";
        } else {
            b.style.opacity = "1";
            b.style.pointerEvents = "auto";
            b.style.textDecoration = "none";
            b.style.backgroundColor = b.classList.contains('active') ? "" : "white";
        }
    });

    if (isRestricted) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 50px 20px; background: #f9f9f9; border-radius: 15px; border: 1px dashed #ccc;">
                <p style="font-size: 1.5rem;">🔒</p>
                <p style="color: #444; font-weight: 700;">${cat.toUpperCase()} UNAVAILABLE</p>
                <p style="color: #777; font-size: 0.9rem;">This category is not included in the ${planName}.</p>
            </div>`;
        return; 
    }

    // Render Menu Items
    menuData.filter(m => {
        if (cat === 'lunch/dinner') {
            return m.category === 'lunch' || m.category === 'dinner';
        }
        return m.category === cat;
    }).forEach(item => {
        grid.innerHTML += `
            <div class="menu-item-card" style="background:white; padding:15px; border-radius:12px; border:1px solid #eee; text-align:center;">
                <h4 style="margin-bottom:10px;">${item.name}</h4>
                <button class="btn-confirm" style="padding:8px; font-size:12px;" onclick="addItem(${item.id})">Add to Day ${currentDay}</button>
            </div>`;
    });
}

/**
 * ADDING A MEAL
 */
function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) {
        alert("Day " + currentDay + " is full!");
        return;
    }

    const item = menuData.find(i => i.id === id);
    pendingItem = JSON.parse(JSON.stringify(item)); 

    if (item.choices) {
        showChoicePopup(item.choices); 
    } else {
        confirmAdd();
    }
}

function showChoicePopup(choiceObj) {
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    
    container.innerHTML = `
        <h3 style="color:var(--forest)">Selection Required</h3>
        <p>Please choose your ${choiceObj.title.toLowerCase()}:</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            ${choiceObj.options.map(opt => `
                <button class="btn-confirm" onclick="finalizeChoice('${opt}')">${opt}</button>
            `).join('')}
        </div>
    `;
    modal.style.display = "flex";
}

function finalizeChoice(selection) {
    pendingItem.selectedChoice = selection;
    confirmAdd();
    document.getElementById('editModal').style.display = "none";
}

function confirmAdd() {
    pendingItem.instanceId = Date.now() + Math.random();
    pendingItem.removedIngredients = [];
    fullState[currentDay].push(pendingItem);
    pendingItem = null;
    updateUI();
}

/**
 * EDITING & CUSTOMIZING
 */
function openEditModal(instanceId) {
    editingItem = fullState[currentDay].find(i => i.instanceId === instanceId);
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    
    container.innerHTML = `<h3>Customize ${editingItem.name}</h3>`;

    if (editingItem.choices) {
        container.innerHTML += `
            <div class="choice-section">
                <p><strong>${editingItem.choices.title}:</strong></p>
                ${editingItem.choices.options.map(opt => `
                    <label class="ing-label">
                        <input type="radio" name="edit-sub" value="${opt}" 
                        ${editingItem.selectedChoice === opt ? 'checked' : ''} 
                        onchange="editingItem.selectedChoice = '${opt}'"> ${opt}
                    </label>
                `).join('')}
            </div>`;
    }

    container.innerHTML += `<p><strong>Remove Ingredients:</strong></p>`;
    editingItem.ingredients.forEach(ing => {
        const isRemoved = editingItem.removedIngredients.includes(ing);
        container.innerHTML += `
            <label class="ing-label">
                <input type="checkbox" ${isRemoved ? '' : 'checked'} onchange="toggleIngredient('${ing}')"> ${ing}
            </label>`;
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

/**
 * UI SYNC: Macros, Sidebar, and Button State
 */
function updateUI() {
    const list = document.getElementById('selection-list');
    const proteinSection = document.querySelector('.day-stats');
    list.innerHTML = "";
    let prot = 0;

    fullState[currentDay].forEach(item => {
        prot += item.protein;
        const choiceText = item.selectedChoice ? `<br><small style="color:var(--forest)"><b>Choice:</b> ${item.selectedChoice}</small>` : '';
        const removedText = item.removedIngredients.length > 0 ? `<br><small style="color:#d97706"><b>Removed:</b> ${item.removedIngredients.join(', ')}</small>` : '';

        list.innerHTML += `
            <li>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <span><strong>${item.name}</strong>${choiceText}${removedText}</span>
                    <button onclick="removeItem(${item.instanceId})" style="color:red; border:none; background:none; cursor:pointer; font-weight:bold;">✕</button>
                </div>
                <button class="edit-btn" onclick="openEditModal(${item.instanceId})">Edit Meal</button>
            </li>`;
    });

    // Protein Logic: Hide for specific plans
    if (proteinSection) {
        const cleanPlan = planName.toLowerCase();
        const hideProtein = ["solo", "duo", "trio", "protein"].some(p => cleanPlan.includes(p));
        
        if (hideProtein) {
            proteinSection.style.display = "none";
        } else {
            proteinSection.style.display = "block";
            document.getElementById('day-protein').innerText = prot;
        }
    }

    const hasAnySelections = Object.values(fullState).some(dayArray => dayArray.length > 0);
    const confirmBtn = document.getElementById('confirm-all-btn');
    
    if (hasAnySelections) {
        confirmBtn.disabled = false;
        confirmBtn.classList.remove('disabled');
    } else {
        confirmBtn.disabled = true;
        confirmBtn.classList.add('disabled');
    }

    renderCalendar();
}

/**
 * CALENDAR & UTILS
 */
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = "";
    for(let i = 1; i <= totalDays; i++) {
        const isFull = fullState[i].length === itemsPerDay;
        const isActive = currentDay === i;
        grid.innerHTML += `
            <div class="day-dot ${isActive ? 'active' : ''} ${isFull ? 'complete' : ''}" 
                 onclick="switchDay(${i})">${i}</div>`;
    }
}

function switchDay(d) { 
    currentDay = d; 
    document.getElementById('active-day-num').innerText = d; 
    updateUI(); 
    
    // Maintain category filter on day switch
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) renderMenu(activeTab.innerText.toLowerCase());
}

function removeItem(id) { 
    fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id); 
    updateUI(); 
}

function handleFinalOrder() {
    const finalOrder = {
        plan: planName,
        days: totalDays,
        itemsPerDay: itemsPerDay,
        selections: fullState
    };
    localStorage.setItem('finalOrder', JSON.stringify(finalOrder));
    window.location.href = "checkout.html";
}

// Kickoff
loadMenu();