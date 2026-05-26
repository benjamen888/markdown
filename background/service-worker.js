// 设置 Side Panel 行为
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// 拦截 .md 文件 URL（可选功能）
chrome.runtime.onInstalled.addListener(() => {
  console.log('Markdown 浏览器已安装');
});
