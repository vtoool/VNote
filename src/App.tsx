import { createContext, useEffect, useMemo, useState, useContext } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CommandLineIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
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
import Landing from './routes/Landing'
import SearchBar from './components/SearchBar'
import CommandPalette from './components/CommandPalette'
import Toast from './components/Toast'
import { strings } from './lib/i18n'
import MobileNav from './components/MobileNav'

export const StoreContext = createContext<StoreContextValue | null>(null)

function Header({
  onOpenCommand,
  canGoBack,
  onNavigateBack
}: {
  onOpenCommand: () => void
  canGoBack: boolean
  onNavigateBack: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  useEffect(() => {
    if (!mobileSearchOpen) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileSearchOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [mobileSearchOpen])

  return (
    <header className="glass-panel sticky top-4 z-40 mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5">
      <div className="flex w-full items-center gap-2">
        {canGoBack && (
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/5 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}
        <button
          onClick={() => navigate('/workspace')}
          className="rounded-2xl bg-slate-900/5 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-100"
        >
          {strings.appTitle}
        </button>
        <nav className="hidden items-center gap-1 sm:flex">
          {[
            { label: 'Workspace', path: '/workspace' },
            { label: 'Settings', path: '/workspace/settings' }
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                isActive(item.path)
                  ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-200'
                  : 'text-slate-600 hover:bg-slate-900/10 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/workspace/settings')}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/5 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200 sm:hidden"
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

function WorkspaceLayout({
  commandOpen,
  onOpenCommand,
  onCloseCommand
}: {
  commandOpen: boolean
  onOpenCommand: () => void
  onCloseCommand: () => void
}) {
  const store = useContext(StoreContext)!
  const location = useLocation()
  const navigate = useNavigate()
  const canGoBack = location.pathname !== '/workspace'

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/workspace')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 pb-28 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:pb-16">
      <Header onOpenCommand={onOpenCommand} canGoBack={canGoBack} onNavigateBack={handleBack} />
      <main className="mx-auto mt-6 w-full max-w-6xl px-4 pb-10 sm:pb-0">
        <Outlet />
      </main>
      <Toast savingState={store.savingState} />
      <CommandPalette open={commandOpen} onClose={onCloseCommand} />
      <MobileNav onOpenCommand={onOpenCommand} />
    </div>
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
        exportProjectToText(project, { agentName: store.settings.agentName })
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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/workspace"
          element={
            <WorkspaceLayout
              commandOpen={commandOpen}
              onOpenCommand={() => setCommandOpen(true)}
              onCloseCommand={() => setCommandOpen(false)}
            />
          }
        >
          <Route index element={<Home />} />
          <Route path="project/:projectId" element={<ProjectRoute />} />
          <Route path="project/:projectId/canvas/:canvasId" element={<CanvasRoute />} />
          <Route
            path="settings"
            element={
              <SettingsRoute
                theme={theme}
                onThemeChange={setTheme}
                agentName={store.settings.agentName}
                onAgentNameChange={(name) => store.updateSettings({ agentName: name })}
              />
            }
          />
        </Route>
        <Route path="/project/:projectId" element={<Navigate to="/workspace/project/:projectId" replace />} />
        <Route
          path="/project/:projectId/canvas/:canvasId"
          element={<Navigate to="/workspace/project/:projectId/canvas/:canvasId" replace />}
        />
        <Route path="/settings" element={<Navigate to="/workspace/settings" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </StoreContext.Provider>
  )
}
