/**
 * THE GOOD GREEN - BUILDER LOGIC (Updated for Weekly Flow)
 * Isolated Subscription Logic
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
            // Check if user is continuing their active 24-day plan
            if (isAttempting24Day && params.get('plan') === profile.active_package_name) {
                isPlan24Progress = true;
                currentPlanWeek = profile["24planweek"] || 0;
                planName = profile.active_package_name;
                
                const name = planName.toUpperCase();
                if(name.includes("SOLO")) itemsPerDay = 1;
                else if(name.includes("DUO")) itemsPerDay = 2;
                else if(name.includes("TRIO")) itemsPerDay = 3;
                else if(name.includes("FULL")) itemsPerDay = 4;
            } 
            // Block attempt to start a different plan while one is active
            else if (isAttempting24Day && params.get('plan') !== profile.active_package_name) {
                window.location.href = "plan-status.html";
                return;
            }
        }
    }

    // UPDATED LOGIC: Force 6 days for any 24-day plan request to simplify UX
    displayDays = isAttempting24Day ? 6 : totalDaysRequested;
    dayOffset = isPlan24Progress ? (currentPlanWeek * 6) : 0;

    document.getElementById('display-total-days').innerText = totalDaysRequested;
    const planDisplay = document.getElementById('plan-name-display');
    const weekLabel = document.getElementById('week-label');

    planDisplay.innerText = planName;
    
    // UI Labeling for Weeks
    if (isAttempting24Day && weekLabel) {
        weekLabel.style.display = "inline-block";
        weekLabel.innerText = `Week ${currentPlanWeek + 1}`;
        document.getElementById('confirm-all-btn').innerText = `Confirm Week ${currentPlanWeek + 1}`;
    } else if (weekLabel) {
        weekLabel.style.display = "none";
        document.getElementById('confirm-all-btn').innerText = `Confirm Order`;
    }

    // Build the selection state for the visible 6 days
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

function applyCategoryRestrictions() {
    const cleanPlanName = planName.toLowerCase().trim();
    const restrictions = {
        "solo": ["snack", "snacks", "protein", "extra pro"],
        "duo": ["snack", "snacks", "protein", "extra pro"],
        "trio": ["protein", "extra pro"],
        "protein": ["breakfast", "snack", "snacks", "main meals"]
    };
    const navButtons = document.querySelectorAll('.cat-btn');
    navButtons.forEach(btn => {
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
    const firstAllowed = Array.from(navButtons).find(b => !b.classList.contains('unavailable'));
    if (firstAllowed) firstAllowed.click();
}

function openEntryModal(mode = 'login') { document.getElementById('entry-modal').style.display = 'flex'; toggleAuthMode(mode); }
function toggleAuthMode(mode) {
    document.getElementById('login-form-area').style.display = mode === 'login' ? 'block' : 'none';
    document.getElementById('signup-form-area').style.display = mode === 'login' ? 'none' : 'block';
}
function closeEntryModal() { document.getElementById('entry-modal').style.display = 'none'; }
function closeAuthModal() { document.getElementById('auth-modal').style.display = 'none'; }

function checkPlanAndAuthUI() {
    const user = JSON.parse(localStorage.getItem('current_user'));
    const modal = document.getElementById('auth-modal');
    if (isPlan24Progress) {
        modal.style.display = 'flex';
        if (user) {
            document.getElementById('auth-message-area').innerHTML = `<h2 style="color:#2d5a27;">Welcome ${user.full_name}!</h2><p>Building <strong>Week ${currentPlanWeek + 1}</strong>.</p>`;
            document.getElementById('auth-buttons-area').innerHTML = `<button onclick="closeAuthModal()" class="btn-primary" style="width:100%">Continue</button>`;
        } else {
            document.getElementById('auth-message-area').innerHTML = `<h2 style="color:#2d5a27;">24-Day Program</h2><p>Login to track weeks.</p>`;
            document.getElementById('auth-buttons-area').innerHTML = `<button onclick="openEntryModal('login')" class="btn-primary" style="width:100%">Log In / Sign Up</button>`;
        }
    }
}

async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { data, error } = await sbClient.from('profiles').select('*').eq('email', email).eq('password', password).single();
    if (error) alert("Invalid credentials."); 
    else { localStorage.setItem('current_user', JSON.stringify(data)); location.reload(); }
}

async function handleSignup() {
    const { data, error } = await sbClient.from('profiles').insert([{ 
        full_name: document.getElementById('reg-name').value, 
        email: document.getElementById('reg-email').value, 
        password: document.getElementById('reg-password').value, 
        phone_number: document.getElementById('reg-phone').value, 
        address: document.getElementById('reg-address').value, 
        plan24days: (totalDaysRequested >= 24), 
        "24planweek": 0,
        active_package_name: planName
    }]).select();
    if (error) alert(error.message); else { localStorage.setItem('current_user', JSON.stringify(data[0])); location.reload(); }
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
    const grid = document.getElementById('menu-grid'); grid.innerHTML = "";
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.innerText.toLowerCase().includes(cat.split('/')[0])));
    const items = menuData.filter(m => (cat === 'lunch/dinner') ? (m.category === 'lunch' || m.category === 'dinner') : (m.category === cat));
    items.forEach(item => { grid.innerHTML += `<div class="menu-item-card"><h4>${item.name}</h4><p>${item.protein}g Protein</p><button class="btn-confirm-mini" onclick="addItem(${item.id})">Add</button></div>`; });
}

function addItem(id) {
    if (fullState[currentDay].length >= itemsPerDay) { showToast("Day full!"); return; }
    const item = menuData.find(i => i.id === id);
    pendingItem = JSON.parse(JSON.stringify(item)); pendingItem.selectedChoices = [];
    if (pendingItem.multiChoices?.length > 0) showChoicePopup(); else confirmAdd();
}

function showChoicePopup() {
    const choiceObj = pendingItem.multiChoices[currentChoiceStep];
    document.getElementById('ingredients-list').innerHTML = `<h3>${choiceObj.title}</h3><div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">${choiceObj.options.map(opt => `<button class="btn-confirm-mini" style="background:#2d5a27; color:white; padding:15px;" onclick="finalizeChoice('${opt}')">${opt}</button>`).join('')}</div>`;
    document.getElementById('editModal').style.display = "flex";
}

function finalizeChoice(selection) {
    pendingItem.selectedChoices.push(selection); currentChoiceStep++;
    if (currentChoiceStep < pendingItem.multiChoices.length) showChoicePopup();
    else { confirmAdd(); document.getElementById('editModal').style.display = "none"; currentChoiceStep = 0; }
}

function confirmAdd() {
    pendingItem.instanceId = Date.now(); pendingItem.removedIngredients = [];
    fullState[currentDay].push(pendingItem); updateUI();
}

function openEditModal(instanceId) {
    editingItem = fullState[currentDay].find(i => i.instanceId === instanceId);
    let html = `<h3>Customize ${editingItem.name}</h3>`;
    editingItem.ingredients.forEach(ing => html += `<label style="display:block; padding:10px;"><input type="checkbox" ${editingItem.removedIngredients.includes(ing) ? '' : 'checked'} onchange="toggleIngredient('${ing}')"> ${ing}</label>`);
    document.getElementById('ingredients-list').innerHTML = html;
    document.getElementById('editModal').style.display = "flex";
}

function toggleIngredient(ing) {
    if (editingItem.removedIngredients.includes(ing)) editingItem.removedIngredients = editingItem.removedIngredients.filter(i => i !== ing);
    else editingItem.removedIngredients.push(ing);
}

function closeEditModal() { document.getElementById('editModal').style.display = "none"; updateUI(); }

function updateUI() {
    const list = document.getElementById('selection-list'); list.innerHTML = "";
    fullState[currentDay].forEach(item => {
        list.innerHTML += `<li style="font-size: 0.85rem; border-bottom: 1px solid #eee; padding: 10px 0;"><div style="display: flex; justify-content: space-between;"><div><strong>${item.name}</strong><br><small>${item.selectedChoices.join(' + ')}</small><button onclick="openEditModal(${item.instanceId})" style="display:block; font-size:0.7rem; color:#2d5a27; background:none; border:none; text-decoration:underline;">Edit</button></div><button onclick="removeItem(${item.instanceId})" style="color:red; background:none; border:none;">&times;</button></div></li>`;
    });
    document.getElementById('day-items-count').innerText = `${fullState[currentDay].length} / ${itemsPerDay} Items`;
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid'); grid.innerHTML = "";
    const loops = displayDays;
    for(let i = 1; i <= loops; i++) {
        const idx = i + dayOffset;
        grid.innerHTML += `<div class="day-dot ${currentDay === idx ? 'active' : ''} ${fullState[idx]?.length === itemsPerDay ? 'complete' : ''}" onclick="switchDay(${idx})">${i}</div>`;
    }
}

function switchDay(d) { currentDay = d; updateUI(); }
function removeItem(id) { fullState[currentDay] = fullState[currentDay].filter(i => i.instanceId !== id); updateUI(); }
function showToast(m) { const t = document.createElement('div'); t.className = 'toast-notice show'; t.innerText = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2500); }

async function handleFinalOrder() {
    const loops = displayDays;
    for(let i = 1; i <= loops; i++) { 
        const actualIdx = i + dayOffset;
        if(!fullState[actualIdx] || fullState[actualIdx].length < itemsPerDay) { 
            showToast(`Day ${i} incomplete!`); return; 
        } 
    }
    localStorage.setItem('finalOrder', JSON.stringify(fullState));
    const subFlag = isPlan24Progress || totalDaysRequested >= 24 ? "&isSub=true" : "&isSub=false";
    window.location.href = `checkout.html?days=${totalDaysRequested}${subFlag}`;
}

loadMenu();