import { Calendar } from 'lucide-react';
import type { DateRange } from '../../types';
import { getDefaultDateRange } from '../../lib/analytics';

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'All time', days: 365 * 10 },
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const handlePresetClick = (days: number) => {
    onChange(getDefaultDateRange(days));
  };

  // Determine which preset is active
  const diffDays = Math.round(
    (value.end.getTime() - value.start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Calendar size={16} />
        <span className="text-sm">Period:</span>
      </div>
      <div className="flex gap-1">
        {presets.map((preset) => {
          const isActive = preset.days === diffDays ||
            (preset.days === 365 * 10 && diffDays > 90);
          return (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset.days)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                isActive
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
