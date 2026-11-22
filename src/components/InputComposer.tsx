import { useRef, useState } from 'react';
import {
  FileText,
  ImagePlus,
  Plus,
  Trash2,
  Braces,
  Image as ImageIcon,
} from 'lucide-react';
import type {
  ImageResolution,
  InputBlock,
  MediaInputBlock,
  TextInputBlock,
} from '../shared/decisionTypes';
import { SAMPLE_ASSETS } from '../data/presets';

interface InputComposerProps {
  blocks: InputBlock[];
  onChange: (blocks: InputBlock[]) => void;
  validationError?: string;
}

function ImageWithFallback({
  src,
  alt,
  name,
}: {
  src: string;
  alt: string;
  name: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className="w-full h-44 bg-slate-100 border border-slate-200 rounded-md flex flex-col items-center justify-center gap-2 text-slate-500">
        <ImageIcon className="w-6 h-6 text-slate-400" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-600">{name}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-44 object-cover rounded-md border border-slate-200 bg-slate-100"
    />
  );
}

export function InputComposer({
  blocks,
  onChange,
  validationError,
}: InputComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const addTextBlock = (isJson: boolean) => {
    const newBlock: TextInputBlock = {
      id: `txt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'text',
      label: isJson ? 'Structured JSON Block' : 'Context Text Block',
      isJson,
      content: isJson ? '{\n  "key": "value"\n}' : '',
    };
    onChange([...blocks, newBlock]);
  };

  const addSampleAsset = (assetId: string) => {
    const sample = SAMPLE_ASSETS.find((s) => s.id === assetId);
    if (!sample) return;
    const newBlock: MediaInputBlock = {
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: 'image',
      name: sample.name,
      mimeType: sample.mimeType,
      previewUrl: sample.assetPath,
      assetPath: sample.assetPath,
      resolution: 'medium',
    };
    onChange([...blocks, newBlock]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    if (!isPdf && !isImage) {
      setUploadError('Only image files (PNG, JPEG, WEBP) and PDF documents are supported.');
      e.target.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15 MB client upload limit.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      const newBlock: MediaInputBlock = {
        id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: isPdf ? 'document' : 'image',
        name: file.name,
        mimeType: file.type,
        previewUrl: isImage ? result : '',
        base64Data: base64,
        resolution: isImage ? 'medium' : undefined,
        byteSize: file.size,
      };
      onChange([...blocks, newBlock]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateBlock = (id: string, patch: Partial<InputBlock>) => {
    onChange(
      blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as InputBlock) : b)),
    );
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter((b) => b.id !== id));
  };

  const formatJsonBlock = (block: TextInputBlock) => {
    try {
      const parsed = JSON.parse(block.content);
      updateBlock(block.id, { content: JSON.stringify(parsed, null, 2) });
    } catch {
      // Leave invalid JSON intact so validation highlights it clearly
    }
  };

  return (
    <section
      aria-labelledby="shared-input-heading"
      className="bg-white border border-slate-200 rounded-lg"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            id="shared-input-heading"
            className="text-base font-semibold text-slate-900"
          >
            Shared Multimodal Input
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluated once across all questions in the batch · Text blocks join with newline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addTextBlock(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Text</span>
          </button>
          <button
            type="button"
            onClick={() => addTextBlock(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <Braces className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add JSON</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ImagePlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Attach Image / PDF</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Upload image or PDF file"
          />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {validationError && (
          <div
            role="alert"
            className="px-3.5 py-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md"
          >
            {validationError}
          </div>
        )}

        {uploadError && (
          <div
            role="alert"
            className="px-3.5 py-2.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-md"
          >
            {uploadError}
          </div>
        )}

        {blocks.length === 0 ? (
          <div className="py-8 px-4 text-center border border-dashed border-slate-300 rounded-md bg-slate-50">
            <p className="text-sm font-medium text-slate-700">
              No input blocks configured
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Add a text block, JSON payload, or attach a sample photo below to run an evaluation.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {blocks.map((block, index) => {
              if (block.type === 'text') {
                let jsonValid = true;
                if (block.isJson && block.content.trim()) {
                  try {
                    JSON.parse(block.content);
                  } catch {
                    jsonValid = false;
                  }
                }

                return (
                  <div
                    key={block.id}
                    className="border border-slate-200 rounded-md bg-slate-50/70 p-3.5 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-slate-400 tabular-nums">
                          #{index + 1}
                        </span>
                        <input
                          type="text"
                          value={block.label}
                          onChange={(e) =>
                            updateBlock(block.id, { label: e.target.value })
                          }
                          aria-label={`Block ${index + 1} label`}
                          className="text-xs font-medium text-slate-800 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none px-1 py-0.5"
                        />
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {block.isJson ? 'JSON serialized' : 'Plain text'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {block.isJson && (
                          <button
                            type="button"
                            onClick={() => formatJsonBlock(block)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 whitespace-nowrap"
                          >
                            Format JSON
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            updateBlock(block.id, { isJson: !block.isJson })
                          }
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-200/60 whitespace-nowrap"
                        >
                          {block.isJson ? 'Switch to Text' : 'Switch to JSON'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeBlock(block.id)}
                          aria-label={`Remove input block ${block.label || index + 1}`}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={block.content}
                      onChange={(e) =>
                        updateBlock(block.id, { content: e.target.value })
                      }
                      rows={block.isJson ? 5 : 4}
                      aria-label={block.label || `Input text block ${index + 1}`}
                      placeholder={
                        block.isJson
                          ? '{"order_id": "1234", "tier": "Gold"}'
                          : 'Enter customer message, report, or document text to evaluate...'
                      }
                      className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 ${
                        block.isJson ? 'font-mono text-xs' : ''
                      } ${!jsonValid ? 'border-red-400' : 'border-slate-300'}`}
                    />
                    {!jsonValid && (
                      <p className="text-xs text-red-600">
                        Invalid JSON syntax — fix formatting or switch block mode to Plain text.
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={block.id}
                  className="border border-slate-200 rounded-md bg-slate-50/70 p-3.5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-slate-400 tabular-nums">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-medium text-slate-800 truncate">
                        {block.name}
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-mono text-slate-500">
                        {block.mimeType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {block.type === 'image' && (
                        <label className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span>Resolution</span>
                          <select
                            value={block.resolution ?? 'medium'}
                            onChange={(e) =>
                              updateBlock(block.id, {
                                resolution: e.target.value as ImageResolution,
                              })
                            }
                            aria-label={`Image resolution for ${block.name}`}
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600"
                          >
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                            <option value="ultra_high">ultra_high</option>
                          </select>
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={() => removeBlock(block.id)}
                        aria-label={`Remove media block ${block.name}`}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-blue-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {block.type === 'image' ? (
                    <ImageWithFallback
                      src={block.previewUrl}
                      alt={block.name}
                      name={block.name}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-md">
                      <FileText className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {block.name}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          PDF document · {block.byteSize ? `${Math.round(block.byteSize / 1024)} KB` : 'Attached'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Quick-attach sample inspection image:</span>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_ASSETS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => addSampleAsset(sample.id)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap"
              >
                + {sample.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
