/**
 * THE GOOD GREEN - COMPLETE BUILDER LOGIC (UPDATED WITH INSTRUCTIONS)
 */
let menuData = []; 
let currentDay = 1; 
let fullState = {};
let pendingItem = null; 
let editingItem = null; 
let currentChoiceStep = 0;
let displayDays = 1; 
let tempSelections = []; 

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

    const totalDaysEl = document.getElementById('display-total-days');
    if (totalDaysEl) totalDaysEl.innerText = totalDaysRequested;

    const planDisplay = document.getElementById('plan-name-display');
    const weekLabel = document.getElementById('week-label');

    if (planDisplay) planDisplay.innerText = planName;
    
    if (isAttempting24Day && weekLabel) {
        weekLabel.style.display = "inline-block";
        weekLabel.innerText = `Week ${currentPlanWeek + 1}`;
        const confirmBtn = document.getElementById('confirm-all-btn');
        if (confirmBtn) confirmBtn.innerText = `Confirm Week ${currentPlanWeek + 1}`;
    }

    fullState = {};
    for(let i = 1; i <= displayDays; i++) { 
        fullState[i + dayOffset] = []; 
    }
    
    currentDay = 1 + dayOffset;
    updateActiveDayDisplay(1);

    applyCategoryRestrictions();
    updateUI();
}

// --- POPUP FLOW (ADD / CHOICES / INGREDIENTS) ---
function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) { 
        showToast("Day full!"); 
        return; 
    }
    const item = menuData.find(i => i.id === id);
    if (!item) return;

    pendingItem = JSON.parse(JSON.stringify(item)); 
    pendingItem.selectedChoices = [];
    pendingItem.removedIngredients = [];
    
    // CRITICAL: Initialize a unique instruction property for THIS meal instance
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

function showChoicePopup() {
    const choiceObj = pendingItem.multiChoices[currentChoiceStep];
    const isMultiple = choiceObj.type === "multiple";
    
    const backBtnText = currentChoiceStep === 0 ? "✕" : "← Back";
    const backAction = currentChoiceStep === 0 ? "closeEditModal()" : "goBackStep()";

    let html = `
        <button onclick="${backAction}" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#888; cursor:pointer; font-weight:600;">${backBtnText}</button>
        
        <h3 style="color: #2d5a27; margin-bottom: 5px; margin-top:10px; text-align:center;">${choiceObj.title}</h3>
        <p style="font-size: 0.8rem; color: #888; margin-bottom: 15px; text-align:center;">
            ${isMultiple ? 'Choose one or more:' : 'Choose one option:'} (Step ${currentChoiceStep + 1} of ${pendingItem.multiChoices.length})
        </p>
        
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${choiceObj.options.map(opt => {
                const isSelected = isMultiple && tempSelections.includes(opt);
                return `
                    <button class="btn-confirm-mini ${isSelected ? 'active-choice-btn' : ''}" 
                            style="background:${isSelected ? '#e8f5e9' : '#f9f9f9'}; color:#333; padding:15px; border:1px solid ${isSelected ? '#2d5a27' : '#ddd'}; font-weight:600;" 
                            onclick="handleChoiceSelection('${opt}')">
                        ${opt} ${isSelected ? '✓' : ''}
                    </button>
                `;
            }).join('')}
             </div>
    `;

    if (isMultiple) {
        html += `<button class="btn-primary" style="margin-top:20px; width:100%;" onclick="confirmMultipleChoice()">Confirm Selection</button>`;
    }
    
    document.getElementById('ingredients-list').innerHTML = html;
    document.getElementById('editModal').style.display = "flex";
}

function handleChoiceSelection(selection) {
    const choiceObj = pendingItem.multiChoices[currentChoiceStep];
    if (selection === "None") {
        advanceChoiceStep();
        return;
    }
    if (choiceObj.type === "single") {
        pendingItem.selectedChoices.push(selection);
        advanceChoiceStep();
    } else {
        if (tempSelections.includes(selection)) {
            tempSelections = tempSelections.filter(s => s !== selection);
        } else {
            tempSelections.push(selection);
        }
        showChoicePopup();
    }
}

function confirmMultipleChoice() {
    if (tempSelections.length > 0) {
        pendingItem.selectedChoices.push(tempSelections.join(', '));
    }
    tempSelections = [];
    advanceChoiceStep();
}

function advanceChoiceStep() {
    currentChoiceStep++;
    if (currentChoiceStep < pendingItem.multiChoices.length) {
        showChoicePopup();
    } else {
        openIngredientReview();
    }
}

function goBackStep() {
    if (currentChoiceStep > 0) {
        currentChoiceStep--;
        pendingItem.selectedChoices.pop();
        tempSelections = [];
        showChoicePopup();
    }
}

function openIngredientReview() {
    const item = pendingItem || editingItem;
    const container = document.getElementById('ingredients-list');
    
    // 1. CLEAR THE ENTIRE WINDOW FIRST to prevent double boxes
    container.innerHTML = "";

    let navBtnHtml = "";
    if (pendingItem && pendingItem.multiChoices && pendingItem.multiChoices.length > 0) {
        navBtnHtml = `<button onclick="goBackFromReview()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#ccc; cursor:pointer; font-weight:600; font-size:0.9rem;">Back ←</button>`;
    } else {
        navBtnHtml = `<button onclick="closeEditModal()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#ccc; cursor:pointer; font-size:1.2rem;">✕</button>`;
    }

    let html = `
        ${navBtnHtml}
        <h3 style="color: #5d8039; margin-bottom: 10px; margin-top: 15px; text-align: center;">Review Ingredients</h3>
        <p style="font-size: 0.85rem; color: #666; margin-bottom: 20px; text-align: center;">Customize your <strong>${item.name}</strong>.</p>
        <div class="review-scroll-area">
    `;

    // Fixed Ingredients
    item.fixedIngredients.forEach(ing => {
        html += `<div style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f9f9f9;"><i class="fas fa-lock" style="font-size: 0.8rem; color: #ccc; width: 18px; text-align: center;"></i><span style="font-size: 0.95rem; color: #666 ;">${ing} <small>(Required)</small></span></div>`;
    });

    // Removable Ingredients
    item.removableIngredients.forEach(ing => {
        const isRemoved = item.removedIngredients.includes(ing);
        html += `<label style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer;"><input type="checkbox" style="width:18px; height:18px; accent-color: #5d8039;" ${isRemoved ? '' : 'checked'} onchange="toggleIngredient('${ing}')"><span style="font-size: 0.95rem;">${ing}</span></label>`;
    });

    html += `</div>`; // End scroll area

    // 2. THE SINGLE MEAL-SPECIFIC TEXT BOX
    html += `
        <div style="margin-top: 15px; padding: 0 10px;">
            <label style="display: block; font-size: 0.8rem; color: #888; margin-bottom: 5px; font-weight: 600;">Special Instructions (Optional)</label>
            <textarea id="user-instructions" 
                placeholder="e.g. No salt, extra spicy..." 
                style="width: 100%; height: 60px; border: 1px solid #eee; border-radius: 8px; padding: 10px; font-family: inherit; font-size: 0.85rem; resize: none;">${item.specialInstructions || ''}</textarea>
        </div>
    `;

    const actionText = editingItem ? "Save Changes" : "Approve & Add Meal";
    html += `<button class="btn-primary" onclick="finishMealProcess()" style="margin-top:20px; width: 100%;">${actionText}</button>`;
    
    container.innerHTML = html;
    document.getElementById('editModal').style.display = "flex";
}

function goBackFromReview() {
    currentChoiceStep--; 
    if(pendingItem.selectedChoices.length > 0) pendingItem.selectedChoices.pop(); 
    showChoicePopup();
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
    const item = pendingItem || editingItem;
    
    // Check if the textarea exists and grab the value
    const instrInput = document.getElementById('user-instructions');
    if (instrInput) {
        // This attaches the text to the specific meal object
        item.specialInstructions = instrInput.value.trim();
        console.log("Saved Instruction:", item.specialInstructions); // Debugging line
    }

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

// --- CORE UI & DATA LOADING ---

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
            image: item.image,
            fixedIngredients: item.fixed_ingredients ? item.fixed_ingredients.split(';') : [],
            removableIngredients: item.removable_ingredients ? item.removable_ingredients.split(';') : [],
            multiChoices: choices 
        };
    });
    init();
}

function renderMenu(cat) {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    grid.innerHTML = "";

    const selectedCat = cat.toLowerCase().trim();

    // --- FIX: Highlighting Logic ---
    document.querySelectorAll('.cat-btn').forEach(btn => {
        const btnText = btn.innerText.toLowerCase().trim();
        
        // This checks for exact matches OR if "Main Meals" is clicked for lunch/dinner
        const isMatch = (btnText === selectedCat) || 
                        (selectedCat === 'lunch/dinner' && (btnText.includes('main') || btnText.includes('meal'))) ||
                        (selectedCat === 'snack' && btnText.includes('snack')) ||
                        (selectedCat === 'protein' && (btnText.includes('extra') || btnText.includes('pro')));

        if (isMatch) {
            btn.classList.add('active');
            btn.style.backgroundColor = "#5d8039"; // Force Green
            btn.style.color = "white";
        } else {
            btn.classList.remove('active');
            btn.style.backgroundColor = ""; // Reset
            btn.style.color = "";
        }
    });
    const items = menuData.filter(m => {
        if (selectedCat === 'lunch/dinner') {
            return m.category === 'lunch' || m.category === 'dinner';
        }
        return m.category === selectedCat;
    });

    if (items.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#888; padding:20px;">No meals found.</p>`;
        return;
    }

    items.forEach(item => { 
      grid.innerHTML += `
    <div class="menu-item-card">
        <div class="card-img-wrapper" 
             onclick="openImageLightbox('${item.image}')" 
             style="width: 100%; height: 120px; overflow: hidden; border-radius:12px 12px 0 0; cursor: pointer;">
            <img src="${item.image}" 
                 alt="${item.name}"
                 style="width: 100%; height: 100%; object-fit: cover;" 
                 onerror="this.src='https://placehold.co/400x300?text=Image+Missing'">                
        </div>
        <div style="padding:10px;">
            <h4 style="font-size:0.9rem; margin-bottom:5px;">${item.name}</h4>
            <button class="btn-confirm-mini" onclick="addItem(${item.id})">Add</button>
        </div>
    </div>`;
    });
}

function updateUI() {
    const list = document.getElementById('selection-list'); 
    if (!list) return;
    list.innerHTML = "";
    
    fullState[currentDay].forEach(item => {
        const instrSnippet = item.specialInstructions ? `<div style="font-size:0.7rem; color:#888; font-style:italic;">Note: ${item.specialInstructions}</div>` : '';
        list.innerHTML += `
            <li style="font-size: 0.85rem; border-bottom: 1px solid #eee; padding: 10px 0;">
                <div style="display: flex; justify-content: space-between; align-items:center;">
                    <div>
                        <strong>${item.name}</strong><br>
                        <small style="color:#2d5a27;">${item.selectedChoices.join(' + ') || 'Standard'}</small>
                        ${instrSnippet}
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

function renderCalendar() {
    const grid = document.getElementById('calendar-grid'); 
    if (!grid) return;
    grid.innerHTML = "";
    for(let i = 1; i <= displayDays; i++) {
        const idx = i + dayOffset;
        grid.innerHTML += `<div class="day-dot ${currentDay === idx ? 'active' : ''} ${fullState[idx]?.length === itemsPerDay ? 'complete' : ''}" onclick="switchDay(${idx})">${i}</div>`;
    }
}

function switchDay(d) { 
    currentDay = d; 
    const relativeDay = d - dayOffset;
    updateActiveDayDisplay(relativeDay);
    updateUI(); 
}

function updateActiveDayDisplay(dayNumber) {
    const dayElement = document.getElementById('active-day-num');
    if (dayElement) dayElement.textContent = dayNumber;
}

function removeItem(id) { 
    fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id); 
    updateUI(); 
}

function showToast(m) { 
    const t = document.createElement('div'); 
    t.className = 'toast-notice show'; 
    t.innerText = m; 
    document.body.appendChild(t); 
    setTimeout(() => t.remove(), 2500); 
}

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

function closeEditModal() { 
    document.getElementById('editModal').style.display = "none"; 
    pendingItem = null;
    editingItem = null;
}
// --- BUILDER MODAL BACKDROP LOGIC ---
window.addEventListener('click', function(event) {
    const editModal = document.getElementById('editModal');
    
    // Check if the click was exactly on the modal background
    if (event.target === editModal) {
        // If we are in the middle of picking choices, we reset pendingItem
        // to prevent data bugs, then close.
        closeEditModal();
    }
});

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
        <button onclick="closeEditModal()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#888; cursor:pointer; font-size:1.2rem;">✕</button>
        <h3 style="color: #2d5a27; margin-bottom: 5px; text-align:center;">Final Review</h3>
        <p style="font-size: 0.8rem; color: #666; margin-bottom: 20px; text-align:center;">Check your order before checkout.</p>
        <div class="review-scroll-area" style="max-height: 400px; overflow-y: auto; padding: 10px;">
    `;

    const loops = displayDays;
    for (let i = 1; i <= loops; i++) {
        const actualIdx = i + dayOffset;
        const dayMeals = fullState[actualIdx] || [];
        
        html += `
            <div style="margin-bottom: 20px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px;">
                <h4 style="margin: 0 0 10px 0; color: #5d8039; font-size: 1rem; border-left: 4px solid #5d8039; padding-left: 10px;">Day ${i}</h4>
        `;

        dayMeals.forEach(item => {
            const choices = item.selectedChoices.length > 0 ? item.selectedChoices.join(' + ') : "Standard";
            
            const instructionsHtml = item.specialInstructions 
                ? `<div style="color: #5d8039; font-size: 0.75rem; margin-top:4px; font-style: italic;">" ${item.specialInstructions} "</div>` 
                : "";

            const removals = item.removedIngredients.length > 0 
                ? `<div style="color: #d9534f; font-size: 0.75rem; margin-top:4px; font-weight:600;">• No: ${item.removedIngredients.join(', ')}</div>` 
                : "";
            
            html += `
                <div style="margin-bottom: 12px; padding: 10px; background: #fdfdfd; border-radius: 8px; border: 1px solid #eee;">
                    <div style="font-size: 0.9rem; font-weight: 700; color: #333;">${item.name}</div>
                    <div style="font-size: 0.8rem; color: #666; margin-top: 2px;">Option: ${choices}</div>
                    ${removals}
                    ${instructionsHtml}
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    html += `
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
            <button class="btn-primary" onclick="proceedToCheckout()" style="width: 100%; padding: 15px; font-weight:bold;">Looks Good, Checkout</button>
            <button onclick="closeEditModal()" style="background: none; border: none; color: #888; font-size: 0.85rem; cursor: pointer; text-decoration: underline;">Wait, let me change something</button>
        </div>
    `;

    const container = document.getElementById('ingredients-list');
    if (container) {
        container.innerHTML = html;
        document.getElementById('editModal').style.display = "flex";
    }
}

function proceedToCheckout() {
    // Stringify the fullState which now includes the specialInstructions
    localStorage.setItem('finalOrder', JSON.stringify(fullState));
    
    const subFlag = isPlan24Progress || totalDaysRequested >= 24 ? "&isSub=true" : "&isSub=false";
    window.location.href = `checkout.html?days=${totalDaysRequested}${subFlag}`;
}

loadMenu();

function openImageLightbox(src) {
    const lightbox = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = src;
    lightbox.style.display = 'flex'; // Shows the modal
}

function closeImageLightbox() {
    document.getElementById('image-lightbox').style.display = 'none'; // Hides the modal
}