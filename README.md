# Prompt Manager Chrome Extension

This is a Chrome extension for managing prompts.

## How to Load the Extension

1.  Open Google Chrome.
2.  Navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle switch in the top right corner.
4.  Click on the "Load unpacked" button.
5.  Select the `prompt-manager-extension` directory (the one containing `manifest.json`).

The extension icon should now appear in your Chrome toolbar.

## Development Notes

*   **Icons**: You'll need to add your own icons (e.g., `icon16.png`, `icon48.png`, `icon128.png`) to the `icons` folder. Placeholder paths are currently in `manifest.json`.
*   **Functionality**: This is a basic skeleton. You'll need to expand on the JavaScript files (`popup.js`, `options.js`, `background.js`) to implement full CRUD (Create, Read, Update, Delete) functionality for prompts, integrate with any external APIs (like DeepSeek), and add features like tagging, categorization, search, etc.
*   **Permissions**: The `manifest.json` currently requests `storage` (for local data), `activeTab`, and `scripting` (if you need to interact with web pages). Adjust as needed.
