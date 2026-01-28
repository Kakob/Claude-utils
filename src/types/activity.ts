// Activity tracking types for real-time Claude usage

export type ActivityType =
  | 'message_sent'
  | 'message_received'
  | 'artifact_created'
  | 'code_block'
  | 'tool_use'
  | 'tool_result';

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
}

export interface StoredActivity {
  id: string;
  type: ActivityType;
  source: 'claude.ai' | 'extension';
  conversationId: string | null;
  conversationTitle: string | null;
  model: string | null;
  timestamp: Date;
  tokens: TokenUsage | null;
  metadata: ActivityMetadata;
}

export interface ActivityMetadata {
  messageRole?: 'user' | 'assistant';
  messagePreview?: string;
  fullContent?: string;
  userMessage?: string;
  artifactTitle?: string;
  artifactType?: string;
  codeLanguage?: string;
  codeContent?: string;
  toolName?: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
  messageCount: number;
  artifactCount: number;
  toolUseCount: number;
  modelUsage: Record<string, number>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface ActivityFilters {
  source?: 'claude.ai' | 'extension';
  types?: ActivityType[];
  dateRange?: DateRange;
  conversationId?: string;
  search?: string;
}

export interface ConversationGroup {
  conversationId: string;
  conversationTitle: string;
  activities: StoredActivity[];
  totalTokens: TokenUsage;
  activityCount: number;
  firstActivity: Date;
  lastActivity: Date;
}
