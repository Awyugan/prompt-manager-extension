// options.js

function applyOptionsPageLocalizations() {
    // Helper function to set text content
    const setText = (id, messageKey, fallbackText) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = chrome.i18n.getMessage(messageKey) || fallbackText || '';
        } else {
            console.warn(`Element with ID '${id}' not found for localization of key '${messageKey}'.`);
        }
    };

    // Page Title
    document.title = chrome.i18n.getMessage('promptManagerSettings') || 'Prompt Manager Settings';

    // Headings and Links
    setText('pageTitle', 'promptManagerSettings', 'Prompt Manager Settings');
    setText('configureApiKeyLink', 'configureApiKey', 'Configure API Key and other settings');
    setText('managePromptsDescriptionText', 'managePromptsDescription', 'Here you can manage all your prompts, add new ones, edit, or delete existing ones.');
    setText('generalSettingsHeadingText', 'generalSettingsHeading', 'General Settings');
    
    // Language Settings
    setText('languageSettingLabelText', 'languageSettingLabel', 'Interface Language:');
    setText('langEnglishOption', 'langEnglish', 'English');
    setText('langChineseOption', 'langChinese', '中文 (Chinese)');

    // Auto Tagging
    setText('autoTaggingLabelText', 'autoTaggingLabel', 'Enable Automatic AI Tagging & Titling on Right-Click Save');

    // Form: Add/Edit Prompt
    setText('addNewPromptHeadingText', 'addNewPromptHeading', 'Add/Edit Prompt');
    setText('promptTitleLabelText', 'promptTitleLabel', 'Title:');
    // Example for placeholder if you add one later:
    // const promptTitleInput = document.getElementById('promptTitle');
    // if (promptTitleInput) promptTitleInput.placeholder = chrome.i18n.getMessage('promptTitlePlaceholder') || 'Enter prompt title';
    
    setText('promptContentLabelText', 'promptContentLabel', 'Content:');
    setText('promptTagsLabelText', 'promptTagsLabel', 'Tags (comma-separated):'); // Ensure this key in messages.json includes the suffix or adjust here
    setText('promptEffectUrlLabelText', 'promptEffectUrlLabel', 'Effect URL (optional):'); // Ensure this key in messages.json includes the suffix or adjust here
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        const promptIdInput = document.getElementById('promptId'); // Assuming you have an input with id 'promptId' for editing
        const isEditing = promptIdInput && promptIdInput.value;
        if (isEditing) {
            saveBtn.textContent = chrome.i18n.getMessage('updatePromptButton') || 'Update Prompt';
        } else {
            saveBtn.textContent = chrome.i18n.getMessage('savePromptButton') || 'Save Prompt';
        }
    }

    // Existing Prompts Section
    setText('existingPromptsHeadingText', 'existingPromptsHeading', 'Existing Prompts');
}

document.addEventListener('DOMContentLoaded', function() {
    applyOptionsPageLocalizations();

    // --- Start of Cascade: Added logic for autoTagging checkbox --- 
    const autoTaggingCheckbox = document.getElementById('autoTagging');

    if (autoTaggingCheckbox) {
        // 1. Load saved setting
        chrome.storage.local.get(['autoTaggingEnabled'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading autoTagging setting:', chrome.runtime.lastError.message);
                return;
            }
            autoTaggingCheckbox.checked = !!result.autoTaggingEnabled;
        });

        // 2. Listen for changes and save setting
        autoTaggingCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            chrome.storage.local.set({ autoTaggingEnabled: isChecked }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving autoTagging setting:', chrome.runtime.lastError.message);
                    // Optionally, notify user of failure
                } else {
                    console.log('Auto-tagging setting saved:', isChecked);
                    const messageKey = isChecked ? 'aiTaggingEnabled' : 'aiTaggingDisabled';
                    const notificationMessage = chrome.i18n.getMessage(messageKey) || (isChecked ? 'AI tagging enabled.' : 'AI tagging disabled.');
                    const notificationTitle = chrome.i18n.getMessage('promptManagerSettings') || 'Settings Update';

                    // Attempt to use chrome.notifications if available
                    if (chrome.notifications && typeof chrome.notifications.create === 'function') {
                        chrome.notifications.create('', {
                            type: 'basic',
                            iconUrl: 'icons/icon128.png', // Ensure this path is correct relative to manifest
                            title: notificationTitle,
                            message: notificationMessage,
                            priority: 0
                        }, function(notificationId) {
                            if (chrome.runtime.lastError) {
                                console.warn('Error creating notification (may need permission or run in extension context):', chrome.runtime.lastError.message);
                                // Fallback to alert if notification fails
                                alert(notificationTitle + "\n" + notificationMessage);
                            }
                        });
                    } else {
                        // Fallback if notifications API is not available or not in a context where it can be used
                        alert(notificationTitle + "\n" + notificationMessage);
                    }
                }
            });
        });
    }
    // --- End of Cascade: Added logic for autoTagging checkbox --- 

  const addPromptForm = document.getElementById('addPromptForm');
  const existingPromptsContainer = document.getElementById('existingPromptsContainer');
  const languageSelect = document.getElementById('languageSelect');
  let editingPromptIndex = null;

  // Function to load and apply the preferred language to the dropdown
  function loadAndSetLanguagePreference() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['preferredLanguage'], function(result) {
        let langToSet = 'zh'; // Default to 'zh' (your manifest default_locale)
        if (result.preferredLanguage) {
          langToSet = result.preferredLanguage;
        } else {
          // If no setting stored, try browser's UI language, then fallback to 'zh'
          const browserLang = chrome.i18n.getUILanguage().split('-')[0];
          if (['en', 'zh'].includes(browserLang)) {
            langToSet = browserLang;
          }
          // Save this initial/determined default if it wasn't already set
          chrome.storage.local.set({ preferredLanguage: langToSet }, function() {
            console.log('Initial language preference set to:', langToSet);
          });
        }
        if (languageSelect) {
          languageSelect.value = langToSet;
        }
        resolve(langToSet);
      });
    });
  }

  // Function to render prompts
  function renderPrompts() {
    chrome.storage.local.get({ prompts: [] }, function(data) {
      if (!existingPromptsContainer) return;
      existingPromptsContainer.innerHTML = ''; // Clear existing list

      // Check if the 'noPromptsSaved' message key exists, otherwise use a hardcoded fallback
      // This is just for robustness, ideally all keys are always present
      let noPromptsMsg = 'No prompts saved.'; // Fallback
      try {
        noPromptsMsg = chrome.i18n.getMessage('noPromptsSaved');
      } catch (e) {
        console.warn("i18n key 'noPromptsSaved' not found, using fallback.");
      }
      
      if (data.prompts.length === 0) {
        existingPromptsContainer.innerHTML = `<p>${noPromptsMsg}</p>`;
        return;
      }

      const ul = document.createElement('ul');
      data.prompts.forEach(function(prompt, index) {
        const li = document.createElement('li');
        // Robustly get messages with fallbacks
        const getMsg = (key, fallback) => {
          try { return chrome.i18n.getMessage(key); }
          catch (e) { console.warn(`i18n key '${key}' not found, using fallback.`); return fallback; }
        };

        let tagsDisplay = getMsg('noTags', 'No tags');
        if (prompt.tags && prompt.tags.length > 0) {
          tagsDisplay = prompt.tags.join(', ');
        }
        let sourceUrlDisplay = '';
        if (prompt.sourceUrl) {
          sourceUrlDisplay = `<a href="${prompt.sourceUrl}" target="_blank">${getMsg('source', 'Source')}</a>`;
        }
        let effectUrlDisplay = '';
        if (prompt.effectUrl) {
          effectUrlDisplay = `<a href="${prompt.effectUrl}" target="_blank">${getMsg('effect', 'Effect')}</a>`;
        }

        li.innerHTML = `
          <div class="prompt-title"><strong>${prompt.title || getMsg('untitled', 'Untitled')}</strong></div>
          <div class="prompt-content-preview">${prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : '')}</div>
          <div class="prompt-tags">${getMsg('tags', 'Tags')}: ${tagsDisplay}</div>
          <div class="prompt-links">${sourceUrlDisplay} ${effectUrlDisplay}</div>
          <div class="prompt-actions">
            <button data-index="${index}" class="edit-prompt">${getMsg('editButton', 'Edit')}</button>
            <button data-index="${index}" class="delete-prompt">${getMsg('deleteButton', 'Delete')}</button>
          </div>
        `;
        ul.appendChild(li);
      });
      existingPromptsContainer.appendChild(ul);

      document.querySelectorAll('.delete-prompt').forEach(button => {
        button.addEventListener('click', function() { deletePrompt(parseInt(this.dataset.index, 10)); });
      });
      document.querySelectorAll('.edit-prompt').forEach(button => {
        button.addEventListener('click', function() { handleEditPrompt(parseInt(this.dataset.index, 10)); });
      });
    });
  }

  // Function to handle editing a prompt
  function handleEditPrompt(index) {
    chrome.storage.local.get({ prompts: [] }, function(data) {
      const promptToEdit = data.prompts[index];
      if (promptToEdit && addPromptForm) {
        addPromptForm.elements.promptTitle.value = promptToEdit.title || '';
        addPromptForm.elements.promptContent.value = promptToEdit.content || '';
        addPromptForm.elements.promptTags.value = (promptToEdit.tags && Array.isArray(promptToEdit.tags)) ? promptToEdit.tags.join(', ') : '';
        addPromptForm.elements.promptEffectUrl.value = promptToEdit.effectUrl || '';
        editingPromptIndex = index;
        // Robustly get message for saveBtn
        try {
          addPromptForm.elements.saveBtn.textContent = chrome.i18n.getMessage('updatePromptButton');
        } catch (e) {
          addPromptForm.elements.saveBtn.textContent = 'Update Prompt'; // Fallback
          console.warn("i18n key 'updatePromptButton' not found, using fallback.");
        }
        addPromptForm.elements.promptTitle.focus();
      }
    });
  }

  // Form submission for adding/updating prompts
  if (addPromptForm) {
    addPromptForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const title = addPromptForm.elements.promptTitle.value.trim();
      const content = addPromptForm.elements.promptContent.value.trim();
      const tagsString = addPromptForm.elements.promptTags.value.trim();
      const effectUrl = addPromptForm.elements.promptEffectUrl.value.trim();
      const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

      chrome.storage.local.get({ prompts: [] }, function(data) {
        let prompts = data.prompts;
        const currentTime = new Date().toISOString();
        if (editingPromptIndex !== null) {
          const originalPrompt = prompts[editingPromptIndex];
          prompts[editingPromptIndex] = { ...originalPrompt, title, content, tags, effectUrl, updatedAt: currentTime };
        } else {
          prompts.push({ title, content, tags, effectUrl, id: Date.now().toString(), sourceUrl: '', createdAt: currentTime, updatedAt: currentTime });
        }
        chrome.storage.local.set({ prompts: prompts }, function() {
          addPromptForm.reset();
          editingPromptIndex = null;
          // Robustly get message for saveBtn
          try {
            addPromptForm.elements.saveBtn.textContent = chrome.i18n.getMessage('savePromptButton');
          } catch (e) {
            addPromptForm.elements.saveBtn.textContent = 'Save Prompt'; // Fallback
            console.warn("i18n key 'savePromptButton' not found, using fallback.");
          }
          renderPrompts();
        });
      });
    });
  }

  // Function to delete a prompt
  function deletePrompt(index) {
    chrome.storage.local.get({ prompts: [] }, function(data) {
      let prompts = data.prompts;
      prompts.splice(index, 1);
      chrome.storage.local.set({ prompts: prompts }, renderPrompts);
    });
  }

  // --- Initialization ---
  loadAndSetLanguagePreference().then(currentLang => {
    console.log('Current UI language for options page:', currentLang);
    // All static __MSG_key__ in HTML are handled by browser.
    // Dynamic content is rendered by renderPrompts() which uses chrome.i18n.getMessage().
    renderPrompts();
  });

  if (languageSelect) {
    languageSelect.addEventListener('change', function() {
      const selectedLang = this.value;
      chrome.storage.local.set({ preferredLanguage: selectedLang }, function() {
        console.log('Preferred language saved:', selectedLang, "Reloading page to apply.");
        location.reload(); // Reload the page to apply the new language
      });
    });
  } else {
    console.error("Error: The #languageSelect element was not found in options.html.");
  }
});