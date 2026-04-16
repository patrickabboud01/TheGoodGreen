/**
 * Builder UI Rendering
 * All DOM rendering, modal display, and choice/ingredient flows
 */

/**
 * Render menu grid for selected category
 */
function renderMenu(cat) {
    const grid = document.getElementById('menu-grid');
    if (!grid) return;
    grid.innerHTML = "";

    const selectedCat = cat.toLowerCase().trim();

    // Highlight the active category button
    document.querySelectorAll('.cat-btn').forEach(btn => {
        const btnText = btn.innerText.toLowerCase().trim();

        const isMatch = (btnText === selectedCat) ||
            (selectedCat === 'lunch/dinner' && (btnText.includes('main') || btnText.includes('meal'))) ||
            (selectedCat === 'snack' && btnText.includes('snack')) ||
            (selectedCat === 'protein' && (btnText.includes('extra') || btnText.includes('pro')));

        if (isMatch) {
            btn.classList.add('active');
            btn.style.backgroundColor = "#5d8039";
            btn.style.color = "white";
        } else {
            btn.classList.remove('active');
            btn.style.backgroundColor = "";
            btn.style.color = "";
        }
    });

    // Filter items by category
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

<div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 10px; white-space: nowrap;">
    <p style="font-size: 0.75rem; color: #5d8039; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 4px;">
        <i class="fas fa-dumbbell" style="font-size: 0.7rem;"></i> ${item.protein} g Protein
    </p>

    <div style="width: 1px; height: 12px; background-color: #ddd;"></div>

    <p style="font-size: 0.75rem; color: #888; margin: 0; display: flex; align-items: center; gap: 4px;">
        <i class="fas fa-fire" style="font-size: 0.7rem;"></i> ${item.Kcal} Kcal*
    </p>
</div>

            <button class="btn-confirm-mini" onclick="addItem(${item.id})">Add</button>
        </div>
    </div>`;
    });
}

/**
 * Update the selection list and day count
 */
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

/**
 * Render the day indicator dots/boxes
 */
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    grid.innerHTML = "";

    for (let i = 1; i <= displayDays; i++) {
        const idx = i + dayOffset;
        grid.innerHTML += `<div class="day-dot ${currentDay === idx ? 'active' : ''} ${fullState[idx]?.length === itemsPerDay ? 'complete' : ''}" onclick="switchDay(${idx})">${i}</div>`;
    }
}

/**
 * Show choice popup for multi-step selection
 */
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

/**
 * Open ingredient review and special instructions modal
 */
function openIngredientReview() {
    const item = pendingItem || editingItem;
    const container = document.getElementById('ingredients-list');

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

    html += `</div>`;

    // Special Instructions textarea
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

/**
 * Open edit modal for an existing meal
 */
function openEditModal(instanceId) {
    editingItem = fullState[currentDay].find(i => i.instanceId === instanceId);
    pendingItem = null;
    openIngredientReview();
}

/**
 * Show final order review before checkout
 */
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

    // Action buttons
    html += `
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%;">
            <button class="btn-primary" onclick="proceedToCheckout()"
                style="width: 100%; max-width: 300px; padding: 15px; font-weight:bold; cursor:pointer;">
                Looks Good, Checkout
            </button>

            <button onclick="closeEditModal()"
                style="background: none; border: none; color: #888; font-size: 0.85rem; cursor: pointer; text-decoration: underline; width: fit-content;">
                Wait, let me change something
            </button>
        </div>
    `;

    const container = document.getElementById('ingredients-list');
    if (container) {
        container.innerHTML = html;
        document.getElementById('editModal').style.display = "flex";
    }
}

/**
 * Open image lightbox
 */
function openImageLightbox(src) {
    const lightbox = document.getElementById('image-lightbox');
    const img = document.getElementById('lightbox-img');
    img.src = src;
    lightbox.style.display = 'flex';
}

/**
 * Close image lightbox
 */
function closeImageLightbox() {
    document.getElementById('image-lightbox').style.display = 'none';
}
