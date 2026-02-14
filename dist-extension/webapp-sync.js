chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "ACTIVITY_STORED") {
    window.dispatchEvent(new CustomEvent("claude-utils-activity", {
      detail: { activity: message.activity }
    }));
    sendResponse({ success: true });
  }
  return true;
});
console.log("[Claude Utils] Web app sync listener ready");
//# sourceMappingURL=webapp-sync.js.map
