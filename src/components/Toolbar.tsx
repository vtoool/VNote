import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowDownTrayIcon,
  PhoneArrowUpRightIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { strings } from '../lib/i18n'

interface ToolbarProps {
  onUndo: () => void
  onRedo: () => void
  onExportJson: () => void
  onExportText: () => void
  onImport: () => void
  onToggleCallMode?: () => void
  callModeActive?: boolean
}

export default function Toolbar({
  onUndo,
  onRedo,
  onExportJson,
  onExportText,
  onImport,
  onToggleCallMode,
  callModeActive
}: ToolbarProps) {
  return (
    <div className="glass-panel flex flex-wrap items-center gap-3 p-4">
      <button
        onClick={onUndo}
        className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200"
      >
        <ArrowUturnLeftIcon className="h-4 w-4" /> {strings.actionUndo}
      </button>
      <button
        onClick={onRedo}
        className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-white dark:bg-slate-900/60 dark:text-slate-200"
      >
        <ArrowUturnRightIcon className="h-4 w-4" /> {strings.actionRedo}
      </button>
      <div className="ml-auto flex flex-wrap gap-2">
        {onToggleCallMode && (
          <button
            onClick={onToggleCallMode}
            className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
              callModeActive
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200'
            }`}
          >
            <PhoneArrowUpRightIcon className="h-4 w-4" /> {callModeActive ? 'Exit call mode' : 'Call mode'}
          </button>
        )}
        <button
          onClick={onImport}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
        >
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-white">
            <CheckIcon className="h-4 w-4" aria-hidden="true" />
          </span>
          {strings.import}
        </button>
        <button
          onClick={onExportJson}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
        >
          <ArrowDownTrayIcon className="h-4 w-4" /> JSON
        </button>
        <button
          onClick={onExportText}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
        >
          <ArrowDownTrayIcon className="h-4 w-4" /> Text
        </button>
      </div>
    </div>
  )
}
