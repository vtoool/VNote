import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  ChatBubbleBottomCenterTextIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline'

const featureCards = [
  {
    title: 'Guided conversations',
    description: 'Start every client call with ready-to-use scripts that adapt to your tone and goals.',
    icon: SparklesIcon
  },
  {
    title: 'Mobile friendly workspace',
    description: 'Capture notes with one hand while you move—no more pinching and zooming endlessly.',
    icon: DevicePhoneMobileIcon
  },
  {
    title: 'Secure by default',
    description: 'Your discovery notes live locally. Export or share only when you are ready.',
    icon: ShieldCheckIcon
  }
]

export default function Landing() {
  const navigate = useNavigate()
  const [activeAuthTab, setActiveAuthTab] = useState<'login' | 'signup'>('signup')

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-violet-100 px-6 py-10 text-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        <header className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-500">VNote</p>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white sm:text-5xl">
              Discovery calls without the scramble
            </h1>
            <p className="max-w-xl text-base text-slate-600 dark:text-slate-300">
              Craft context-rich notes, follow up faster, and stay human on every conversation. VNote keeps your prompts,
              scripts, and cards ready—no spreadsheet gymnastics required.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/workspace')}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:shadow-xl"
              >
                Enter workspace
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActiveAuthTab('signup')}
                className="inline-flex items-center gap-2 rounded-full border border-indigo-300/60 bg-white/70 px-6 py-3 text-sm font-semibold text-indigo-600 transition hover:border-indigo-400 hover:bg-white/90 dark:border-indigo-500/50 dark:bg-slate-900/70 dark:text-indigo-200"
              >
                Create free account
              </button>
            </div>
          </div>
          <div className="glass-panel w-full max-w-sm space-y-4 p-5">
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
              <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-indigo-500" />
              <p>"VNote is my co-pilot for every high-stakes call."</p>
            </div>
            <div className="rounded-3xl border border-indigo-200/60 bg-indigo-500/10 p-4 text-sm text-indigo-600 dark:border-indigo-500/40 dark:text-indigo-200">
              <p className="font-semibold">What&apos;s inside</p>
              <ul className="mt-2 space-y-1 text-indigo-700 dark:text-indigo-100">
                <li>• Templates tailored to complex conversations</li>
                <li>• Canvas boards to capture context in seconds</li>
                <li>• Guided scripts that adapt to your tone</li>
              </ul>
            </div>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="glass-panel space-y-4 p-6 transition hover:-translate-y-1 hover:shadow-glow"
            >
              <feature.icon className="h-10 w-10 text-indigo-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{feature.description}</p>
            </article>
          ))}
        </section>

        <section className="glass-panel grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Account access</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Cloud sync and collaborative workspaces are coming soon. Leave your email to be among the first to try it, or
              continue locally right away.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-200">
              <UserPlusIcon className="h-4 w-4" /> Early access beta
            </div>
          </div>
          <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-5 shadow-inner dark:border-slate-800/60 dark:bg-slate-900/70">
            <div className="flex items-center gap-3 rounded-full bg-slate-100/60 p-1 text-xs font-semibold text-slate-500 dark:bg-slate-800/60">
              <button
                onClick={() => setActiveAuthTab('login')}
                className={`flex-1 rounded-full px-3 py-2 transition ${
                  activeAuthTab === 'login' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : ''
                }`}
              >
                Log in
              </button>
              <button
                onClick={() => setActiveAuthTab('signup')}
                className={`flex-1 rounded-full px-3 py-2 transition ${
                  activeAuthTab === 'signup' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white' : ''
                }`}
              >
                Sign up
              </button>
            </div>
            <form className="mt-5 space-y-4" onSubmit={(event) => event.preventDefault()}>
              {activeAuthTab === 'login' ? (
                <>
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Email</span>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-slate-200/60 bg-white/90 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700/60 dark:bg-slate-900/60"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Password</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full rounded-2xl border border-slate-200/60 bg-white/90 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700/60 dark:bg-slate-900/60"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500/90 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
                    disabled
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    Login coming soon
                  </button>
                </>
              ) : (
                <>
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Name</span>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full rounded-2xl border border-slate-200/60 bg-white/90 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700/60 dark:bg-slate-900/60"
                    />
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Work email</span>
                    <input
                      type="email"
                      placeholder="team@company.com"
                      className="w-full rounded-2xl border border-slate-200/60 bg-white/90 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:border-slate-700/60 dark:bg-slate-900/60"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-violet-500/90 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-violet-500"
                    disabled
                  >
                    <UserPlusIcon className="h-4 w-4" />
                    Save my spot
                  </button>
                </>
              )}
            </form>
          </div>
        </section>

        <footer className="flex flex-col items-start gap-3 border-t border-white/40 pt-6 text-xs text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} VNote. All rights reserved.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#" className="hover:text-indigo-500">
              Privacy
            </a>
            <a href="#" className="hover:text-indigo-500">
              Terms
            </a>
            <a href="#" className="hover:text-indigo-500">
              Contact
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}
