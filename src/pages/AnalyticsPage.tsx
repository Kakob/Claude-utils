import { BarChart3 } from 'lucide-react';

export function AnalyticsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Insights into your Claude usage patterns
        </p>
      </div>

      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
        <p>No data to analyze yet</p>
        <p className="text-sm mt-2">
          Import your Claude conversations to see analytics
        </p>
      </div>
    </div>
  );
}
