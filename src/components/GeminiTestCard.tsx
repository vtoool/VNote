import { FormEvent, useMemo, useState } from "react";

import { DEFAULT_GEMINI_API_KEY } from "../config/gemini";

interface GeminiTestCardProps {
  className?: string;
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  [key: string]: unknown;
};

export default function GeminiTestCard({
  className = "",
}: GeminiTestCardProps) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState<GeminiGenerateResponse | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const hasResponseText = useMemo(
    () => typeof response === "string" && response.trim().length > 0,
    [response],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!prompt.trim()) {
      setError("Add a prompt so Gemini knows what to respond to.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setRawResponse(null);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        DEFAULT_GEMINI_API_KEY,
      )}`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message =
          (errorBody as { error?: { message?: string } } | null)?.error
            ?.message ?? `Request failed with status ${res.status}`;
        throw new Error(message);
      }

      const data: GeminiGenerateResponse = await res.json();
      setRawResponse(data);

      const textResponse =
        data.candidates
          ?.flatMap((candidate) => candidate.content?.parts ?? [])
          .map((part) => part.text ?? "")
          .join("\n") ?? "";

      setResponse(textResponse);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while contacting Gemini.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={`${className} space-y-4`} aria-live="polite">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Gemini API tester
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Run a quick prompt against{" "}
            <span className="font-medium text-slate-700 dark:text-slate-200">
              gemini-2.5-flash
            </span>{" "}
            using a client-side request—no API key required.
          </p>
        </div>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask Gemini anything..."
            rows={4}
            className="w-full rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-700/60 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-violet-400 dark:focus:ring-violet-500/30"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:shadow-glow focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-violet-400/60 dark:focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
        >
          {isLoading ? "Sending…" : "Send test prompt"}
        </button>
      </form>
      <div className="space-y-3">
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-600 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        ) : null}
        {!error && hasResponseText ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-sm shadow-sm dark:border-slate-800/80 dark:bg-slate-950/40">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Response
            </h3>
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
              {response}
            </pre>
          </div>
        ) : null}
        {!error && !isLoading && !hasResponseText && rawResponse ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300">
            Gemini responded without any text output.
          </div>
        ) : null}
      </div>
    </section>
  );
}
