// 直接跳转到选项页面
chrome.runtime.openOptionsPage().then(() => {
  // 确保选项页面完全加载后再关闭弹出窗口
  window.close();
}).catch(err => {
  console.error('打开选项页面失败:', err);
  window.close();
});
