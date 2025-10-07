import { createContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { CommandLineIcon, Cog6ToothIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLocalStore } from './hooks/useLocalStore'
import { applyTheme, loadTheme, saveTheme, ThemeState } from './lib/theme'
import { exportProjectToJson, exportProjectToText } from './lib/export'
export type StoreContextValue = ReturnType<typeof useLocalStore> & {
  theme: ThemeState;
  setTheme: (theme: ThemeState) => void;
  exportProject: (projectId: string, format: 'json' | 'text') => void;
}

import Home from './routes/Home'
import ProjectRoute from './routes/Project'
import CanvasRoute from './routes/Canvas'
import SettingsRoute from './routes/Settings'
import SearchBar from './components/SearchBar'
import CommandPalette from './components/CommandPalette'
import Toast from './components/Toast'
import { strings } from './lib/i18n'

export const StoreContext = createContext<StoreContextValue | null>(null)

function Header({ onOpenCommand }: { onOpenCommand: () => void }) {
  const navigate = useNavigate()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    if (!mobileSearchOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSearchOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mobileSearchOpen])

  return (
    <header className="glass-panel sticky top-4 z-40 mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
      <div className="flex w-full items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="rounded-2xl bg-slate-900/5 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-100"
        >
          {strings.appTitle}
        </button>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/5 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
            aria-label="Open settings"
          >
            <Cog6ToothIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900/5 p-2 text-slate-600 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200 sm:hidden"
            aria-label="Open search"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onOpenCommand}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-200"
            aria-label="Open command palette"
          >
            <CommandLineIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Cmd / Ctrl + K</span>
          </button>
        </div>
      </div>
      <div className="hidden w-full sm:block">
        <SearchBar />
      </div>

      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col gap-4 bg-slate-900/80 px-4 py-16 backdrop-blur-sm sm:hidden"
          onClick={() => setMobileSearchOpen(false)}
        >
          <div
            className="glass-panel mx-auto w-full max-w-lg rounded-3xl p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <SearchBar
                autoFocus
                containerClassName="max-w-none"
                inputClassName="py-3 text-base"
                onNavigate={() => setMobileSearchOpen(false)}
              />
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-600 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
                aria-label="Close search"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default function App() {
  const store = useLocalStore()
  const [theme, setTheme] = useState<ThemeState>(() => loadTheme())
  const [commandOpen, setCommandOpen] = useState(false)

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
  }, [theme])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
      }
    }
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  const contextValue = useMemo<StoreContextValue>(() => ({
    ...store,
    theme,
    setTheme,
    exportProject: (projectId: string, format: 'json' | 'text') => {
      const project = store.projects.find((p) => p.id === projectId)
      if (!project) return
      if (format === 'json') {
        exportProjectToJson(project)
      } else {
        exportProjectToText(project)
      }
    }
  }), [store, theme])

  if (!store.ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-violet-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="glass-panel max-w-md space-y-4 p-8 text-center">
          <p className="text-lg font-medium text-slate-600 dark:text-slate-200">Loading workspace…</p>
        </div>
      </div>
    )
  }

  return (
    <StoreContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 pb-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Header onOpenCommand={() => setCommandOpen(true)} />
        <main className="mx-auto mt-6 w-full max-w-6xl px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/project/:projectId" element={<ProjectRoute />} />
            <Route path="/project/:projectId/canvas/:canvasId" element={<CanvasRoute />} />
            <Route path="/settings" element={<SettingsRoute theme={theme} onThemeChange={setTheme} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Toast savingState={store.savingState} />
        <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      </div>
    </StoreContext.Provider>
  )
}
