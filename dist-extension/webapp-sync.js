let db = null;
async function initDB() {
  return new Promise((resolve) => {
    const request = indexedDB.open("ClaudeUtils");
    request.onerror = () => {
      console.warn("[Claude Utils] Could not open DB:", request.error);
      resolve(null);
    };
    request.onsuccess = () => {
      const database = request.result;
      const stores = Array.from(database.objectStoreNames);
      console.log("[Claude Utils] DB opened, stores:", stores);
      if (!stores.includes("activities")) {
        console.warn("[Claude Utils] activities store not found. Make sure to open the web app first to initialize the database.");
        database.close();
        resolve(null);
        return;
      }
      resolve(database);
    };
  });
}
function getDateString(timestamp) {
  return new Date(timestamp).toISOString().split("T")[0];
}
async function storeActivity(activity) {
  if (!db) {
    db = await initDB();
    if (!db) {
      console.warn("[Claude Utils] DB not available, cannot store activity");
      return;
    }
  }
  try {
    const transaction = db.transaction(["activities", "dailyStats"], "readwrite");
    transaction.onerror = () => {
      console.error("[Claude Utils] Transaction error:", transaction.error);
    };
    const activitiesStore = transaction.objectStore("activities");
    const addRequest = activitiesStore.add(activity);
    addRequest.onerror = () => {
      console.error("[Claude Utils] Error adding activity:", addRequest.error);
    };
    addRequest.onsuccess = () => {
      console.log("[Claude Utils] Activity stored:", activity.type, activity.id);
      window.dispatchEvent(new CustomEvent("claude-utils-activity", {
        detail: { activity }
      }));
    };
    const dateStr = getDateString(activity.timestamp.getTime());
    const dailyStatsStore = transaction.objectStore("dailyStats");
    const statsRequest = dailyStatsStore.get(dateStr);
    statsRequest.onsuccess = () => {
      const existing = statsRequest.result ?? {
        date: dateStr,
        inputTokens: 0,
        outputTokens: 0,
        messageCount: 0,
        artifactCount: 0,
        toolUseCount: 0,
        modelUsage: {}
      };
      if (activity.tokens) {
        existing.inputTokens += activity.tokens.inputTokens;
        existing.outputTokens += activity.tokens.outputTokens;
      }
      if (activity.type === "message_sent" || activity.type === "message_received") {
        existing.messageCount += 1;
      }
      if (activity.type === "artifact_created") {
        existing.artifactCount += 1;
      }
      if (activity.type === "tool_use") {
        existing.toolUseCount += 1;
      }
      if (activity.model) {
        existing.modelUsage[activity.model] = (existing.modelUsage[activity.model] ?? 0) + 1;
      }
      dailyStatsStore.put(existing);
    };
  } catch (error) {
    console.error("[Claude Utils] Error storing activity:", error);
    db = null;
  }
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SYNC_ACTIVITY") {
    console.log("[Claude Utils] Received activity to sync:", message.activity);
    const activity = {
      ...message.activity,
      timestamp: new Date(message.activity.timestamp)
    };
    storeActivity(activity);
    sendResponse({ success: true });
  }
  return true;
});
function signalReady() {
  try {
    chrome.runtime.sendMessage({ type: "WEBAPP_READY" });
    console.log("[Claude Utils] Sent WEBAPP_READY signal to background");
  } catch (error) {
    console.log("[Claude Utils] Could not send ready signal:", error);
  }
}
initDB().then((database) => {
  if (database) {
    db = database;
    console.log("[Claude Utils] Web app sync ready");
    signalReady();
  } else {
    console.log("[Claude Utils] Web app sync waiting for database (open the Timeline page first)");
    signalReady();
  }
});
//# sourceMappingURL=webapp-sync.js.map
