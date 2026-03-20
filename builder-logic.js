/**
 * THE GOOD GREEN - COMPLETE BUILDER LOGIC
 */
let menuData = []; 
let currentDay = 1; 
let fullState = {};
let pendingItem = null; 
let editingItem = null; 
let currentChoiceStep = 0;
let displayDays = 1; 

const sbUrl = 'https://dehcgxbupadfabotpwvg.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaGNneGJ1cGFkZmFib3Rwd3ZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDEyNjUsImV4cCI6MjA4ODk3NzI2NX0.rXFsN9k0XYCPFf4BejbwkHvmuhvIid921jYeZmsUU6g';
const sbClient = supabase.createClient(sbUrl, sbKey);

const params = new URLSearchParams(window.location.search);
let planName = params.get('plan') || "Custom Plan";
let itemsPerDay = parseInt(params.get('items')) || 3;
const totalDaysRequested = parseInt(params.get('days')) || 1;

let isPlan24Progress = false; 
let currentPlanWeek = 0; 
let dayOffset = 0;

async function init() {
    const user = JSON.parse(localStorage.getItem('current_user'));
    const isAttempting24Day = (totalDaysRequested >= 24);
    
    if (user) {
        const { data: profile } = await sbClient
            .from('profiles')
            .select('plan24days, "24planweek", active_package_name')
            .eq('email', user.email)
            .single();

        if (profile && profile.plan24days) {
            if (isAttempting24Day && params.get('plan') === profile.active_package_name) {
                isPlan24Progress = true;
                currentPlanWeek = profile["24planweek"] || 0;
                planName = profile.active_package_name;
                
                const name = planName.toUpperCase();
                if(name.includes("SOLO")) itemsPerDay = 1;
                else if(name.includes("DUO")) itemsPerDay = 2;
                else if(name.includes("TRIO")) itemsPerDay = 3;
                else if(name.includes("FULL")) itemsPerDay = 4;
                else if(name.includes("PROTEIN")) itemsPerDay = 1;
            } 
            else if (isAttempting24Day && params.get('plan') !== profile.active_package_name) {
                window.location.href = "plan-status.html";
                return;
            }
        }
    }

    displayDays = isAttempting24Day ? 6 : totalDaysRequested;
    dayOffset = isPlan24Progress ? (currentPlanWeek * 6) : 0;

    document.getElementById('display-total-days').innerText = totalDaysRequested;
    const planDisplay = document.getElementById('plan-name-display');
    const weekLabel = document.getElementById('week-label');

    planDisplay.innerText = planName;
    
    if (isAttempting24Day && weekLabel) {
        weekLabel.style.display = "inline-block";
        weekLabel.innerText = `Week ${currentPlanWeek + 1}`;
        document.getElementById('confirm-all-btn').innerText = `Confirm Week ${currentPlanWeek + 1}`;
    }

    fullState = {};
    for(let i = 1; i <= displayDays; i++) { 
        fullState[i + dayOffset] = []; 
    }
    
    currentDay = 1 + dayOffset;
    document.getElementById('active-day-num').innerText = 1; 

    applyCategoryRestrictions();
    updateUI();
    if (isPlan24Progress) setTimeout(checkPlanAndAuthUI, 500);
}

// --- POPUP FLOW (ADD / CHOICES / INGREDIENTS) ---

function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) { 
        showToast("Day full!"); 
        return; 
    }
    const item = menuData.find(i => i.id === id);
    pendingItem = JSON.parse(JSON.stringify(item)); 
    pendingItem.selectedChoices = [];
    pendingItem.removedIngredients = [];
    pendingItem.instanceId = Date.now();
    
    currentChoiceStep = 0;
    
    if (pendingItem.multiChoices && pendingItem.multiChoices.length > 0) {
        showChoicePopup();
    } else {
        openIngredientReview();
    }
}

function showChoicePopup() {
    const choiceObj = pendingItem.multiChoices[currentChoiceStep];
    const optionsWithNone = [...choiceObj.options, "None"];
    
    let html = `
        <h3 style="color: #2d5a27; margin-bottom: 5px;">${choiceObj.title}</h3>
        <p style="font-size: 0.8rem; color: #888; margin-bottom: 15px;">Step ${currentChoiceStep + 1} of ${pendingItem.multiChoices.length}</p>
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${optionsWithNone.map(opt => `
                <button class="btn-confirm-mini" 
                        style="background:#f9f9f9; color:#333; padding:15px; border:1px solid #ddd; font-weight:600;" 
                        onclick="finalizeChoice('${opt}')">
                    ${opt}
                </button>
            `).join('')}
        </div>
    `;
    
    document.getElementById('ingredients-list').innerHTML = html;
    document.getElementById('editModal').style.display = "flex";
}

function finalizeChoice(selection) {
    if (selection !== "None") pendingItem.selectedChoices.push(selection);
    
    currentChoiceStep++;
    if (currentChoiceStep < pendingItem.multiChoices.length) {
        showChoicePopup();
    } else {
        openIngredientReview();
    }
}

function openIngredientReview() {
    const item = pendingItem || editingItem;
    
    let html = `
        <h3 style="color: #2d5a27; margin-bottom: 10px;">Review Ingredients</h3>
        <p style="font-size: 0.85rem; color: #666; margin-bottom: 20px;">Uncheck to remove from your <strong>${item.name}</strong>.</p>
        <div class="review-scroll-area">
    `;

    item.ingredients.forEach(ing => {
        const isRemoved = item.removedIngredients.includes(ing);
        html += `
            <label style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer;">
                <input type="checkbox" style="width:18px; height:18px;" 
                       ${isRemoved ? '' : 'checked'} 
                       onchange="toggleIngredient('${ing}')"> 
                <span style="font-size: 0.95rem;">${ing}</span>
            </label>
        `;
    });

    html += `</div>`;
    const actionText = editingItem ? "Save Changes" : "Approve & Add Meal";
    html += `<button class="btn-primary" onclick="finishMealProcess()" style="margin-top:20px; width: 100%;">${actionText}</button>`;
    
    document.getElementById('ingredients-list').innerHTML = html;
    document.getElementById('editModal').style.display = "flex";
}

function toggleIngredient(ing) {
    const item = pendingItem || editingItem;
    if (item.removedIngredients.includes(ing)) {
        item.removedIngredients = item.removedIngredients.filter(i => i !== ing);
    } else {
        item.removedIngredients.push(ing);
    }
}

function finishMealProcess() {
    if (pendingItem) {
        fullState[currentDay].push(pendingItem);
        pendingItem = null;
    } 
    editingItem = null;
    document.getElementById('editModal').style.display = "none";
    updateUI();
}

function openEditModal(instanceId) {
    editingItem = fullState[currentDay].find(i => i.instanceId === instanceId);
    pendingItem = null;
    openIngredientReview();
}

// --- FINAL CONFIRMATION & SUMMARY MODAL ---

async function handleFinalOrder() {
    const loops = displayDays;
    for(let i = 1; i <= loops; i++) { 
        const actualIdx = i + dayOffset;
        if(!fullState[actualIdx] || fullState[actualIdx].length < itemsPerDay) { 
            showToast(`Day ${i} is incomplete!`); 
            return; 
        } 
    }
    showOrderReview();
}

function showOrderReview() {
    let html = `
        <h3 style="color: #2d5a27; margin-bottom: 5px;">Final Review</h3>
        <p style="font-size: 0.8rem; color: #666; margin-bottom: 20px;">Check your order before checkout.</p>
        <div class="review-scroll-area">
    `;

    const loops = displayDays;
    for (let i = 1; i <= loops; i++) {
        const actualIdx = i + dayOffset;
        const dayMeals = fullState[actualIdx] || [];
        
        html += `
            <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <h4 style="margin: 0 0 8px 0; color: #2d5a27; font-size: 0.9rem;">Day ${i}</h4>
        `;

        dayMeals.forEach(item => {
            const choices = item.selectedChoices.length > 0 ? item.selectedChoices.join(' + ') : "Standard";
            const removals = item.removedIngredients.length > 0 
                ? `<div style="color: #d9534f; font-size: 0.75rem; margin-top:2px;">• No ${item.removedIngredients.join(', ')}</div>` 
                : "";
            
            html += `
                <div style="margin-bottom: 8px; padding-left: 8px; border-left: 2px solid #ddd;">
                    <div style="font-size: 0.85rem; font-weight: 600;">${item.name}</div>
                    <div style="font-size: 0.75rem; color: #666;">${choices}${removals}</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    html += `
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
            <button class="btn-primary" onclick="proceedToCheckout()" style="width: 100%; padding: 15px;">Looks Good, Checkout</button>
            <button onclick="closeEditModal()" style="background: none; border: none; color: #888; font-size: 0.85rem; cursor: pointer; text-decoration: underline;">Wait, let me change something</button>
        </div>
    `;

    document.getElementById('ingredients-list').innerHTML = html;
    document.getElementById('editModal').style.display = "flex";
}

function proceedToCheckout() {
    localStorage.setItem('finalOrder', JSON.stringify(fullState));
    const subFlag = isPlan24Progress || totalDaysRequested >= 24 ? "&isSub=true" : "&isSub=false";
    window.location.href = `checkout.html?days=${totalDaysRequested}${subFlag}`;
}

// --- CORE UI & DATA ---

function updateUI() {
    const list = document.getElementById('selection-list'); list.innerHTML = "";
    fullState[currentDay].forEach(item => {
        list.innerHTML += `
            <li style="font-size: 0.85rem; border-bottom: 1px solid #eee; padding: 10px 0;">
                <div style="display: flex; justify-content: space-between; align-items:center;">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small style="color:#2d5a27;">${item.selectedChoices.join(' + ') || 'Standard'}</small>
                        <button onclick="openEditModal(${item.instanceId})" style="display:block; font-size:0.7rem; color:#2d5a27; background:none; border:none; text-decoration:underline; cursor:pointer; padding:0; margin-top:3px;">Edit Ingredients</button>
                    </div>
                    <button onclick="removeItem(${item.instanceId})" style="color:red; background:none; border:none; font-size:1.2rem; cursor:pointer;">&times;</button>
                </div>
            </li>`;
    });
const countDisplay = document.getElementById('day-items-count');
    if (countDisplay) {
        countDisplay.innerText = `${fullState[currentDay].length} / ${itemsPerDay} Items`;
    }
    
    renderCalendar();
}

function loadMenu() {
    if (typeof rawMenuData === 'undefined') return;
    menuData = rawMenuData.map((item, index) => {
        let choices = [];
        if (item.choice_options?.trim()) choices.push({ title: item.choice_title, options: item.choice_options.split(';').map(o => o.trim()) });
        if (item.choice_options_2?.trim()) choices.push({ title: item.choice_title_2, options: item.choice_options_2.split(';').map(o => o.trim()) });
        return { id: index, category: item.category.toLowerCase(), name: item.name, protein: item.protein, ingredients: item.ingredients ? item.ingredients.split(';') : [], multiChoices: choices };
    });
    init();
}

function renderMenu(cat) {
    const grid = document.getElementById('menu-grid'); 
    grid.innerHTML = "";
    
    // 1. Update the Active Button Highlight
    document.querySelectorAll('.cat-btn').forEach(btn => {
        // We check if the onclick attribute contains the category string we just clicked
        const btnOnclick = btn.getAttribute('onclick');
        if (btnOnclick && btnOnclick.includes(`'${cat}'`)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // 2. Filter and Render Items
    const items = menuData.filter(m => {
        if (cat === 'lunch/dinner') {
            return m.category === 'lunch' || m.category === 'dinner';
        }
        return m.category === cat;
    });

    items.forEach(item => { 
        grid.innerHTML += `
            <div class="menu-item-card">
                <h4>${item.name}</h4>
                <p>${item.protein}g Protein</p>
                <button class="btn-confirm-mini" onclick="addItem(${item.id})">Add</button>
            </div>`; 
    });
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid'); grid.innerHTML = "";
    for(let i = 1; i <= displayDays; i++) {
        const idx = i + dayOffset;
        grid.innerHTML += `<div class="day-dot ${currentDay === idx ? 'active' : ''} ${fullState[idx]?.length === itemsPerDay ? 'complete' : ''}" onclick="switchDay(${idx})">${i}</div>`;
    }
}

function switchDay(d) { currentDay = d; updateUI(); }
function removeItem(id) { fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id); updateUI(); }
function showToast(m) { const t = document.createElement('div'); t.className = 'toast-notice show'; t.innerText = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }

function applyCategoryRestrictions() {
    const cleanPlanName = planName.toLowerCase().trim();
    const restrictions = {
        "solo": ["snack", "snacks", "protein", "extra pro"],
        "duo": ["snack", "snacks", "protein", "extra pro"],
        "trio": ["protein", "extra pro"],
        "protein": ["breakfast", "snack", "snacks", "main meals"]
    };
    document.querySelectorAll('.cat-btn').forEach(btn => {
        const btnText = btn.innerText.toLowerCase().trim();
        let isRestricted = false;
        for (const plan in restrictions) {
            if (cleanPlanName.includes(plan) && restrictions[plan].includes(btnText)) { isRestricted = true; break; }
        }
        if (isRestricted) {
            btn.classList.add('unavailable');
            btn.style.opacity = "0.3"; btn.style.pointerEvents = "none";
        }
    });
    const firstAllowed = Array.from(document.querySelectorAll('.cat-btn')).find(b => !b.classList.contains('unavailable'));
    if (firstAllowed) firstAllowed.click();
}

function openEntryModal(mode = 'login') { document.getElementById('entry-modal').style.display = 'flex'; toggleAuthMode(mode); }
function toggleAuthMode(mode) {
    document.getElementById('login-form-area').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('signup-form-area').style.display = mode === 'login' ? 'none' : 'block';
}
function closeEntryModal() { document.getElementById('entry-modal').style.display = 'none'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }
function closeEditModal() { document.getElementById('editModal').style.display = 'none'; }

loadMenu();


// --- 1. ADD THE MISSING FUNCTION ---
function showAlert(message) {
    const alertBox = document.getElementById("custom-alert");
    if (!alertBox) {
        // Fallback if you forgot the HTML element
        alert(message);
        return;
    }
    alertBox.innerText = message;
    alertBox.classList.add("show");
    setTimeout(() => { alertBox.classList.remove("show"); }, 3000);
}

// Function to update the Day Number in the status card
function updateActiveDayDisplay(dayNumber) {
    const dayElement = document.getElementById('active-day-num');
    if (dayElement) {
        dayElement.textContent = dayNumber;
    }
}

function switchDay(d) { 
    currentDay = d; 
    
    // THE FIX: Calculate the relative day (1-6) instead of the offset (7-12, etc.)
    const relativeDay = d - dayOffset;
    const dayDisplay = document.getElementById('active-day-num');
    if (dayDisplay) {
        dayDisplay.innerText = relativeDay;
    }

    updateUI(); 
}