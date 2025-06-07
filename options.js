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
        'existingPromptsHeadingText': 'existingPromptsHeading',
        // Shortcut Settings
        'shortcutSettingsHeadingText': 'shortcutSettingsHeading',
        'siteSpecificActivationHeadingText': 'siteSpecificActivationHeading',
        'siteSpecificActivationDescriptionText': 'siteSpecificActivationDescription',
        'allowedSitesLabelText': 'allowedSitesLabel',
        'customizeShortcutsHeadingText': 'customizeShortcutsHeading',
        'customizeShortcutsDescriptionText': 'customizeShortcutsDescription',
        'saveAllowedSitesButton': 'saveAllowedSitesButton',
        'customizeShortcutsButton': 'customizeShortcutsButton',
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

// --- Shortcut Settings ---
function initializeShortcutSettings() {
    const allowedSitesTextarea = document.getElementById('allowedSitesTextarea');
    const saveAllowedSitesButton = document.getElementById('saveAllowedSitesButton');
    const allowedSitesStatusMessage = document.getElementById('allowedSitesStatusMessage');
    const customizeShortcutsButton = document.getElementById('customizeShortcutsButton');

    // Load allowed sites
    if (allowedSitesTextarea && saveAllowedSitesButton && allowedSitesStatusMessage) {
        allowedSitesStatusMessage.textContent = chrome.i18n.getMessage('allowedSitesStatusLoading') || 'Loading...';
        chrome.storage.sync.get(['allowedSites'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading allowed sites:', chrome.runtime.lastError);
                allowedSitesStatusMessage.textContent = chrome.i18n.getMessage('allowedSitesStatusError') || 'Error loading.';
                allowedSitesStatusMessage.style.color = 'red';
                return;
            }
            if (result.allowedSites && Array.isArray(result.allowedSites)) {
                allowedSitesTextarea.value = result.allowedSites.join('\n');
            }
            allowedSitesStatusMessage.textContent = ''; // Clear loading message
        });

        saveAllowedSitesButton.addEventListener('click', function() {
            const urls = allowedSitesTextarea.value.split('\n').map(url => url.trim()).filter(url => url);
            chrome.storage.sync.set({ allowedSites: urls }, function() {
                if (chrome.runtime.lastError) {
                    console.error('Error saving allowed sites:', chrome.runtime.lastError);
                    allowedSitesStatusMessage.textContent = chrome.i18n.getMessage('allowedSitesStatusError') || 'Error saving.';
                    allowedSitesStatusMessage.style.color = 'red';
                } else {
                    allowedSitesStatusMessage.textContent = chrome.i18n.getMessage('allowedSitesStatusSuccess') || 'Saved successfully.';
                    allowedSitesStatusMessage.style.color = 'green';
                }
                setTimeout(() => {
                    allowedSitesStatusMessage.textContent = '';
                    allowedSitesStatusMessage.style.color = ''; // Reset color
                }, 3000);
            });
        });
    } else {
        if (!allowedSitesTextarea) console.warn("Element 'allowedSitesTextarea' not found for shortcut settings.");
        if (!saveAllowedSitesButton) console.warn("Element 'saveAllowedSitesButton' not found for shortcut settings.");
        if (!allowedSitesStatusMessage) console.warn("Element 'allowedSitesStatusMessage' not found for shortcut settings.");
    }

    // Customize shortcuts button
    if (customizeShortcutsButton) {
        customizeShortcutsButton.addEventListener('click', function() {
            chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
        });
    } else {
        console.warn("Element 'customizeShortcutsButton' not found for shortcut settings.");
    }
}
// --- END Shortcut Settings ---

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
        languageSelect.addEventListener('change', async function() {
            const selectedLang = this.value;
            chrome.storage.sync.set({ preferredLanguage: selectedLang }, async function() {
                await loadLocaleMessages(selectedLang);
                applyOptionsPageLocalizations_Custom();
                if (typeof renderPrompts === 'function') renderPrompts();
                if (typeof renderDeletedPrompts === 'function') renderDeletedPrompts();
                // 不再刷新页面，保持当前tab和滚动等状态
            });
        });
    }

    initializeShortcutSettings(); // Initialize shortcut settings

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
                } // Closes IF_SETTINGS
                // const finalTagsArray and savePrompt are now inside the main try block
                const finalTagsArray = finalTagsString ? finalTagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
                savePrompt(currentPromptId, finalTitle, promptContentValue, finalTagsArray, effectUrl, notes); // Pass notes to savePrompt
            } catch (error) { // Closes the main try block (L389), starts catch block
        console.error('Error in form submission process:', error);
        const statusElement = document.getElementById('promptStatusMessage'); // Assumes 'promptStatusMessage' element exists for feedback
        const errorMessage = chrome.i18n.getMessage('promptSaveError') || 'Error saving prompt. See console for details.';
        if (statusElement) {
          statusElement.textContent = errorMessage;
          statusElement.className = 'status-message error'; // Ensure CSS for .error class is defined
        } else {
          alert(errorMessage);
        }
      } finally {
        // This block executes regardless of success or error in try/catch.
        // Useful for UI cleanup, like re-enabling the save button or resetting its text.
        // Ensure savePromptButton and currentPromptId are accessible in this scope.
        if (typeof savePromptButton !== 'undefined' && savePromptButton) {
          const buttonTextKey = currentPromptId ? 'updatePromptButton' : 'savePromptButton';
          const fallbackButtonText = currentPromptId ? 'Update Prompt' : 'Save Prompt';
          savePromptButton.textContent = chrome.i18n.getMessage(buttonTextKey) || fallbackButtonText;
          savePromptButton.disabled = false;
        }
      }
    } // Closes async function(event) body
    ); // Closes addEventListener call
  } // Closes if (addPromptForm)
    // --- Prompt Management Functions (defined within DOMContentLoaded to access shared vars like existingPromptsContainer) ---
function clearRecycleBin() {
    if (!confirm(chrome.i18n.getMessage('clearRecycleBinConfirmation') || '确定要清空回收站吗？此操作无法撤销。')) {
        return;
    }
    chrome.storage.local.set({ deletedPrompts: [] }, function() {
        // Callback for successful recycle bin clearing
        console.log('Recycle bin has been cleared.');
        if (typeof renderDeletedPrompts === 'function') {
            renderDeletedPrompts(); // Re-render the list of deleted prompts if the function exists
        } else {
            console.warn('renderDeletedPrompts function not found after clearing recycle bin.');
        }
    }); // Closes chrome.storage.local.set
} // Closes clearRecycleBin function
// Misplaced loadAndSetSiteSpecificUrls function (formerly lines 442-449) removed.
function handlePermanentlyDeletePrompt(promptId) {
    chrome.storage.local.get({ deletedPrompts: [] }, function(data) {
        if (chrome.runtime.lastError) {
            console.error('[handlePermanentlyDeletePrompt] Error during storage.get:', chrome.runtime.lastError.message);
            alert(chrome.i18n.getMessage('permanentlyDeleteError') || '删除失败，请重试。');
            return;
        }
        let deletedPrompts = data.deletedPrompts || [];
        const idx = deletedPrompts.findIndex(p => p.id === promptId);
        if (idx === -1) {
            console.error('[handlePermanentlyDeletePrompt] Prompt not found in deletedPrompts, ID:', promptId);
            alert(chrome.i18n.getMessage('permanentlyDeleteNotFound') || '未找到要删除的数据。');
            return;
        }
        deletedPrompts.splice(idx, 1);
        chrome.storage.local.set({ deletedPrompts }, function() {
            if (chrome.runtime.lastError) {
                console.error('[handlePermanentlyDeletePrompt] Error during storage.set:', chrome.runtime.lastError.message);
                alert(chrome.i18n.getMessage('permanentlyDeleteError') || '删除失败，请重试。');
                return;
            }
            console.log('[handlePermanentlyDeletePrompt] Prompt permanently deleted, ID:', promptId);
            renderDeletedPrompts();
        });
    });
}

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

    // 行内编辑辅助函数
    function showEditForm({prompt, container, onCancel}) {
    // 全局移除所有编辑表单，并自动保存有变动且合法的内容
    let needRender = false;
document.querySelectorAll('.edit-form-container').forEach(f => {
    const lastForm = f.querySelector('form');
    if (lastForm) {
        const title = lastForm.querySelector('#editPromptTitle').value.trim();
        const content = lastForm.querySelector('#editPromptContent').value.trim();
        const tags = lastForm.querySelector('#editPromptTags').value.split(',').map(t=>t.trim()).filter(Boolean);
        const effectUrl = lastForm.querySelector('#editPromptEffectUrl').value.trim();
        const notes = lastForm.querySelector('#editPromptNotes').value.trim();
        const id = lastForm.querySelector('#editPromptId')?.value;
        if (title && content) {
            if (id) {
                savePromptFromForm({
                    prompt: {id, title, content, tags, effectUrl, notes},
                    form: lastForm,
                    onSaved: (changed) => { needRender = needRender || changed; }
                });
            } else {
                savePromptFromForm({
                    prompt: null,
                    form: lastForm,
                    onSaved: (changed) => { needRender = needRender || changed; }
                });
            }
        }
    }
    f.remove();
});
// 如果自动保存导致 renderPrompts，则直接 return，不再插入新表单
if (needRender) return;
    // 构建表单
    const formDiv = document.createElement('div');
    formDiv.className = 'edit-form-container';
    formDiv.innerHTML = `
        <form class="edit-prompt-form">
            <input type="hidden" id="editPromptId" value="${prompt?.id||''}">
            <div class="form-group">
                <label data-i18n-key="promptTitleLabel">Title</label>
                <input type="text" id="editPromptTitle" value="${prompt?.title ? escapeHtml(prompt.title) : ''}" required placeholder="${chrome.i18n.getMessage('promptTitlePlaceholder')||''}">
            </div>
            <div class="form-group">
                <label data-i18n-key="promptContentLabel">Content</label>
                <textarea id="editPromptContent" required placeholder="${chrome.i18n.getMessage('promptContentPlaceholder')||''}">${prompt?.content ? escapeHtml(prompt.content) : ''}</textarea>
            </div>
            <div class="form-group">
                <label data-i18n-key="promptTagsLabel">Tags</label>
                <input type="text" id="editPromptTags" value="${prompt?.tags?.join(', ')||''}" placeholder="tag1, tag2, ...">
            </div>
            <div class="form-group">
                <label data-i18n-key="promptEffectUrlLabel">Effect URL</label>
                <input type="url" id="editPromptEffectUrl" value="${prompt?.effectUrl||''}" data-i18n-placeholder-key="promptEffectUrlPlaceholder" placeholder="${chrome.i18n.getMessage('promptEffectUrlPlaceholder')||'https://example.com'}">
            </div>
            <div class="form-group">
                <label data-i18n-key="promptNotesLabel">Notes</label>
                <textarea id="editPromptNotes" data-i18n-placeholder-key="promptNotesPlaceholder" placeholder="${chrome.i18n.getMessage('promptNotesPlaceholder')||'Enter notes...'}">${prompt?.notes ? escapeHtml(prompt.notes) : ''}</textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="ai-generate-btn" data-i18n-key="aiGenerateButton">${chrome.i18n.getMessage('aiGenerateButton')||'AI生成'}</button>
                <button type="button" class="cancel-edit-btn" data-i18n-key="cancelButton">${chrome.i18n.getMessage('cancelButton')||'Cancel'}</button>
                <button type="submit" class="save-btn primary" data-i18n-key="saveButton">${chrome.i18n.getMessage('saveButton')||'Save'}</button>
            </div>
        </form>
    `;
    // 取消按钮
    formDiv.querySelector('.cancel-edit-btn').onclick = () => {
        formDiv.remove();
        if (onCancel) onCancel();
    };
    // AI生成按钮
    formDiv.querySelector('.ai-generate-btn').onclick = async function() {
        const aiBtn = this;
        aiBtn.disabled = true;
        aiBtn.textContent = chrome.i18n.getMessage('generatingAIText') || 'AI生成中...';
        const contentInput = formDiv.querySelector('#editPromptContent');
        const titleInput = formDiv.querySelector('#editPromptTitle');
        const tagsInput = formDiv.querySelector('#editPromptTags');
        const contentVal = contentInput.value.trim();
        const { autoTaggingEnabled, deepseekApiKey } = await new Promise(resolve =>
            chrome.storage.local.get(['autoTaggingEnabled', 'deepseekApiKey'], resolve)
        );
        if (!autoTaggingEnabled || !deepseekApiKey || !contentVal) {
            aiBtn.textContent = chrome.i18n.getMessage('aiGenerateButton')||'AI生成';
            aiBtn.disabled = false;
            alert('未配置AI或内容为空');
            return;
        }
        const ai = await fetchAITitleAndTags(contentVal, deepseekApiKey);
        if (ai && ai.title) titleInput.value = ai.title;
        if (ai && ai.tags) tagsInput.value = Array.isArray(ai.tags) ? ai.tags.join(', ') : ai.tags;
        aiBtn.textContent = chrome.i18n.getMessage('aiGenerateButton')||'AI生成';
        aiBtn.disabled = false;
    };
    // 提交保存
    formDiv.querySelector('form').onsubmit = function(e) {
        e.preventDefault();
        savePromptFromForm({prompt: null, form: formDiv});
    };
    container.appendChild(formDiv);
    try {
        formDiv.querySelector('#editPromptTitle').focus({preventScroll:true});
    } catch(e){}
}

    function savePromptFromForm({prompt, form, onSaved}) {
    try {
        // 统一从表单读取 promptId，严格区分编辑/新增
        const id = form.querySelector('#editPromptId')?.value;
        const title = form.querySelector('#editPromptTitle').value.trim();
        const content = form.querySelector('#editPromptContent').value.trim();
        const tags = form.querySelector('#editPromptTags').value.split(',').map(t=>t.trim()).filter(Boolean);
        const effectUrl = form.querySelector('#editPromptEffectUrl').value.trim();
        const notes = form.querySelector('#editPromptNotes').value.trim();
        if (!title || !content) {
            alert(chrome.i18n.getMessage('titleAndContentRequired')||'Title and content required');
            return;
        }
        chrome.storage.local.get({ prompts: [] }, function(data){
            let prompts = data.prompts;
            let now = new Date().toISOString();
            if (id) {
                // 编辑
                const idx = prompts.findIndex(p=>p.id===id);
                if (idx>-1) {
                    const old = prompts[idx];
                    // 仅有实际变动时才更新
                    const oldTags = Array.isArray(old.tags) ? old.tags.map(t=>t.trim()).filter(Boolean) : [];
                    const isChanged = (
                        old.title !== title ||
                        old.content !== content ||
                        old.effectUrl !== effectUrl ||
                        old.notes !== notes ||
                        oldTags.join(',') !== tags.join(',')
                    );
                    if (!isChanged) {
                        // 没有变动则不更新 updatedAt，不写入 storage
                        if (typeof onSaved === 'function') onSaved(false);
                        return;
                    }
                    prompts[idx] = {...old, title, content, tags, effectUrl, notes, updatedAt: now};
                    chrome.storage.local.set({prompts}, function(){
                        if (typeof onSaved === 'function') onSaved(true);
                        renderPrompts();
                    });
                    return;
                }
            } else {
                // 新增
                const newPrompt = {
                    id: crypto.randomUUID(),
                    title, content, tags, effectUrl, notes,
                    createdAt: now, updatedAt: now
                };
                prompts.unshift(newPrompt);
                chrome.storage.local.set({prompts}, function(){
                    if (typeof onSaved === 'function') onSaved(true);
                    renderPrompts();
                });
            }
        });
    } catch (err) {
        alert('保存失败: '+err.message);
    }
}

    function renderPrompts() {
    // 渲染前先全局移除所有 edit-form-container，防止脏表单
    document.querySelectorAll('.edit-form-container').forEach(f => f.remove());
        chrome.storage.local.get({ prompts: [] }, function(data) {
            const prompts = data.prompts;
            if (!existingPromptsContainer) { console.error("existingPromptsContainer not found."); return; }
            existingPromptsContainer.innerHTML = '';
            // 新增按钮
            const addBtnWrap = document.createElement('div');
            addBtnWrap.className = 'add-prompt-container';
            const addBtn = document.createElement('button');
            addBtn.id = 'addNewPromptBtn';
            addBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> ${chrome.i18n.getMessage('addNewPromptButton')||'Add New Prompt'}`;
            addBtn.onclick = () => {
                // 1. 先移除所有已存在的表单，避免多表单和滚动干扰
                document.querySelectorAll('.edit-form-container').forEach(el => el.remove());
                addBtn.style.display = 'none';
                showEditForm({
                    prompt: null,
                    container: existingPromptsContainer,
                    onCancel: () => { addBtn.style.display = 'flex'; }
                });
                // 2. 只插入一次表单，并只滚动一次
                const editForm = existingPromptsContainer.querySelector('.edit-form-container');
                if (editForm) {
                    existingPromptsContainer.insertBefore(editForm, addBtnWrap.nextSibling);
                }
            };
            addBtnWrap.appendChild(addBtn);
            existingPromptsContainer.appendChild(addBtnWrap);
            // 若页面加载时有未关闭的编辑表单，自动插入到按钮下方
            const existEditForm = existingPromptsContainer.querySelector('.edit-form-container');
            if (existEditForm) {
                existingPromptsContainer.insertBefore(existEditForm, addBtnWrap.nextSibling);
            }
            // 空状态
            if (prompts.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.textContent = getMessage('noPromptsSaved') || 'No prompts yet.';
                existingPromptsContainer.appendChild(empty);
                return;
            }
            // 排序：按更新时间倒序
            prompts.sort((a, b) => {
                const aTime = a.updatedAt || a.createdAt || '';
                const bTime = b.updatedAt || b.createdAt || '';
                return bTime.localeCompare(aTime);
            });
            prompts.forEach(prompt => {
                const item = document.createElement('div');
                item.className = 'prompt-item';
                item.innerHTML = `
                    <div class="prompt-header">
                        <div class="prompt-title">${escapeHtml(prompt.title || '')}</div>
                        <div class="prompt-actions">
                            <button class="edit-prompt-btn" title="${chrome.i18n.getMessage('editButtonLabel')||'编辑'}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                                ${chrome.i18n.getMessage('editButtonLabel')||'编辑'}
                            </button>
                            <button class="duplicate-prompt-btn" title="${chrome.i18n.getMessage('duplicateButtonLabel')||'创建副本'}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><rect x="3" y="3" width="13" height="13" rx="2"/></svg>
                                ${chrome.i18n.getMessage('duplicateButtonLabel')||'创建副本'}
                            </button>
                            <button class="delete-prompt-btn" title="${chrome.i18n.getMessage('deleteButtonLabel')||'删除'}">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                                ${chrome.i18n.getMessage('deleteButtonLabel')||'删除'}
                            </button>
                        </div>
                    </div>
                    <div class="prompt-content-preview">${escapeHtml(prompt.content || '').slice(0, 120)}${prompt.content && prompt.content.length > 120 ? '...' : ''}</div>
                ${prompt.sourceUrl ? `<div class="prompt-source-url" style="margin: 4px 0 4px 0;font-size:12px;color:#888;">
                  <span class="source-label">${chrome.i18n.getMessage('sourceUrlLabel') || 'Source'}：</span>
                  <a href="${escapeHtml(prompt.sourceUrl)}" target="_blank" rel="noopener noreferrer" style="color:#1677ff;word-break:break-all;">${escapeHtml(prompt.sourceUrl)}</a>
                </div>` : ''}
                <div class="prompt-tags">
  ${prompt.tags && prompt.tags.length ? prompt.tags.map(tag => `<span class="tag clickable" style="background:#f0f7ff;color:#1677ff;margin-right:6px;cursor:pointer;" onclick="window.open('?tag=${encodeURIComponent(tag)}','_self')">${escapeHtml(tag)}</span>`).join('') : `<span class='tag'>${chrome.i18n.getMessage('noTags')||'无标签'}</span>`}
</div>
${prompt.notes ? `<div class="prompt-notes"><span class="label">${chrome.i18n.getMessage('promptNotesLabel')||'备注'}：</span>${escapeHtml(prompt.notes)}</div>` : ''}
${prompt.effectUrl ? `<div class="prompt-source"><span class="label">${chrome.i18n.getMessage('sourceUrlLabel')||'来源'}：</span><a href="${escapeHtml(prompt.effectUrl)}" target="_blank" rel="noopener noreferrer" style="color:#1677ff;text-decoration:underline;">${escapeHtml(prompt.effectUrl)}</a></div>` : ''}
                    <div class="prompt-meta">
                        <span>${chrome.i18n.getMessage('createdLabel')||'创建于'}：${prompt.createdAt ? formatDate(prompt.createdAt) : ''}</span>
                        <span>${chrome.i18n.getMessage('updatedLabel')||'更新于'}：${prompt.updatedAt ? formatDate(prompt.updatedAt) : ''}</span>
                    </div>
                `;
                // 按钮事件绑定
                item.querySelector('.edit-prompt-btn').onclick = (e)=>{
                    e.stopPropagation();
                    showEditForm({prompt, container:item});
                };
                item.querySelector('.delete-prompt-btn').onclick = (e)=>{
                    e.stopPropagation();
                    if (confirm(chrome.i18n.getMessage('confirmDeletePrompt')||'确定删除该提示词？')) deletePrompt(prompt.id);
                };
                item.querySelector('.duplicate-prompt-btn').onclick = (e)=>{
                    e.stopPropagation();
                    duplicatePrompt(prompt.id);
                };
                // 点击卡片标题也可编辑
                item.querySelector('.prompt-title').onclick = (e)=>{
                    e.stopPropagation();
                    showEditForm({prompt, container:item});
                };
                existingPromptsContainer.appendChild(item);
            });
        });
    }

    function deletePrompt(promptId) {
        chrome.storage.local.get({ prompts: [], deletedPrompts: [] }, function(data) {
            const prompts = data.prompts;
            const deletedPrompts = data.deletedPrompts;
            const index = prompts.findIndex(p => p.id === promptId);
            if (index === -1) {
                console.error('Prompt to delete not found for id:', promptId);
                return;
            }
            const promptToMove = prompts[index];
            promptToMove.deletedTimestamp = Date.now();
            deletedPrompts.push(promptToMove);
            prompts.splice(index, 1);
            chrome.storage.local.set({ prompts: prompts, deletedPrompts: deletedPrompts }, function() {
                renderPrompts();
                renderDeletedPrompts();
            });
        });
    }

    // 日期格式化工具函数，保证所有时间显示正常
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        // 返回本地化日期时间字符串
        return d.toLocaleString();
    } catch (e) {
        return '';
    }
}

// 复制提示词（副本）
function duplicatePrompt(promptId) {
    try {
        chrome.storage.local.get({ prompts: [] }, function(data) {
            const prompts = data.prompts;
            const idx = prompts.findIndex(p => p.id === promptId);
            if (idx === -1) {
                console.error('duplicatePrompt: 未找到指定 id 的提示词:', promptId);
                return;
            }
            const oldPrompt = prompts[idx];
            // 深拷贝并生成新 id/timestamp
            const now = new Date().toISOString();
            const newPrompt = {
                ...oldPrompt,
                id: crypto.randomUUID(),
                createdAt: now,
                updatedAt: now
            };
            prompts.unshift(newPrompt);
            chrome.storage.local.set({ prompts }, function() {
                if (chrome.runtime.lastError) {
                    console.error('duplicatePrompt: 保存副本失败:', chrome.runtime.lastError.message);
                    alert('创建副本失败: ' + chrome.runtime.lastError.message);
                    return;
                }
                renderPrompts();
            });
        });
    } catch (e) {
        console.error('duplicatePrompt: 执行异常:', e);
        alert('创建副本时发生错误: ' + e.message);
    }
}

// HTML转义工具函数，防止XSS和undefined
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

// 回收站渲染函数，支持恢复和彻底删除
function renderDeletedPrompts() {
    const container = document.getElementById('deletedPromptsContainer');
    if (!container) return;
    chrome.storage.local.get({ deletedPrompts: [] }, function(data) {
        const deletedPrompts = data.deletedPrompts || [];
        container.innerHTML = '';
        if (deletedPrompts.length === 0) {
            const p = document.createElement('p');
            p.textContent = getMessage('recycleBinEmpty') || 'Recycle bin is empty.';
            container.appendChild(p);
            return;
        }
        deletedPrompts.forEach(prompt => {
            const li = document.createElement('div');
            li.className = 'prompt-item deleted';
            li.innerHTML = `
                <div class="prompt-title">${escapeHtml(prompt.title || '')}</div>
                <div class="prompt-content-preview">${escapeHtml(prompt.content || '').slice(0, 120)}${prompt.content && prompt.content.length > 120 ? '...' : ''}</div>
                <button class="restore-btn">${chrome.i18n.getMessage('restoreButtonLabel')||'恢复'}</button>
                <button class="perm-delete-btn">${chrome.i18n.getMessage('permanentlyDeleteButtonLabel')||'彻底删除'}</button>
            `;
            li.querySelector('.restore-btn').onclick = () => handleRestorePrompt(prompt.id);
            li.querySelector('.perm-delete-btn').onclick = () => handlePermanentlyDeletePrompt(prompt.id);
            container.appendChild(li);
        });
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

        // 绑定清空回收站按钮事件
        const clearRecycleBinButton = document.getElementById('clearRecycleBinButton');
        if (clearRecycleBinButton) {
            clearRecycleBinButton.addEventListener('click', clearRecycleBin);
        }

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

function initializeCustomShortcutSetting() {
    const shortcutKeyInput = document.getElementById('customShortcutKeyInput');
    const saveButton = document.getElementById('saveCustomShortcutKeyButton');
    const statusMessage = document.getElementById('customShortcutKeyStatusMessage');
    const DEFAULT_SHORTCUT_KEY = '/';

    if (!shortcutKeyInput || !saveButton || !statusMessage) {
        console.warn('Custom shortcut key UI elements not found.');
        return;
    }

    // Load saved shortcut key
    chrome.storage.sync.get(['customPromptShortcutKey'], function(result) {
        if (chrome.runtime.lastError) {
            console.error('Error loading custom shortcut key:', chrome.runtime.lastError);
            statusMessage.textContent = chrome.i18n.getMessage('errorLoadingSettings') || 'Error loading setting.'; // Assuming 'errorLoadingSettings' exists
            statusMessage.className = 'status-message error';
            shortcutKeyInput.value = DEFAULT_SHORTCUT_KEY; // Fallback to default
            return;
        }
        shortcutKeyInput.value = result.customPromptShortcutKey || DEFAULT_SHORTCUT_KEY;
    });

    // Save shortcut key
    saveButton.addEventListener('click', function() {
        const newKey = shortcutKeyInput.value.trim();
        if (newKey.length !== 1) {
            statusMessage.textContent = chrome.i18n.getMessage('customShortcutKeyInvalid') || 'Invalid shortcut key. Please enter a single character.';
            statusMessage.className = 'status-message error';
            setTimeout(() => { statusMessage.textContent = ''; statusMessage.className = 'status-message'; }, 3000);
            return;
        }

        chrome.storage.sync.set({ customPromptShortcutKey: newKey }, function() {
            if (chrome.runtime.lastError) {
                console.error('Error saving custom shortcut key:', chrome.runtime.lastError);
                statusMessage.textContent = chrome.i18n.getMessage('errorSavingSettings') || 'Error saving.'; // Assuming 'errorSavingSettings' exists
                statusMessage.className = 'status-message error';
            } else {
                statusMessage.textContent = chrome.i18n.getMessage('customShortcutKeySavedSuccess') || 'Shortcut key saved successfully. Reload open pages for the change to take effect.';
                statusMessage.className = 'status-message success';
            }
            setTimeout(() => { statusMessage.textContent = ''; statusMessage.className = 'status-message'; }, 5000);
        });
    });
}

    // Initialize settings sections
    // initializeTheme(); // Temporarily commented out
    // initializeLanguageSetting();
    // initializeApiKeySetting();
    // initializeAutoTaggingSetting();
    // initializeCustomSystemPromptSetting();
    // initializeRecycleBinRetentionSetting();
    // initializeShortcutSettings(); // Existing shortcut settings (site-specific, chrome shortcuts page)
    // initializeCustomShortcutSetting(); // NEW: For custom prompt search key
    // loadAndDisplayPrompts(); // Load prompts for 'My Prompts' tab
    // loadAndDisplayRecycleBin(); // Load items for 'Recycle Bin' tab

}); // Closes DOMContentLoaded

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

// ====== 自定义i18n方案开始 ======
let currentMessages = {};
let currentLang = 'zh_CN';

// 动态加载messages.json
async function loadLocaleMessages(lang) {
    const url = `/_locales/${lang}/messages.json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('加载语言包失败');
        const json = await res.json();
        currentMessages = {};
        for (const key in json) {
            if (json[key] && json[key].message) {
                currentMessages[key] = json[key].message;
            }
        }
        currentLang = lang;
    } catch (e) {
        console.error('加载语言包失败:', e);
        currentMessages = {};
    }
}

// 获取本地化文本
function getMessage(key) {
    return currentMessages[key] || '';
}

// 替换本地化渲染逻辑
function applyOptionsPageLocalizations_Custom() {
    // 按ID渲染
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
        'existingPromptsHeadingText': 'existingPromptsHeading',
        // Shortcut Settings
        'shortcutSettingsHeadingText': 'shortcutSettingsHeading',
        'siteSpecificActivationHeadingText': 'siteSpecificActivationHeading',
        'siteSpecificActivationDescriptionText': 'siteSpecificActivationDescription',
        'allowedSitesLabelText': 'allowedSitesLabel',
        'customizeShortcutsHeadingText': 'customizeShortcutsHeading',
        'customizeShortcutsDescriptionText': 'customizeShortcutsDescription',
        'saveAllowedSitesButton': 'saveAllowedSitesButton',
        'customizeShortcutsButton': 'customizeShortcutsButton',
    };
    for (const id in elementsToLocalizeById) {
        const el = document.getElementById(id);
        if (el) el.textContent = getMessage(elementsToLocalizeById[id]);
    }
    // data-i18n-key
    document.querySelectorAll('[data-i18n-key]').forEach(element => {
        const key = element.dataset.i18nKey;
        const message = getMessage(key);
        if (message) {
            element.textContent = message;
        }
    });
    // data-i18n-placeholder-key
    document.querySelectorAll('[data-i18n-placeholder-key]').forEach(element => {
        const key = element.dataset.i18nPlaceholderKey;
        const message = getMessage(key);
        if (message) {
            element.placeholder = message;
        }
    });
    // 页面标题
    document.title = getMessage('promptManagerSettings') || 'Prompt Manager Settings';
}

// ====== 自定义i18n方案结束 ======

// 语言初始化和切换
async function initI18nAndRender() {
    // 1. 获取用户设置语言
    let lang = 'zh_CN';
    await new Promise(resolve => {
        chrome.storage.sync.get('preferredLanguage', function(data) {
            lang = data.preferredLanguage || 'zh_CN';
            resolve();
        });
    });
    // 2. 加载语言包
    await loadLocaleMessages(lang);
    // 3. 渲染
    applyOptionsPageLocalizations_Custom();
    // 4. 设置下拉框选中
    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) languageSelect.value = lang;
}

// 监听语言切换
const languageSelect = document.getElementById('languageSelect');
if (languageSelect) {
    languageSelect.addEventListener('change', async function() {
        const selectedLang = this.value;
        chrome.storage.sync.set({ preferredLanguage: selectedLang }, async function() {
            await loadLocaleMessages(selectedLang);
            applyOptionsPageLocalizations_Custom();
            if (typeof renderPrompts === 'function') renderPrompts();
            if (typeof renderDeletedPrompts === 'function') renderDeletedPrompts();
            // 不再刷新页面，保持当前tab和滚动等状态
        });
    });
}

// 页面加载时初始化
initI18nAndRender();