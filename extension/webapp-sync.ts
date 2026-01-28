// Content script that runs on the localhost web app
// Receives activities from the background and writes to the page's IndexedDB

interface StoredActivity {
  id: string;
  type: string;
  source: 'claude.ai' | 'extension';
  conversationId: string | null;
  conversationTitle: string | null;
  model: string | null;
  timestamp: Date;
  tokens: { inputTokens: number; outputTokens: number; cacheCreationTokens?: number; cacheReadTokens?: number } | null;
  metadata: Record<string, unknown>;
}

interface DailyStats {
  date: string;
  inputTokens: number;
  outputTokens: number;
  messageCount: number;
  artifactCount: number;
  toolUseCount: number;
  modelUsage: Record<string, number>;
}

let db: IDBDatabase | null = null;
let dbReady = false;

async function initDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    // Try to open existing database (created by Dexie in the web app)
    const request = indexedDB.open('ClaudeUtils');

    request.onerror = () => {
      console.warn('[Claude Utils] Could not open DB:', request.error);
      resolve(null);
    };

    request.onsuccess = () => {
      const database = request.result;
      const stores = Array.from(database.objectStoreNames);
      console.log('[Claude Utils] DB opened, stores:', stores);

      // Check if the activities store exists (created by Dexie v2)
      if (!stores.includes('activities')) {
        console.warn('[Claude Utils] activities store not found. Make sure to open the web app first to initialize the database.');
        database.close();
        resolve(null);
        return;
      }

      resolve(database);
    };
  });
}

function getDateString(timestamp: number): string {
  return new Date(timestamp).toISOString().split('T')[0];
}

async function storeActivity(activity: StoredActivity): Promise<void> {
  if (!db) {
    db = await initDB();
    if (!db) {
      console.warn('[Claude Utils] DB not available, cannot store activity');
      return;
    }
    dbReady = true;
  }

  try {
    const transaction = db.transaction(['activities', 'dailyStats'], 'readwrite');

    transaction.onerror = () => {
      console.error('[Claude Utils] Transaction error:', transaction.error);
    };

    // Store the activity
    const activitiesStore = transaction.objectStore('activities');
    const addRequest = activitiesStore.add(activity);

    addRequest.onerror = () => {
      console.error('[Claude Utils] Error adding activity:', addRequest.error);
    };

    addRequest.onsuccess = () => {
      console.log('[Claude Utils] Activity stored:', activity.type, activity.id);
      // Dispatch custom event to notify the web app
      window.dispatchEvent(new CustomEvent('claude-utils-activity', {
        detail: { activity },
      }));
    };

    // Update daily stats
    const dateStr = getDateString(activity.timestamp.getTime());
    const dailyStatsStore = transaction.objectStore('dailyStats');

    const statsRequest = dailyStatsStore.get(dateStr);
    statsRequest.onsuccess = () => {
      const existing: DailyStats = statsRequest.result ?? {
        date: dateStr,
        inputTokens: 0,
        outputTokens: 0,
        messageCount: 0,
        artifactCount: 0,
        toolUseCount: 0,
        modelUsage: {},
      };

      if (activity.tokens) {
        existing.inputTokens += activity.tokens.inputTokens;
        existing.outputTokens += activity.tokens.outputTokens;
      }

      if (activity.type === 'message_sent' || activity.type === 'message_received') {
        existing.messageCount += 1;
      }

      if (activity.type === 'artifact_created') {
        existing.artifactCount += 1;
      }

      if (activity.type === 'tool_use') {
        existing.toolUseCount += 1;
      }

      if (activity.model) {
        existing.modelUsage[activity.model] = (existing.modelUsage[activity.model] ?? 0) + 1;
      }

      dailyStatsStore.put(existing);
    };
  } catch (error) {
    console.error('[Claude Utils] Error storing activity:', error);
    // Reset db so it tries to reconnect next time
    db = null;
    dbReady = false;
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SYNC_ACTIVITY') {
    console.log('[Claude Utils] Received activity to sync:', message.activity);
    // Convert timestamp back to Date
    const activity = {
      ...message.activity,
      timestamp: new Date(message.activity.timestamp),
    };
    storeActivity(activity);
    sendResponse({ success: true });
  }
  return true;
});

// Signal to background that this tab is ready to receive activities
function signalReady(): void {
  try {
    chrome.runtime.sendMessage({ type: 'WEBAPP_READY' });
    console.log('[Claude Utils] Sent WEBAPP_READY signal to background');
  } catch (error) {
    console.log('[Claude Utils] Could not send ready signal:', error);
  }
}

// Initialize DB on load
initDB().then((database) => {
  if (database) {
    db = database;
    dbReady = true;
    console.log('[Claude Utils] Web app sync ready');
    signalReady();
  } else {
    console.log('[Claude Utils] Web app sync waiting for database (open the Timeline page first)');
    // Still signal ready - activities can be stored once DB is available
    signalReady();
  }
});
