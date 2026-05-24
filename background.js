// Background service worker for Prompt Manager
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for quick prompt insertion
  chrome.contextMenus.create({
    id: 'insert-prompt',
    title: 'Insert Prompt',
    contexts: ['editable']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'insert-prompt') {
    // Open popup for prompt selection
    chrome.action.openPopup();
  }
});

// Handle keyboard shortcut (if defined)
chrome.commands?.onCommand?.addListener((command) => {
  if (command === 'open-popup') {
    chrome.action.openPopup();
  }
});
