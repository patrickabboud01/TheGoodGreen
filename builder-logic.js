/**
 * THE GOOD GREEN - ULTIMATE BUILDER LOGIC (FIXED MODALS)
 * Features: 6-Day Weekly Building, Signup/Login Toggle, Plan Restrictions, Ingredient Toggles
 */

let menuData = []; 
let currentDay = 1;
let fullState = {};
let pendingItem = null; 
let editingItem = null; 
let currentChoiceStep = 0;
let displayDays = 1; 

// --- 1. SUPABASE CONFIG ---
const U = 'https://dehcgxbupadfabotpwvg.supabase.co';
const K = 'sb_publishable_6ktk6QMyDzhrCDDI33G9pA_hgCf8gFU';
const sbClient = supabase.createClient(U, K);

// --- 2. PLAN SETTINGS ---
const params = new URLSearchParams(window.location.search);
const planName = params.get('plan') || "Custom Plan";
const itemsPerDay = parseInt(params.get('items')) || 3;
const totalDays = parseInt(params.get('days')) || 1;
const planPrice = params.get('price') || "0"; 

// --- 3. INITIALIZATION & 6-DAY CAP ---
function init() {
    displayDays = (totalDays >= 24) ? 6 : totalDays;
    document.getElementById('plan-name-display').innerText = (totalDays >= 24) ? `${planName} (Week 1)` : planName;
    document.getElementById('display-total-days').innerText = displayDays;

    fullState = {};
    for(let i = 1; i <= displayDays; i++) { fullState[i] = []; }

    const cleanPlanName = planName.toLowerCase().trim();
    const restrictions = {
        "solo": ["snack", "snacks", "protein", "extra pro"],
        "duo": ["snack", "snacks", "protein", "extra pro"],
        "trio": ["protein", "extra pro"],
        "protein": ["breakfast", "snack", "snacks", "main meals"]
    };

    const navButtons = document.querySelectorAll('.cat-btn');
    let firstAllowedBtn = null;

    navButtons.forEach(btn => {
        const btnText = btn.innerText.toLowerCase().trim();
        let isRestricted = false;
        for (const plan in restrictions) {
            if (cleanPlanName.includes(plan) && restrictions[plan].includes(btnText)) {
                isRestricted = true; break;
            }
        }
        if (isRestricted) {
            btn.classList.add('unavailable');
            btn.style.opacity = "0.3";
            btn.style.pointerEvents = "none";
        } else if (!firstAllowedBtn) {
            firstAllowedBtn = btn;
        }
    });

    if (firstAllowedBtn) firstAllowedBtn.click();
    else renderMenu('breakfast');

    updateUI();
    setTimeout(checkPlanAndAuth, 500);
}

// --- 4. AUTH MODAL LOGIC (FIXES THE WHITE WINDOW) ---
function openEntryModal(mode = 'login') {
    document.getElementById('entry-modal').style.display = 'flex';
    toggleAuthMode(mode); 
}

function toggleAuthMode(mode) {
    const loginArea = document.getElementById('login-form-area');
    const signupArea = document.getElementById('signup-form-area');

    if (mode === 'login') {
        loginArea.style.display = 'block';
        signupArea.style.display = 'none';
    } else {
        loginArea.style.display = 'none';
        signupArea.style.display = 'block';
    }
}

function closeEntryModal() {
    document.getElementById('entry-modal').style.display = 'none';
}

function checkPlanAndAuth() {
    const user = JSON.parse(localStorage.getItem('current_user'));
    const modal = document.getElementById('auth-modal');
    const msgArea = document.getElementById('auth-message-area');
    const btnArea = document.getElementById('auth-buttons-area');

    if (totalDays >= 24) {
        modal.style.display = 'flex';
        if (user) {
            msgArea.innerHTML = `<h2 style="color:#2d5a27;">Welcome ${user.full_name}!</h2><p style="margin-top:15px; color:#444;">Building <strong>Week 1</strong> (6 Days).</p>`;
            btnArea.innerHTML = `<button onclick="closeAuthModal()" class="btn-primary" style="width:100%">Start Week 1</button>`;
        } else {
            msgArea.innerHTML = `<h2 style="color:#2d5a27;">24-Day Program</h2><p style="margin-top:15px; color:#444;">Please Login/Signup to save progress.</p>`;
            btnArea.innerHTML = `<button onclick="openEntryModal('login')" class="btn-primary" style="width:100%">Log In / Sign Up</button>`;
        }
    }
}

// --- 5. SUPABASE ACTIONS ---
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await sbClient.from('profiles').select('*').eq('email', email).eq('password', password).single();
    
    if (error || !data) { alert("Invalid credentials."); } 
    else { localStorage.setItem('current_user', JSON.stringify(data)); location.reload(); }
}

async function handleSignup() {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const phone = document.getElementById('reg-phone').value;
    const address = document.getElementById('reg-address').value;

    if(!name || !email || !password || !phone || !address) { 
        alert("All fields are required for delivery setup!"); 
        return; 
    }

    // 1. Insert the user into Supabase
    const { data, error } = await sbClient.from('profiles').insert([
        { 
            full_name: name, 
            email: email, 
            password: password,
            phone_number: phone, 
            address: address
        }
    ]).select(); // .select() is important to get the created record back

    if (error) {
        console.error("Supabase Error:", error);
        alert("Signup failed: " + error.message);
    } else {
        // 2. AUTO-LOGIN: 
        // We take the data we just sent (or the returned 'data[0]') 
        // and save it to localStorage as if they had logged in.
        const newUser = data[0] || { full_name: name, email: email, phone_number: phone, address: address };
        localStorage.setItem('current_user', JSON.stringify(newUser));
        
        // 3. Refresh or Close Modals
        alert("Welcome to The Good Green, " + name + "!");
        location.reload(); // This reloads the builder with the user now "Logged In"
    }
}

// --- 6. MENU & UI CORE ---
function loadMenu() {
    if (typeof rawMenuData === 'undefined') return;
    menuData = rawMenuData.map((item, index) => {
        let choicesArray = [];
        if (item.choice_options?.trim()) choicesArray.push({ title: item.choice_title || "Selection", options: item.choice_options.split(';').map(o => o.trim()) });
        if (item.choice_options_2?.trim()) choicesArray.push({ title: item.choice_title_2 || "Selection 2", options: item.choice_options_2.split(';').map(o => o.trim()) });
        return { id: index, category: item.category.toLowerCase(), name: item.name, protein: item.protein, ingredients: item.ingredients ? item.ingredients.split(';') : [], multiChoices: choicesArray };
    });
    init();
}

function renderMenu(cat) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = "";
    const cleanCat = cat.toLowerCase().trim();
    document.querySelectorAll('.cat-btn').forEach(b => {
        const btnText = b.innerText.toLowerCase().trim();
        const btnCategory = btnText === "main meals" ? "lunch/dinner" : (btnText === "extra pro" ? "protein" : btnText);
        b.classList.toggle('active', (cleanCat === btnCategory));
    });
    const itemsToShow = menuData.filter(m => (cat === 'lunch/dinner') ? (m.category === 'lunch' || m.category === 'dinner') : (m.category === cat));
    itemsToShow.forEach(item => {
        grid.innerHTML += `<div class="menu-item-card"><h4>${item.name}</h4><p>${item.protein}g Protein</p><button class="btn-confirm-mini" onclick="addItem(${item.id})">Add</button></div>`;
    });
}

function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) { showToast("Day full!"); return; }
    const item = menuData.find(i => i.id === id);
    pendingItem = JSON.parse(JSON.stringify(item)); 
    pendingItem.selectedChoices = [];
    currentChoiceStep = 0; 
    if (pendingItem.multiChoices?.length > 0) showChoicePopup(); 
    else confirmAdd();
}

function showChoicePopup() {
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    const choiceObj = pendingItem.multiChoices[currentChoiceStep];
    container.innerHTML = `<h3>${choiceObj.title}</h3><div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">${choiceObj.options.map(opt => `<button class="btn-confirm-mini" style="background:#2d5a27; color:white; padding:15px;" onclick="finalizeChoice('${opt}')">${opt}</button>`).join('')}</div>`;
    modal.style.display = "flex";
}

function finalizeChoice(selection) {
    pendingItem.selectedChoices.push(selection);
    currentChoiceStep++;
    if (currentChoiceStep < pendingItem.multiChoices.length) showChoicePopup();
    else { confirmAdd(); document.getElementById('editModal').style.display = "none"; }
}

function confirmAdd() {
    pendingItem.instanceId = Date.now() + Math.random();
    pendingItem.removedIngredients = [];
    fullState[currentDay].push(pendingItem);
    pendingItem = null;
    updateUI();
}

function openEditModal(instanceId) {
    editingItem = fullState[currentDay].find(i => i.instanceId === instanceId);
    const modal = document.getElementById('editModal');
    const container = document.getElementById('ingredients-list');
    container.innerHTML = `<h3>Customize ${editingItem.name}</h3>`;
    editingItem.ingredients.forEach(ing => {
        const isRemoved = editingItem.removedIngredients.includes(ing);
        container.innerHTML += `<label style="display:block; padding:10px;"><input type="checkbox" ${isRemoved ? '' : 'checked'} onchange="toggleIngredient('${ing}')"> ${ing}</label>`;
    });
    modal.style.display = "flex";
}

function toggleIngredient(ing) {
    if (editingItem.removedIngredients.includes(ing)) editingItem.removedIngredients = editingItem.removedIngredients.filter(i => i !== ing);
    else editingItem.removedIngredients.push(ing);
}

function closeEditModal() { document.getElementById('editModal').style.display = "none"; editingItem = null; updateUI(); }

function updateUI() {
    const list = document.getElementById('selection-list');
    list.innerHTML = "";
    fullState[currentDay].forEach(item => {
        list.innerHTML += `<li style="font-size: 0.85rem; border-bottom: 1px solid #eee; padding: 10px 0;">
            <div style="display: flex; justify-content: space-between;">
                <div><strong>${item.name}</strong><br><small>${item.selectedChoices.join(' + ')}</small>
                <button onclick="openEditModal(${item.instanceId})" style="display:block; font-size:0.7rem; color:#2d5a27; background:none; border:none; text-decoration:underline;">Edit</button></div>
                <button onclick="removeItem(${item.instanceId})" style="color:red; background:none; border:none;">&times;</button>
            </div></li>`;
    });
    document.getElementById('day-items-count').innerText = `${fullState[currentDay].length} / ${itemsPerDay} Items`;
    if(totalDays >= 24) document.getElementById('confirm-all-btn').innerText = "Confirm Week 1";
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = "";
    for(let i = 1; i <= displayDays; i++) {
        const isFull = fullState[i]?.length === itemsPerDay;
        grid.innerHTML += `<div class="day-dot ${currentDay === i ? 'active' : ''} ${isFull ? 'complete' : ''}" onclick="switchDay(${i})">${i}</div>`;
    }
}

function switchDay(d) { currentDay = d; document.getElementById('active-day-num').innerText = d; updateUI(); }
function removeItem(id) { fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id); updateUI(); }

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notice show';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

async function handleFinalOrder() {
    for(let i=1; i<=displayDays; i++) {
        if(fullState[i].length < itemsPerDay) { showToast(`Day ${i} incomplete!`); return; }
    }
    localStorage.setItem('finalOrder', JSON.stringify(fullState));
    window.location.href = "checkout.html";
}

loadMenu();