import { useState } from 'react'
import { GROUPS, GROUP_SIZE, WORDS, fmt } from '../lib/words'
import { canSpeak } from '../lib/speech'
import { goalOf } from '../lib/srs'

const input =
  'w-full rounded-xl bg-slate-950/60 px-4 py-3 text-[15px] text-white ring-1 ring-white/10 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400'
const primary =
  'w-full rounded-full bg-indigo-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300'
const linkBtn = 'text-sm text-indigo-300 hover:text-indigo-200 underline-offset-4 hover:underline'

const FRIENDLY = {
  'Invalid login credentials': 'That email and password don’t match an account.',
  'Email not confirmed': 'Please confirm your email first. Check your inbox for the link.',
  'User already registered': 'An account with this email already exists. Try signing in.',
}
const friendly = (e) => FRIENDLY[e?.message] || e?.message || 'Something went wrong. Please try again.'

function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      <input className={input} {...props} />
    </label>
  )
}

function Notice({ tone = 'info', children }) {
  const cls = tone === 'error' ? 'bg-rose-500/10 text-rose-100 ring-rose-400/30' : 'bg-emerald-500/10 text-emerald-100 ring-emerald-400/30'
  return <p className={`rounded-xl p-3 text-sm leading-relaxed ring-1 ${cls}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</p>
}

function useForm(run) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      setMsg(await run(new FormData(e.currentTarget)))
    } catch (err) {
      setMsg({ tone: 'error', text: friendly(err) })
    }
    setBusy(false)
  }
  return { busy, msg, submit }
}

export function AuthForms({ account }) {
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')

  const signin = useForm(async (f) => {
    const { error } = await account.signIn(f.get('email'), f.get('password'))
    return error ? { tone: 'error', text: friendly(error) } : null
  })
  const signup = useForm(async (f) => {
    if (f.get('password') !== f.get('confirm')) return { tone: 'error', text: 'The two passwords don’t match.' }
    const { error, needsConfirm } = await account.signUp(f.get('email'), f.get('password'))
    if (error) return { tone: 'error', text: friendly(error) }
    return needsConfirm ? { tone: 'ok', text: `Almost done: we sent a confirmation link to ${f.get('email')}. Open it on this device to finish creating your account.` } : null
  })
  const forgot = useForm(async (f) => {
    const { error } = await account.sendReset(f.get('email'))
    if (error) return { tone: 'error', text: friendly(error) }
    return { tone: 'ok', text: `If an account exists for ${f.get('email')}, a reset link is on its way. Open it to choose a new password.` }
  })

  const tabs = [
    ['signin', 'Sign in'],
    ['signup', 'Create account'],
  ]
  const emailField = (
    <Field label="Email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
  )

  return (
    <div className="flex flex-col gap-6">
      {tab !== 'forgot' && (
        <div role="tablist" className="grid grid-cols-2 rounded-full bg-slate-950/60 p-1 ring-1 ring-white/10">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full py-2 text-sm font-medium transition ${tab === id ? 'bg-white text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === 'signin' && (
        <form onSubmit={signin.submit} className="flex flex-col gap-4">
          {emailField}
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          {signin.msg && <Notice tone={signin.msg.tone}>{signin.msg.text}</Notice>}
          <button className={primary} disabled={signin.busy}>{signin.busy ? 'Signing in…' : 'Sign in'}</button>
          <button type="button" className={`${linkBtn} self-center`} onClick={() => setTab('forgot')}>
            Forgot your password?
          </button>
        </form>
      )}

      {tab === 'signup' && (
        <form onSubmit={signup.submit} className="flex flex-col gap-4">
          {emailField}
          <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={6} required />
          <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" minLength={6} required />
          <p className="text-xs text-slate-500">At least 6 characters.</p>
          {signup.msg && <Notice tone={signup.msg.tone}>{signup.msg.text}</Notice>}
          <button className={primary} disabled={signup.busy}>{signup.busy ? 'Creating account…' : 'Create account'}</button>
        </form>
      )}

      {tab === 'forgot' && (
        <form onSubmit={forgot.submit} className="flex flex-col gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-white">Reset your password</h2>
            <p className="mt-1 text-sm text-slate-400">Enter your account email and we’ll send you a link to set a new password.</p>
          </div>
          {emailField}
          {forgot.msg && <Notice tone={forgot.msg.tone}>{forgot.msg.text}</Notice>}
          <button className={primary} disabled={forgot.busy}>{forgot.busy ? 'Sending…' : 'Send reset link'}</button>
          <button type="button" className={`${linkBtn} self-center`} onClick={() => setTab('signin')}>
            Back to sign in
          </button>
        </form>
      )}
    </div>
  )
}

function NewPassword({ account, title = 'Choose a new password', onDone }) {
  const form = useForm(async (f) => {
    if (f.get('password') !== f.get('confirm')) return { tone: 'error', text: 'The two passwords don’t match.' }
    const { error } = await account.setPassword(f.get('password'))
    if (error) return { tone: 'error', text: friendly(error) }
    onDone?.()
    return { tone: 'ok', text: 'Password updated.' }
  })
  return (
    <form onSubmit={form.submit} className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={6} required />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" minLength={6} required />
      {form.msg && <Notice tone={form.msg.tone}>{form.msg.text}</Notice>}
      <button className={primary} disabled={form.busy}>{form.busy ? 'Saving…' : 'Save new password'}</button>
    </form>
  )
}

function Stat({ label, value, of }) {
  return (
    <div className="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/5">
      <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-white tabular">
        {fmt(value)}
        {of != null && <span className="text-sm font-normal text-slate-500"> / {fmt(of)}</span>}
      </p>
    </div>
  )
}

const SYNC_TEXT = {
  idle: 'Not synced yet',
  loading: 'Loading your progress…',
  saving: 'Saving…',
  saved: 'All progress saved to your account',
  error: 'Couldn’t reach the server. Your progress is kept on this device and will save when you’re back online.',
}

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-4">
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-white">{label}</span>
        <span className="block text-sm text-slate-400">{hint}</span>
      </span>
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        aria-hidden="true"
        className="relative h-7 w-12 shrink-0 rounded-full bg-slate-700 ring-1 ring-white/10 transition peer-checked:bg-indigo-500 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-300 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
      />
    </label>
  )
}

const GOAL_MIN = 5
const GOAL_MAX = 500

function GoalStepper({ goal, setGoal }) {
  const [draft, setDraft] = useState(String(goal))
  const commit = (n) => {
    const v = Math.min(GOAL_MAX, Math.max(GOAL_MIN, Math.round(Number(n)) || goal))
    setDraft(String(v))
    if (v !== goal) setGoal(v)
  }
  const step = (d) => commit(goal + d)
  const btn =
    'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-800 text-lg text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700 disabled:opacity-40'
  return (
    <div className="flex items-center gap-4">
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-white">Daily goal</span>
        <span className="block text-sm text-slate-400">Cards to swipe each day to keep your streak</span>
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" className={btn} onClick={() => step(-5)} disabled={goal <= GOAL_MIN} aria-label="Lower the daily goal by 5">
          −
        </button>
        <input
          inputMode="numeric"
          aria-label="Daily goal in cards"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
          onBlur={() => commit(draft)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="w-14 rounded-xl bg-slate-950/60 py-2 text-center text-[16px] font-medium text-white ring-1 ring-white/10 tabular focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button type="button" className={btn} onClick={() => step(5)} disabled={goal >= GOAL_MAX} aria-label="Raise the daily goal by 5">
          +
        </button>
      </div>
    </div>
  )
}

const BUILT = new Date(__BUILD_DATE__).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })

function About() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl bg-slate-950/50 ring-1 ring-white/5">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 rounded-2xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-800 text-slate-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-white">About FrenchFlash</span>
          <span className="block text-sm text-slate-400">What the app does, version and creator</span>
        </span>
        <span className={`text-slate-300 transition ${open ? 'rotate-90' : ''}`} aria-hidden="true">→</span>
      </button>
      {open && (
        <div className="flex flex-col gap-4 px-4 pb-4 animate-fade-up">
          <p className="text-sm leading-relaxed text-slate-300">
            FrenchFlash helps you build the vocabulary for the TCF Canada exam, aiming for CLB 7. It holds 6,250 words in 125 levels of 50. Swipe through each
            level until every word is learned, then test yourself in exam mode in both directions. Learned words come back for review on a spaced-repetition schedule, and a daily goal and streak keep you going. Reverse, typing and listening modes train spelling, gender and the listening section. It also includes a guide to the TCF format and 10 full sample
            exams, and your progress syncs to your account on every device.
          </p>
          <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-slate-400">Version</dt>
            <dd className="text-white tabular">{__APP_VERSION__}</dd>
            <dt className="text-slate-400">Last updated</dt>
            <dd className="text-white">{BUILT}</dd>
            <dt className="text-slate-400">Created by</dt>
            <dd className="text-white">Kevin Andrin</dd>
          </dl>
        </div>
      )}
    </div>
  )
}

function Profile({ account, progress, theme, setTheme, settings, onOpenGuide, onOpenExams }) {
  const [changing, setChanging] = useState(false)
  const learned = progress.learned.ids
  const completed = GROUPS.filter((g) => g.ids.every((id) => learned.has(id)))
  const examWords = completed.length * GROUP_SIZE
  const inCompleted = (set) => completed.reduce((n, g) => n + g.ids.filter((id) => set.has(id)).length, 0)
  const { sync, user } = account
  const since = user.created_at ? new Date(user.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-indigo-500 font-display text-2xl font-semibold text-white">
          {user.email[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-medium text-white">{user.email}</p>
          {since && <p className="text-sm text-slate-400">Member since {since}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Words learned" value={learned.size} of={WORDS.length} />
        <Stat label="Levels completed" value={completed.length} of={GROUPS.length} />
        <Stat label="Exam FR → EN" value={inCompleted(progress['fr-en'].ids)} of={examWords} />
        <Stat label="Exam EN → FR" value={inCompleted(progress['en-fr'].ids)} of={examWords} />
      </div>

      <button
        onClick={onOpenGuide}
        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-slate-900 p-4 text-left ring-1 ring-indigo-400/30 transition hover:ring-indigo-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/25 text-indigo-100">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h6M8 11h6" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-white">TCF exam format</span>
          <span className="block text-sm text-slate-400">Sections, questions, timing, scores and the CLB levels you need</span>
        </span>
        <span className="text-indigo-200 transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </button>

      <button
        onClick={onOpenExams}
        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-slate-900 p-4 text-left ring-1 ring-emerald-400/30 transition hover:ring-emerald-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500/25 text-emerald-100">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 4h6M9 4a2 2 0 0 0-2 2v0H5v15h14V6h-2a2 2 0 0 0-2-2M8.5 13l2.5 2.5 4.5-5" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-white">Sample exams</span>
          <span className="block text-sm text-slate-400">10 full practice tests with answers, scores and estimated CLB</span>
        </span>
        <span className="text-emerald-200 transition group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </button>

      <section aria-labelledby="settings-heading" className="flex flex-col gap-3">
        <h2 id="settings-heading" className="text-xs font-medium uppercase tracking-wider text-slate-400">Settings</h2>
        <div className="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/5">
          <GoalStepper key={goalOf(progress.stats)} goal={goalOf(progress.stats)} setGoal={progress.setGoal} />
        </div>
        <div className="flex flex-col gap-5 rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/5">
          <Toggle
            label="Reverse cards"
            hint="Show the English and recall the French, with its le / la"
            checked={settings.reverse}
            onChange={(on) => settings.set('reverse', on)}
          />
          <Toggle
            label="Typing mode"
            hint="Type the French answer, so spelling, accents and gender are checked"
            checked={settings.typing}
            onChange={(on) => settings.set('typing', on)}
          />
          <Toggle
            label="Listening mode"
            hint={canSpeak ? 'Hear the word first with the word hidden, like the TCF listening section' : 'Hear the word first with the word hidden. This browser can’t play audio.'}
            checked={settings.listen}
            onChange={(on) => settings.set('listen', on)}
          />
          <p className="text-xs leading-relaxed text-slate-500">
            Modes combine. Typing shows the English unless listening is on, and listening with typing is a dictation. In Exam mode the exam
            direction picks the side shown.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/5">
          <Toggle
            label="Liquid glass look"
            hint="Frosted, translucent cards over a colourful background"
            checked={theme === 'glass'}
            onChange={(on) => setTheme(on ? 'glass' : 'classic')}
          />
        </div>
        <About />
      </section>

      <p className={`flex items-center gap-2 text-sm ${sync.status === 'error' ? 'text-amber-200' : 'text-slate-400'}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${sync.status === 'saved' ? 'bg-emerald-400' : sync.status === 'error' ? 'bg-amber-400' : 'bg-slate-500 animate-pulse'}`} />
        <span>
          {SYNC_TEXT[sync.status]}
          {sync.status === 'error' && sync.message && <span className="mt-1 block font-mono text-xs text-amber-200/70">Details: {sync.message}</span>}
          {sync.status === 'saved' && sync.at && <span className="text-slate-500"> · {sync.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
        </span>
      </p>

      {account.legacy && (
        <p className="-mt-3 rounded-xl bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100 ring-1 ring-amber-400/30">
          Your review schedule and streak are saved on this device only, because the database needs a small update. Run the two
          <span className="font-mono"> alter table </span>lines at the end of <span className="font-mono">supabase/schema.sql</span> in Supabase to sync them too.
        </p>
      )}

      {changing ? (
        <div className="rounded-2xl bg-slate-950/40 p-4 ring-1 ring-white/5">
          <NewPassword account={account} title="Change password" onDone={() => setTimeout(() => setChanging(false), 1500)} />
        </div>
      ) : (
        <button className={`${linkBtn} self-start`} onClick={() => setChanging(true)}>
          Change password
        </button>
      )}

      <button
        onClick={account.signOut}
        className="w-full rounded-full bg-slate-800 px-4 py-3 text-sm font-medium text-slate-200 ring-1 ring-white/10 transition hover:bg-slate-700"
      >
        Sign out
      </button>
      <p className="-mt-3 text-center text-xs text-slate-500">Signing out removes your progress from this device. It stays safe in your account.</p>
    </div>
  )
}

export default function AccountPanel({ account, progress, theme, setTheme, settings, onBack, onOpenGuide, onOpenExams }) {
  const title = account.recovering ? 'Reset password' : account.user ? 'Your profile' : 'Your account'
  return (
    <div className="gutter mx-auto max-w-md pb-16 pt-6">
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800/80 text-slate-300 ring-1 ring-white/10 transition hover:bg-slate-700 hover:text-white"
          aria-label="Back to levels"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="font-display text-2xl font-semibold text-white">{title}</h1>
      </header>
      {!account.user && !account.recovering && (
        <p className="mt-3 text-sm leading-relaxed text-slate-400">Sign in to keep your progress in sync on every browser and device.</p>
      )}
      <div className="mt-6 rounded-3xl bg-slate-900 p-6 ring-1 ring-white/[0.07]">
        {!account.ready ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : account.recovering ? (
          <NewPassword account={account} onDone={() => setTimeout(onBack, 1200)} />
        ) : account.user ? (
          <Profile account={account} progress={progress} theme={theme} setTheme={setTheme} settings={settings} onOpenGuide={onOpenGuide} onOpenExams={onOpenExams} />
        ) : (
          <AuthForms account={account} />
        )}
      </div>
    </div>
  )
}
