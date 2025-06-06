// options.js

function applyOptionsPageLocalizations() {
    // Helper function to set text content using ID
    const setTextById = (id, messageKey, fallbackText) => {
        const element = document.getElementById(id);
        if (element) {
            const localizedText = chrome.i18n.getMessage(messageKey);
            if (localizedText) {
                // For buttons, set value or textContent based on type
                if (element.tagName === 'BUTTON' || (element.tagName === 'INPUT' && (element.type === 'submit' || element.type === 'button'))) {
                    element.textContent = localizedText; // Prefer textContent for buttons for consistency
                } else {
                    element.textContent = localizedText;
                }
            } else if (fallbackText) {
                element.textContent = fallbackText;
            } else {
                console.warn(`No localization or fallback for key: ${messageKey} (element ID: ${id})`);
            }
        } else {
            console.warn(`Element with ID '${id}' not found for localization of key '${messageKey}'.`);
        }
    };

    // Page Title (document.title)
    document.title = chrome.i18n.getMessage('promptManagerSettings') || 'Prompt Manager Settings';

    // Elements localized by ID
    const elementsToLocalizeById = {
        'pageTitle': 'promptManagerSettings',
        'deepseekApiKeyLabelText': 'deepseekApiKeyLabel',
        'saveApiKeyButton': 'saveApiKeyButton',
        'apiKeyNoteText': 'aiKeyNote',
        'generalSettingsHeadingText': 'generalSettingsHeading',
        'languageSettingLabelText': 'languageSettingLabel',
        'langEnglishOption': 'langEnglish',
        'langChineseOption': 'langChinese',
        'autoTaggingLabelText': 'autoTaggingLabel',
        'customSystemPromptLabelText': 'customSystemPromptLabel',
        'customSystemPromptDescriptionText': 'customSystemPromptDescription',
        'addNewPromptHeadingText': 'addNewPromptHeading',
        'promptTitleLabelText': 'promptTitleLabel',
        'promptContentLabelText': 'promptContentLabel',
        'promptTagsLabelText': 'promptTagsLabel',
        'promptEffectUrlLabelText': 'promptEffectUrlLabel',
        'promptNotesLabelText': 'promptNotesLabel',
        // saveBtn is handled dynamically based on edit/add mode
        'existingPromptsHeadingText': 'existingPromptsHeading',
    };

    for (const id in elementsToLocalizeById) {
        setTextById(id, elementsToLocalizeById[id]);
    }

    // Special handling for save/update button text (initial state)
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        const promptIdInput = document.getElementById('promptId');
        const isEditing = promptIdInput && promptIdInput.value;
        if (isEditing) {
            saveBtn.textContent = chrome.i18n.getMessage('updatePromptButton') || 'Update Prompt';
        } else {
            saveBtn.textContent = chrome.i18n.getMessage('savePromptButton') || 'Save Prompt';
        }
    }

    // Elements localized by data-i18n-key (e.g., tabs)
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.dataset.i18nKey;
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.textContent = message;
        } else {
            console.warn(`No localization found for data-i18n-key: ${key}`);
        }
    });

    // Elements localized by data-i18n-placeholder-key
    document.querySelectorAll('[data-i18n-placeholder-key]').forEach(element => {
        const key = element.dataset.i18nPlaceholderKey;
        const message = chrome.i18n.getMessage(key);
        if (message) {
            element.placeholder = message;
        } else {
            console.warn(`No localization found for data-i18n-placeholder-key: ${key}`);
        }
    });

    // Ensure specific placeholders are set if not covered by the generic loop, or if they need fallback
    // Example: promptNotesTextarea was handled specifically, this can be removed if data-i18n-placeholder-key is used consistently
    // const promptNotesTextarea = document.getElementById('promptNotes');
}

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching logic
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', function() {
            const tabId = this.dataset.tab;

            // Update active class on tab links
            tabLinks.forEach(innerLink => {
                innerLink.classList.remove('active');
            });
            this.classList.add('active');

            // Show/hide tab content
            tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Initialize the first tab as active (if not already set in HTML)
    // This ensures that if JS runs before HTML fully parsed or if default active classes are missing,
    // the first tab is still shown.
    if (document.querySelector('.tab-link.active') && document.querySelector('.tab-content.active')) {
        // Already handled by HTML static classes, do nothing or can re-trigger if needed.
    } else if (tabLinks.length > 0 && tabContents.length > 0) {
        tabLinks[0].classList.add('active');
        const firstTabId = tabLinks[0].dataset.tab;
        const firstTabContent = document.getElementById(firstTabId);
        if (firstTabContent) {
            firstTabContent.classList.add('active');
        }
    }

    // Declare DOM element variables once
    const autoTaggingCheckbox = document.getElementById('autoTagging');
    const languageSelect = document.getElementById('languageSelect');
    const addPromptForm = document.getElementById('addPromptForm');
    const existingPromptsContainer = document.getElementById('existingPromptsContainer');
    const promptTitleInput = document.getElementById('promptTitle'); 
    const promptTagsInput = document.getElementById('promptTags'); 
    const promptIdInput = document.getElementById('promptId'); 
    const saveBtn = document.getElementById('saveBtn'); 
    const customSystemPromptTextarea = document.getElementById('customSystemPromptTextarea');
    const promptNotesTextarea = document.getElementById('promptNotes'); // Get notes textarea
    const deepseekApiKeyInput = document.getElementById('deepseekApiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');
    const apiKeyStatusMessage = document.getElementById('apiKeyStatusMessage');
    const toggleApiKeyVisibilityButton = document.getElementById('toggleApiKeyVisibilityButton');
    const recycleBinRetentionInput = document.getElementById('recycleBinRetention');
    const DEFAULT_RECYCLE_BIN_RETENTION_DAYS = 7; // Get notes textarea
    let editingPromptIndex = null; // Keep if used by logic not yet reviewed, otherwise can be removed if only promptIdInput is used.

    applyOptionsPageLocalizations(); // Initial localization call

    // The tab link localization is now handled within applyOptionsPageLocalizations
    //         if (message) link.textContent = message;
    //     }
    // });


    // --- API Key Logic --- 
    if (deepseekApiKeyInput && saveApiKeyButton && apiKeyStatusMessage) {
        // Load existing API Key
        chrome.storage.local.get(['deepseekApiKey'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading deepseekApiKey:', chrome.runtime.lastError.message);
                return;
            }
            if (result.deepseekApiKey) {
                deepseekApiKeyInput.value = result.deepseekApiKey;
            }
        });

        // Save API Key
        saveApiKeyButton.addEventListener('click', function() {
            const apiKey = deepseekApiKeyInput.value.trim();
            if (apiKey) {
                chrome.storage.local.set({ deepseekApiKey: apiKey }, function() {
                    if (chrome.runtime.lastError) {
                        apiKeyStatusMessage.textContent = (chrome.i18n.getMessage('apiKeySaveError') || 'Error: Unable to save API Key.') + ' ' + chrome.runtime.lastError.message;
                        apiKeyStatusMessage.style.color = 'red';
                    } else {
                        apiKeyStatusMessage.textContent = chrome.i18n.getMessage('apiKeySavedSuccess') || 'API Key saved successfully!';
                        apiKeyStatusMessage.style.color = 'green';
                    }
                    setTimeout(() => { apiKeyStatusMessage.textContent = ''; apiKeyStatusMessage.style.color = ''; }, 3000);
                });
            } else {
                apiKeyStatusMessage.textContent = chrome.i18n.getMessage('apiKeyInputRequired') || 'Please enter an API Key.';
                apiKeyStatusMessage.style.color = 'orange';
                setTimeout(() => { apiKeyStatusMessage.textContent = ''; apiKeyStatusMessage.style.color = ''; }, 3000);
            }
        });

        // Toggle API Key Visibility
        if (toggleApiKeyVisibilityButton && deepseekApiKeyInput) {
            toggleApiKeyVisibilityButton.addEventListener('click', function() {
                if (deepseekApiKeyInput.type === 'password') {
                    deepseekApiKeyInput.type = 'text';
                    this.textContent = '🙈'; // Or some other icon/text for 'hide'
                } else {
                    deepseekApiKeyInput.type = 'password';
                    this.textContent = '👁️'; // Icon/text for 'show'
                }
            });
        }
    }

    // --- Custom System Prompt Logic ---
    if (customSystemPromptTextarea) {
        const defaultSystemPromptTemplate = `You are an expert text analyst. Based on the user's content, generate a concise, relevant title (5-10 words) and 3-5 keywords/tags. The response MUST be in \${langName}.\nOutput ONLY a valid JSON object with "title" (string) and "tags" (array of strings).\nExample for \${langName}: {"title": "Example AI Title", "tags": ["tag1","tag2"]}`;
        chrome.storage.sync.get('customSystemPrompt', function(data) {
            if (chrome.runtime.lastError) {
                console.error('Error loading customSystemPrompt:', chrome.runtime.lastError.message);
                customSystemPromptTextarea.value = defaultSystemPromptTemplate;
                return;
            }
            if (data.customSystemPrompt && typeof data.customSystemPrompt === 'string' && data.customSystemPrompt.trim() !== '') {
                customSystemPromptTextarea.value = data.customSystemPrompt;
            } else {
                customSystemPromptTextarea.value = defaultSystemPromptTemplate;
            }
        });

        customSystemPromptTextarea.addEventListener('change', function() { // Using 'change' which fires on blur for textareas or when Enter is pressed if applicable
            const newPrompt = this.value.trim();
            chrome.storage.sync.set({ customSystemPrompt: newPrompt }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving customSystemPrompt:', chrome.runtime.lastError.message);
                } else {
                    console.log('Custom system prompt saved.');
                    // Optional: Show a small notification/confirmation
                }
            });
        });
    }

    // --- Auto Tagging Checkbox Logic --- 
    if (autoTaggingCheckbox) {
        chrome.storage.local.get(['autoTaggingEnabled'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading autoTagging setting:', chrome.runtime.lastError.message);
                return;
            }
            autoTaggingCheckbox.checked = !!result.autoTaggingEnabled;
        });
        autoTaggingCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            chrome.storage.local.set({ autoTaggingEnabled: isChecked }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving autoTagging setting:', chrome.runtime.lastError.message);
                } else {
                    console.log('Auto-tagging setting saved:', isChecked);
                    const messageKey = isChecked ? 'aiTaggingEnabled' : 'aiTaggingDisabled';
                    const notificationMessage = chrome.i18n.getMessage(messageKey) || (isChecked ? 'AI tagging enabled.' : 'AI tagging disabled.');
                    const notificationTitle = chrome.i18n.getMessage('promptManagerSettings') || 'Settings Update';
                    if (chrome.notifications && typeof chrome.notifications.create === 'function') {
                        chrome.notifications.create('', {
                            type: 'basic',
                            iconUrl: 'icons/icon128.png',
                            title: notificationTitle,
                            message: notificationMessage,
                            priority: 0
                        }, function(notificationId) {
                            if (chrome.runtime.lastError) {
                                alert(notificationTitle + "\n" + notificationMessage);
                            }
                        });
                    } else {
                        alert(notificationTitle + "\n" + notificationMessage);
                    }
                }
            });
        });
    }

    // --- Language Preference Logic --- 
    async function loadAndSetLanguagePreferenceInternal() {
        return new Promise((resolve) => {
            chrome.storage.sync.get('preferredLanguage', function(data) {
                const currentLang = data.preferredLanguage || chrome.i18n.getUILanguage().split('-')[0] || 'en';
                document.documentElement.lang = currentLang;
                if (languageSelect) {
                    languageSelect.value = currentLang;
                }
                resolve(currentLang);
            });
        });
    }

    if (languageSelect) {
        languageSelect.addEventListener('change', function() {
            const selectedLang = this.value;
            chrome.storage.sync.set({ preferredLanguage: selectedLang }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving language preference:', chrome.runtime.lastError.message);
                    return;
                }
                console.log('Language preference saved:', selectedLang);
                document.documentElement.lang = selectedLang;
                applyOptionsPageLocalizations();
                renderPrompts(); 
            });
        });
    }

    // --- Form Submission Logic (Add/Edit Prompt) --- 
    if (addPromptForm) {
        addPromptForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            const currentPromptId = promptIdInput ? promptIdInput.value : null;
            let manualTitle = promptTitleInput.value.trim(); 
            const promptContentValue = addPromptForm.elements.promptContent.value.trim();
            let manualTagsString = promptTagsInput.value.trim(); 
            const effectUrl = addPromptForm.elements.promptEffectUrl.value.trim();
            const notes = promptNotesTextarea.value.trim(); // Get notes value
            let finalTitle = manualTitle; 
            let finalTagsString = manualTagsString; 
            let buttonTextKey = currentPromptId ? 'updatePromptButton' : 'savePromptButton';
            let fallbackButtonText = currentPromptId ? 'Update Prompt' : 'Save Prompt';

            try {
                const settings = await new Promise((resolve, reject) => {
                    chrome.storage.local.get(['autoTaggingEnabled', 'deepseekApiKey'], result => {
                        if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
                        resolve(result);
                    });
                });

                if (settings.autoTaggingEnabled && settings.deepseekApiKey && promptContentValue) {
                    if (manualTitle === '' || manualTagsString === '') {
                        saveBtn.disabled = true;
                        saveBtn.textContent = chrome.i18n.getMessage('generatingAIText') || 'Generating AI suggestions...';
                        try {
                            const aiSuggestions = await fetchAITitleAndTags(promptContentValue, settings.deepseekApiKey);
                            if (aiSuggestions) {
                                if (aiSuggestions.title && manualTitle === '') { 
                                    finalTitle = aiSuggestions.title;
                                    promptTitleInput.value = finalTitle; 
                                }
                                if (aiSuggestions.tags && manualTagsString === '') { 
                                    // fetchAITitleAndTags should return tags as an array.
                                    // Join with ', ' for display and for finalTagsString.
                                    finalTagsString = Array.isArray(aiSuggestions.tags) ? aiSuggestions.tags.join(', ') : (aiSuggestions.tags || '');
                                    promptTagsInput.value = finalTagsString; 
                                }
                                console.log('AI suggestions considered. Title:', finalTitle, 'Tags:', finalTagsString);
                            }
                        } catch (error) {
                            console.error('AI title/tag generation failed:', error);
                        } finally {
                            saveBtn.disabled = false;
                            saveBtn.textContent = chrome.i18n.getMessage(buttonTextKey) || fallbackButtonText;
                        }
                    } 
                } 
            } catch (storageError) {
                console.error('Failed to get settings from storage:', storageError);
            }
            
            const finalTagsArray = finalTagsString ? finalTagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
            savePrompt(currentPromptId, finalTitle, promptContentValue, finalTagsArray, effectUrl, notes); // Pass notes to savePrompt
        });
    }

    // --- Prompt Management Functions (defined within DOMContentLoaded to access shared vars like existingPromptsContainer) ---
    function savePrompt(promptIdToEdit, title, content, tagsArray, effectUrl, notes) { // Add notes parameter
        chrome.storage.local.get({ prompts: [] }, function(data) {
            let prompts = data.prompts;
            const currentTime = new Date().toISOString();
            if (promptIdToEdit) {
                const existingPromptIndex = prompts.findIndex(p => p.id === promptIdToEdit);
                if (existingPromptIndex !== -1) {
                    prompts[existingPromptIndex] = { ...prompts[existingPromptIndex], title, content, tags: tagsArray, effectUrl, notes: notes || '', updatedAt: currentTime };
                } else {
                    console.error("Prompt to edit not found with ID:", promptIdToEdit); return;
                }
            } else {
                prompts.push({ id: Date.now().toString(), title, content, tags: tagsArray, effectUrl, notes: notes || '', sourceUrl: '', createdAt: currentTime, updatedAt: currentTime });
            }
            chrome.storage.local.set({ prompts: prompts }, function() {
                if (chrome.runtime.lastError) { console.error("Error saving prompts:", chrome.runtime.lastError.message); return; }
                if(addPromptForm) {
                    addPromptForm.reset();
                    if(promptNotesTextarea) promptNotesTextarea.value = ''; // Clear notes textarea on reset
                }
                editingPromptIndex = null; 
                if(promptIdInput) promptIdInput.value = ''; 
                if(saveBtn) saveBtn.textContent = chrome.i18n.getMessage('savePromptButton') || 'Save Prompt';
                renderPrompts();
            });
        });
    }

    function renderPrompts() {
    chrome.storage.local.get({ prompts: [] }, function(data) {
        const prompts = data.prompts;
        if (!existingPromptsContainer) { console.error("existingPromptsContainer not found."); return; }
        existingPromptsContainer.innerHTML = '';
        if (prompts.length === 0) {
            existingPromptsContainer.innerHTML = `<p>${chrome.i18n.getMessage('noPromptsSaved') || 'No prompts saved yet.'}</p>`;
            return;
        }
        const ul = document.createElement('ul');
        ul.className = 'prompt-list';
        prompts.forEach((prompt, index) => {
            const li = document.createElement('li');
            li.className = 'prompt-item';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'prompt-title';
            titleDiv.textContent = prompt.title || 'Untitled Prompt';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'prompt-content-preview';
            contentDiv.textContent = prompt.content ? (prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : '')) : 'No content';

            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'prompt-tags';
            if (prompt.tags && prompt.tags.length > 0) {
                tagsDiv.textContent = prompt.tags.join(', ');
            } else {
                tagsDiv.textContent = chrome.i18n.getMessage('noTags') || 'No tags';
            }

            const notesDiv = document.createElement('div');
            notesDiv.className = 'prompt-notes-preview';
            if (prompt.notes && prompt.notes.trim() !== '') {
                notesDiv.textContent = (chrome.i18n.getMessage('promptNotesLabel') || 'Notes:') + ' ' + prompt.notes.substring(0, 150) + (prompt.notes.length > 150 ? '...' : '');
            } else {
                notesDiv.style.display = 'none';
            }

            const sourceUrlDiv = document.createElement('div');
            sourceUrlDiv.className = 'prompt-source-url';
            if (prompt.sourceUrl && prompt.sourceUrl.trim() !== '') {
                const link = document.createElement('a');
                link.href = prompt.sourceUrl;
                link.target = '_blank';
                link.textContent = prompt.sourceUrl.length > 70 ? prompt.sourceUrl.substring(0, 67) + '...' : prompt.sourceUrl;
                sourceUrlDiv.appendChild(document.createTextNode((chrome.i18n.getMessage('sourceUrlLabel') || 'Source') + ': '));
                sourceUrlDiv.appendChild(link);
            } else {
                sourceUrlDiv.style.display = 'none';
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'prompt-actions';

            const editButton = document.createElement('button');
            editButton.className = 'edit-prompt';
            editButton.dataset.index = index;
            editButton.textContent = chrome.i18n.getMessage('editButton') || 'Edit';
            editButton.addEventListener('click', function() { handleEditPrompt(parseInt(this.dataset.index, 10)); });

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-prompt';
            deleteButton.dataset.index = index;
            deleteButton.textContent = chrome.i18n.getMessage('deleteButton') || 'Delete';
            deleteButton.addEventListener('click', function() { deletePrompt(parseInt(this.dataset.index, 10)); });

            const duplicateButton = document.createElement('button');
            duplicateButton.className = 'duplicate-prompt';
            duplicateButton.dataset.promptId = prompt.id; // Use prompt.id for reliable identification
            duplicateButton.textContent = chrome.i18n.getMessage('duplicateButtonLabel') || 'Duplicate';
            duplicateButton.addEventListener('click', function() { duplicatePrompt(this.dataset.promptId); });

            actionsDiv.appendChild(editButton);
            actionsDiv.appendChild(duplicateButton);
            actionsDiv.appendChild(deleteButton);

            li.appendChild(titleDiv);
            li.appendChild(contentDiv);
            li.appendChild(tagsDiv);
            li.appendChild(notesDiv);
            const createdDateDiv = document.createElement('div');
            createdDateDiv.className = 'prompt-created-date';
            if (prompt.createdAt) {
                const date = new Date(prompt.createdAt);
                createdDateDiv.textContent = (chrome.i18n.getMessage('createdOnLabel') || 'Created on:') + ' ' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            } else {
                createdDateDiv.style.display = 'none'; // Hide if no createdAt, though it should always exist for new prompts
            }

            li.appendChild(createdDateDiv);
            li.appendChild(sourceUrlDiv);
            li.appendChild(actionsDiv);
            ul.appendChild(li);
        });
        existingPromptsContainer.appendChild(ul);
    });
}

function duplicatePrompt(promptId) {
    chrome.storage.local.get({ prompts: [] }, function(data) {
        let prompts = data.prompts;
        const originalPrompt = prompts.find(p => p.id === promptId);

        if (!originalPrompt) {
            console.error('Original prompt not found for duplication, ID:', promptId);
            return;
        }

        const currentTime = new Date().toISOString();
        const duplicateSuffix = chrome.i18n.getMessage('duplicateSuffix') || ' (Copy)';

        const newPrompt = {
            ...JSON.parse(JSON.stringify(originalPrompt)), // Deep copy
            id: Date.now().toString(),
            title: originalPrompt.title + duplicateSuffix,
            createdAt: currentTime,
            updatedAt: currentTime,
            // Reset any version-specific fields if versioning is implemented later
            // e.g., version: 1, parentId: null (or originalPrompt.id if tracking lineage explicitly)
        };

        // Insert the new prompt, perhaps next to the original or at the end
        // For simplicity, adding to the end. Could also find original index and insert after.
        prompts.push(newPrompt);

        chrome.storage.local.set({ prompts: prompts }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving duplicated prompt:', chrome.runtime.lastError.message);
                return;
            }
            console.log('Prompt duplicated successfully:', newPrompt.title);
            renderPrompts(); // Refresh the list to show the new duplicate
        });
    });
}

function handleRestorePrompt(promptId) {
    chrome.storage.local.get({ prompts: [], deletedPrompts: [] }, function(data) {
        let prompts = data.prompts;
        let deletedPrompts = data.deletedPrompts;

        const promptToRestoreIndex = deletedPrompts.findIndex(p => p.id === promptId);
        if (promptToRestoreIndex === -1) {
            console.error('Prompt to restore not found in recycle bin, ID:', promptId);
            return;
        }

        const promptToRestore = deletedPrompts.splice(promptToRestoreIndex, 1)[0];
        
        // Remove recycle bin specific properties or update status
        delete promptToRestore.deletedTimestamp; 
        // If using a status field: promptToRestore.status = 'active';

        // Add to active prompts
        prompts.push(promptToRestore);

        // Sort prompts again if needed, e.g., by creation or update time
        // prompts.sort((a, b) => (new Date(b.createdAt)) - (new Date(a.createdAt)));

        chrome.storage.local.set({ prompts: prompts, deletedPrompts: deletedPrompts }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error restoring prompt:', chrome.runtime.lastError.message);
                // Potentially re-add to deletedPrompts if save fails, or notify user
                return;
            }
            console.log('Prompt restored successfully:', promptToRestore.title);
            renderPrompts();
            renderDeletedPrompts();
        });
    });
}

function renderDeletedPrompts() {
    console.log('[Debug renderDeletedPrompts] Function called.');
    const container = document.getElementById('deletedPromptsContainer');
    if (!container) {
        console.error('Recycle bin container (deletedPromptsContainer) not found.');
        return;
    }

    chrome.storage.local.get({ deletedPrompts: [] }, function(data) {
        console.log('[Debug renderDeletedPrompts] Entered storage.get callback.');
        if (chrome.runtime.lastError) {
            console.error('[Debug renderDeletedPrompts] Error during storage.get:', chrome.runtime.lastError.message);
            // If there's an error, data might be undefined or unreliable
            // We should probably stop further processing in this block
            return; 
        }
        console.log('[Debug renderDeletedPrompts] Data object from storage.get:', data); // Log raw data object
        // Now, specifically log the deletedPrompts array if data itself is not null/undefined
        if (data && data.hasOwnProperty('deletedPrompts')) {
            console.log('[Debug renderDeletedPrompts] deletedPrompts array from storage:', JSON.parse(JSON.stringify(data.deletedPrompts)));
        } else {
            console.log('[Debug renderDeletedPrompts] deletedPrompts key not found in data or data is null/undefined.');
        }
        const deletedPrompts = data ? data.deletedPrompts : []; // Ensure deletedPrompts is an array even if data is problematic
        container.innerHTML = ''; // Clear previous content

        if (deletedPrompts.length === 0) {
            const p = document.createElement('p');
            p.textContent = chrome.i18n.getMessage('recycleBinEmpty') || 'Recycle bin is empty.';
            container.appendChild(p);
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'prompt-list deleted-prompt-list';

        // Sort by deletion date, newest first
        deletedPrompts.sort((a, b) => (b.deletedTimestamp || 0) - (a.deletedTimestamp || 0));

        deletedPrompts.forEach((prompt, index) => { // Index here is after sorting, might not be original index
            const li = document.createElement('li');
            li.className = 'prompt-item deleted-prompt-item';

            const titleDiv = document.createElement('div');
            titleDiv.className = 'prompt-title';
            titleDiv.textContent = prompt.title || (chrome.i18n.getMessage('untitled') || 'Untitled');

            const contentPreviewDiv = document.createElement('div');
            contentPreviewDiv.className = 'prompt-content-preview';
            contentPreviewDiv.textContent = prompt.content ? (prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : '')) : (chrome.i18n.getMessage('noContentPreview') || 'No content preview');

            const deletedDateDiv = document.createElement('div');
            deletedDateDiv.className = 'prompt-deleted-date';
            if (prompt.deletedTimestamp) {
                const date = new Date(prompt.deletedTimestamp);
                deletedDateDiv.textContent = (chrome.i18n.getMessage('deletedOnLabel') || 'Deleted on:') + ' ' + date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            }

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'prompt-actions';

            const restoreButton = document.createElement('button');
            restoreButton.className = 'restore-prompt-btn';
            restoreButton.textContent = chrome.i18n.getMessage('restoreButtonLabel') || 'Restore';
            restoreButton.dataset.promptId = prompt.id;
            restoreButton.addEventListener('click', function() { handleRestorePrompt(this.dataset.promptId); });

            const permDeleteButton = document.createElement('button');
            permDeleteButton.className = 'perm-delete-prompt-btn';
            permDeleteButton.textContent = chrome.i18n.getMessage('permanentlyDeleteButtonLabel') || 'Delete Permanently';
            permDeleteButton.dataset.promptId = prompt.id;
            // permDeleteButton.addEventListener('click', function() { /* handlePermanentlyDeletePrompt(this.dataset.promptId); */ });
            permDeleteButton.disabled = true; // Permanent delete functionality not yet implemented

            actionsDiv.appendChild(restoreButton);
            actionsDiv.appendChild(permDeleteButton);

            li.appendChild(titleDiv);
            li.appendChild(contentPreviewDiv);
            li.appendChild(deletedDateDiv);
            li.appendChild(actionsDiv);
            ul.appendChild(li);
        });
        container.appendChild(ul);
    });
}

    function handleEditPrompt(index) {
    chrome.storage.local.get({ prompts: [] }, function(data) {
        const promptToEdit = data.prompts[index];
        if (promptToEdit && addPromptForm) { // Ensure addPromptForm exists
            // Populate the form fields
            if (promptIdInput) promptIdInput.value = promptToEdit.id || '';
            if (promptTitleInput) promptTitleInput.value = promptToEdit.title || '';
            
            const promptContentTextarea = addPromptForm.elements.promptContent; 
            if (promptContentTextarea) promptContentTextarea.value = promptToEdit.content || '';
            
            if (promptTagsInput) promptTagsInput.value = (promptToEdit.tags && Array.isArray(promptToEdit.tags)) ? promptToEdit.tags.join(', ') : '';
            
            const promptEffectUrlInput = addPromptForm.elements.promptEffectUrl;
            if (promptEffectUrlInput) promptEffectUrlInput.value = promptToEdit.effectUrl || '';

            // Populate notes
            if (promptNotesTextarea) promptNotesTextarea.value = promptToEdit.notes || '';

            if (saveBtn) saveBtn.textContent = chrome.i18n.getMessage('updatePromptButton') || 'Update Prompt';
            if (promptTitleInput) {
                 promptTitleInput.focus();
                 window.scrollTo(0, 0); // Scroll to top to see the form
            }
            // editingPromptIndex = index; // This global variable might not be necessary if relying on promptIdInput.value
        } else {
            if (!addPromptForm) console.error("addPromptForm not found during edit.");
            if (!promptToEdit) console.error("Prompt data not found for index:", index);
        }
    });
}

function deletePrompt(index) {
    chrome.storage.local.get({ prompts: [], deletedPrompts: [] }, function(data) {
        let prompts = data.prompts;
        let deletedPrompts = data.deletedPrompts;

        const promptToMove = prompts[index];
        if (!promptToMove) {
            console.error('Prompt to move to recycle bin not found at index:', index);
            return;
        }

        // Use a new localization key for moving to recycle bin
        const confirmMessage = (chrome.i18n.getMessage('moveToRecycleBinConfirmation') || 'Are you sure you want to move the prompt "{title}" to the Recycle Bin?').replace('{title}', promptToMove.title);

        if (confirm(confirmMessage)) {
            // Add deletion timestamp
            promptToMove.deletedTimestamp = Date.now();
            console.log('[Debug deletePrompt] Prompt being moved:', JSON.parse(JSON.stringify(promptToMove)));

            // Add to deletedPrompts array
            deletedPrompts.push(promptToMove);

            // Remove from original prompts array
            prompts.splice(index, 1);
            
            console.log('[Debug deletePrompt] Prompts array before storage.set:', JSON.parse(JSON.stringify(prompts)));
            console.log('[Debug deletePrompt] DeletedPrompts array before storage.set:', JSON.parse(JSON.stringify(deletedPrompts)));

            chrome.storage.local.set({ prompts: prompts, deletedPrompts: deletedPrompts }, function() {
                if (chrome.runtime.lastError) { 
                    console.error('[Debug deletePrompt] Error during chrome.storage.local.set:', chrome.runtime.lastError.message); 
                    // Optional: Revert changes in memory if save fails, or notify user more clearly
                    return; 
                } else {
                    console.log('[Debug deletePrompt] Successfully updated storage.');
                }
                renderPrompts(); 
                renderDeletedPrompts(); // Update recycle bin view
                // console.log('Prompt moved to recycle bin:', promptToMove);
            });
        }
    });
}

    // --- Recycle Bin Retention Logic ---
    if (recycleBinRetentionInput) {
        recycleBinRetentionInput.addEventListener('change', function() {
            let days = parseInt(this.value, 10);
            if (isNaN(days) || days < 0) {
                console.warn('Invalid input for recycle bin retention days. Reverting to default or last saved.');
                // Optionally, revert to last known good value or default
                chrome.storage.local.get(['recycleBinRetentionDays'], function(result) {
                    if (!chrome.runtime.lastError && typeof result.recycleBinRetentionDays === 'number' && result.recycleBinRetentionDays >= 0) {
                        recycleBinRetentionInput.value = result.recycleBinRetentionDays;
                    } else {
                        recycleBinRetentionInput.value = DEFAULT_RECYCLE_BIN_RETENTION_DAYS;
                    }
                });
                return;
            }
            chrome.storage.local.set({ recycleBinRetentionDays: days }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving recycleBinRetentionDays:', chrome.runtime.lastError.message);
                } else {
                    console.log('Recycle bin retention period saved:', days, 'days.');
                }
            });
        });
    }

    // --- Initialization Call --- 
    loadAndSetLanguagePreferenceInternal().then(currentLang => {
        console.log('Current UI language for options page:', currentLang);
        applyOptionsPageLocalizations(); 
        renderPrompts(); 
        renderDeletedPrompts(); // Render deleted prompts on load

        // Load Recycle Bin Retention Days
        if (recycleBinRetentionInput) {
            chrome.storage.local.get(['recycleBinRetentionDays'], function(result) {
                if (chrome.runtime.lastError) {
                    console.error('Error loading recycleBinRetentionDays:', chrome.runtime.lastError.message);
                    recycleBinRetentionInput.value = DEFAULT_RECYCLE_BIN_RETENTION_DAYS;
                    return;
                }
                const savedDays = result.recycleBinRetentionDays;
                if (typeof savedDays === 'number' && savedDays >= 0) {
                    recycleBinRetentionInput.value = savedDays;
                } else {
                    recycleBinRetentionInput.value = DEFAULT_RECYCLE_BIN_RETENTION_DAYS;
                }
            });
        }
    });
}); // Re-add closing for DOMContentLoaded

// Global functions (like fetchAITitleAndTags) can remain outside if they don't rely on DOMContentLoaded variables directly
// or be moved inside if preferred for consistency, but fetchAITitleAndTags is self-contained.
async function fetchAITitleAndTags(content, apiKey) {
    const API_URL = 'https://api.deepseek.com/chat/completions';

    // 1. Get user's preferred language
    const { preferredLanguage } = await new Promise((resolve) => { // Changed to preferredLanguage
        chrome.storage.sync.get({ preferredLanguage: 'en' }, (items) => { // Changed key to preferredLanguage
            resolve(items); 
        });
    });
    const langActual = preferredLanguage || 'en'; // Ensure langActual gets a value, fallback to 'en'
    const langName = langActual === 'zh' ? 'Chinese' : 'English';

    // 2. Get custom system prompt or use default
    let { customSystemPrompt } = await new Promise(resolve =>
        chrome.storage.sync.get('customSystemPrompt', result => resolve(result))
    );

    let systemMessageContent;
    const defaultSystemPromptTemplate = `You are an expert text analyst. Based on the user's content, generate a concise, relevant title (5-10 words) and 3-5 keywords/tags. The response MUST be in ${langName}.
Output ONLY a valid JSON object with "title" (string) and "tags" (array of strings).
Example for ${langName}: {"title": "${langName === 'Chinese' ? '示例 AI 标题' : 'Example AI Title'}", "tags": ["${langName === 'Chinese' ? '标签1' : 'tag1'}','${langName === 'Chinese' ? '标签2' : 'tag2'}']}`;

    if (customSystemPrompt && typeof customSystemPrompt === 'string' && customSystemPrompt.trim() !== '') {
        systemMessageContent = customSystemPrompt.replace(/\$\{langName\}/g, langName);
    } else {
        systemMessageContent = defaultSystemPromptTemplate;
    }
    // For debugging: console.log("Options.js - Using system prompt:", systemMessageContent);

    const messages = [
        {
            role: "system",
            content: systemMessageContent
        },
        {
            role: "user",
            content: `Generate a title and tags for the following content: """${content}"""`
        }
    ];

    const payload = {
        model: "deepseek-chat",
        messages: messages,
        response_format: { type: "json_object" },
        stream: false,
        max_tokens: 250, // Max tokens for title and tags
        temperature: 0.5,
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('DeepSeek API Error in options.js:', response.status, errorBody);
            // Try to get a localized error message if available
            const apiErrorMsg = chrome.i18n.getMessage('apiError') || 'API request failed';
            throw new Error(`${apiErrorMsg} (${response.status}): ${errorBody}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            try {
                const aiResponse = JSON.parse(data.choices[0].message.content);
                // 3. Ensure tags are an array of strings
                const title = (typeof aiResponse.title === 'string' && aiResponse.title.trim() !== '') ? aiResponse.title.trim() : null;
                let tagsArray = [];
                if (Array.isArray(aiResponse.tags)) {
                    tagsArray = aiResponse.tags.map(tag => String(tag).trim()).filter(tag => tag);
                } else if (typeof aiResponse.tags === 'string') { // Fallback for comma-separated string
                    tagsArray = aiResponse.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
                }
                
                if (title) { // Only return if title is valid
                    return { title: title, tags: tagsArray };
                } else {
                    console.error('AI response JSON does not have a valid title field:', aiResponse);
                    return null;
                }
            } catch (e) {
                console.error('Failed to parse AI response JSON in options.js:', e, "Raw content:", data.choices[0].message.content);
                return null;
            }
        } else {
            console.error('Unexpected AI response structure in options.js:', data);
            return null;
        }
    } catch (error) {
        console.error('Error fetching AI title and tags in options.js:', error);
        // Do not re-throw here, allow the caller to handle null or show a generic message
        return null; // Indicate failure to the caller
    }
}