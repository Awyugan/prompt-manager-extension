document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKey');
  const saveApiKeyButton = document.getElementById('saveApiKeyButton');
  const statusMessage = document.getElementById('statusMessage');
  const autoAITaggingCheckbox = document.getElementById('autoAITagging');

  // 动态国际化渲染函数
  function renderI18n() {
    document.getElementById('backToOptions').textContent = chrome.i18n.getMessage('backToOptions') || '← 返回提示词管理';
    document.getElementById('settingsPageTitle').textContent = chrome.i18n.getMessage('settingsPageTitle') || '扩展设置';
    document.getElementById('apiKeySectionTitle').textContent = chrome.i18n.getMessage('apiKeySectionTitle') || 'API Key 配置';
    document.getElementById('apiKeySectionDesc').textContent = chrome.i18n.getMessage('apiKeySectionDesc') || '请输入您的 DeepSeek API Key。此密钥将安全地存储在本地。';
    document.getElementById('apiKeyLabel').textContent = chrome.i18n.getMessage('deepseekApiKeyLabel') || 'DeepSeek API Key:';
    document.getElementById('otherSettingsTitle').textContent = chrome.i18n.getMessage('otherSettingsTitle') || '其他设置';
    document.getElementById('autoAITaggingLabel').textContent = chrome.i18n.getMessage('autoTaggingLabel') || '启用右键保存时自动 AI 生成标题和标签';
    document.getElementById('saveApiKeyButton').textContent = chrome.i18n.getMessage('saveApiKeyButton') || '保存 API Key';
    document.getElementById('aiKeyNote').textContent = chrome.i18n.getMessage('aiKeyNote') || '注意：AI 生成功能需要有效的 DeepSeek API Key。';
  }

  renderI18n();

  // Load saved settings
  chrome.storage.local.get(['deepseekApiKey', 'autoAITaggingEnabled'], function(result) {
    if (result.deepseekApiKey) {
      apiKeyInput.value = result.deepseekApiKey;
      statusMessage.textContent = chrome.i18n.getMessage('apiKeyLoaded') || '已加载保存的 API Key。';
      setTimeout(() => { statusMessage.textContent = ''; }, 3000);
    }
    if (result.autoAITaggingEnabled !== undefined) {
      autoAITaggingCheckbox.checked = result.autoAITaggingEnabled;
    } else {
      // Default to true if not set, or false based on preference
      autoAITaggingCheckbox.checked = true; 
      chrome.storage.local.set({autoAITaggingEnabled: true}); // Save default
    }
  });

  // Save API Key
  saveApiKeyButton.addEventListener('click', function() {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({deepseekApiKey: apiKey}, function() {
        if (chrome.runtime.lastError) {
          statusMessage.textContent = (chrome.i18n.getMessage('apiKeySaveError') || '错误：无法保存 API Key。') + ' ' + chrome.runtime.lastError.message;
          statusMessage.style.color = 'red';
        } else {
          statusMessage.textContent = chrome.i18n.getMessage('apiKeySavedSuccess') || 'API Key 已成功保存！';
          statusMessage.style.color = 'green';
        }
        setTimeout(() => { statusMessage.textContent = ''; statusMessage.style.color = ''; }, 3000);
      });
    } else {
      statusMessage.textContent = chrome.i18n.getMessage('apiKeyInputRequired') || '请输入 API Key。';
      statusMessage.style.color = 'orange';
      setTimeout(() => { statusMessage.textContent = ''; statusMessage.style.color = ''; }, 3000);
    }
  });

  // Save Auto AI Tagging setting
  autoAITaggingCheckbox.addEventListener('change', function() {
    const enabled = autoAITaggingCheckbox.checked;
    chrome.storage.local.set({autoAITaggingEnabled: enabled}, function() {
      if (chrome.runtime.lastError) {
        statusMessage.textContent = (chrome.i18n.getMessage('aiTaggingSettingError') || '保存 AI 标记设置失败：') + ' ' + chrome.runtime.lastError.message;
        statusMessage.style.color = 'red';
      } else {
        statusMessage.textContent = enabled
          ? (chrome.i18n.getMessage('aiTaggingEnabled') || '自动 AI 标记已启用。')
          : (chrome.i18n.getMessage('aiTaggingDisabled') || '自动 AI 标记已关闭。');
        statusMessage.style.color = enabled ? 'green' : 'red';
      }
      setTimeout(() => { statusMessage.textContent = ''; statusMessage.style.color = ''; }, 3000);
    });
  });

  // Add storage listener to refresh language dynamically
  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'local') {
      renderI18n();
    }
  });
});
