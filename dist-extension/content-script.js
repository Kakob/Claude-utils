function injectScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  (document.head || document.documentElement).appendChild(script);
  script.onload = () => script.remove();
}
function setupResponseListener() {
  window.addEventListener("claude-utils-response", ((event) => {
    console.log("[Claude Utils] Content script received response:", event.detail);
    sendToBackground({ type: "CLAUDE_RESPONSE", data: event.detail });
  }));
}
function setupDOMObserver() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          detectActivities(node);
        }
      }
    }
  });
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
}
function detectActivities(element) {
  const artifacts = element.querySelectorAll("[data-artifact-id], .artifact-container");
  for (const artifact of artifacts) {
    const title = artifact.getAttribute("data-artifact-title") ?? artifact.querySelector('[class*="title"]')?.textContent ?? "Untitled";
    const type = artifact.getAttribute("data-artifact-type") ?? "unknown";
    sendDOMActivity({
      type: "artifact",
      title,
      artifactType: type,
      timestamp: Date.now()
    });
  }
  const codeBlocks = element.querySelectorAll("pre code, .code-block");
  for (const codeBlock of codeBlocks) {
    const classList = codeBlock.className;
    const langMatch = classList.match(/language-(\w+)/);
    const language = langMatch?.[1] ?? "unknown";
    const codeContent = codeBlock.textContent ?? "";
    sendDOMActivity({
      type: "code_block",
      language,
      codeContent,
      timestamp: Date.now()
    });
  }
  const toolElements = element.querySelectorAll("[data-tool-name], .tool-use, .tool-result");
  for (const toolEl of toolElements) {
    const toolName = toolEl.getAttribute("data-tool-name") ?? toolEl.querySelector('[class*="tool-name"]')?.textContent ?? "unknown";
    const isResult = toolEl.classList.contains("tool-result") || toolEl.getAttribute("data-tool-result") !== null;
    sendDOMActivity({
      type: isResult ? "tool_result" : "tool_use",
      toolName,
      timestamp: Date.now()
    });
  }
}
function sendDOMActivity(activity) {
  sendToBackground({ type: "DOM_ACTIVITY", data: activity });
}
function setupTitleObserver() {
  let lastTitle = "";
  const checkTitle = () => {
    const titleEl = document.querySelector("h1, [data-conversation-title]");
    const title = titleEl?.textContent?.trim() ?? "";
    if (title && title !== lastTitle) {
      lastTitle = title;
      const match = window.location.pathname.match(/\/chat\/([^/?]+)/);
      const conversationId = match?.[1];
      if (conversationId) {
        sendToBackground({
          type: "CONVERSATION_TITLE",
          data: { title, conversationId }
        });
      }
    }
  };
  setInterval(checkTitle, 2e3);
  window.addEventListener("popstate", checkTitle);
}
function sendToBackground(message) {
  chrome.runtime.sendMessage(message).catch(() => {
  });
}
injectScript();
setupResponseListener();
setupDOMObserver();
setupTitleObserver();
console.log("[Claude Utils] Content script loaded");
//# sourceMappingURL=content-script.js.map
