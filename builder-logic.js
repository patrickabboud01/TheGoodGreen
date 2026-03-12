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

function init() {
    document.getElementById('plan-name-display').innerText = planName;
    document.getElementById('display-total-days').innerText = totalDays;
    document.getElementById('display-items-per-day').innerText = itemsPerDay;
    renderCalendar();
    renderMenu('breakfast');
    updateUI();
}

/**
 * ADDING A MEAL: Handles the initial click and mandatory popups
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
 * EDITING A MEAL: Handles removing ingredients from existing selections
 */
function openEditModal(instanceId) {
    editingItem = fullState[currentDay].find(i => i.instanceId === instanceId);
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    
    container.innerHTML = `<h3>Customize ${editingItem.name}</h3>`;

    // Edit Choice (Milk/Dressing)
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

    // Edit Ingredients
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
 * UI UPDATES: Syncs the sidebar, Macros, and the Confirm Button
 */
function updateUI() {
    const list = document.getElementById('selection-list');
    list.innerHTML = "";
    let prot = 0;

    // 1. Render Current Day Selections
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

    document.getElementById('day-protein').innerText = prot;

    // 2. LOGIC: Should the "Confirm" button be active?
    // Current Logic: Active if the user has selected AT LEAST one meal in the entire plan.
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
 * MENU & CALENDAR NAVIGATION
 */
function renderMenu(cat) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = "";
    
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.innerText.toLowerCase() === cat);
    });

    menuData.filter(m => m.category === cat).forEach(item => {
        grid.innerHTML += `
            <div class="menu-item-card" style="background:white; padding:15px; border-radius:12px; border:1px solid #eee; text-align:center;">
                <h4 style="margin-bottom:10px;">${item.name}</h4>
                <button class="btn-confirm" style="padding:8px; font-size:12px;" onclick="addItem(${item.id})">Add to Day ${currentDay}</button>
            </div>`;
    });
}

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

function switchDay(d) { currentDay = d; document.getElementById('active-day-num').innerText = d; updateUI(); }
function removeItem(id) { fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id); updateUI(); }

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

// Start Application
loadMenu();