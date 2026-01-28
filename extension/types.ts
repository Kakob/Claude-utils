// Shared types for extension communication

export interface CapturedResponse {
  url: string;
  method: string;
  status: number;
  tokens?: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
  };
  model?: string;
  conversationId?: string;
  messagePreview?: string;
  fullContent?: string;
  userMessage?: string;
  timestamp: number;
}

export interface DOMActivity {
  type: 'artifact' | 'code_block' | 'tool_use' | 'tool_result';
  title?: string;
  artifactType?: string;
  language?: string;
  codeContent?: string;
  toolName?: string;
  timestamp: number;
}

export type ExtensionMessage =
  | { type: 'CLAUDE_RESPONSE'; data: CapturedResponse }
  | { type: 'DOM_ACTIVITY'; data: DOMActivity }
  | { type: 'CONVERSATION_TITLE'; data: { title: string; conversationId: string } };
