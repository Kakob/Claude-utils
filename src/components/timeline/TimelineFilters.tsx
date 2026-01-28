import { useState } from 'react';
import { Search, Filter, Layers, List, Download } from 'lucide-react';
import type { ActivityType, ActivityFilters } from '../../types';

interface TimelineFiltersProps {
  filters: ActivityFilters;
  onFiltersChange: (filters: ActivityFilters) => void;
  groupByConversation: boolean;
  onGroupByChange: (grouped: boolean) => void;
  onExport: (format: 'json' | 'csv') => void;
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'message_sent', label: 'Messages Sent' },
  { value: 'message_received', label: 'Responses' },
  { value: 'artifact_created', label: 'Artifacts' },
  { value: 'code_block', label: 'Code Blocks' },
  { value: 'tool_use', label: 'Tool Usage' },
  { value: 'tool_result', label: 'Tool Results' },
];

const datePresets = [
  { label: 'Today', days: 0 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'All time', days: -1 },
];

export function TimelineFilters({
  filters,
  onFiltersChange,
  groupByConversation,
  onGroupByChange,
  onExport,
}: TimelineFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeDatePreset, setActiveDatePreset] = useState('All time');

  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search: search || undefined });
  };

  const handleSourceChange = (source: 'claude.ai' | 'extension' | undefined) => {
    onFiltersChange({ ...filters, source });
  };

  const handleTypeToggle = (type: ActivityType) => {
    const currentTypes = filters.types ?? [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    onFiltersChange({ ...filters, types: newTypes.length > 0 ? newTypes : undefined });
  };

  const handleDatePreset = (days: number, label: string) => {
    setActiveDatePreset(label);
    if (days < 0) {
      onFiltersChange({ ...filters, dateRange: undefined });
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      start.setHours(0, 0, 0, 0);
      onFiltersChange({ ...filters, dateRange: { start, end } });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search activities..."
            value={filters.search ?? ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-lg border transition-colors ${
            showFilters
              ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <Filter size={18} />
        </button>

        {/* Group toggle */}
        <button
          onClick={() => onGroupByChange(!groupByConversation)}
          className={`p-2 rounded-lg border transition-colors ${
            groupByConversation
              ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400'
              : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          title={groupByConversation ? 'Show flat list' : 'Group by conversation'}
        >
          {groupByConversation ? <List size={18} /> : <Layers size={18} />}
        </button>

        {/* Export dropdown */}
        <div className="relative group">
          <button className="p-2 rounded-lg border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <Download size={18} />
          </button>
          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              onClick={() => onExport('json')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-t-lg"
            >
              Export JSON
            </button>
            <button
              onClick={() => onExport('csv')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-b-lg"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
          {/* Date presets */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
              Time Range
            </label>
            <div className="flex gap-2">
              {datePresets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleDatePreset(preset.days, preset.label)}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    activeDatePreset === preset.label
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source filter */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
              Source
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleSourceChange(undefined)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  !filters.source
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleSourceChange('claude.ai')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filters.source === 'claude.ai'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Claude.ai
              </button>
              <button
                onClick={() => handleSourceChange('extension')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filters.source === 'extension'
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Extension
              </button>
            </div>
          </div>

          {/* Activity type filters */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
              Activity Types
            </label>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((type) => {
                const isActive = filters.types?.includes(type.value) ?? false;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleTypeToggle(type.value)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
