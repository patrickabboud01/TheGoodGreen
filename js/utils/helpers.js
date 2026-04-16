/**
 * Helper Utilities
 * Pure functions for choice handling, ingredient management, and user feedback
 */

/**
 * Show a temporary toast notification
 */
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-notice show';
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

/**
 * Handle a choice selection (single or multiple)
 */
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
        // Toggle selection for multiple choice
        if (tempSelections.includes(selection)) {
            tempSelections = tempSelections.filter(s => s !== selection);
        } else {
            tempSelections.push(selection);
        }
        showChoicePopup();
    }
}

/**
 * Confirm multiple selections and advance step
 */
function confirmMultipleChoice() {
    if (tempSelections.length > 0) {
        pendingItem.selectedChoices.push(tempSelections.join(', '));
    }
    tempSelections = [];
    advanceChoiceStep();
}

/**
 * Advance to the next choice step
 */
function advanceChoiceStep() {
    currentChoiceStep++;
    if (currentChoiceStep < pendingItem.multiChoices.length) {
        showChoicePopup();
    } else {
        openIngredientReview();
    }
}

/**
 * Go back one step in choice selection
 */
function goBackStep() {
    if (currentChoiceStep > 0) {
        currentChoiceStep--;
        pendingItem.selectedChoices.pop();
        tempSelections = [];
        showChoicePopup();
    }
}

/**
 * Go back from ingredient review to previous choice step
 */
function goBackFromReview() {
    currentChoiceStep--;
    if (pendingItem.selectedChoices.length > 0) {
        pendingItem.selectedChoices.pop();
    }
    showChoicePopup();
}

/**
 * Toggle an ingredient as removed/included
 */
function toggleIngredient(ingredient) {
    const item = pendingItem || editingItem;
    if (item.removedIngredients.includes(ingredient)) {
        item.removedIngredients = item.removedIngredients.filter(i => i !== ingredient);
    } else {
        item.removedIngredients.push(ingredient);
    }
}

/**
 * Finish the meal add/edit process
 */
function finishMealProcess() {
    const item = pendingItem || editingItem;

    // Capture special instructions from textarea
    const instrInput = document.getElementById('user-instructions');
    if (instrInput) {
        item.specialInstructions = instrInput.value.trim();
    }

    if (pendingItem) {
        fullState[currentDay].push(pendingItem);
        pendingItem = null;
    }

    editingItem = null;
    document.getElementById('editModal').style.display = "none";
    updateUI();
}
