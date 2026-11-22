import type {
  ChoiceAnswerPayload,
  DecisionQuestionConfig,
  InputBlock,
  NoulAnswerPayload,
  ScoreAnswerPayload,
  ValidationIssue,
} from '../shared/decisionTypes';

const QUESTION_KEY_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

export function validateQuestionKey(key: string): string | null {
  const trimmed = key.trim();
  if (!trimmed) {
    return 'Question key is required.';
  }
  if (trimmed.length > 64) {
    return 'Question key must be 64 characters or fewer.';
  }
  if (!QUESTION_KEY_REGEX.test(trimmed)) {
    return 'Question key may only contain letters, numbers, underscores, and hyphens.';
  }
  return null;
}

export function sortKeysUtf8(keys: string[]): string[] {
  const encoder = new TextEncoder();
  return [...keys].sort((a, b) => {
    const ba = encoder.encode(a);
    const bb = encoder.encode(b);
    const len = Math.min(ba.length, bb.length);
    for (let i = 0; i < len; i++) {
      if (ba[i] !== bb[i]) {
        return ba[i] - bb[i];
      }
    }
    return ba.length - bb.length;
  });
}

export function validateDecisionRequest(
  inputBlocks: InputBlock[],
  questions: DecisionQuestionConfig[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!inputBlocks || inputBlocks.length === 0) {
    issues.push({
      field: 'input',
      message: 'Shared input cannot be empty. Add at least one text block or media file.',
    });
  } else {
    const hasNonEmptyContent = inputBlocks.some((block) => {
      if (block.type === 'text') {
        return block.content.trim().length > 0;
      }
      return Boolean(block.assetPath || block.base64Data);
    });
    if (!hasNonEmptyContent) {
      issues.push({
        field: 'input',
        message: 'Shared input cannot be empty. Enter text or attach an image/PDF.',
      });
    }

    for (const block of inputBlocks) {
      if (block.type === 'text' && block.isJson && block.content.trim().length > 0) {
        try {
          JSON.parse(block.content);
        } catch {
          issues.push({
            field: `input.${block.id}`,
            message: `JSON block "${block.label || 'JSON Payload'}" contains invalid JSON syntax.`,
          });
        }
      }
    }
  }

  if (!questions || questions.length === 0) {
    issues.push({
      field: 'questions',
      message: 'Add at least one evaluation question (1–1,000 allowed).',
    });
    return issues;
  }

  if (questions.length > 1000) {
    issues.push({
      field: 'questions',
      message: 'A single batch supports at most 1,000 questions.',
    });
  }

  const seenKeys = new Set<string>();

  for (const q of questions) {
    const trimmedKey = q.key.trim();
    const keyError = validateQuestionKey(trimmedKey);
    if (keyError) {
      issues.push({ field: `question.${q.id}.key`, message: keyError });
    } else if (seenKeys.has(trimmedKey)) {
      issues.push({
        field: `question.${q.id}.key`,
        message: `Duplicate question key "${trimmedKey}". Each question key must be unique.`,
      });
    } else {
      seenKeys.add(trimmedKey);
    }

    if (!q.instructions.trim()) {
      issues.push({
        field: `question.${q.id}.instructions`,
        message: `Question "${trimmedKey || q.id}" must include text instructions.`,
      });
    }

    if (q.type === 'noul') {
      if (q.threshold <= 0.01 || q.threshold >= 0.99) {
        issues.push({
          field: `question.${q.id}.threshold`,
          message: `Threshold for "${trimmedKey || q.id}" must stay strictly inside (0.01, 0.99).`,
        });
      }
    } else if (q.type === 'choice') {
      if (q.options.length < 2 || q.options.length > 255) {
        issues.push({
          field: `question.${q.id}.options`,
          message: `Choice question "${trimmedKey || q.id}" requires between 2 and 255 options.`,
        });
      }
      const optionKeys = new Set<string>();
      for (const opt of q.options) {
        const optKey = opt.key.trim();
        if (!optKey) {
          issues.push({
            field: `question.${q.id}.options`,
            message: `Every option key in "${trimmedKey || q.id}" must be non-empty.`,
          });
        } else if (optionKeys.has(optKey)) {
          issues.push({
            field: `question.${q.id}.options`,
            message: `Duplicate option key "${optKey}" in "${trimmedKey || q.id}".`,
          });
        } else {
          optionKeys.add(optKey);
        }
      }
      if (q.confidenceThreshold < 0.1 || q.confidenceThreshold > 0.99) {
        issues.push({
          field: `question.${q.id}.confidenceThreshold`,
          message: `Confidence threshold for "${trimmedKey || q.id}" must be between 0.10 and 0.99.`,
        });
      }
    } else if (q.type === 'score') {
      if (q.levels.length < 2 || q.levels.length > 255) {
        issues.push({
          field: `question.${q.id}.levels`,
          message: `Score rubric "${trimmedKey || q.id}" requires between 2 and 255 levels.`,
        });
      }
      if (q.levels.some((lvl) => lvl.trim().length === 0)) {
        issues.push({
          field: `question.${q.id}.levels`,
          message: `All rubric level descriptions in "${trimmedKey || q.id}" must be non-empty.`,
        });
      }
    }
  }

  return issues;
}

export interface ApiTextPart {
  type: 'text';
  text: string;
}

export interface ApiMediaPart {
  type: 'image' | 'document';
  data: string;
  mime_type: string;
  resolution?: string;
}

export type ApiInputPart = ApiTextPart | ApiMediaPart;

export function buildApiQuestionsObject(
  questions: DecisionQuestionConfig[],
): Record<string, Record<string, unknown>> {
  const result: Record<string, Record<string, unknown>> = {};

  for (const q of questions) {
    const key = q.key.trim();
    if (q.type === 'noul') {
      const payload: Record<string, unknown> = {
        type: 'noul',
        instructions: q.instructions.trim(),
      };
      const trueDesc = q.trueDescription.trim();
      const falseDesc = q.falseDescription.trim();
      if (trueDesc || falseDesc) {
        payload.criteria = {
          ...(trueDesc ? { true_description: trueDesc } : {}),
          ...(falseDesc ? { false_description: falseDesc } : {}),
        };
      }
      result[key] = payload;
    } else if (q.type === 'choice') {
      const criteria: Record<string, string> = {};
      const sortedKeys = sortKeysUtf8(q.options.map((o) => o.key.trim()));
      const descByKey = new Map(q.options.map((o) => [o.key.trim(), o.description.trim()]));
      for (const optKey of sortedKeys) {
        criteria[optKey] = descByKey.get(optKey) ?? '';
      }
      result[key] = {
        type: 'choice',
        instructions: q.instructions.trim(),
        criteria,
      };
    } else if (q.type === 'score') {
      result[key] = {
        type: 'score',
        instructions: q.instructions.trim(),
        criteria: q.levels.map((lvl) => lvl.trim()),
      };
    }
  }

  return result;
}

export function formatInputBlocksForPreview(
  inputBlocks: InputBlock[],
  resolvedMediaBytes?: Record<string, number>,
): Array<Record<string, unknown>> {
  const parts: Array<Record<string, unknown>> = [];

  for (let i = 0; i < inputBlocks.length; i++) {
    const block = inputBlocks[i];
    if (block.type === 'text') {
      const raw = block.content.trim();
      if (!raw) continue;
      let formatted = raw;
      if (block.isJson) {
        try {
          formatted = JSON.stringify(JSON.parse(raw));
        } catch {
          formatted = raw;
        }
      }
      const needsTrailingNewline = i < inputBlocks.length - 1;
      parts.push({
        type: 'text',
        text: needsTrailingNewline ? `${formatted}\n` : formatted,
      });
    } else {
      const byteSize = resolvedMediaBytes?.[block.id] ?? block.byteSize ?? 0;
      parts.push({
        type: block.type,
        mime_type: block.mimeType,
        ...(block.type === 'image' && block.resolution ? { resolution: block.resolution } : {}),
        data: `<base64:${byteSize > 0 ? `${Math.round(byteSize / 1024)}KB` : 'media'}>`,
      });
    }
  }

  return parts;
}

export interface NoulEvaluation {
  passed: boolean;
  label: string;
  probability: number;
  confidence: number;
  marginFromThreshold: number;
}

export function evaluateNoulGate(
  answer: NoulAnswerPayload,
  threshold: number,
): NoulEvaluation {
  const passed = answer.noul >= threshold;
  const margin = Number((answer.noul - threshold).toFixed(4));
  return {
    passed,
    label: passed ? `TRUE · Meets threshold (${threshold.toFixed(2)})` : `FALSE · Below threshold (${threshold.toFixed(2)})`,
    probability: answer.noul,
    confidence: answer.confidence,
    marginFromThreshold: margin,
  };
}

export interface ChoiceEvaluation {
  selectedChoice: string;
  isConfident: boolean;
  effectiveRoute: string;
  confidence: number;
  sortedOptions: Array<{ key: string; probability: number; isWinner: boolean }>;
}

export function evaluateChoiceDecision(
  answer: ChoiceAnswerPayload,
  confidenceThreshold: number,
): ChoiceEvaluation {
  const entries = Object.entries(answer.probabilities ?? {}).sort(([, a], [, b]) => b - a);
  const isConfident = answer.confidence >= confidenceThreshold;
  return {
    selectedChoice: answer.choice,
    isConfident,
    effectiveRoute: isConfident ? answer.choice : 'human_escalation',
    confidence: answer.confidence,
    sortedOptions: entries.map(([key, probability]) => ({
      key,
      probability,
      isWinner: key === answer.choice,
    })),
  };
}

export interface ScoreEvaluation {
  expectedScore: number;
  maxIndex: number;
  normalizedPercent: number;
  confidence: number;
  topLevelIndex: string;
  topLevelLabel: string;
  levels: Array<{ index: number; label: string; probability: number; isTop: boolean }>;
}

export function evaluateScoreDecision(
  answer: ScoreAnswerPayload,
  criteriaLength: number,
): ScoreEvaluation {
  const maxIndex = Math.max(1, criteriaLength - 1);
  const entries = Object.entries(answer.probabilities ?? {}).sort(([, a], [, b]) => b - a);
  const topLevelIndex = entries[0]?.[0] ?? '0';
  const topLevelLabel = answer.legend?.[topLevelIndex] ?? '';
  const normalizedPercent = Math.max(0, Math.min(100, (answer.score / maxIndex) * 100));

  const levels: ScoreEvaluation['levels'] = [];
  for (let i = 0; i < criteriaLength; i++) {
    const idxKey = String(i);
    levels.push({
      index: i,
      label: answer.legend?.[idxKey] ?? `Level ${i}`,
      probability: answer.probabilities?.[idxKey] ?? 0,
      isTop: idxKey === topLevelIndex,
    });
  }

  return {
    expectedScore: answer.score,
    maxIndex,
    normalizedPercent,
    confidence: answer.confidence,
    topLevelIndex,
    topLevelLabel,
    levels,
  };
}
