import { ThemeState } from "../lib/theme";

interface SettingsProps {
  theme: ThemeState;
  onThemeChange: (theme: ThemeState) => void;
  agentName: string;
  onAgentNameChange: (name: string) => void;
}

export default function SettingsRoute({ theme, onThemeChange, agentName, onAgentNameChange }: SettingsProps) {
  return (
    <div className="glass-panel mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Personalize how VNote feels while you work.
        </p>
      </header>
      <section className="space-y-4">
        <div className="rounded-3xl bg-white/70 p-4 shadow-sm dark:bg-slate-900/70">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Agent profile
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Personalize scripts and cards with the name you use on calls.
          </p>
          <div className="mt-4 space-y-2">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-200" htmlFor="agent-name">
              Display name
            </label>
            <input
              id="agent-name"
              value={agentName}
              onChange={(event) => onAgentNameChange(event.target.value)}
              placeholder="e.g. Alex from VNote"
              className="w-full rounded-2xl border border-slate-200/60 bg-white/90 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/70"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500">
              This name replaces any <code className="rounded bg-slate-200/80 px-1 py-0.5 text-[10px] uppercase tracking-wide text-slate-600 dark:bg-slate-800/70 dark:text-slate-200">{'{agent}'}</code> placeholders across templates.
            </p>
          </div>
        </div>
        <div className="rounded-3xl bg-white/70 p-4 shadow-sm dark:bg-slate-900/70">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Theme
          </h2>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => onThemeChange({ ...theme, mode: "light" })}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${theme.mode === "light" ? "bg-indigo-500 text-white" : "bg-slate-200/60 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200"}`}
            >
              Light
            </button>
            <button
              onClick={() => onThemeChange({ ...theme, mode: "dark" })}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${theme.mode === "dark" ? "bg-indigo-500 text-white" : "bg-slate-200/60 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200"}`}
            >
              Dark
            </button>
          </div>
        </div>
        <div className="rounded-3xl bg-white/70 p-4 shadow-sm dark:bg-slate-900/70">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Accent
          </h2>
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => onThemeChange({ ...theme, accent: "indigo" })}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${theme.accent === "indigo" ? "bg-indigo-500 text-white" : "bg-slate-200/60 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200"}`}
            >
              Indigo
            </button>
            <button
              onClick={() => onThemeChange({ ...theme, accent: "violet" })}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${theme.accent === "violet" ? "bg-violet-500 text-white" : "bg-slate-200/60 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200"}`}
            >
              Violet
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
