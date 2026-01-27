import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Brain, Wrench, FileQuestion, FileText } from 'lucide-react';
import type { ContentBlock } from '../../types/unified';
import { HighlightedText } from '../search/HighlightedText';

interface ContentBlocksProps {
  blocks: ContentBlock[];
  highlightQuery?: string;
}

export function ContentBlocks({ blocks, highlightQuery }: ContentBlocksProps) {
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => (
        <ContentBlockRenderer
          key={index}
          block={block}
          highlightQuery={highlightQuery}
        />
      ))}
    </div>
  );
}

interface ContentBlockRendererProps {
  block: ContentBlock;
  highlightQuery?: string;
}

function ContentBlockRenderer({ block, highlightQuery }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'text':
      return <TextBlock text={block.text || ''} highlightQuery={highlightQuery} />;
    case 'code':
      return (
        <CodeBlock
          code={block.text || ''}
          language={block.language}
          highlightQuery={highlightQuery}
        />
      );
    case 'thinking':
      return <ThinkingBlock text={block.text || ''} highlightQuery={highlightQuery} />;
    case 'tool_use':
      return (
        <ToolUseBlock
          toolName={block.toolName || 'Unknown Tool'}
          toolInput={block.toolInput}
        />
      );
    case 'tool_result':
      return (
        <ToolResultBlock
          toolName={block.toolName || 'Unknown Tool'}
          result={block.toolResult || ''}
        />
      );
    case 'artifact':
      return (
        <ArtifactBlock
          title={block.artifactTitle || 'Artifact'}
          content={block.text || ''}
          artifactType={block.artifactType}
          highlightQuery={highlightQuery}
        />
      );
    case 'unsupported':
      return <UnsupportedBlock />;
    default:
      return null;
  }
}

// Text Block Component
interface TextBlockProps {
  text: string;
  highlightQuery?: string;
}

function TextBlock({ text, highlightQuery }: TextBlockProps) {
  return (
    <span className="whitespace-pre-wrap">
      {highlightQuery ? (
        <HighlightedText text={text} query={highlightQuery} />
      ) : (
        text
      )}
    </span>
  );
}

// Code Block Component
interface CodeBlockProps {
  code: string;
  language?: string;
  highlightQuery?: string;
}

function CodeBlock({ code, language, highlightQuery }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className="relative group my-2">
      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 rounded-t-lg px-3 py-1.5 text-xs">
        <span className="text-gray-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 rounded-b-lg p-3 overflow-x-auto text-xs">
        <code>
          {highlightQuery ? (
            <HighlightedText
              text={code}
              query={highlightQuery}
              highlightClassName="bg-yellow-400 text-gray-900 rounded px-0.5"
            />
          ) : (
            code
          )}
        </code>
      </pre>
    </div>
  );
}

// Thinking Block Component (Collapsible)
interface ThinkingBlockProps {
  text: string;
  highlightQuery?: string;
}

function ThinkingBlock({ text, highlightQuery }: ThinkingBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-2 border border-violet-200 dark:border-violet-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-violet-500" />
        ) : (
          <ChevronRight size={16} className="text-violet-500" />
        )}
        <Brain size={16} className="text-violet-500" />
        <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
          Thinking
        </span>
        {!isExpanded && (
          <span className="text-xs text-violet-500 dark:text-violet-400 truncate ml-2">
            {text.slice(0, 100)}...
          </span>
        )}
      </button>
      {isExpanded && (
        <div className="p-3 bg-violet-50/50 dark:bg-violet-900/10 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
          {highlightQuery ? (
            <HighlightedText text={text} query={highlightQuery} />
          ) : (
            text
          )}
        </div>
      )}
    </div>
  );
}

// Tool Use Block Component
interface ToolUseBlockProps {
  toolName: string;
  toolInput?: Record<string, unknown>;
}

function ToolUseBlock({ toolName, toolInput }: ToolUseBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputJson = toolInput ? JSON.stringify(toolInput, null, 2) : '';

  return (
    <div className="my-2 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-amber-500" />
        ) : (
          <ChevronRight size={16} className="text-amber-500" />
        )}
        <Wrench size={16} className="text-amber-500" />
        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
          {toolName}
        </span>
      </button>
      {isExpanded && inputJson && (
        <pre className="p-3 bg-amber-50/50 dark:bg-amber-900/10 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
          {inputJson}
        </pre>
      )}
    </div>
  );
}

// Tool Result Block Component
interface ToolResultBlockProps {
  toolName: string;
  result: string;
}

function ToolResultBlock({ toolName, result }: ToolResultBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Result: {toolName}
        </span>
        {!isExpanded && (
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">
            {result.slice(0, 80)}...
          </span>
        )}
      </button>
      {isExpanded && (
        <pre className="p-3 bg-gray-50/50 dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
          {result}
        </pre>
      )}
    </div>
  );
}

// Artifact Block Component (for markdown files, documents, etc.)
interface ArtifactBlockProps {
  title: string;
  content: string;
  artifactType?: string;
  highlightQuery?: string;
}

function ArtifactBlock({ title, content, artifactType, highlightQuery }: ArtifactBlockProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const isMarkdown = artifactType?.includes('markdown') || title.endsWith('.md');
  const hasContent = content && content.trim().length > 0;

  const handleCopy = async () => {
    if (!hasContent) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  // No content - show as unavailable artifact
  if (!hasContent) {
    return (
      <div className="my-2 flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <FileText size={16} className="text-blue-400" />
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {title}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          Content not included in export
        </span>
      </div>
    );
  }

  return (
    <div className="my-2 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded px-1 -ml-1 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown size={16} className="text-blue-500" />
          ) : (
            <ChevronRight size={16} className="text-blue-500" />
          )}
          <FileText size={16} className="text-blue-500" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {title}
          </span>
        </button>
        <button
          onClick={handleCopy}
          className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 text-xs"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {isExpanded && (
        <div className={`p-3 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-200 overflow-x-auto max-h-96 overflow-y-auto ${isMarkdown ? 'whitespace-pre-wrap' : ''}`}>
          {highlightQuery ? (
            <HighlightedText text={content} query={highlightQuery} />
          ) : (
            content
          )}
        </div>
      )}
    </div>
  );
}

// Unsupported Block Component
function UnsupportedBlock() {
  return (
    <div className="my-2 flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
      <FileQuestion size={16} />
      <span>Attachment not available in export</span>
    </div>
  );
}
