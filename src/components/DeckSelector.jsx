import { useMemo } from 'react'
import { BATCHES, GROUPS, GROUP_SIZE, WORDS, fmt } from '../lib/words'
import { doneOn, goalOf, streak } from '../lib/srs'

const LEVEL_OF = Object.fromEntries(GROUPS.flatMap((g) => g.ids.map((id) => [id, g.index])))

function GroupCard({ group, count, due, onOpen, unit }) {
  const pct = (count / GROUP_SIZE) * 100
  const complete = count === GROUP_SIZE
  const started = count > 0
  return (
    <button
      onClick={() => onOpen(group.index)}
      className={`group flex min-w-0 flex-col gap-3 rounded-2xl p-4 text-left ring-1 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
        complete
          ? 'bg-emerald-500/[0.07] ring-emerald-400/30 hover:ring-emerald-400/60'
          : 'bg-slate-900 ring-white/[0.07] hover:bg-slate-800/80 hover:ring-indigo-400/40'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-display text-lg font-semibold text-white tabular">Level {group.index}</span>
        <span className="font-mono text-[11px] text-slate-500 tabular">
          {fmt(group.from)}–{fmt(group.to)}
        </span>
      </div>
      <p className="line-clamp-2 min-h-[2.5em] text-xs leading-[1.25em] text-slate-400">{group.sections.join(' · ')}</p>
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${complete ? 'bg-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs tabular">
          <span className={complete ? 'font-medium text-emerald-300' : started ? 'text-slate-200' : 'text-slate-500'}>
            {count} / {GROUP_SIZE} {unit}
          </span>
          {due > 0 ? (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-medium text-amber-200 ring-1 ring-amber-300/30" title="Learned words due for review">{due} due</span>
          ) : (
            complete && <span className="text-emerald-300" aria-label="Complete">✓</span>
          )}
        </div>
      </div>
    </button>
  )
}

function Segmented({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-slate-900 p-1 ring-1 ring-white/[0.07]">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              active ? o.activeClass : 'text-slate-400 hover:text-white'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

const MODES = [
  { value: 'learn', label: 'Learning', activeClass: 'bg-indigo-500 text-white' },
  { value: 'exam', label: 'Exam', activeClass: 'bg-amber-400 text-slate-950' },
]
const DIRECTIONS = [
  { value: 'fr-en', label: 'French → English', activeClass: 'bg-white text-slate-950' },
  { value: 'en-fr', label: 'English → French', activeClass: 'bg-white text-slate-950' },
]

function AccountButton({ account, onClick }) {
  if (!account?.enabled) return null
  const { user } = account
  return (
    <button
      onClick={onClick}
      className="ml-auto flex items-center gap-2 rounded-full bg-slate-900 py-1.5 pl-1.5 pr-4 text-sm text-slate-200 ring-1 ring-white/[0.07] transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${user ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
        {user ? user.email[0].toUpperCase() : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </svg>
        )}
      </span>
      {user ? 'Profile' : 'Sign in'}
    </button>
  )
}

// Streak and today's progress toward the daily goal
function StudyStrip({ stats }) {
  const goal = goalOf(stats)
  const today = doneOn(stats)
  const days = streak(stats)
  const met = today >= goal
  const pct = Math.min(100, (today / goal) * 100)
  return (
    <section aria-label="Daily study" className="mt-6 grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 ring-1 ring-white/[0.07]">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl ${days ? 'bg-orange-500/20' : 'bg-slate-800 grayscale'}`} aria-hidden="true">
          🔥
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl font-semibold leading-none text-white tabular">{days}</p>
          <p className="mt-1 text-xs text-slate-400">day streak</p>
        </div>
      </div>
      <div className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/[0.07]">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400">Today</span>
          {met && <span className="text-xs font-medium text-emerald-300">Goal met ✓</span>}
        </div>
        <p className="mt-1 font-display text-2xl font-semibold leading-none text-white tabular">
          {today}
          <span className="text-sm font-normal text-slate-500"> / {goal} cards</span>
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full transition-[width] duration-500 ${met ? 'bg-emerald-400' : 'bg-gradient-to-r from-orange-400 to-amber-300'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </section>
  )
}

export default function DeckSelector({ mode, setMode, direction, setDirection, known, available, onOpen, batch, setBatch, account, onAccount, stats, due }) {
  const isExam = mode === 'exam'
  const unit = isExam ? 'correct' : 'mastered'
  // Learned words due for spaced-repetition review, per level (they reappear inside their level)
  const dueCounts = useMemo(() => {
    const n = {}
    for (const id of due || []) n[LEVEL_OF[id]] = (n[LEVEL_OF[id]] || 0) + 1
    return n
  }, [due])
  const counts = useMemo(() => GROUPS.map((g) => g.ids.reduce((n, id) => n + (known.has(id) ? 1 : 0), 0)), [known])
  const pool = GROUPS.filter((g) => available.includes(g.index))
  const poolWords = pool.length * GROUP_SIZE
  const total = pool.reduce((n, g) => n + counts[g.index - 1], 0)
  const totalPct = poolWords ? (total / poolWords) * 100 : 0
  const groupsDone = pool.filter((g) => counts[g.index - 1] === GROUP_SIZE).length
  const resume = pool.find((g) => counts[g.index - 1] < GROUP_SIZE) || null

  const shown = pool.filter((g) => !batch || g.batch === batch)
  const accent = isExam ? 'text-amber-300' : 'text-indigo-300'

  return (
    <div className="gutter mx-auto max-w-6xl pb-16 pt-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Segmented options={MODES} value={mode} onChange={setMode} label="Mode" />
        {isExam && <Segmented options={DIRECTIONS} value={direction} onChange={setDirection} label="Exam direction" />}
        <AccountButton account={account} onClick={onAccount} />
      </div>

      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className={`font-mono text-[11px] uppercase tracking-[0.2em] ${isExam ? 'text-amber-300/80' : 'text-indigo-300/80'}`}>
            TCF Canada · objectif CLB 7
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-none text-white sm:text-5xl">
            {isExam ? (
              <>
                Mode <span className={`italic ${accent}`}>examen</span>
              </>
            ) : (
              <>
                Swipe <span className={`italic ${accent}`}>le</span> vocabulaire
              </>
            )}
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            {isExam
              ? direction === 'fr-en'
                ? 'See the French, recall the English. Only levels you have fully learned appear here. Swipe right if you got it, left to try again.'
                : 'See the English, recall the French. Only levels you have fully learned appear here. Swipe right if you got it, left to try again.'
              : '6,250 words in 125 levels of 50. Swipe right when you know a word, left to see it again.'}
          </p>
        </div>

        <div className="w-full rounded-2xl bg-slate-900 p-5 ring-1 ring-white/[0.07] md:w-80">
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400">{isExam ? 'Correct' : 'Mastered'}</span>
            <span className="text-xs text-slate-500 tabular">
              {groupsDone} / {pool.length} {isExam ? 'passed' : 'levels'}
            </span>
          </div>
          <p className="mt-1 font-display text-3xl font-semibold text-white tabular">
            {fmt(total)}
            <span className="text-base font-normal text-slate-500"> / {fmt(poolWords)}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${isExam ? 'from-amber-500 to-emerald-400' : 'from-indigo-500 to-emerald-400'}`}
              style={{ width: `${Math.max(totalPct, total ? 1 : 0)}%` }}
            />
          </div>
          {resume && (
            <button
              onClick={() => onOpen(resume.index)}
              className={`mt-4 w-full rounded-full px-4 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 ${
                isExam
                  ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 focus-visible:ring-amber-200'
                  : 'bg-indigo-500 text-white hover:bg-indigo-400 focus-visible:ring-indigo-300'
              }`}
            >
              {counts[resume.index - 1] > 0 ? 'Continue' : 'Start'} {isExam ? 'exam for ' : ''}level {resume.index}
            </button>
          )}
        </div>
      </header>

      <StudyStrip stats={stats} />

      {isExam && pool.length === 0 ? (
        <div className="mt-10 rounded-2xl bg-slate-900 p-8 text-center ring-1 ring-white/[0.07]">
          <h2 className="font-display text-2xl font-semibold text-white">No levels to test yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
            A level appears here once all 50 of its words are marked learned in Learning mode.
          </p>
          <button
            onClick={() => setMode('learn')}
            className="mt-5 rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Go to Learning
          </button>
        </div>
      ) : (
        <>
          <nav className="-mx-1 mt-8 flex gap-2 overflow-x-auto px-1 pb-2" aria-label="Filter by batch">
            {[{ n: 0, name: isExam ? `All unlocked (${pool.length})` : 'All 125 levels' }, ...BATCHES]
              .filter((b) => !b.n || pool.some((g) => g.batch === b.n))
              .map((b) => {
                const active = batch === b.n
                return (
                  <button
                    key={b.n}
                    onClick={() => setBatch(b.n)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                      active ? 'bg-white text-slate-950' : 'bg-slate-900 text-slate-300 ring-1 ring-white/[0.07] hover:bg-slate-800'
                    }`}
                  >
                    {b.n ? (
                      <>
                        <span className="font-medium">Batch {b.n}</span>
                        <span className={active ? 'text-slate-600' : 'text-slate-500'}> · {b.name}</span>
                      </>
                    ) : (
                      b.name
                    )}
                  </button>
                )
              })}
          </nav>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {shown.map((g) => (
              <GroupCard key={g.index} group={g} count={counts[g.index - 1]} due={dueCounts[g.index] || 0} onOpen={onOpen} unit={unit} />
            ))}
          </div>
          {shown.length === 0 && <p className="mt-6 text-sm text-slate-500">No completed levels in this batch yet.</p>}
        </>
      )}

      <footer className="mt-12 text-xs leading-relaxed text-slate-500">
        Word list, pronunciation cues and meanings from the <em>French Vocabulary for the TCF Exam</em> guide. {account?.user ? 'Learning and exam progress are saved to your account.' : 'Learning and exam progress are saved separately in this browser.'}
      </footer>
    </div>
  )
}
