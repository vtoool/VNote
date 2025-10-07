import { ThemeState } from "../lib/theme";
import GeminiTestCard from "../components/GeminiTestCard";

interface SettingsProps {
  theme: ThemeState;
  onThemeChange: (theme: ThemeState) => void;
}

export default function SettingsRoute({ theme, onThemeChange }: SettingsProps) {
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
        <GeminiTestCard className="rounded-3xl bg-white/70 p-4 shadow-sm dark:bg-slate-900/70" />
      </section>
    </div>
  );
}
