// background.js

const CONTEXT_MENU_ID = "saveSelectedTextToPromptManager";

// Helper function to get a snippet of text for title
function getTitleFromSelection(text) {
  if (!text) return chrome.i18n.getMessage('defaultSelectedTextTitle') || "Selected Text";
  return text.trim().split(/\s+/).slice(0, 5).join(" ") + (text.length > 30 ? "..." : "");
}

// Function to get AI-generated title and tags
async function getAIAttributes(text) {
  const { preferredLanguage } = await new Promise((resolve) => {
    chrome.storage.sync.get({ preferredLanguage: 'en' }, (items) => {
      resolve(items);
    });
  });
  const langActual = preferredLanguage || 'en';
  const langName = (langActual === 'zh' || langActual === 'zh_CN') ? 'Chinese' : 'English';

  const { deepseekApiKey: apiKey } = await new Promise(resolve =>
    chrome.storage.local.get('deepseekApiKey', result => resolve(result))
  );

  if (!apiKey) {
    const apiKeyMissingMsg = chrome.i18n.getMessage('apiKeyMissingError') || 'DeepSeek API Key not found. Please set it in options. Returning default title and no tags.';
    console.warn(apiKeyMissingMsg);
    return { title: getTitleFromSelection(text), tags: [] };
  }

  // Get custom system prompt or use default
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
    systemMessageContent = defaultSystemPromptTemplate; // Default already has langName interpolated if it was defined above
  }
  // For debugging: console.log("Background - Using system prompt:", systemMessageContent);

  const API_URL = 'https://api.deepseek.com/chat/completions';
  const messages = [
    {
      role: "system",
      content: systemMessageContent
    },
    {
      role: "user",
      content: `Generate a title and tags for the following content: \"\"\"${text}\"\"\"`
    }
  ];

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.5,
        max_tokens: 200, // Adjusted for title/tags
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`DeepSeek API error in background: ${response.status} - ${response.statusText}`, errorBody);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      try {
        const aiResponse = JSON.parse(data.choices[0].message.content);
        const title = (typeof aiResponse.title === 'string' && aiResponse.title.trim() !== '') ? aiResponse.title.trim() : getTitleFromSelection(text);
        let tagsArray = [];
        if (Array.isArray(aiResponse.tags)) {
            tagsArray = aiResponse.tags.map(tag => String(tag).trim()).filter(tag => tag);
        } else if (typeof aiResponse.tags === 'string') {
            const trimmedTagsString = aiResponse.tags.trim();
            if (trimmedTagsString.includes(',')) { // If it has commas, split by comma
                tagsArray = trimmedTagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
            } else if (trimmedTagsString.includes(' ')) { // Else, if it has spaces, split by space
                tagsArray = trimmedTagsString.split(/\s+/).map(tag => tag.trim()).filter(tag => tag); // Split by one or more spaces
            } else if (trimmedTagsString) { // Else, if it's a non-empty string without commas or spaces, treat as a single tag
                tagsArray = [trimmedTagsString];
            }
        }
        return { title: title, tags: tagsArray };
      } catch (parseError) {
        console.error('Error parsing AI response JSON in background:', parseError, "Raw AI response content:", data.choices[0].message.content);
        return { title: getTitleFromSelection(text), tags: [] };
      }
    } else {
      console.error('Unexpected response structure from DeepSeek API in background:', data);
      return { title: getTitleFromSelection(text), tags: [] };
    }
  } catch (error) {
    console.error('Error calling DeepSeek API in background:', error);
    return { title: getTitleFromSelection(text), tags: [] };
  }
}

// Function to save a prompt
async function savePrompt(title, content, tags, sourceUrl) {
  if (!title || title.trim() === '') {
    title = getTitleFromSelection(content);
  }
  const newPrompt = {
    id: Date.now().toString(),
    title: title.trim(),
    content: content.trim(),
    tags: Array.isArray(tags) ? tags.map(tag => String(tag).trim()).filter(tag => tag !== '') : [],
    sourceUrl: sourceUrl || '', // Ensure sourceUrl is saved
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  chrome.storage.local.get({ prompts: [] }, (data) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving prompts for saving:', chrome.runtime.lastError.message);
      return;
    }
    const prompts = data.prompts || [];
    prompts.push(newPrompt);
    chrome.storage.local.set({ prompts: prompts }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving prompt:', chrome.runtime.lastError.message);
      } else {
        console.log('Prompt saved successfully:', newPrompt);
        const notificationTitle = chrome.i18n.getMessage('notificationTitle') || 'Prompt Saved';
        const notificationMessage = chrome.i18n.getMessage('notificationMessage', [newPrompt.title]) || `Prompt "${newPrompt.title}" saved.`;
        chrome.notifications.create(null, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: notificationTitle,
          message: notificationMessage,
          priority: 0
        }, (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error('Error showing notification:', chrome.runtime.lastError.message);
          }
        });
      }
    });
  });
}

// Listener for extension installation/update to create context menu
chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt Manager extension installed/updated. Setting up context menu.');
  const contextMenuTitle = chrome.i18n.getMessage('contextMenuLabel') || "Save selection to Prompt Manager";
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: contextMenuTitle,
    contexts: ["selection"]
  });
});

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText) {
    const selectedText = info.selectionText.trim();
    const sourceUrl = info.pageUrl; // Get the URL of the page where text was selected

    if (!selectedText) {
      console.log("Empty selection, not saving.");
      return;
    }

    const settings = await new Promise(resolve => {
        chrome.storage.local.get(['autoTaggingEnabled', 'deepseekApiKey'], result => resolve(result)); // Changed key here
    });

    let title = getTitleFromSelection(selectedText);
    let tags = [];

    if (settings.autoTaggingEnabled) { // Changed key here
      try {
        const attributes = await getAIAttributes(selectedText);
        title = attributes.title;
        tags = attributes.tags;
        console.log("AI attributes successfully received in context menu onClicked:", {title, tags});
      } catch (error) {
        console.error("Error in AI processing during context menu save, falling back to default title/tags:", error);
      }
    } else {
      console.log("Automatic AI tagging is disabled for context menu. Using default title and no tags.");
    }
    // 保证 effectUrl 字段用于来源，且内容保留原始换行
    savePrompt(title, selectedText, tags, sourceUrl, '', '', { effectUrl: sourceUrl });
  }
});

// Listen for the extension's icon to be clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// Listen for messages from other parts of the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PROMPTS_FOR_SLASH_COMMAND') {
    chrome.storage.local.get({ prompts: [] }, (data) => {
      if (chrome.runtime.lastError) {
        console.error('Error retrieving prompts for slash command:', chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message, prompts: [] });
      } else {
        sendResponse({ prompts: data.prompts || [] });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }
  // Removed SAVE_API_KEY listener as options.js handles this directly now.
});

console.log('Background script fully loaded: Icon click opens options, context menu active, message listeners ready.');
