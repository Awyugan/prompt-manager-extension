// content_script.js
console.log("Prompt Manager content script loaded.");

let searchUiContainer = null;
let searchInput = null;
let promptsListUl = null;
let activeInputElement = null;
let allPrompts = []; // To store all prompts fetched from background

function createSearchUI() {
  if (searchUiContainer) return; // Already created

  searchUiContainer = document.createElement('div');
  searchUiContainer.id = 'prompt-manager-search-ui';
  searchUiContainer.classList.add('prompt-manager-container');
  searchUiContainer.style.display = 'none'; // Initially hidden

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
  document.body.appendChild(searchUiContainer);

  // Close UI if clicked outside
  document.addEventListener('click', handleClickOutside, true);
  // Close UI with Escape key
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

    // Click to insert prompt
    li.addEventListener('click', () => {
      insertPromptContent(prompt.content);
    });
    promptsListUl.appendChild(li);
  });
}

function showSearchUI(prompts) {
  if (!searchUiContainer) createSearchUI();
  allPrompts = prompts; // Store all prompts
  populatePromptList(allPrompts); // Initially display all prompts
  searchUiContainer.style.display = 'block';
  searchInput.focus();
}

function hideSearchUI() {
  if (searchUiContainer) {
    searchUiContainer.style.display = 'none';
    searchInput.value = ''; // Clear search input
    activeInputElement = null;
  }
}

function insertPromptContent(content) {
  if (activeInputElement && content) {
    // More robust insertion logic might be needed for contenteditable or complex inputs
    const start = activeInputElement.selectionStart;
    const end = activeInputElement.selectionEnd;
    const text = activeInputElement.value;
    activeInputElement.value = text.substring(0, start) + content + text.substring(end);
    activeInputElement.focus();
    // Dispatch input event to notify any listeners on the input field (e.g., React/Vue)
    activeInputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }
  hideSearchUI();
}

function handleClickOutside(event) {
  if (searchUiContainer && searchUiContainer.style.display === 'block' && 
      !searchUiContainer.contains(event.target) && event.target !== activeInputElement) {
    hideSearchUI();
  }
}

function handleEscapeKey(event) {
  if (event.key === 'Escape' && searchUiContainer && searchUiContainer.style.display === 'block') {
    hideSearchUI();
  }
}

function handleSearchInput() {
  if (!searchInput || !allPrompts) return;
  const searchTerm = searchInput.value.toLowerCase();
  const filteredPrompts = allPrompts.filter(prompt => {
    const titleMatch = prompt.title && prompt.title.toLowerCase().includes(searchTerm);
    const contentMatch = prompt.content && prompt.content.toLowerCase().includes(searchTerm);
    return titleMatch || contentMatch;
  });
  populatePromptList(filteredPrompts);
}

document.addEventListener('keydown', function(event) {
  const targetElement = event.target;
  const isEditable = targetElement.matches('input[type="text"]:not([readonly]), input[type="search"]:not([readonly]), textarea:not([readonly]), [contenteditable="true"]');
  const isPromptSearchInput = targetElement === searchInput;

  if (isPromptSearchInput) {
    // Allow slash in our own search input, and don't trigger new search UI
    if (event.key === 'Escape') hideSearchUI(); // Also handle escape here for our input
    return; 
  }
  
  const isProbablyEmailOrPassword = targetElement.matches('input[type="email"], input[type="password"]');

  if (isEditable && !isProbablyEmailOrPassword && event.key === '/') {
    event.preventDefault(); // Prevent default slash insertion
    activeInputElement = targetElement; // Store the active input
    console.log("Slash key pressed in an editable field:", activeInputElement);

    if (!searchUiContainer) {
      createSearchUI();
    }

    // If UI is already visible and triggered from another input, hide it first
    if (searchUiContainer.style.display === 'block' && activeInputElement !== targetElement) {
        hideSearchUI(); 
    }

    chrome.runtime.sendMessage({ type: 'GET_PROMPTS_FOR_SLASH_COMMAND' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message to background:", chrome.runtime.lastError.message);
        // Optionally show an error in the UI
        return;
      }
      if (response && response.prompts) {
        console.log('Received prompts from background:', response.prompts);
        showSearchUI(response.prompts);
      } else {
        console.log('No prompts received or empty response.');
        showSearchUI([]); // Show UI with 'no prompts' message
      }
    });
  }
});
