import { Play, Loader2 } from 'lucide-react';
import { MobileMenuButton, type WorkspaceTab } from './Sidebar';

interface TopBarProps {
  activeTab: WorkspaceTab;
  scenarioName: string;
  questionCount: number;
  isRunning: boolean;
  onRunBatch: () => void;
  onOpenMobileNav: () => void;
}

export function TopBar({
  activeTab,
  scenarioName,
  questionCount,
  isRunning,
  onRunBatch,
  onOpenMobileNav,
}: TopBarProps) {
  const sectionLabel =
    activeTab === 'workbench'
      ? 'Workbench'
      : activeTab === 'history'
        ? 'Run History'
        : 'API Reference';

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <MobileMenuButton onOpen={onOpenMobileNav} />
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm min-w-0">
          <span className="text-slate-500 whitespace-nowrap hidden md:inline">
            Verdict Studio
          </span>
          <span className="text-slate-300 hidden md:inline" aria-hidden="true">
            /
          </span>
          <span className="text-slate-600 whitespace-nowrap hidden sm:inline">
            {sectionLabel}
          </span>
          {activeTab === 'workbench' && (
            <>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {scenarioName}
              </span>
            </>
          )}
          {activeTab !== 'workbench' && (
            <span className="font-semibold text-slate-900 sm:hidden truncate">
              {sectionLabel}
            </span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {activeTab === 'workbench' && (
          <button
            type="button"
            onClick={onRunBatch}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">
                  Run Decision Batch ({questionCount})
                </span>
                <span className="sm:hidden">Run ({questionCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
}
