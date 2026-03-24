import { useState } from 'react';
import { Tag, X } from 'lucide-react';
import { TagInput } from '../common/TagInput';
import { useTagStore } from '../../stores/tagStore';
import type { ApiTag } from '../../lib/api';

interface BatchTagBarProps {
  selectedCount: number;
  selectedIds: string[];
  onClear: () => void;
  onTagsApplied: () => void;
}

export function BatchTagBar({ selectedCount, selectedIds, onClear, onTagsApplied }: BatchTagBarProps) {
  const [showTagInput, setShowTagInput] = useState(false);
  const [appliedTags, setAppliedTags] = useState<ApiTag[]>([]);
  const { tagEntity } = useTagStore();

  const handleTagAdd = async (tag: ApiTag) => {
    setAppliedTags((prev) => [...prev, tag]);
    await Promise.all(
      selectedIds.map((id) => tagEntity(tag.id, id, 'conversation'))
    );
    onTagsApplied();
  };

  const handleTagRemove = (tagId: string) => {
    setAppliedTags((prev) => prev.filter((t) => t.id !== tagId));
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-violet-600 text-white rounded-full shadow-lg">
      <span className="text-sm font-medium">{selectedCount} selected</span>

      {showTagInput ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg p-2 min-w-64" onClick={(e) => e.stopPropagation()}>
          <TagInput
            selectedTags={appliedTags}
            onTagAdd={handleTagAdd}
            onTagRemove={handleTagRemove}
            entityType="conversation"
            placeholder="Tag selected conversations..."
          />
        </div>
      ) : (
        <button
          onClick={() => setShowTagInput(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          <Tag size={14} />
          Tag Selected
        </button>
      )}

      <button
        onClick={() => {
          setShowTagInput(false);
          setAppliedTags([]);
          onClear();
        }}
        className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
