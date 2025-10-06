import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState } from 'react'
import { parseProjectJson } from '../lib/import'

interface ImportDialogProps {
  open: boolean
  onClose: () => void
  onImport: (json: string) => void
}

export default function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [notes, setNotes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <Dialog.Panel className="glass-panel w-full max-w-lg space-y-4 p-6">
              <Dialog.Title className="text-lg font-semibold text-slate-700 dark:text-slate-100">Import project</Dialog.Title>
              <input
                type="file"
                accept="application/json"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  const text = await file.text()
                  try {
                    const preview = parseProjectJson(text)
                    setNotes(preview.notes)
                    onImport(JSON.stringify(preview.incoming))
                    onClose()
                  } catch (err) {
                    setError('Unable to parse file. Make sure it is a VNote export.')
                  }
                }}
                className="w-full rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-slate-700/50 dark:bg-slate-900/70"
              />
              {notes.length > 0 && (
                <div className="rounded-2xl bg-indigo-500/10 p-3 text-xs text-indigo-600 dark:text-indigo-200">
                  {notes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              )}
              {error && <p className="text-sm text-rose-500">{error}</p>}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
