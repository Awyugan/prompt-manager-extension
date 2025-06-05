// Background service worker for the Prompt Manager extension.

const CONTEXT_MENU_ID = "saveSelectedTextToPromptManager";

// Function to get a snippet of text for title
function getTitleFromSelection(text) {
  if (!text) return "Selected Text";
  return text.trim().split(/\s+/).slice(0, 5).join(" ") + (text.length > 30 ? "..." : "");
}

// Function to save a prompt
async function savePrompt(title, content, tags, sourceUrl, calledAI) {
  if (!title || title.trim() === '') {
    title = getTitleFromSelection(content);
  }
  const newPrompt = {
    id: Date.now().toString(),
    title: title.trim(),
    content: content.trim(),
    tags: Array.isArray(tags) ? tags.map(tag => String(tag).trim()).filter(tag => tag !== '') : [],
    sourceUrl: sourceUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // calledAI: calledAI // Optional: if you want to store this info
  };

  chrome.storage.local.get({ prompts: [] }, (data) => {
    if (chrome.runtime.lastError) {
      console.error('Error retrieving prompts for saving:', chrome.runtime.lastError.message);
      // Optionally notify user of save failure
      return;
    }
    const prompts = data.prompts;
    prompts.push(newPrompt);
    chrome.storage.local.set({ prompts: prompts }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving prompt:', chrome.runtime.lastError.message);
        // Optionally notify user of save failure
      } else {
        console.log('Prompt saved successfully:', newPrompt);
        // Show notification
        chrome.notifications.create(null, {
          type: 'basic',
          iconUrl: 'icons/icon128.png', // Ensure this icon exists
          title: chrome.i18n.getMessage('notificationTitle'),
          message: chrome.i18n.getMessage('notificationMessage', [newPrompt.title]), // Pass title as a substitution
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

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt Manager extension installed.');

  // Create context menu item
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Save selection to Prompt Manager",
    contexts: ["selection"]
  });

  // You can set up initial storage values here if needed
  // chrome.storage.local.get({ prompts: [] }, (data) => {
  //   if (!data.prompts) {
  //     chrome.storage.local.set({ prompts: [] });
  //   }
  // });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText) {
    const selectedText = info.selectionText.trim();
    const sourceUrl = info.pageUrl; // Get the URL of the page where text was selected

    if (!selectedText) {
      console.log("Empty selection, not saving.");
      return;
    }

    chrome.storage.local.get(['autoAITaggingEnabled', 'deepseekApiKey'], async (settings) => {
      let title = getTitleFromSelection(selectedText);
      let tags = [];
      let calledAI = false;

      if (settings.autoAITaggingEnabled) {
        calledAI = true;
        if (!settings.deepseekApiKey) {
          console.warn('AI Tagging is enabled, but DeepSeek API Key is not set. Please configure it in settings. Falling back to default title/tags.');
        }
        try {
          const attributes = await getAIAttributes(selectedText); // getAIAttributes handles its own API key check & fallback
          title = attributes.title; 
          tags = attributes.tags;
          console.log("AI attributes successfully received in onClicked:", {title, tags});
        } catch (error) {
          console.error("Error in AI processing during context menu save, falling back to default title/tags:", error);
          // title is already set to default by getTitleFromSelection(selectedText) via getAIAttributes fallback or initial declaration
          // tags is already set to [] by initial declaration or getAIAttributes fallback
        }
      } else {
        console.log("Automatic AI tagging is disabled. Using default title and no tags.");
      }
      savePrompt(title, selectedText, tags, sourceUrl, calledAI);
    });
  }
});

// Placeholder for AI tagging function - to be implemented in the next step
async function getAIAttributes(text) {
  const settings = await new Promise(resolve => {
    chrome.storage.local.get(['deepseekApiKey', 'preferredLanguage'], result => { // Removed 'autoTaggingEnabled' as it's not used here directly
      if (chrome.runtime.lastError) {
        console.error('Error retrieving settings:', chrome.runtime.lastError.message);
        resolve({ deepseekApiKey: null, preferredLanguage: 'zh' });
      } else {
        resolve(result);
      }
    });
  });

  const apiKey = settings.deepseekApiKey;
  const preferredLanguage = settings.preferredLanguage || 'zh'; // Default to Chinese if not set
  const langName = preferredLanguage === 'zh' ? 'Chinese' : 'English'; // For the prompt

  if (!apiKey) {
    console.warn(chrome.i18n.getMessage('apiKeyMissingError'));
    return { title: getTitleFromSelection(text), tags: [] }; // Fallback to basic title generation
  }

  const deepSeekAPIUrl = 'https://api.deepseek.com/chat/completions';
  const messages = [
    {
      role: 'system',
      content: `You are an AI assistant that analyzes text. Your task is to return a concise title and 3-5 relevant tags for the given text. The title should be around 5-10 words, and each tag should be 1-3 words. IMPORTANT: Generate the title and tags in ${langName}. Provide your response as a single JSON object with two keys: 'title' (a string) and 'tags' (an array of strings). Example for ${langName}: {"title": "${langName === 'Chinese' ? '示例标题' : 'Example Title'}", "tags": ["${langName === 'Chinese' ? '标签1' : 'tag1'}", "${langName === 'Chinese' ? '标签2' : 'tag2'}"]}`
    },
    {
      role: 'user',
      content: `Please analyze the following text and provide a title and tags in ${langName} using the specified JSON format:\n\n${text}`
    }
  ];

  try {
    const response = await fetch(deepSeekAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // Or your preferred model
        messages: messages,
        temperature: 0.5, // Adjust for creativity vs. determinism
        max_tokens: 1500, // Max tokens for the AI response
        response_format: { type: "json_object" } // Request JSON output if supported by model/API version
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`DeepSeek API error: ${response.status} - ${response.statusText}`, errorBody);
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    // The actual content is in data.choices[0].message.content
    // This content should be a JSON string, so we need to parse it again.
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      try {
        const aiResponse = JSON.parse(data.choices[0].message.content);
        console.log("AI attributes received from DeepSeek:", aiResponse);
        // Validate the structure
        const title = (typeof aiResponse.title === 'string' && aiResponse.title.trim() !== '') ? aiResponse.title.trim() : getTitleFromSelection(text);
        const tags = Array.isArray(aiResponse.tags) ? aiResponse.tags.map(tag => String(tag).trim()).filter(tag => tag !== '') : [];
        return { title: title, tags: tags };
      } catch (parseError) {
        console.error('Error parsing AI response JSON:', parseError, "Raw AI response content:", data.choices[0].message.content);
        return { title: getTitleFromSelection(text), tags: [] }; // Fallback
      }
    } else {
      console.error('Unexpected response structure from DeepSeek API:', data);
      return { title: getTitleFromSelection(text), tags: [] }; // Fallback
    }

  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return { title: getTitleFromSelection(text), tags: [] }; // Fallback on any other error
  }
}

// Listen for messages from content scripts or other extension parts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_PROMPTS_FOR_SLASH_COMMAND') {
    chrome.storage.local.get({ prompts: [] }, (data) => {
      if (chrome.runtime.lastError) {
        console.error('Error retrieving prompts for slash command:', chrome.runtime.lastError.message);
        sendResponse({ error: chrome.runtime.lastError.message, prompts: [] });
      } else {
        sendResponse({ prompts: data.prompts });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  } else if (request.type === 'SAVE_API_KEY') { // From settings.js
    chrome.storage.local.set({ deepseekApiKey: request.apiKey }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving API key:', chrome.runtime.lastError.message);
        sendResponse({ success: false, message: chrome.runtime.lastError.message });
      } else {
        console.log('API Key saved successfully via message.');
        sendResponse({ success: true });
      }
    });
    return true; // Indicates that the response is sent asynchronously
  }
  // Add other message handlers here if needed
});

