document.addEventListener('DOMContentLoaded', function() {
  const promptList = document.getElementById('promptList');
  const managePromptsButton = document.getElementById('managePrompts');

  // Load prompts from storage and display them
  chrome.storage.local.get({ prompts: [] }, function(data) {
    data.prompts.forEach(function(prompt) {
      const listItem = document.createElement('li');
      listItem.textContent = prompt.title || prompt.content.substring(0, 30) + (prompt.content.length > 30 ? '...' : '');
      listItem.addEventListener('click', function() {
        // Action when a prompt is clicked (e.g., copy to clipboard or insert into active tab)
        // For now, just log it
        console.log('Prompt clicked:', prompt);
        // Example: Copy content to clipboard
        // navigator.clipboard.writeText(prompt.content).then(() => {
        //   console.log('Prompt content copied to clipboard');
        // }).catch(err => {
        //   console.error('Failed to copy prompt: ', err);
        // });
      });
      promptList.appendChild(listItem);
    });
  });

  if (managePromptsButton) {
    managePromptsButton.addEventListener('click', function() {
      chrome.runtime.openOptionsPage();
    });
  }
});
