import type { RangeTuple } from 'fuse.js';

interface HighlightedTextProps {
  text: string;
  indices?: RangeTuple[];
  query?: string;
  highlightClassName?: string;
}

export function HighlightedText({
  text,
  indices,
  query,
  highlightClassName = 'bg-yellow-200 dark:bg-yellow-800 rounded px-0.5',
}: HighlightedTextProps) {
  // If we have indices from Fuse.js, use them
  if (indices && indices.length > 0) {
    return <HighlightByIndices text={text} indices={indices} highlightClassName={highlightClassName} />;
  }

  // If we have a query string, do simple case-insensitive matching
  if (query && query.trim()) {
    return <HighlightByQuery text={text} query={query} highlightClassName={highlightClassName} />;
  }

  // No highlighting needed
  return <span>{text}</span>;
}

function HighlightByIndices({
  text,
  indices,
  highlightClassName,
}: {
  text: string;
  indices: RangeTuple[];
  highlightClassName: string;
}) {
  // Sort indices by start position
  const sortedIndices = [...indices].sort((a, b) => a[0] - b[0]);

  // Merge overlapping indices
  const mergedIndices: RangeTuple[] = [];
  for (const [start, end] of sortedIndices) {
    if (mergedIndices.length === 0) {
      mergedIndices.push([start, end]);
    } else {
      const last = mergedIndices[mergedIndices.length - 1];
      if (start <= last[1] + 1) {
        last[1] = Math.max(last[1], end);
      } else {
        mergedIndices.push([start, end]);
      }
    }
  }

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;

  mergedIndices.forEach(([start, end], i) => {
    // Add text before this match
    if (start > lastEnd) {
      parts.push(
        <span key={`text-${i}`}>{text.slice(lastEnd, start)}</span>
      );
    }

    // Add highlighted match
    parts.push(
      <mark key={`highlight-${i}`} className={highlightClassName}>
        {text.slice(start, end + 1)}
      </mark>
    );

    lastEnd = end + 1;
  });

  // Add remaining text after last match
  if (lastEnd < text.length) {
    parts.push(<span key="text-end">{text.slice(lastEnd)}</span>);
  }

  return <>{parts}</>;
}

function HighlightByQuery({
  text,
  query,
  highlightClassName,
}: {
  text: string;
  query: string;
  highlightClassName: string;
}) {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) {
    return <span>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;
  let keyIndex = 0;

  // Find all occurrences
  let index = lowerText.indexOf(lowerQuery);
  while (index !== -1) {
    // Add text before match
    if (index > lastEnd) {
      parts.push(
        <span key={`text-${keyIndex++}`}>{text.slice(lastEnd, index)}</span>
      );
    }

    // Add highlighted match (preserving original case)
    parts.push(
      <mark key={`highlight-${keyIndex++}`} className={highlightClassName}>
        {text.slice(index, index + query.length)}
      </mark>
    );

    lastEnd = index + query.length;
    index = lowerText.indexOf(lowerQuery, lastEnd);
  }

  // Add remaining text
  if (lastEnd < text.length) {
    parts.push(<span key={`text-${keyIndex}`}>{text.slice(lastEnd)}</span>);
  }

  return <>{parts}</>;
}
