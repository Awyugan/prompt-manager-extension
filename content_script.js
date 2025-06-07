// content_script.js
console.log("Prompt Manager content script loaded.");

let searchUiContainer = null;
let searchInput = null;
let promptsListUl = null;
let activeInputElement = null;
let allPrompts = []; // To store all prompts fetched from background

let shadowHost = null; // New variable to hold the shadow DOM host
let shadowRoot = null; // New variable to hold the shadow root

let PROMPT_SEARCH_SHORTCUT_KEY = '/'; // Default value
let lastSlashTimestamp = 0;
let slashCount = 0;

// Helper function to simulate backspace key presses (re-introduced for contenteditable)
function simulateBackspace(element, count) {
  if (!element || count <= 0) return;

  const event = new KeyboardEvent('keydown', {
    key: 'Backspace',
    code: 'Backspace',
    keyCode: 8,
    which: 8,
    bubbles: true,
    cancelable: true // Allow event to be cancelled by site scripts if they handle it
  });

  for (let i = 0; i < count; i++) {
    element.dispatchEvent(event);
  }
  // Dispatch a synthetic input event after backspaces for frameworks that listen to it
  element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
}

// Global listener to track the currently focused editable element
document.addEventListener('focusin', function(event) {
  const target = event.target;
  const isEditable = target.matches('input[type="text"]:not([readonly]), input[type="search"]:not([readonly]), textarea:not([readonly]), [contenteditable="true"]');
  
  if (isEditable) {
    activeInputElement = target;
    // console.log("Active editable element updated:", activeInputElement);
  }
});

// Function to show a temporary notification
function showNotification(message) {
  let notification = document.getElementById('prompt-manager-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'prompt-manager-notification';
    notification.classList.add('prompt-manager-notification');
    document.body.appendChild(notification);
  }
  notification.textContent = message;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 2000); // Notification disappears after 2 seconds
}

// Function to copy text to clipboard
function copyPromptToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showNotification(chrome.i18n.getMessage('copiedToClipboard') || 'Copied to clipboard!');
    hideSearchUI(); // Hide UI after copying
  }).catch(err => {
    console.error('Failed to copy text:', err);
    showNotification(chrome.i18n.getMessage('copyFailed') || 'Failed to copy!');
  });
}

function loadPromptSearchShortcutKey() {
    chrome.storage.sync.get(['customPromptShortcutKey'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading customPromptShortcutKey:', chrome.runtime.lastError);
            // Keep default value
            return;
        }
        if (result.customPromptShortcutKey && typeof result.customPromptShortcutKey === 'string' && result.customPromptShortcutKey.length === 1) {
            PROMPT_SEARCH_SHORTCUT_KEY = result.customPromptShortcutKey;
            console.log('Custom prompt search shortcut key loaded:', PROMPT_SEARCH_SHORTCUT_KEY);
        } else {
            // If stored value is invalid, use default.
            console.log('No valid custom prompt search shortcut key found, using default:', PROMPT_SEARCH_SHORTCUT_KEY);
        }
    });
}

// Call this function when the content script loads
loadPromptSearchShortcutKey();

// Listen for changes in storage, so if the user changes it in options, it updates here too without needing a page reload.
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.customPromptShortcutKey) {
        if (changes.customPromptShortcutKey.newValue && typeof changes.customPromptShortcutKey.newValue === 'string' && changes.customPromptShortcutKey.newValue.length === 1) {
            PROMPT_SEARCH_SHORTCUT_KEY = changes.customPromptShortcutKey.newValue;
            console.log('Prompt search shortcut key updated to:', PROMPT_SEARCH_SHORTCUT_KEY);
        } else {
            // Revert to default if new value is invalid
            PROMPT_SEARCH_SHORTCUT_KEY = '/'; 
            console.warn('Invalid new shortcut key received from storage, reverting to default.');
        }
    }
});

function createSearchUI() {
  if (searchUiContainer) return; // Already created

  // Create a host for the Shadow DOM
  shadowHost = document.createElement('div');
  shadowHost.id = 'prompt-manager-shadow-host';
  // Position the shadow host - this will be the overall container for our UI
  shadowHost.style.position = 'fixed';
  shadowHost.style.top = '50%';
  shadowHost.style.left = '50%';
  shadowHost.style.transform = 'translate(-50%, -50%)';
  shadowHost.style.zIndex = '10000'; // Ensure it's above most page content
  shadowHost.style.display = 'none'; // Initially hidden

  document.body.appendChild(shadowHost);

  // Attach Shadow DOM
  shadowRoot = shadowHost.attachShadow({ mode: 'open' });

  // Load content_script.css into the Shadow DOM
  const styleLink = document.createElement('link');
  styleLink.setAttribute('rel', 'stylesheet');
  styleLink.setAttribute('href', chrome.runtime.getURL('content_script.css'));
  shadowRoot.appendChild(styleLink);

  searchUiContainer = document.createElement('div');
  searchUiContainer.id = 'prompt-manager-search-ui';
  searchUiContainer.classList.add('prompt-manager-container');
  // searchUiContainer.style.display = 'none'; // No longer needed here, controlled by shadowHost

  const titleElement = document.createElement('h3');
  titleElement.textContent = chrome.i18n.getMessage('searchPromptsTitle');
  titleElement.classList.add('prompt-manager-title');

  searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = chrome.i18n.getMessage('searchPlaceholder');
  searchInput.classList.add('prompt-manager-search-input');
  searchInput.addEventListener('input', handleSearchInput);
  // Add keydown listener for search input for Enter/Arrow keys later

  promptsListUl = document.createElement('ul');
  promptsListUl.classList.add('prompt-manager-list');

  searchUiContainer.appendChild(titleElement);
  searchUiContainer.appendChild(searchInput);
  searchUiContainer.appendChild(promptsListUl);
  shadowRoot.appendChild(searchUiContainer); // Append to shadowRoot instead of document.body

  // Close UI if clicked outside - listeners now on document, but logic adjusted for shadowHost
  document.addEventListener('click', handleClickOutside, true);
  // Close UI with Escape key - listener on document, as it's a global hotkey
  document.addEventListener('keydown', handleEscapeKey, true);
}

function populatePromptList(promptsToDisplay) {
  if (!promptsListUl) return;
  promptsListUl.innerHTML = ''; // Clear existing items

  if (promptsToDisplay.length === 0) {
    const li = document.createElement('li');
    li.textContent = chrome.i18n.getMessage('noPromptsFound');
    li.classList.add('prompt-manager-list-item', 'no-prompts');
    promptsListUl.appendChild(li);
    return;
  }

  promptsToDisplay.forEach((prompt, index) => {
    const li = document.createElement('li');
    li.classList.add('prompt-manager-list-item');
    li.dataset.promptContent = prompt.content;
    li.dataset.index = index.toString(); // For keyboard navigation later

    const titleStrong = document.createElement('strong');
    titleStrong.textContent = prompt.title || 'Untitled';

    const contentSpan = document.createElement('span');
    contentSpan.textContent = prompt.content.substring(0, 80) + (prompt.content.length > 80 ? '...' : '');

    li.appendChild(titleStrong);
    li.appendChild(contentSpan);

    // Click to insert prompt -> now click to copy prompt and insert
    li.addEventListener('click', () => {
      insertPromptContent(prompt.content); // Call insert first
      copyPromptToClipboard(prompt.content); // Then call copy
    });
    promptsListUl.appendChild(li);
  });
}

function showSearchUI(prompts) {
  if (!shadowHost) createSearchUI(); // Ensure shadowHost and UI are created
  allPrompts = prompts; // Store all prompts
  console.log('showSearchUI received prompts:', allPrompts);
  populatePromptList(allPrompts); // Initially display all prompts
  shadowHost.style.display = 'block'; // Control visibility via shadowHost
  // Need to focus search input within shadow DOM
  // A slight delay might be needed if styling or rendering causes issues
  setTimeout(() => {
    if (searchInput) searchInput.focus();
  }, 50);
}

function hideSearchUI() {
  if (shadowHost) {
    shadowHost.style.display = 'none'; // Hide shadowHost
    if (searchInput) searchInput.value = ''; // Clear search input
  }
}

function insertPromptContent(content) {
  // This function is now re-enabled to perform auto-insertion.
  console.log("insertPromptContent called. activeInputElement (before re-evaluation):", activeInputElement);

  let targetElement = activeInputElement; // Start with the saved element

  // If activeElement was not set (e.g., due to blur on icon click), try current active document element as fallback
  if (!targetElement) {
    const currentDocActiveElement = document.activeElement;
    const isCurrentEditable = currentDocActiveElement.matches('input[type="text"]:not([readonly]), input[type="search"]:not([readonly]), textarea:not([readonly]), [contenteditable="true"]');
    if (isCurrentEditable) {
      targetElement = currentDocActiveElement;
      console.log("insertPromptContent: activeInputElement was null, using document.activeElement as fallback:", targetElement);
    }
  }

  if (!targetElement || !content) {
    console.warn("Cannot insert prompt: No valid target element found for insertion or content is empty. Please focus on a text input field first.");
    hideSearchUI();
    return;
  }

  // Now use targetElement for insertion
  if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
    const start = targetElement.selectionStart;
    const end = targetElement.selectionEnd;
    const text = targetElement.value;
    targetElement.value = text.substring(0, start) + content + text.substring(end);
    targetElement.focus();
    targetElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  } 
  // Handle contenteditable elements
  else if (targetElement.isContentEditable) {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        console.warn("No selection range found for contenteditable element.");
        targetElement.focus(); // Ensure focus for potential future insertion
        return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents(); // Remove selected content (if any)
    range.insertNode(document.createTextNode(content)); // Insert new content
    range.collapse(false); // Move caret to the end of inserted content
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Dispatch input event for contenteditable to notify frameworks like React/Vue
    targetElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  } else {
    console.warn("Cannot insert prompt: activeElement is not a recognized editable input type.", targetElement);
    // You might want to try finding a default input field here, or notify user
  }

  hideSearchUI();
}

function handleClickOutside(event) {
  // Check if the click target is outside the shadow host
  if (shadowHost && shadowHost.style.display === 'block' && 
      !shadowHost.contains(event.target) && event.target !== activeInputElement && !event.composedPath().includes(shadowHost)) {
    hideSearchUI();
  }
}

function handleEscapeKey(event) {
  if (event.key === 'Escape' && shadowHost && shadowHost.style.display === 'block') {
    hideSearchUI();
  }
}

function handleSearchInput() {
  if (!searchInput || !allPrompts) return;
  const searchTerm = searchInput.value.toLowerCase();
  console.log('handleSearchInput - searchTerm:', searchTerm);
  console.log('handleSearchInput - allPrompts (before filter):', allPrompts);
  const filteredPrompts = allPrompts.filter(prompt => {
    const titleMatch = prompt.title && prompt.title.toLowerCase().includes(searchTerm);
    const contentMatch = prompt.content && prompt.content.toLowerCase().includes(searchTerm);
    return titleMatch || contentMatch;
  });
  console.log('handleSearchInput - filteredPrompts (after filter):', filteredPrompts);
  populatePromptList(filteredPrompts);
}

document.addEventListener('keydown', function(event) {
  const targetElement = event.target;
  const isEditable = targetElement.matches('input[type="text"]:not([readonly]), input[type="search"]:not([readonly]), textarea:not([readonly]), [contenteditable="true"]');
  const isPromptSearchInput = targetElement === searchInput || (shadowRoot && shadowRoot.contains(targetElement)); // Include elements inside shadow DOM

  if (isPromptSearchInput) {
    // Allow slash in our own search input, and don't trigger new search UI
    if (event.key === 'Escape') hideSearchUI(); // Also handle escape here for our input
    return; 
  }
  
  const isProbablyEmailOrPassword = targetElement.matches('input[type="email"], input[type="password"]');

  // New logic for triple slash (///) trigger
  if (isEditable && !isProbablyEmailOrPassword && event.key === '/') {
    const currentTime = Date.now();
    if (currentTime - lastSlashTimestamp < 2000) { // Within 2 seconds
      slashCount++;
      if (slashCount === 3) {
        event.preventDefault(); // Prevent default slash insertion for the third slash
        activeInputElement = targetElement; // Store the active input
        console.log("Triple slash (///) detected. Triggering Prompt Manager UI.", activeInputElement);

        // Remove the previously typed slashes using appropriate method
        if (activeInputElement) {
          const initialValue = activeInputElement.tagName === 'INPUT' || activeInputElement.tagName === 'TEXTAREA' ? activeInputElement.value : activeInputElement.textContent;
          console.log("Input value before slash removal:", initialValue);

          if (activeInputElement.tagName === 'INPUT' || activeInputElement.tagName === 'TEXTAREA') {
            const currentValue = activeInputElement.value;
            // Always remove the last 3 characters assuming they are the slashes
            activeInputElement.value = currentValue.substring(0, Math.max(0, currentValue.length - 3)); // Ensure length doesn't go below 0
            activeInputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          } else if (activeInputElement.isContentEditable) {
            // Use simulated backspace for contenteditable elements
            console.log("Simulating backspace for contenteditable element.");
            simulateBackspace(activeInputElement, 3);
          }
          const finalValue = activeInputElement.tagName === 'INPUT' || activeInputElement.tagName === 'TEXTAREA' ? activeInputElement.value : activeInputElement.textContent;
          console.log("Input value after slash removal:", finalValue);
        }

        if (!shadowHost) {
          createSearchUI();
        }

        chrome.runtime.sendMessage({ type: 'GET_PROMPTS_FOR_SLASH_COMMAND' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending message to background via triple slash:", chrome.runtime.lastError.message);
            return;
          }
          if (response && response.prompts) {
            console.log('Received prompts from background via triple slash:', response.prompts);
            showSearchUI(response.prompts);
          } else {
            console.log('No prompts received or empty response via triple slash.');
            showSearchUI([]);
          }
        });
        slashCount = 0; // Reset count after trigger
        lastSlashTimestamp = 0; // Reset timestamp as well
      } else if (slashCount === 1) {
        // For the first and second slash, we need to allow them to be typed normally
        // if they are not part of a triple slash sequence.
        // However, to ensure they don't interfere with the trigger, we need to prevent them
        // if they lead to a potential triple slash. This is tricky. 
        // A simpler approach for now: allow typing, and if triple slash, remove the last two.
        // For now, let's keep it simple and just rely on preventDefault for the 3rd slash only.
        // If we want to remove the typed slashes, we'd need more complex DOM manipulation.
      }
    } else {
      slashCount = 1; // Start new sequence
    }
    lastSlashTimestamp = currentTime;
  } else {
    slashCount = 0; // Reset if non-slash key is pressed
    lastSlashTimestamp = 0; 
  }
});

// New function to create and attach the floating icon
// This function is now removed as per user request.
/*
function createFloatingIcon() {
  const floatingIcon = document.createElement('div');
  floatingIcon.id = 'prompt-manager-floating-icon';
  floatingIcon.style.position = 'fixed';
  floatingIcon.style.bottom = '20px';
  floatingIcon.style.right = '20px';
  floatingIcon.style.width = '50px';
  floatingIcon.style.height = '50px';
  floatingIcon.style.borderRadius = '50%';
  floatingIcon.style.backgroundColor = '#007bff'; // Example color
  floatingIcon.style.color = 'white';
  floatingIcon.style.display = 'flex';
  floatingIcon.style.justifyContent = 'center';
  floatingIcon.style.alignItems = 'center';
  floatingIcon.style.cursor = 'pointer';
  floatingIcon.style.zIndex = '9999';
  floatingIcon.textContent = '✨'; // Example icon, can be replaced with an image later

  floatingIcon.addEventListener('click', () => {
    if (shadowHost && shadowHost.style.display === 'block') {
      hideSearchUI();
    } else {
      // Capture the currently focused editable element at the moment of click.
      const currentlyActiveElementOnIconClick = document.activeElement;
      const isEditableOnIconClick = currentlyActiveElementOnIconClick.matches('input[type="text"]:not([readonly]), input[type="search"]:not([readonly]), textarea:not([readonly]), [contenteditable="true"]');
      
      if (isEditableOnIconClick) {
        activeInputElement = currentlyActiveElementOnIconClick;
        console.log("Floating icon clicked. Captured active element:", activeInputElement);
      } else {
        // If the element clicked outside of the input, activeInputElement might be null
        // from previous interaction or current document.activeElement not being editable.
        // We will rely on the last known activeInputElement from focusin.
        console.log("Floating icon clicked. No editable element found at click. Last active element (from focusin):", activeInputElement);
      }

      // Ensure UI is created before showing
      if (!shadowHost) {
        createSearchUI();
      }

      // When icon is clicked, fetch prompts and show the UI
      chrome.runtime.sendMessage({ type: 'GET_PROMPTS_FOR_SLASH_COMMAND' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message to background via icon click:", chrome.runtime.lastError.message);
          return;
        }
        if (response && response.prompts) {
          console.log('Received prompts from background via icon click:', response.prompts);
          showSearchUI(response.prompts);
        } else {
          console.log('No prompts received or empty response via icon click.');
          showSearchUI([]);
        }
      });
    }
  });

  document.body.appendChild(floatingIcon);
}

// Call this function to initialize the floating icon when the content script loads
createFloatingIcon();
*/
