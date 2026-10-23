import { useState } from 'react'
import { GROUPS, GROUP_SIZE, WORDS, fmt } from '../lib/words'

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

function AuthForms({ account }) {
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
          <p className="text-xs text-slate-500">At least 6 characters. Progress already on this device is added to your new account.</p>
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

function Profile({ account, progress }) {
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
        <Stat label="Groups completed" value={completed.length} of={GROUPS.length} />
        <Stat label="Exam FR → EN" value={inCompleted(progress['fr-en'].ids)} of={examWords} />
        <Stat label="Exam EN → FR" value={inCompleted(progress['en-fr'].ids)} of={examWords} />
      </div>

      <p className={`flex items-center gap-2 text-sm ${sync.status === 'error' ? 'text-amber-200' : 'text-slate-400'}`}>
        <span className={`h-2 w-2 shrink-0 rounded-full ${sync.status === 'saved' ? 'bg-emerald-400' : sync.status === 'error' ? 'bg-amber-400' : 'bg-slate-500 animate-pulse'}`} />
        <span>
          {SYNC_TEXT[sync.status]}
          {sync.status === 'saved' && sync.at && <span className="text-slate-500"> · {sync.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
        </span>
      </p>

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

export default function AccountPanel({ account, progress, onBack }) {
  const title = account.recovering ? 'Reset password' : account.user ? 'Your profile' : 'Your account'
  return (
    <div className="gutter mx-auto max-w-md pb-16 pt-6">
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800/80 text-slate-300 ring-1 ring-white/10 transition hover:bg-slate-700 hover:text-white"
          aria-label="Back to decks"
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
          <Profile account={account} progress={progress} />
        ) : (
          <AuthForms account={account} />
        )}
      </div>
    </div>
  )
}
