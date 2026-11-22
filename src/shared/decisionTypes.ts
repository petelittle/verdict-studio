export type QuestionType = 'noul' | 'choice' | 'score';

export type ImageResolution = 'low' | 'medium' | 'high' | 'ultra_high';

export interface TextInputBlock {
  id: string;
  type: 'text';
  label: string;
  content: string;
  isJson?: boolean;
}

export interface MediaInputBlock {
  id: string;
  type: 'image' | 'document';
  name: string;
  mimeType: string;
  /** Preview URL or Vite asset path for built-in sample images */
  previewUrl: string;
  /** Built-in sample asset path relative to project root (e.g. /src/assets/images/...) */
  assetPath?: string;
  /** Base64 data without data-URI prefix for client-uploaded files */
  base64Data?: string;
  /** Image resolution setting for token vs detail trade-off */
  resolution?: ImageResolution;
  byteSize?: number;
}

export type InputBlock = TextInputBlock | MediaInputBlock;

export interface NoulQuestionConfig {
  id: string;
  key: string;
  type: 'noul';
  instructions: string;
  trueDescription: string;
  falseDescription: string;
  /** Client-side decision gate threshold strictly within (0.01, 0.99) */
  threshold: number;
}

export interface ChoiceOptionEntry {
  id: string;
  key: string;
  description: string;
}

export interface ChoiceQuestionConfig {
  id: string;
  key: string;
  type: 'choice';
  instructions: string;
  options: ChoiceOptionEntry[];
  /** Client-side minimum confidence threshold to auto-route instead of escalating */
  confidenceThreshold: number;
}

export interface ScoreQuestionConfig {
  id: string;
  key: string;
  type: 'score';
  instructions: string;
  levels: string[];
}

export type DecisionQuestionConfig =
  | NoulQuestionConfig
  | ChoiceQuestionConfig
  | ScoreQuestionConfig;

export interface DecisionPreset {
  id: string;
  name: string;
  category: string;
  summary: string;
  inputBlocks: InputBlock[];
  questions: DecisionQuestionConfig[];
}

export interface NoulAnswerPayload {
  type: 'noul';
  noul: number;
  confidence: number;
}

export interface ChoiceAnswerPayload {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

export interface ScoreAnswerPayload {
  type: 'score';
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
}

export type DecisionAnswerPayload =
  | NoulAnswerPayload
  | ChoiceAnswerPayload
  | ScoreAnswerPayload;

export interface DecisionUsage {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_tokens?: number;
  input_tokens_by_modality?: Array<{ modality?: string; tokens?: number }>;
}

export interface DecisionApiRawResponse {
  id?: string;
  model?: string;
  answers?: Record<string, DecisionAnswerPayload>;
  usage?: DecisionUsage;
  prompt_feedback?: unknown;
}

export interface DecisionExecutionResult {
  requestPayloadPreview: {
    model: string;
    input: Array<Record<string, unknown>>;
    questions: Record<string, unknown>;
  };
  response: DecisionApiRawResponse;
  latencyMs: number;
}

export interface DecisionRunRecord {
  id: string;
  timestamp: string;
  presetName: string;
  questionCount: number;
  inputSummary: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  questions: DecisionQuestionConfig[];
  result: DecisionExecutionResult;
}

export interface ValidationIssue {
  field: string;
  message: string;
}
