import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'

interface ExportDialogProps {
  open: boolean
  onClose: () => void
  onExportJson: () => void
  onExportText: () => void
}

export default function ExportDialog({ open, onClose, onExportJson, onExportText }: ExportDialogProps) {
  return (
    <Transition show={open} as={Fragment} appear>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50" />
        </Transition.Child>
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="glass-panel w-full max-w-sm space-y-3 p-6">
              <Dialog.Title className="text-lg font-semibold text-slate-700 dark:text-slate-100">Export project</Dialog.Title>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Choose the format that best fits your next step.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onExportJson()
                    onClose()
                  }}
                  className="flex-1 rounded-2xl bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
                >
                  JSON
                </button>
                <button
                  onClick={() => {
                    onExportText()
                    onClose()
                  }}
                  className="flex-1 rounded-2xl bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-200"
                >
                  Markdown
                </button>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
