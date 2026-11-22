import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildApiQuestionsObject,
  evaluateChoiceDecision,
  evaluateNoulGate,
  evaluateScoreDecision,
  sortKeysUtf8,
  validateDecisionRequest,
  validateQuestionKey,
} from './decisionValidation';
import type { DecisionQuestionConfig, InputBlock } from '../shared/decisionTypes';

test('validateQuestionKey accepts valid keys and rejects invalid ones', () => {
  assert.equal(validateQuestionKey('is_defect-01'), null);
  assert.equal(validateQuestionKey(''), 'Question key is required.');
  assert.equal(
    validateQuestionKey('invalid key with spaces'),
    'Question key may only contain letters, numbers, underscores, and hyphens.',
  );
  assert.equal(
    validateQuestionKey('a'.repeat(65)),
    'Question key must be 64 characters or fewer.',
  );
});

test('sortKeysUtf8 sorts option keys in UTF-8 byte order', () => {
  assert.deepEqual(sortKeysUtf8(['shipping', 'billing', 'other', 'technical']), [
    'billing',
    'other',
    'shipping',
    'technical',
  ]);
});

test('validateDecisionRequest rejects empty input and boundary-violating thresholds', () => {
  const emptyInput: InputBlock[] = [
    { id: 't1', type: 'text', label: 'Message', content: '   ' },
  ];
  const questions: DecisionQuestionConfig[] = [
    {
      id: 'q1',
      key: 'is_defect',
      type: 'noul',
      instructions: 'Is this a hardware defect?',
      trueDescription: 'Broken hardware',
      falseDescription: 'Preference issue',
      threshold: 0.99, // invalid boundary: must be strictly < 0.99
    },
  ];
  const issues = validateDecisionRequest(emptyInput, questions);
  assert.equal(issues.length, 2);
  assert.match(issues[0].message, /Shared input cannot be empty/);
  assert.match(issues[1].message, /strictly inside \(0\.01, 0\.99\)/);
});

test('validateDecisionRequest catches duplicate keys and invalid JSON blocks', () => {
  const input: InputBlock[] = [
    { id: 't1', type: 'text', label: 'Order', content: '{ bad json', isJson: true },
  ];
  const questions: DecisionQuestionConfig[] = [
    {
      id: 'q1',
      key: 'same_key',
      type: 'noul',
      instructions: 'First question',
      trueDescription: '',
      falseDescription: '',
      threshold: 0.7,
    },
    {
      id: 'q2',
      key: 'same_key',
      type: 'score',
      instructions: 'Second question',
      levels: ['Low', 'High'],
    },
  ];

  const issues = validateDecisionRequest(input, questions);
  assert.equal(issues.some((i) => i.message.includes('invalid JSON syntax')), true);
  assert.equal(issues.some((i) => i.message.includes('Duplicate question key')), true);
});

test('buildApiQuestionsObject serializes noul, choice (alphabetical), and score rubrics', () => {
  const questions: DecisionQuestionConfig[] = [
    {
      id: 'q1',
      key: 'is_defect',
      type: 'noul',
      instructions: 'Is it broken?',
      trueDescription: 'Faulty hardware',
      falseDescription: 'Buyer preference',
      threshold: 0.8,
    },
    {
      id: 'q2',
      key: 'dept',
      type: 'choice',
      instructions: 'Route ticket',
      options: [
        { id: 'o1', key: 'technical', description: 'Product bugs' },
        { id: 'o2', key: 'billing', description: 'Refunds and charges' },
      ],
      confidenceThreshold: 0.7,
    },
    {
      id: 'q3',
      key: 'severity',
      type: 'score',
      instructions: 'Rate severity',
      levels: ['Minor', 'Moderate', 'Critical'],
    },
  ];

  const built = buildApiQuestionsObject(questions);
  assert.deepEqual(Object.keys(built.dept.criteria as Record<string, string>), [
    'billing',
    'technical',
  ]);
  assert.deepEqual(built.severity.criteria, ['Minor', 'Moderate', 'Critical']);
  assert.deepEqual(built.is_defect.criteria, {
    true_description: 'Faulty hardware',
    false_description: 'Buyer preference',
  });
});

test('evaluateNoulGate, evaluateChoiceDecision, and evaluateScoreDecision compute expected verdicts', () => {
  const noulPass = evaluateNoulGate({ type: 'noul', noul: 0.84, confidence: 0.84 }, 0.75);
  assert.equal(noulPass.passed, true);
  assert.equal(noulPass.marginFromThreshold, 0.09);

  const choiceUncertain = evaluateChoiceDecision(
    {
      type: 'choice',
      choice: 'billing',
      confidence: 0.55,
      probabilities: { billing: 0.55, technical: 0.35, other: 0.1 },
    },
    0.7,
  );
  assert.equal(choiceUncertain.isConfident, false);
  assert.equal(choiceUncertain.effectiveRoute, 'human_escalation');
  assert.equal(choiceUncertain.sortedOptions[0].key, 'billing');

  const scoreEval = evaluateScoreDecision(
    {
      type: 'score',
      score: 1.5,
      confidence: 0.65,
      legend: { '0': 'Low', '1': 'Medium', '2': 'High' },
      probabilities: { '0': 0.1, '1': 0.3, '2': 0.6 },
    },
    3,
  );
  assert.equal(scoreEval.normalizedPercent, 75);
  assert.equal(scoreEval.topLevelIndex, '2');
  assert.equal(scoreEval.topLevelLabel, 'High');
});
