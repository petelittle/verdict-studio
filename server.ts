import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import {
  buildApiQuestionsObject,
  formatInputBlocksForPreview,
  validateDecisionRequest,
} from './src/utils/decisionValidation';
import type {
  DecisionQuestionConfig,
  InputBlock,
} from './src/shared/decisionTypes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const SAMPLE_IMAGES_DIR = path.resolve(__dirname, 'src/assets/images');

function getDecisionsClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error(
        'GEMINI_API_KEY is not configured on the server. Add it in Settings > Secrets to run live Decisions API evaluations.',
      ),
      { statusCode: 503 },
    );
  }

  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function resolveSafeSampleAssetBase64(assetPath: string): { data: string; byteSize: number } {
  const normalized = assetPath.replace(/^\/+/, '');
  const resolved = path.resolve(__dirname, normalized);
  if (!resolved.startsWith(SAMPLE_IMAGES_DIR + path.sep)) {
    throw Object.assign(new Error(`Invalid sample asset path: ${assetPath}`), {
      statusCode: 400,
    });
  }
  if (!fs.existsSync(resolved)) {
    throw Object.assign(new Error(`Sample asset not found: ${assetPath}`), {
      statusCode: 404,
    });
  }
  const buf = fs.readFileSync(resolved);
  return {
    data: buf.toString('base64'),
    byteSize: buf.byteLength,
  };
}

async function startServer() {
  const app = express();

  // Support multimodal base64 uploads up to 50mb
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/decisions', async (req, res) => {
    const startedAt = Date.now();
    try {
      const body = req.body as {
        inputBlocks?: InputBlock[];
        questions?: DecisionQuestionConfig[];
      };

      const inputBlocks = Array.isArray(body?.inputBlocks) ? body.inputBlocks : [];
      const questions = Array.isArray(body?.questions) ? body.questions : [];

      const issues = validateDecisionRequest(inputBlocks, questions);
      if (issues.length > 0) {
        res.status(400).json({
          error: issues[0].message,
          issues,
        });
        return;
      }

      const apiInputParts: Array<Record<string, unknown>> = [];
      const resolvedMediaBytes: Record<string, number> = {};

      for (let i = 0; i < inputBlocks.length; i++) {
        const block = inputBlocks[i];
        if (block.type === 'text') {
          const raw = block.content.trim();
          if (!raw) continue;
          let textValue = raw;
          if (block.isJson) {
            textValue = JSON.stringify(JSON.parse(raw));
          }
          const needsNewline = i < inputBlocks.length - 1;
          apiInputParts.push({
            type: 'text',
            text: needsNewline ? `${textValue}\n` : textValue,
          });
        } else if (block.type === 'image' || block.type === 'document') {
          let b64Data = block.base64Data;
          if (!b64Data && block.assetPath) {
            const loaded = resolveSafeSampleAssetBase64(block.assetPath);
            b64Data = loaded.data;
            resolvedMediaBytes[block.id] = loaded.byteSize;
          } else if (b64Data) {
            resolvedMediaBytes[block.id] = Buffer.byteLength(b64Data, 'base64');
          }

          if (!b64Data) {
            res.status(400).json({
              error: `Media block "${block.name}" has no image or document payload.`,
            });
            return;
          }

          const mediaPart: Record<string, unknown> = {
            type: block.type,
            data: b64Data,
            mime_type: block.mimeType,
          };
          if (block.type === 'image' && block.resolution) {
            mediaPart.resolution = block.resolution;
          }
          apiInputParts.push(mediaPart);
        }
      }

      if (apiInputParts.length === 0) {
        res.status(400).json({ error: 'Input payload cannot be empty.' });
        return;
      }

      const apiQuestions = buildApiQuestionsObject(questions);
      const decisionsAi = getDecisionsClient();

      const requestParams = {
        model: 'gemini-decision-1' as const,
        input: apiInputParts,
        questions: apiQuestions,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await decisionsAi.decisions.create(requestParams as any);
      const latencyMs = Date.now() - startedAt;

      if (!result.answers || Object.keys(result.answers).length === 0) {
        res.status(422).json({
          error: 'The Decisions API returned no answers for this input.',
          prompt_feedback: result.prompt_feedback ?? null,
          response: result,
        });
        return;
      }

      res.json({
        requestPayloadPreview: {
          model: 'gemini-decision-1',
          input: formatInputBlocksForPreview(inputBlocks, resolvedMediaBytes),
          questions: apiQuestions,
        },
        response: {
          answers: result.answers,
          usage: result.usage,
          ...(result.prompt_feedback ? { prompt_feedback: result.prompt_feedback } : {}),
        },
        latencyMs,
      });
    } catch (err: unknown) {
      const errorObj = err as {
        status?: number;
        statusCode?: number;
        message?: string;
        error?: { message?: string; status?: string };
      };
      const status =
        typeof errorObj.status === 'number'
          ? errorObj.status
          : typeof errorObj.statusCode === 'number'
            ? errorObj.statusCode
            : 500;
      const message =
        errorObj.error?.message ||
        errorObj.message ||
        'Failed to execute decision batch against Gemini Decisions API.';

      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: message,
        status,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Verdict Studio server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
