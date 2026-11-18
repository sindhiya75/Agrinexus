import React from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({ content, className = '' }) => {
  // Helper to render inline formatting: bold, italic, code
  const renderInline = (text: string): React.ReactNode => {
    // Regex matches: **bold**, *italic*, _italic_, `code`
    const tokens: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern matching **bold**, `code`, *italic*, or _italic_
    const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g;
    const parts = remaining.split(pattern);

    for (const part of parts) {
      if (!part) continue;

      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        tokens.push(
          <strong key={keyIdx++} className="font-semibold text-neutral-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        tokens.push(
          <code key={keyIdx++} className="px-1 py-0.5 rounded bg-forest-50/80 text-forest-900 font-mono text-[11px] border border-forest-200">
            {part.slice(1, -1)}
          </code>
        );
      } else if ((part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
                 (part.startsWith('_') && part.endsWith('_') && part.length >= 2)) {
        tokens.push(
          <em key={keyIdx++} className="italic text-neutral-700">
            {part.slice(1, -1)}
          </em>
        );
      } else {
        tokens.push(part);
      }
    }

    return tokens;
  };

  // Split content into lines and group into blocks
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let blockIdx = 0;

  const flushList = () => {
    if (!currentList) return;
    const listKey = `list-${blockIdx++}`;
    if (currentList.type === 'ul') {
      blocks.push(
        <ul key={listKey} className="my-1.5 space-y-1 pl-4 list-disc marker:text-forest-600 text-neutral-800 text-xs sm:text-sm">
          {currentList.items.map((it, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
    } else {
      blocks.push(
        <ol key={listKey} className="my-1.5 space-y-1 pl-4 list-decimal marker:text-forest-700 font-medium text-neutral-800 text-xs sm:text-sm">
          {currentList.items.map((it, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(it)}
            </li>
          ))}
        </ol>
      );
    }
    currentList = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line flushes active lists and acts as paragraph gap
    if (!trimmed) {
      flushList();
      continue;
    }

    // Horizontal Rule (--- or ***)
    if (trimmed === '---' || trimmed === '***') {
      flushList();
      blocks.push(<hr key={`hr-${blockIdx++}`} className="my-2.5 border-neutral-200" />);
      continue;
    }

    // Headings (###, ##, #)
    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(
        <h4 key={`h4-${blockIdx++}`} className="font-bold text-xs sm:text-sm text-neutral-900 mt-2 mb-1 tracking-tight flex items-center gap-1.5">
          {renderInline(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(
        <h3 key={`h3-${blockIdx++}`} className="font-bold text-sm sm:text-base text-neutral-900 mt-2.5 mb-1 tracking-tight">
          {renderInline(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(
        <h2 key={`h2-${blockIdx++}`} className="font-extrabold text-base sm:text-lg text-neutral-900 mt-3 mb-1.5 tracking-tight">
          {renderInline(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // Bullet List items (- or *)
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      continue;
    }

    // Numbered List items (1. 2. etc.)
    const numberMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      continue;
    }

    // Regular line / paragraph
    flushList();
    blocks.push(
      <p key={`p-${blockIdx++}`} className="text-xs sm:text-sm text-neutral-800 leading-relaxed my-1">
        {renderInline(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className={`markdown-body space-y-1 leading-relaxed ${className}`}>{blocks}</div>;
};

export default MarkdownContent;

