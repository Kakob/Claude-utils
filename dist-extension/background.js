const API_URL = "http://localhost:3003/api";
const conversationTitles = /* @__PURE__ */ new Map();
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
async function syncActivity(activity) {
  console.log("[Claude Utils] Sending activity to API:", activity.type, activity.id);
  try {
    const response = await fetch(`${API_URL}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...activity,
        timestamp: activity.timestamp.toISOString()
      })
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    console.log("[Claude Utils] Activity stored:", activity.type, activity.id);
    notifyWebAppTabs(activity);
  } catch (error) {
    console.error("[Claude Utils] Error sending activity to API:", error);
  }
}
async function notifyWebAppTabs(activity) {
  try {
    const tabs = await chrome.tabs.query({
      url: ["http://localhost:*/*", "http://127.0.0.1:*/*"]
    });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: "ACTIVITY_STORED",
          activity: { ...activity, timestamp: activity.timestamp.toISOString() }
        }).catch(() => {
        });
      }
    }
  } catch {
  }
}
function processResponse(data) {
  const conversationTitle = data.conversationId ? conversationTitles.get(data.conversationId) ?? null : null;
  if (!data.url.includes("/completion")) {
    return;
  }
  const activity = {
    id: generateId(),
    type: "message_received",
    source: "extension",
    conversationId: data.conversationId ?? null,
    conversationTitle,
    model: data.model ?? null,
    timestamp: new Date(data.timestamp),
    tokens: data.tokens ?? null,
    metadata: {
      messageRole: "assistant",
      messagePreview: data.messagePreview,
      fullContent: data.fullContent,
      userMessage: data.userMessage
    }
  };
  syncActivity(activity);
}
function processDOMActivity(data) {
  const conversationId = getCurrentConversationId();
  const conversationTitle = conversationId ? conversationTitles.get(conversationId) ?? null : null;
  let activityType;
  const metadata = {};
  switch (data.type) {
    case "artifact":
      activityType = "artifact_created";
      metadata.artifactTitle = data.title;
      metadata.artifactType = data.artifactType;
      break;
    case "code_block":
      activityType = "code_block";
      metadata.codeLanguage = data.language;
      metadata.codeContent = data.codeContent;
      break;
    case "tool_use":
      activityType = "tool_use";
      metadata.toolName = data.toolName;
      break;
    case "tool_result":
      activityType = "tool_result";
      metadata.toolName = data.toolName;
      break;
    default:
      return;
  }
  const activity = {
    id: generateId(),
    type: activityType,
    source: "extension",
    conversationId,
    conversationTitle,
    model: null,
    timestamp: new Date(data.timestamp),
    tokens: null,
    metadata
  };
  syncActivity(activity);
}
let currentConversationId = null;
function getCurrentConversationId() {
  return currentConversationId;
}
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("[Claude Utils] Background received message:", message.type);
  if (sender.tab?.url) {
    const match = sender.tab.url.match(/\/chat\/([^/?]+)/);
    if (match) {
      currentConversationId = match[1];
    }
  }
  switch (message.type) {
    case "CLAUDE_RESPONSE":
      processResponse(message.data);
      break;
    case "DOM_ACTIVITY":
      processDOMActivity(message.data);
      break;
    case "CONVERSATION_TITLE":
      conversationTitles.set(message.data.conversationId, message.data.title);
      break;
  }
});
console.log("[Claude Utils] Background service worker initialized");
//# sourceMappingURL=background.js.map
