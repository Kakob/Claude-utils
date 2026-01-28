const conversationTitles = /* @__PURE__ */ new Map();
const pendingActivities = [];
const readyTabs = /* @__PURE__ */ new Set();
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
async function syncActivityToWebApp(activity) {
  console.log("[Claude Utils] Syncing activity to web app:", activity);
  try {
    const tabs = await chrome.tabs.query({
      url: ["http://localhost:*/*", "http://127.0.0.1:*/*"]
    });
    if (tabs.length === 0) {
      console.log("[Claude Utils] No web app tabs found, queuing activity");
      pendingActivities.push(activity);
      return;
    }
    let delivered = false;
    for (const tab of tabs) {
      if (tab.id && readyTabs.has(tab.id)) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: "SYNC_ACTIVITY",
            activity: {
              ...activity,
              timestamp: activity.timestamp.toISOString()
            }
          });
          console.log("[Claude Utils] Activity sent to tab:", tab.id);
          delivered = true;
        } catch (error) {
          console.log("[Claude Utils] Could not send to tab:", tab.id, error);
          readyTabs.delete(tab.id);
        }
      }
    }
    if (!delivered) {
      console.log("[Claude Utils] No ready tabs, queuing activity");
      pendingActivities.push(activity);
    }
  } catch (error) {
    console.error("[Claude Utils] Error syncing activity:", error);
    pendingActivities.push(activity);
  }
}
async function flushPendingActivities(tabId) {
  if (pendingActivities.length === 0) return;
  console.log("[Claude Utils] Flushing", pendingActivities.length, "pending activities to tab:", tabId);
  const toFlush = [...pendingActivities];
  pendingActivities.length = 0;
  for (const activity of toFlush) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "SYNC_ACTIVITY",
        activity: {
          ...activity,
          timestamp: activity.timestamp.toISOString()
        }
      });
      console.log("[Claude Utils] Flushed activity:", activity.id);
    } catch (error) {
      console.log("[Claude Utils] Failed to flush activity:", activity.id, error);
      pendingActivities.push(activity);
    }
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
  syncActivityToWebApp(activity);
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
  syncActivityToWebApp(activity);
}
let currentConversationId = null;
function getCurrentConversationId() {
  return currentConversationId;
}
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log("[Claude Utils] Background received message:", message.type);
  if (message.type === "WEBAPP_READY") {
    if (sender.tab?.id) {
      console.log("[Claude Utils] Web app tab ready:", sender.tab.id);
      readyTabs.add(sender.tab.id);
      flushPendingActivities(sender.tab.id);
    }
    return;
  }
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
chrome.tabs.onRemoved.addListener((tabId) => {
  readyTabs.delete(tabId);
});
console.log("[Claude Utils] Background service worker initialized");
//# sourceMappingURL=background.js.map
