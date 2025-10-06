import { useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { StoreContext } from '../App'
import { search } from '../lib/search'
import { strings } from '../lib/i18n'

export default function SearchBar() {
  const store = useContext(StoreContext)!
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const results = useMemo(() => (term ? search(store.projects, term) : []), [store.projects, term])

  return (
    <div className="relative w-full max-w-md">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        placeholder={strings.searchPlaceholder}
        className="w-full rounded-2xl border-0 bg-slate-900/5 py-2 pl-10 pr-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:bg-white/10 dark:text-slate-100"
      />
      {term && results.length > 0 && (
        <div className="glass-panel absolute left-0 right-0 top-12 max-h-80 overflow-y-auto p-3 text-sm">
          <ul className="space-y-2">
            {results.map((result) => (
              <li key={`${result.projectId}-${result.cardId ?? result.canvasId ?? 'project'}`}>
                <button
                  onClick={() => {
                    if (result.canvasId) {
                      navigate(`/project/${result.projectId}/canvas/${result.canvasId}`)
                    } else {
                      navigate(`/project/${result.projectId}`)
                    }
                    setTerm('')
                  }}
                  className="w-full rounded-2xl px-3 py-2 text-left hover:bg-indigo-500/10"
                >
                  <p className="font-medium text-slate-700 dark:text-slate-100">{result.path}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{result.preview}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
