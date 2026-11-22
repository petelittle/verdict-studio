import { Copy, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import type {
  ChoiceQuestionConfig,
  DecisionQuestionConfig,
  NoulQuestionConfig,
  QuestionType,
  ScoreQuestionConfig,
  ValidationIssue,
} from '../shared/decisionTypes';
import { sortKeysUtf8 } from '../utils/decisionValidation';

interface QuestionBuilderProps {
  questions: DecisionQuestionConfig[];
  onChange: (questions: DecisionQuestionConfig[]) => void;
  issues: ValidationIssue[];
}

function makeUniqueKey(base: string, existing: DecisionQuestionConfig[]): string {
  const keys = new Set(existing.map((q) => q.key));
  if (!keys.has(base)) return base;
  let counter = 2;
  while (keys.has(`${base}_${counter}`)) {
    counter++;
  }
  return `${base}_${counter}`;
}

export function QuestionBuilder({
  questions,
  onChange,
  issues,
}: QuestionBuilderProps) {
  const addQuestion = (type: QuestionType) => {
    const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let next: DecisionQuestionConfig;

    if (type === 'noul') {
      next = {
        id,
        key: makeUniqueKey('boolean_check', questions),
        type: 'noul',
        instructions: 'Does the input satisfy this condition?',
        trueDescription: 'Condition is clearly present.',
        falseDescription: 'Condition is absent or unrelated.',
        threshold: 0.7,
      };
    } else if (type === 'choice') {
      next = {
        id,
        key: makeUniqueKey('route_category', questions),
        type: 'choice',
        instructions: 'Which category best fits this input?',
        options: [
          { id: `${id}-o1`, key: 'primary', description: 'Matches primary category.' },
          { id: `${id}-o2`, key: 'other', description: 'Anything outside the listed categories.' },
        ],
        confidenceThreshold: 0.65,
      };
    } else {
      next = {
        id,
        key: makeUniqueKey('quality_score', questions),
        type: 'score',
        instructions: 'Rate the input along this ordered rubric.',
        levels: [
          'Level 0: Low or minimal severity.',
          'Level 1: Moderate severity.',
          'Level 2: High or critical severity.',
        ],
      };
    }

    onChange([...questions, next]);
  };

  const duplicateQuestion = (q: DecisionQuestionConfig) => {
    const copyId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const cloned = structuredClone(q);
    cloned.id = copyId;
    cloned.key = makeUniqueKey(`${q.key}_copy`, questions);
    onChange([...questions, cloned]);
  };

  const removeQuestion = (id: string) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updated: DecisionQuestionConfig) => {
    onChange(questions.map((q) => (q.id === id ? updated : q)));
  };

  const switchQuestionType = (q: DecisionQuestionConfig, newType: QuestionType) => {
    if (q.type === newType) return;
    if (newType === 'noul') {
      const converted: NoulQuestionConfig = {
        id: q.id,
        key: q.key,
        type: 'noul',
        instructions: q.instructions,
        trueDescription: '',
        falseDescription: '',
        threshold: 0.7,
      };
      updateQuestion(q.id, converted);
    } else if (newType === 'choice') {
      const converted: ChoiceQuestionConfig = {
        id: q.id,
        key: q.key,
        type: 'choice',
        instructions: q.instructions,
        options: [
          { id: `${q.id}-o1`, key: 'option_a', description: 'First option.' },
          { id: `${q.id}-o2`, key: 'other', description: 'Catch-all fallback.' },
        ],
        confidenceThreshold: 0.65,
      };
      updateQuestion(q.id, converted);
    } else {
      const converted: ScoreQuestionConfig = {
        id: q.id,
        key: q.key,
        type: 'score',
        instructions: q.instructions,
        levels: ['Lowest level', 'Middle level', 'Highest level'],
      };
      updateQuestion(q.id, converted);
    }
  };

  const batchError = issues.find((i) => i.field === 'questions')?.message;

  return (
    <section
      aria-labelledby="question-batch-heading"
      className="bg-white border border-slate-200 rounded-lg"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="question-batch-heading"
            className="text-base font-semibold text-slate-900"
          >
            Question Batch ({questions.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Independent questions evaluated in parallel · Model never sees question keys
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addQuestion('noul')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Yes/No (noul)</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion('choice')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Choice</span>
          </button>
          <button
            type="button"
            onClick={() => addQuestion('score')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Rubric (score)</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {batchError && (
          <div
            role="alert"
            className="px-3.5 py-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md"
          >
            {batchError}
          </div>
        )}

        {questions.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-slate-300 rounded-md bg-slate-50">
            <p className="text-sm font-medium text-slate-700">
              No questions in batch
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add a noul, choice, or score question above to evaluate the shared input.
            </p>
          </div>
        ) : (
          questions.map((q, qIndex) => {
            const qIssues = issues.filter((i) =>
              i.field.startsWith(`question.${q.id}.`),
            );
            const sortedChoiceKeys =
              q.type === 'choice'
                ? sortKeysUtf8(q.options.map((o) => o.key.trim()).filter(Boolean))
                : [];

            return (
              <div
                key={q.id}
                className="border border-slate-200 rounded-md bg-slate-50/60 p-4 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      Q{qIndex + 1}
                    </span>

                    <div
                      role="group"
                      aria-label={`Question type for ${q.key || qIndex + 1}`}
                      className="inline-flex items-center p-0.5 bg-slate-200/70 rounded-md"
                    >
                      {(['noul', 'choice', 'score'] as QuestionType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => switchQuestionType(q, t)}
                          className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                            q.type === t
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => duplicateQuestion(q)}
                      aria-label={`Duplicate question ${q.key || qIndex + 1}`}
                      className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      aria-label={`Delete question ${q.key || qIndex + 1}`}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {qIssues.length > 0 && (
                  <div
                    role="alert"
                    className="px-3 py-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md space-y-0.5"
                  >
                    {qIssues.map((iss, idx) => (
                      <div key={idx}>{iss.message}</div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="block sm:col-span-1">
                    <span className="block text-xs font-medium text-slate-700 mb-1">
                      Question Key
                    </span>
                    <input
                      type="text"
                      value={q.key}
                      onChange={(e) =>
                        updateQuestion(q.id, { ...q, key: e.target.value })
                      }
                      placeholder="e.g. is_defect"
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="block text-xs font-medium text-slate-700 mb-1">
                      Instructions (Full Question Prompt)
                    </span>
                    <input
                      type="text"
                      value={q.instructions}
                      onChange={(e) =>
                        updateQuestion(q.id, { ...q, instructions: e.target.value })
                      }
                      placeholder="Write the full closed-ended question..."
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                    />
                  </label>
                </div>

                {q.type === 'noul' && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="block text-xs font-medium text-slate-700 mb-1">
                          True Description (Optional)
                        </span>
                        <input
                          type="text"
                          value={q.trueDescription}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              ...q,
                              trueDescription: e.target.value,
                            })
                          }
                          placeholder="When the answer should be true..."
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-xs font-medium text-slate-700 mb-1">
                          False Description (Optional)
                        </span>
                        <input
                          type="text"
                          value={q.falseDescription}
                          onChange={(e) =>
                            updateQuestion(q.id, {
                              ...q,
                              falseDescription: e.target.value,
                            })
                          }
                          placeholder="When the answer should be false..."
                          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/80">
                      <label
                        htmlFor={`threshold-${q.id}`}
                        className="text-xs font-medium text-slate-700"
                      >
                        Client Decision Gate Threshold:{' '}
                        <span className="font-mono tabular-nums text-slate-900">
                          {q.threshold.toFixed(2)}
                        </span>
                      </label>
                      <input
                        id={`threshold-${q.id}`}
                        type="range"
                        min={0.05}
                        max={0.95}
                        step={0.05}
                        value={q.threshold}
                        onChange={(e) =>
                          updateQuestion(q.id, {
                            ...q,
                            threshold: Number(e.target.value),
                          })
                        }
                        className="w-48 accent-blue-600"
                      />
                    </div>
                  </div>
                )}

                {q.type === 'choice' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        Options ({q.options.length}) · API evaluates in UTF-8 order:{' '}
                        <span className="font-mono text-slate-500">
                          {sortedChoiceKeys.join(', ')}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(q.id, {
                            ...q,
                            options: [
                              ...q.options,
                              {
                                id: `${q.id}-o-${Date.now()}`,
                                key: `option_${q.options.length + 1}`,
                                description: '',
                              },
                            ],
                          })
                        }
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                      >
                        + Add Option
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={opt.id}
                          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                        >
                          <input
                            type="text"
                            value={opt.key}
                            onChange={(e) => {
                              const nextOpts = q.options.map((o) =>
                                o.id === opt.id ? { ...o, key: e.target.value } : o,
                              );
                              updateQuestion(q.id, { ...q, options: nextOpts });
                            }}
                            aria-label={`Option ${optIdx + 1} key for ${q.key}`}
                            placeholder="option_id"
                            className="sm:w-44 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                          <input
                            type="text"
                            value={opt.description}
                            onChange={(e) => {
                              const nextOpts = q.options.map((o) =>
                                o.id === opt.id
                                  ? { ...o, description: e.target.value }
                                  : o,
                              );
                              updateQuestion(q.id, { ...q, options: nextOpts });
                            }}
                            aria-label={`Option ${optIdx + 1} description for ${q.key}`}
                            placeholder="Description (leave empty if key is self-explanatory)"
                            className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                          {q.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateQuestion(q.id, {
                                  ...q,
                                  options: q.options.filter((o) => o.id !== opt.id),
                                })
                              }
                              aria-label={`Remove option ${opt.key || optIdx + 1} from ${q.key}`}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 self-end sm:self-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-200/80">
                      <label
                        htmlFor={`conf-${q.id}`}
                        className="text-xs font-medium text-slate-700"
                      >
                        Auto-Route Confidence Gate:{' '}
                        <span className="font-mono tabular-nums text-slate-900">
                          {q.confidenceThreshold.toFixed(2)}
                        </span>
                      </label>
                      <input
                        id={`conf-${q.id}`}
                        type="range"
                        min={0.3}
                        max={0.95}
                        step={0.05}
                        value={q.confidenceThreshold}
                        onChange={(e) =>
                          updateQuestion(q.id, {
                            ...q,
                            confidenceThreshold: Number(e.target.value),
                          })
                        }
                        className="w-48 accent-blue-600"
                      />
                    </div>
                  </div>
                )}

                {q.type === 'score' && (
                  <div className="space-y-2.5 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        Ordered Rubric Levels (0 = Lowest First)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuestion(q.id, {
                            ...q,
                            levels: [
                              ...q.levels,
                              `Level ${q.levels.length}: Description`,
                            ],
                          })
                        }
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                      >
                        + Add Level
                      </button>
                    </div>

                    <div className="space-y-2">
                      {q.levels.map((lvl, lvlIdx) => (
                        <div key={lvlIdx} className="flex items-center gap-2">
                          <span className="w-7 text-xs font-mono text-slate-500 tabular-nums text-right shrink-0">
                            [{lvlIdx}]
                          </span>
                          <input
                            type="text"
                            value={lvl}
                            onChange={(e) => {
                              const nextLevels = [...q.levels];
                              nextLevels[lvlIdx] = e.target.value;
                              updateQuestion(q.id, { ...q, levels: nextLevels });
                            }}
                            aria-label={`Rubric level ${lvlIdx} for ${q.key}`}
                            className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600"
                          />
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={lvlIdx === 0}
                              onClick={() => {
                                const nextLevels = [...q.levels];
                                [nextLevels[lvlIdx - 1], nextLevels[lvlIdx]] = [
                                  nextLevels[lvlIdx],
                                  nextLevels[lvlIdx - 1],
                                ];
                                updateQuestion(q.id, { ...q, levels: nextLevels });
                              }}
                              aria-label={`Move rubric level ${lvlIdx} up in ${q.key}`}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={lvlIdx === q.levels.length - 1}
                              onClick={() => {
                                const nextLevels = [...q.levels];
                                [nextLevels[lvlIdx + 1], nextLevels[lvlIdx]] = [
                                  nextLevels[lvlIdx],
                                  nextLevels[lvlIdx + 1],
                                ];
                                updateQuestion(q.id, { ...q, levels: nextLevels });
                              }}
                              aria-label={`Move rubric level ${lvlIdx} down in ${q.key}`}
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            {q.levels.length > 2 && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateQuestion(q.id, {
                                    ...q,
                                    levels: q.levels.filter((_, i) => i !== lvlIdx),
                                  })
                                }
                                aria-label={`Remove rubric level ${lvlIdx} from ${q.key}`}
                                className="p-1 text-slate-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
