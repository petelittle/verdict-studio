import { useState } from 'react';
import { ArrowUpRight, Search, Trash2 } from 'lucide-react';
import type { DecisionRunRecord } from '../shared/decisionTypes';

interface HistoryViewProps {
  records: DecisionRunRecord[];
  onLoadRecord: (record: DecisionRunRecord) => void;
  onClearHistory: () => void;
}

export function HistoryView({
  records,
  onLoadRecord,
  onClearHistory,
}: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = records.filter((rec) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      rec.presetName.toLowerCase().includes(q) ||
      rec.inputSummary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Evaluation Run History
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Session log of executed decision batches with token accounting and latency
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter runs..."
              aria-label="Filter evaluation run history"
              className="pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-600 w-56"
            />
          </div>

          {records.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg py-12 px-6 text-center">
          <h2 className="text-sm font-semibold text-slate-900">
            {records.length === 0
              ? 'No evaluation runs recorded yet'
              : 'No runs match your filter'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {records.length === 0
              ? 'Execute a decision batch in the Workbench to compare runs and inspect token counts here.'
              : 'Try clearing the search query to see all recorded runs.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-600">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Scenario</th>
                  <th className="py-2.5 px-4">Input Preview</th>
                  <th className="py-2.5 px-4 text-right">Questions</th>
                  <th className="py-2.5 px-4 text-right">In / Out Tokens</th>
                  <th className="py-2.5 px-4 text-right">Latency</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-500 whitespace-nowrap">
                      {rec.timestamp}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {rec.presetName}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs truncate">
                      {rec.inputSummary}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800">
                      {rec.questionCount}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {rec.inputTokens.toLocaleString()} /{' '}
                      <span className="text-emerald-700 font-semibold">
                        {rec.outputTokens}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                      {rec.latencyMs} ms
                    </td>
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onLoadRecord(rec)}
                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
