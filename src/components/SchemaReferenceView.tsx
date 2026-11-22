export function SchemaReferenceView() {
  const sampleSnippet = `import { GoogleGenAI } from "@google/genai";

const decisionsAi = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  apiVersion: "v1beta",
});

const result = await decisionsAi.decisions.create({
  model: "gemini-decision-1",
  input: [
    { type: "text", text: JSON.stringify(order) + "\\n" },
    { type: "text", text: customerMessage },
  ],
  questions: {
    is_defect: {
      type: "noul",
      instructions: "Is the customer reporting a hardware defect?",
      criteria: {
        true_description: "Broken, cracked, or malfunctioning hardware.",
        false_description: "Preference, sizing, shipping, or pricing issue.",
      },
    },
    department: {
      type: "choice",
      instructions: "Which department should handle this request?",
      criteria: {
        billing: "Payments, invoices, and refunds.",
        technical: "Problems using the product.",
        other: "Anything outside these categories.",
      },
    },
    severity: {
      type: "score",
      instructions: "How severe is this issue for the user?",
      criteria: [
        "Cosmetic: appearance only, no lost functionality.",
        "Workaround available: a task fails, another way works.",
        "Fully blocked: core workflow fails with no workaround.",
      ],
    },
  },
});`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Decisions API Reference Guide
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Key architectural rules for <span className="font-mono">gemini-decision-1</span> via{' '}
          <span className="font-mono">ai.decisions.create</span> on <span className="font-mono">v1beta</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-900">
            01. noul (Yes / No)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Returns calibrated <span className="font-mono">noul</span> probability in{' '}
            <span className="font-mono tabular-nums">[0.01, 0.99]</span> and{' '}
            <span className="font-mono">confidence</span>. Keep decision thresholds strictly inside{' '}
            <span className="font-mono tabular-nums">(0.01, 0.99)</span>.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-900">
            02. choice (Single-Select)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Accepts 2 to 255 keys sorted in UTF-8 byte order. Always distributes probability across options—pair with a catch-all key like <span className="font-mono">other</span> and confidence gating.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
          <div className="text-xs font-mono font-semibold text-slate-900">
            03. score (Ordered Rubric)
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Accepts 2 to 255 linear level descriptions ordered lowest first. Returns probability-weighted expected index <span className="font-mono">score</span> plus <span className="font-mono">legend</span>.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Server-Side SDK Integration Pattern
          </h2>
        </div>
        <pre className="p-5 text-xs font-mono bg-slate-900 text-slate-100 overflow-x-auto leading-relaxed">
          {sampleSnippet}
        </pre>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Operational Limits & Constraints
        </h2>
        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4 leading-relaxed">
          <li>
            Up to <span className="font-mono tabular-nums">1,000</span> independent questions per batch; shared input tokens are counted once, and output tokens are strictly <span className="font-mono tabular-nums">0</span>.
          </li>
          <li>
            Total input limit of <span className="font-mono tabular-nums">262,144</span> tokens across shared input and all question prompts.
          </li>
          <li>
            Question keys must match <span className="font-mono">[A-Za-z0-9_-]+</span> (1–64 chars) and are hidden from the model; place the full prompt inside <span className="font-mono">instructions</span>.
          </li>
          <li>
            Adjacent <span className="font-mono">text</span> input blocks are concatenated with no implicit separator—append explicit newlines when mixing JSON and prose.
          </li>
        </ul>
      </div>
    </div>
  );
}
