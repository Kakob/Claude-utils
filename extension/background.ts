// Background service worker for the extension
// Captures activities and syncs them to the web app's IndexedDB

import type { ExtensionMessage, CapturedResponse, DOMActivity } from './types';

// Conversation title cache
const conversationTitles = new Map<string, string>();

// Queue for activities that couldn't be delivered
const pendingActivities: Array<{
  id: string;
  type: string;
  source: 'extension';
  conversationId: string | null;
  conversationTitle: string | null;
  model: string | null;
  timestamp: Date;
  tokens: { inputTokens: number; outputTokens: number; cacheCreationTokens?: number; cacheReadTokens?: number } | null;
  metadata: Record<string, unknown>;
}> = [];

// Track ready web app tabs
const readyTabs = new Set<number>();

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

type ActivityPayload = {
  id: string;
  type: string;
  source: 'extension';
  conversationId: string | null;
  conversationTitle: string | null;
  model: string | null;
  timestamp: Date;
  tokens: { inputTokens: number; outputTokens: number; cacheCreationTokens?: number; cacheReadTokens?: number } | null;
  metadata: Record<string, unknown>;
};

// Find web app tabs and sync activity to them
async function syncActivityToWebApp(activity: ActivityPayload): Promise<void> {
  console.log('[Claude Utils] Syncing activity to web app:', activity);

  try {
    // Find all localhost tabs (where the web app runs)
    const tabs = await chrome.tabs.query({
      url: ['http://localhost:*/*', 'http://127.0.0.1:*/*'],
    });

    if (tabs.length === 0) {
      console.log('[Claude Utils] No web app tabs found, queuing activity');
      pendingActivities.push(activity);
      return;
    }

    let delivered = false;

    // Send to all matching tabs that are ready
    for (const tab of tabs) {
      if (tab.id && readyTabs.has(tab.id)) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'SYNC_ACTIVITY',
            activity: {
              ...activity,
              timestamp: activity.timestamp.toISOString(),
            },
          });
          console.log('[Claude Utils] Activity sent to tab:', tab.id);
          delivered = true;
        } catch (error) {
          // Tab might have been closed or refreshed
          console.log('[Claude Utils] Could not send to tab:', tab.id, error);
          readyTabs.delete(tab.id);
        }
      }
    }

    // If no ready tabs, queue the activity
    if (!delivered) {
      console.log('[Claude Utils] No ready tabs, queuing activity');
      pendingActivities.push(activity);
    }
  } catch (error) {
    console.error('[Claude Utils] Error syncing activity:', error);
    pendingActivities.push(activity);
  }
}

// Flush pending activities to a newly ready tab
async function flushPendingActivities(tabId: number): Promise<void> {
  if (pendingActivities.length === 0) return;

  console.log('[Claude Utils] Flushing', pendingActivities.length, 'pending activities to tab:', tabId);

  const toFlush = [...pendingActivities];
  pendingActivities.length = 0;

  for (const activity of toFlush) {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'SYNC_ACTIVITY',
        activity: {
          ...activity,
          timestamp: activity.timestamp.toISOString(),
        },
      });
      console.log('[Claude Utils] Flushed activity:', activity.id);
    } catch (error) {
      console.log('[Claude Utils] Failed to flush activity:', activity.id, error);
      // Put it back in queue
      pendingActivities.push(activity);
    }
  }
}

// Process captured API response
function processResponse(data: CapturedResponse): void {
  const conversationTitle = data.conversationId
    ? conversationTitles.get(data.conversationId) ?? null
    : null;

  // Only track completion requests (actual messages)
  if (!data.url.includes('/completion')) {
    return;
  }

  const activity = {
    id: generateId(),
    type: 'message_received',
    source: 'extension' as const,
    conversationId: data.conversationId ?? null,
    conversationTitle,
    model: data.model ?? null,
    timestamp: new Date(data.timestamp),
    tokens: data.tokens ?? null,
    metadata: {
      messageRole: 'assistant' as const,
      messagePreview: data.messagePreview,
      fullContent: data.fullContent,
      userMessage: data.userMessage,
    },
  };

  syncActivityToWebApp(activity);
}

// Process DOM activity
function processDOMActivity(data: DOMActivity): void {
  const conversationId = getCurrentConversationId();
  const conversationTitle = conversationId
    ? conversationTitles.get(conversationId) ?? null
    : null;

  let activityType: string;
  const metadata: Record<string, unknown> = {};

  switch (data.type) {
    case 'artifact':
      activityType = 'artifact_created';
      metadata.artifactTitle = data.title;
      metadata.artifactType = data.artifactType;
      break;
    case 'code_block':
      activityType = 'code_block';
      metadata.codeLanguage = data.language;
      metadata.codeContent = data.codeContent;
      break;
    case 'tool_use':
      activityType = 'tool_use';
      metadata.toolName = data.toolName;
      break;
    case 'tool_result':
      activityType = 'tool_result';
      metadata.toolName = data.toolName;
      break;
    default:
      return;
  }

  const activity = {
    id: generateId(),
    type: activityType,
    source: 'extension' as const,
    conversationId,
    conversationTitle,
    model: null,
    timestamp: new Date(data.timestamp),
    tokens: null,
    metadata,
  };

  syncActivityToWebApp(activity);
}

// Track current conversation
let currentConversationId: string | null = null;

function getCurrentConversationId(): string | null {
  return currentConversationId;
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message: ExtensionMessage | { type: 'WEBAPP_READY' }, sender) => {
  console.log('[Claude Utils] Background received message:', message.type);

  // Handle web app ready signal
  if (message.type === 'WEBAPP_READY') {
    if (sender.tab?.id) {
      console.log('[Claude Utils] Web app tab ready:', sender.tab.id);
      readyTabs.add(sender.tab.id);
      flushPendingActivities(sender.tab.id);
    }
    return;
  }

  // Extract conversation ID from tab URL
  if (sender.tab?.url) {
    const match = sender.tab.url.match(/\/chat\/([^/?]+)/);
    if (match) {
      currentConversationId = match[1];
    }
  }

  switch (message.type) {
    case 'CLAUDE_RESPONSE':
      processResponse(message.data);
      break;
    case 'DOM_ACTIVITY':
      processDOMActivity(message.data);
      break;
    case 'CONVERSATION_TITLE':
      conversationTitles.set(message.data.conversationId, message.data.title);
      break;
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  readyTabs.delete(tabId);
});

console.log('[Claude Utils] Background service worker initialized');
