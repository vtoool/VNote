import { CommandLineIcon, Cog6ToothIcon, HomeIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { useLocation, useNavigate } from 'react-router-dom'

interface MobileNavProps {
  onOpenCommand: () => void
}

export default function MobileNav({ onOpenCommand }: MobileNavProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  return (
    <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border border-white/70 bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/85 sm:hidden">
      <div className="flex items-center justify-around text-xs font-semibold">
        <button
          type="button"
          onClick={() => navigate('/workspace')}
          className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 ${
            isActive('/workspace')
              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-200'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <Squares2X2Icon className="h-5 w-5" />
          Workspace
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 ${
            location.pathname === '/'
              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-200'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <HomeIcon className="h-5 w-5" />
          Landing
        </button>
        <button
          type="button"
          onClick={() => navigate('/workspace/settings')}
          className={`flex flex-col items-center gap-1 rounded-2xl px-3 py-2 ${
            isActive('/workspace/settings')
              ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-200'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-300'
          }`}
        >
          <Cog6ToothIcon className="h-5 w-5" />
          Settings
        </button>
        <button
          type="button"
          onClick={onOpenCommand}
          className="flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-indigo-600 transition hover:bg-indigo-500/15 dark:text-indigo-200"
        >
          <CommandLineIcon className="h-5 w-5" />
          Command
        </button>
      </div>
    </nav>
  )
}
