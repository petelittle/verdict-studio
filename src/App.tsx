import { useState } from 'react';
import { DECISION_PRESETS } from './data/presets';
import { Sidebar, type WorkspaceTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { InputComposer } from './components/InputComposer';
import { QuestionBuilder } from './components/QuestionBuilder';
import { ResultsPanel } from './components/ResultsPanel';
import { HistoryView } from './components/HistoryView';
import { SchemaReferenceView } from './components/SchemaReferenceView';
import type {
  DecisionExecutionResult,
  DecisionPreset,
  DecisionQuestionConfig,
  DecisionRunRecord,
  InputBlock,
  ValidationIssue,
} from './shared/decisionTypes';
import { validateDecisionRequest } from './utils/decisionValidation';

function summarizeInput(blocks: InputBlock[]): string {
  const textParts = blocks
    .filter((b): b is Extract<InputBlock, { type: 'text' }> => b.type === 'text')
    .map((b) => b.content.trim())
    .filter(Boolean);
  const mediaCount = blocks.filter((b) => b.type !== 'text').length;
  const textSnippet = textParts.join(' ').slice(0, 72);
  if (mediaCount > 0 && textSnippet) {
    return `${textSnippet}${textParts.join(' ').length > 72 ? '...' : ''} (+${mediaCount} media)`;
  }
  if (mediaCount > 0) {
    return `${mediaCount} multimodal attachment${mediaCount > 1 ? 's' : ''}`;
  }
  return textSnippet || 'Empty input';
}

export default function App() {
  const initialPreset = DECISION_PRESETS[0];

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('workbench');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [selectedPresetId, setSelectedPresetId] = useState<string>(initialPreset.id);
  const [scenarioName, setScenarioName] = useState<string>(initialPreset.name);
  const [scenarioSummary, setScenarioSummary] = useState<string>(initialPreset.summary);
  const [inputBlocks, setInputBlocks] = useState<InputBlock[]>(() =>
    structuredClone(initialPreset.inputBlocks),
  );
  const [questions, setQuestions] = useState<DecisionQuestionConfig[]>(() =>
    structuredClone(initialPreset.questions),
  );

  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DecisionExecutionResult | null>(null);
  const [apiError, setApiError] = useState<{ message: string; details?: unknown } | null>(
    null,
  );
  const [history, setHistory] = useState<DecisionRunRecord[]>([]);

  const handleSelectPreset = (preset: DecisionPreset) => {
    setSelectedPresetId(preset.id);
    setScenarioName(preset.name);
    setScenarioSummary(preset.summary);
    setInputBlocks(structuredClone(preset.inputBlocks));
    setQuestions(structuredClone(preset.questions));
    setValidationIssues([]);
    setResult(null);
    setApiError(null);
  };

  const handleRunBatch = async () => {
    const issues = validateDecisionRequest(inputBlocks, questions);
    setValidationIssues(issues);
    if (issues.length > 0) {
      return;
    }

    setIsRunning(true);
    setApiError(null);

    try {
      const response = await fetch('/api/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputBlocks, questions }),
      });

      const data = await response.json();
      if (!response.ok) {
        setApiError({
          message: data?.error || `Decisions API error (${response.status})`,
          details: data?.prompt_feedback ?? data?.issues ?? null,
        });
        setResult(null);
        return;
      }

      const executionResult = data as DecisionExecutionResult;
      setResult(executionResult);

      const newRecord: DecisionRunRecord = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        presetName: scenarioName,
        questionCount: questions.length,
        inputSummary: summarizeInput(inputBlocks),
        latencyMs: executionResult.latencyMs,
        inputTokens: executionResult.response.usage?.total_input_tokens ?? 0,
        outputTokens: executionResult.response.usage?.total_output_tokens ?? 0,
        questions: structuredClone(questions),
        result: executionResult,
      };
      setHistory((prev) => [newRecord, ...prev]);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Network error calling /api/decisions';
      setApiError({ message: msg });
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleLoadRecord = (record: DecisionRunRecord) => {
    setScenarioName(record.presetName);
    setQuestions(structuredClone(record.questions));
    setResult(record.result);
    setApiError(null);
    setValidationIssues([]);
    setActiveTab('workbench');
  };

  const inputError = validationIssues.find((i) => i.field.startsWith('input'))?.message;

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        presets={DECISION_PRESETS}
        selectedPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        historyCount={history.length}
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          activeTab={activeTab}
          scenarioName={scenarioName}
          questionCount={questions.length}
          isRunning={isRunning}
          onRunBatch={handleRunBatch}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1440px] w-full mx-auto">
          {activeTab === 'workbench' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 text-balance">
                    {scenarioName}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1 max-w-3xl">
                    {scenarioSummary}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-7 space-y-6">
                  <InputComposer
                    blocks={inputBlocks}
                    onChange={(next) => {
                      setInputBlocks(next);
                      if (validationIssues.length > 0) {
                        setValidationIssues(validateDecisionRequest(next, questions));
                      }
                    }}
                    validationError={inputError}
                  />

                  <QuestionBuilder
                    questions={questions}
                    onChange={(next) => {
                      setQuestions(next);
                      if (validationIssues.length > 0) {
                        setValidationIssues(validateDecisionRequest(inputBlocks, next));
                      }
                    }}
                    issues={validationIssues}
                  />
                </div>

                <div className="xl:col-span-5 xl:sticky xl:top-22">
                  <ResultsPanel
                    questions={questions}
                    result={result}
                    isRunning={isRunning}
                    apiError={apiError}
                    onRunBatch={handleRunBatch}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <HistoryView
              records={history}
              onLoadRecord={handleLoadRecord}
              onClearHistory={() => setHistory([])}
            />
          )}

          {activeTab === 'reference' && <SchemaReferenceView />}
        </main>
      </div>
    </div>
  );
}
