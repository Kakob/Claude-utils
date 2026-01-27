import {
  parseClaudeAIZip,
  parseClaudeAIJSON,
  isClaudeAIZip,
  isClaudeAIJSON,
} from './claude-ai';
import {
  parseClaudeCodeJSONL,
  isClaudeCodeJSONL,
} from './claude-code';
import type { StoredConversation, StoredMessage, DataSource } from '../../types';

export type ParsedData = {
  conversations: StoredConversation[];
  messages: StoredMessage[];
  source: DataSource;
};

export type FileFormat = 'claude-ai-zip' | 'claude-ai-json' | 'claude-code-jsonl' | 'unknown';

export function detectFileFormat(file: File): FileFormat {
  if (isClaudeAIZip(file)) {
    return 'claude-ai-zip';
  }
  if (isClaudeCodeJSONL(file)) {
    return 'claude-code-jsonl';
  }
  if (isClaudeAIJSON(file)) {
    return 'claude-ai-json';
  }
  return 'unknown';
}

export async function parseFile(file: File): Promise<ParsedData> {
  const format = detectFileFormat(file);

  switch (format) {
    case 'claude-ai-zip': {
      const result = await parseClaudeAIZip(file);
      return { ...result, source: 'claude.ai' };
    }

    case 'claude-ai-json': {
      const content = await file.text();
      const result = await parseClaudeAIJSON(content);
      return { ...result, source: 'claude.ai' };
    }

    case 'claude-code-jsonl': {
      const result = await parseClaudeCodeJSONL(file);
      return { ...result, source: 'claude-code' };
    }

    default:
      throw new Error(
        `Unknown file format. Expected ZIP (Claude.ai export), JSON (conversations.json), or JSONL (Claude Code logs).`
      );
  }
}

export async function parseFiles(
  files: File[],
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<ParsedData> {
  const allConversations: StoredConversation[] = [];
  const allMessages: StoredMessage[] = [];
  let primarySource: DataSource = 'claude.ai';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.(i + 1, files.length, file.name);

    const result = await parseFile(file);
    allConversations.push(...result.conversations);
    allMessages.push(...result.messages);

    // Track the primary source based on the first file
    if (i === 0) {
      primarySource = result.source;
    }
  }

  return {
    conversations: allConversations,
    messages: allMessages,
    source: primarySource,
  };
}

export { parseClaudeAIZip, parseClaudeAIJSON } from './claude-ai';
export { parseClaudeCodeJSONL } from './claude-code';
