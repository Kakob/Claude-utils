// Types for Claude.ai export format

export interface ClaudeAIExport {
  conversations: ClaudeAIConversation[];
}

export interface ClaudeAIConversation {
  uuid: string;
  name: string;
  summary?: string;
  created_at: string;
  updated_at: string;
  chat_messages: ClaudeAIMessage[];
}

export interface ClaudeAIMessage {
  uuid: string;
  sender: 'human' | 'assistant';
  text: string;
  created_at: string;
  attachments?: ClaudeAIAttachment[];
}

export interface ClaudeAIAttachment {
  file_name?: string;
  file_type?: string;
  extracted_content?: string;
}
