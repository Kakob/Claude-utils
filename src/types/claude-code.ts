// Types for Claude Code JSONL log format

export type ClaudeCodeEntry =
  | ClaudeCodeSystemEntry
  | ClaudeCodeUserEntry
  | ClaudeCodeAssistantEntry
  | ClaudeCodeToolUseEntry
  | ClaudeCodeToolResultEntry;

export interface ClaudeCodeSystemEntry {
  type: 'system';
  session_id?: string;
  cwd?: string;
  git_branch?: string;
  model?: string;
  timestamp: string;
}

export interface ClaudeCodeUserEntry {
  type: 'user';
  message: {
    content: string | ClaudeCodeContentBlock[];
  };
  timestamp: string;
}

export interface ClaudeCodeAssistantEntry {
  type: 'assistant';
  message: {
    content: string | ClaudeCodeContentBlock[];
  };
  timestamp: string;
}

export interface ClaudeCodeToolUseEntry {
  type: 'tool_use';
  tool_name: string;
  tool_input: Record<string, unknown>;
  timestamp: string;
}

export interface ClaudeCodeToolResultEntry {
  type: 'tool_result';
  tool_name: string;
  result: string;
  timestamp: string;
}

export interface ClaudeCodeContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  result?: string;
}
