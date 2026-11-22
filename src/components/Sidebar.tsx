import { BookOpen, History, Layers, Menu, X } from 'lucide-react';
import type { DecisionPreset } from '../shared/decisionTypes';

export type WorkspaceTab = 'workbench' | 'history' | 'reference';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  presets: DecisionPreset[];
  selectedPresetId: string;
  onSelectPreset: (preset: DecisionPreset) => void;
  historyCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  presets,
  selectedPresetId,
  onSelectPreset,
  historyCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    icon: typeof Layers;
    suffix?: string;
  }> = [
    { id: 'workbench', label: 'Workbench', icon: Layers },
    {
      id: 'history',
      label: 'Run History',
      icon: History,
      suffix: historyCount > 0 ? String(historyCount) : undefined,
    },
    { id: 'reference', label: 'API Reference', icon: BookOpen },
  ];

  const content = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 shrink-0">
        <span className="font-semibold text-base tracking-tight text-slate-900 whitespace-nowrap">
          Verdict Studio
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation drawer"
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 rounded-md focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <nav aria-label="Workspace navigation" className="px-3 py-4 border-b border-slate-200">
        <p className="px-2.5 mb-2 text-xs font-medium text-slate-500">Workspace</p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {item.suffix && (
                    <span
                      className={`text-xs font-mono tabular-nums ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.suffix}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2.5 mb-2 text-xs font-medium text-slate-500">
          Evaluation Scenarios
        </p>
        <ul className="space-y-1">
          {presets.map((preset) => {
            const isSelected = activeTab === 'workbench' && selectedPresetId === preset.id;
            const hasMedia = preset.inputBlocks.some((b) => b.type !== 'text');
            return (
              <li key={preset.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectPreset(preset);
                    onSelectTab('workbench');
                    onCloseMobile();
                  }}
                  className={`w-full text-left px-2.5 py-2.5 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 ${
                    isSelected
                      ? 'bg-blue-50 text-blue-950 border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {preset.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500 truncate">
                    {preset.category}
                    <span aria-hidden="true"> · </span>
                    {hasMedia ? 'Multimodal' : 'Text / JSON'}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-5 py-3.5 border-t border-slate-200 text-xs text-slate-500">
        Model: <span className="font-mono text-slate-700">gemini-decision-1</span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <button
            type="button"
            aria-label="Dismiss navigation backdrop"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/40"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{content}</div>
        </div>
      )}
    </>
  );
}

export function MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open navigation menu"
      className="lg:hidden inline-flex items-center justify-center p-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      <Menu className="w-4 h-4" />
    </button>
  );
}
