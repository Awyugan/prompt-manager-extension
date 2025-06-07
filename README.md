# Prompt Manager Extension

**Manage and inject your prompts directly into any webpage.**

## Overview

The Prompt Manager Extension is a powerful Chrome extension designed to streamline your workflow by allowing you to store, categorize, and quickly inject your frequently used prompts into any text input field on any webpage. Whether you're working with AI models, chatbots, or just need quick access to predefined text snippets, this extension makes it effortless.

## Features

*   **Prompt Management:** Store and organize an unlimited number of prompts.
*   **Quick Injection:** Easily inject prompts into text areas or input fields with a single click or keyboard shortcut.
*   **Context Menu Integration:** Access your prompts directly from the browser's right-click context menu.
*   **Persistent Storage:** All your prompts and settings are saved locally in your browser.
*   **Multi-language Support:** (If applicable, based on `_locales` directory)

## Installation

### From Source (Developer Mode)

1.  **Download:** Clone or download this repository to your local machine.
    ```bash
    git clone https://github.com/awyugan/prompt-manager-extension.git
    cd prompt-manager-extension
    ```
2.  **Build:** Run the build script to package the extension.
    ```bash
    chmod +x build_chrome_web_store.sh
    ./build_chrome_web_store.sh
    ```
    This will create a `.zip` file in the `dist/` directory.
3.  **Open Chrome Extensions Page:**
    *   Open your Chrome browser.
    *   Navigate to `chrome://extensions` or click the three-dot menu (⋮) > `More tools` > `Extensions`.
4.  **Enable Developer Mode:** Toggle on the "Developer mode" switch in the top right corner.
5.  **Load Unpacked/Load Zipped:**
    *   If you want to load from the source directory, click "Load unpacked" and select the `prompt-manager-extension` directory.
    *   Alternatively, if you built the `.zip` file, click "Load zipped" or "Load unpacked" and drag the `.zip` file (or the unzipped `dist` folder) into the extensions page.
6.  **Enjoy:** The Prompt Manager Extension icon should now appear in your browser toolbar.

### From Chrome Web Store

The Prompt Manager Extension will soon be available on the Chrome Web Store. Once published, you can install it directly from there by following these steps:

1.  Visit the [Chrome Web Store](https://chrome.google.com/webstore/)
2.  Search for "Prompt Manager"
3.  Click "Add to Chrome"

### Via CRX File

To install via a CRX file, you can download the latest `.crx` file from the [GitHub Releases page](https://github.com/awyugan/prompt-manager-extension/releases), and then follow these steps:

1.  Open your Chrome browser and navigate to `chrome://extensions/`
2.  Enable "Developer mode" in the top right corner.
3.  Drag and drop the downloaded `.crx` file onto the `chrome://extensions/` page.
4.  Click "Add extension" in the confirmation dialog.

## Usage

1.  **Open the Extension Popup:** Click the Prompt Manager Extension icon in your Chrome toolbar.
2.  **Manage Prompts:** Use the extension's options page (right-click the icon > "Options") to add, edit, or delete your custom prompts.
3.  **Inject Prompts:**
    *   Navigate to any webpage with a text input field.
    *   Click on the extension icon and select the prompt you want to inject.
    *   Alternatively, right-click inside a text area, hover over "Prompt Manager", and select your desired prompt.

## Permissions Explained

The Prompt Manager Extension requests the following permissions to provide its full functionality:

*   **`storage`**: Used to save your custom prompts and extension settings locally in your browser.
*   **`activeTab`**: Allows the extension to temporarily access the current active tab when invoked, typically by clicking the extension icon.
*   **`scripting`**: Enables the extension to inject content scripts into web pages to manage and insert prompts into text fields.
*   **`contextMenus`**: Used to add "Prompt Manager" options to your browser's right-click context menu for quick access.
*   **`notifications`**: To send you occasional notifications, e.g., for updates or important information.
*   **Host Permissions (`<all_urls>`)**: Required to inject content scripts across all web pages, which is essential for the extension to interact with text fields on any website.

For a detailed explanation of how we handle your data, please refer to our [Privacy Policy](/privacy%20policy.md).

## Contributing

Contributions are welcome! If you have suggestions for improvements, bug reports, or would like to contribute code, please feel free to open an issue or submit a pull request on the GitHub repository.

## Contact

For any questions or support, please open an issue on the GitHub repository or contact us at:

[awyugan@gmail.com](awyugan@gmail.com)