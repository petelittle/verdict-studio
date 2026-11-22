import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type {
  DecisionExecutionResult,
  DecisionQuestionConfig,
} from '../shared/decisionTypes';
import {
  evaluateChoiceDecision,
  evaluateNoulGate,
  evaluateScoreDecision,
} from '../utils/decisionValidation';

interface ResultsPanelProps {
  questions: DecisionQuestionConfig[];
  result: DecisionExecutionResult | null;
  isRunning: boolean;
  apiError: { message: string; details?: unknown } | null;
  onRunBatch: () => void;
}

export function ResultsPanel({
  questions,
  result,
  isRunning,
  apiError,
  onRunBatch,
}: ResultsPanelProps) {
  const [viewMode, setViewMode] = useState<'verdicts' | 'json'>('verdicts');

  const inputTokens = result?.response.usage?.total_input_tokens ?? 0;
  const outputTokens = result?.response.usage?.total_output_tokens ?? 0;

  return (
    <section
      aria-labelledby="calibrated-results-heading"
      className="bg-white border border-slate-200 rounded-lg"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="calibrated-results-heading"
            className="text-base font-semibold text-slate-900"
          >
            Calibrated Decision Output
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Probabilities and rubric expectations with zero generated output tokens
          </p>
        </div>

        {result && !isRunning && (
          <div
            role="tablist"
            aria-label="Output inspection mode"
            className="inline-flex items-center p-0.5 bg-slate-100 rounded-md border border-slate-200"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'verdicts'}
              onClick={() => setViewMode('verdicts')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                viewMode === 'verdicts'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calibrated Verdicts
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'json'}
              onClick={() => setViewMode('json')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                viewMode === 'json'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Payload & Raw JSON
            </button>
          </div>
        )}
      </div>

      <div className="p-5">
        {isRunning && (
          <div className="space-y-4" aria-live="polite" aria-busy="true">
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-md bg-slate-100 animate-pulse border border-slate-200"
                />
              ))}
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-32 rounded-md bg-slate-100 animate-pulse border border-slate-200"
              />
            ))}
          </div>
        )}

        {!isRunning && apiError && (
          <div
            role="alert"
            className="border border-red-200 bg-red-50 rounded-md p-4 space-y-3"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="w-5 h-5 text-red-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-900">
                  Decisions API Request Failed
                </h3>
                <p className="text-xs text-red-800 leading-relaxed break-words">
                  {apiError.message}
                </p>
              </div>
            </div>

            {apiError.details !== undefined && apiError.details !== null && (
              <pre className="text-xs font-mono bg-white border border-red-200 rounded p-3 overflow-x-auto text-red-900">
                {JSON.stringify(apiError.details, null, 2)}
              </pre>
            )}

            <div>
              <button
                type="button"
                onClick={onRunBatch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-900 bg-white border border-red-300 rounded-md hover:bg-red-100/50 whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Retry Evaluation</span>
              </button>
            </div>
          </div>
        )}

        {!isRunning && !apiError && !result && (
          <div className="py-12 px-6 text-center border border-dashed border-slate-300 rounded-md bg-slate-50/70">
            <h3 className="text-sm font-semibold text-slate-900">
              Ready to evaluate {questions.length} question{questions.length === 1 ? '' : 's'}
            </h3>
            <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
              Run the batch to call <span className="font-mono">ai.decisions.create</span> with{' '}
              <span className="font-mono">gemini-decision-1</span> and inspect calibrated probabilities, threshold gates, and token accounting.
            </p>
            <button
              type="button"
              onClick={onRunBatch}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Run Decision Batch</span>
            </button>
          </div>
        )}

        {!isRunning && !apiError && result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 divide-x divide-slate-200 border border-slate-200 rounded-md bg-slate-50">
              <div className="px-3.5 py-2.5">
                <div className="text-xs text-slate-500">Input Tokens</div>
                <div className="mt-0.5 text-base font-semibold font-mono tabular-nums text-slate-900">
                  {inputTokens.toLocaleString()}
                </div>
              </div>
              <div className="px-3.5 py-2.5">
                <div className="text-xs text-slate-500">Output Tokens</div>
                <div className="mt-0.5 text-base font-semibold font-mono tabular-nums text-emerald-700">
                  {outputTokens.toLocaleString()}
                </div>
              </div>
              <div className="px-3.5 py-2.5">
                <div className="text-xs text-slate-500">API Latency</div>
                <div className="mt-0.5 text-base font-semibold font-mono tabular-nums text-slate-900">
                  {result.latencyMs} ms
                </div>
              </div>
            </div>

            {viewMode === 'verdicts' ? (
              <div className="space-y-3">
                {questions.map((q) => {
                  const answer = result.response.answers?.[q.key.trim()];
                  if (!answer) {
                    return (
                      <div
                        key={q.id}
                        className="border border-slate-200 rounded-md p-4 bg-slate-50 text-xs text-slate-500"
                      >
                        <span className="font-mono font-medium text-slate-800">{q.key}</span>{' '}
                        <span aria-hidden="true">·</span> Not present in last API response (re-run batch after adding or renaming keys).
                      </div>
                    );
                  }

                  if (q.type === 'noul' && answer.type === 'noul') {
                    const evalRes = evaluateNoulGate(answer, q.threshold);
                    const pct = Math.round(evalRes.probability * 1000) / 10;
                    const threshPct = Math.round(q.threshold * 100);

                    return (
                      <div
                        key={q.id}
                        className="border border-slate-200 rounded-md p-3.5 space-y-2.5 bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                              <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                                {q.key}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="whitespace-nowrap">noul</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums whitespace-nowrap">
                                Confidence {(evalRes.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{q.instructions}</p>
                          </div>

                          <div
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                              evalRes.passed ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {evalRes.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                            )}
                            <span>{evalRes.label}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Calibrated P(true)</span>
                            <span className="font-mono font-semibold tabular-nums text-slate-900">
                              {evalRes.probability.toFixed(4)} ({pct}%)
                            </span>
                          </div>
                          <div className="relative h-2.5 w-full bg-slate-100 rounded-sm overflow-visible border border-slate-200">
                            <div
                              className={`h-full rounded-sm transition-all ${
                                evalRes.passed ? 'bg-emerald-600' : 'bg-slate-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(1, pct))}%` }}
                            />
                            <div
                              title={`Threshold: ${q.threshold.toFixed(2)}`}
                              className="absolute -top-1 -bottom-1 w-0.5 bg-blue-600"
                              style={{ left: `${threshPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'choice' && answer.type === 'choice') {
                    const evalRes = evaluateChoiceDecision(answer, q.confidenceThreshold);

                    return (
                      <div
                        key={q.id}
                        className="border border-slate-200 rounded-md p-3.5 space-y-2.5 bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                              <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                                {q.key}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="whitespace-nowrap">choice</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums whitespace-nowrap">
                                Confidence {(evalRes.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{q.instructions}</p>
                          </div>

                          <div
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${
                              evalRes.isConfident ? 'text-blue-700' : 'text-amber-700'
                            }`}
                          >
                            {evalRes.isConfident ? (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                            )}
                            <span>
                              {evalRes.isConfident
                                ? `Selected: ${evalRes.selectedChoice}`
                                : `Low confidence (< ${q.confidenceThreshold.toFixed(2)}) · Escalate`}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {evalRes.sortedOptions.map((opt) => {
                            const pct = opt.probability * 100;
                            return (
                              <div key={opt.key} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span
                                    className={`font-mono ${
                                      opt.isWinner
                                        ? 'font-semibold text-slate-900'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    {opt.key}
                                  </span>
                                  <span className="font-mono tabular-nums text-slate-800">
                                    {pct.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden border border-slate-200/80">
                                  <div
                                    className={`h-full ${
                                      opt.isWinner ? 'bg-blue-600' : 'bg-slate-400'
                                    }`}
                                    style={{ width: `${Math.max(0.5, pct)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'score' && answer.type === 'score') {
                    const evalRes = evaluateScoreDecision(answer, q.levels.length);

                    return (
                      <div
                        key={q.id}
                        className="border border-slate-200 rounded-md p-3.5 space-y-2.5 bg-white"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                              <span className="font-mono font-semibold text-slate-900 whitespace-nowrap">
                                {q.key}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="whitespace-nowrap">score rubric</span>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums whitespace-nowrap">
                                Confidence {(evalRes.confidence * 100).toFixed(1)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{q.instructions}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold font-mono tabular-nums text-slate-900">
                              {evalRes.expectedScore.toFixed(2)} / {evalRes.maxIndex}.00
                            </div>
                            <div className="text-xs text-slate-500 tabular-nums">
                              {evalRes.normalizedPercent.toFixed(0)}% normalized
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {evalRes.levels.map((lvl) => {
                            const pct = lvl.probability * 100;
                            return (
                              <div key={lvl.index} className="space-y-1">
                                <div className="flex items-center justify-between gap-3 text-xs">
                                  <span
                                    className={`truncate ${
                                      lvl.isTop
                                        ? 'font-semibold text-slate-900'
                                        : 'text-slate-600'
                                    }`}
                                  >
                                    <span className="font-mono text-slate-400 mr-1.5">
                                      [{lvl.index}]
                                    </span>
                                    {lvl.label}
                                  </span>
                                  <span className="font-mono tabular-nums text-slate-800 shrink-0">
                                    {pct.toFixed(1)}%
                                  </span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-sm overflow-hidden border border-slate-200/80">
                                  <div
                                    className={`h-full ${
                                      lvl.isTop ? 'bg-slate-900' : 'bg-slate-300'
                                    }`}
                                    style={{ width: `${Math.max(0.5, pct)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-1.5">
                    API Request Payload (ai.decisions.create)
                  </h3>
                  <pre className="text-xs font-mono bg-slate-900 text-slate-100 rounded-md p-4 overflow-x-auto max-h-72">
                    {JSON.stringify(result.requestPayloadPreview, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-700 mb-1.5">
                    Raw API Response
                  </h3>
                  <pre className="text-xs font-mono bg-slate-900 text-slate-100 rounded-md p-4 overflow-x-auto max-h-80">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
