import { useEffect, useMemo, useRef, useState } from 'react'
import INDEX from '../data/exams/index.json'
import { canSpeak, speakPassage, stopSpeaking } from '../lib/speech'

const loaders = import.meta.glob('../data/exams/exam-*.json', { import: 'default' })
const loadExam = (id) => loaders[`../data/exams/exam-${String(id).padStart(2, '0')}.json`]()

const RESULTS_KEY = 'tcf-flashcards:sample-results:v1'
const DRAFTS_KEY = 'tcf-flashcards:sample-drafts:v1'

const SECTIONS = {
  co: { label: 'Listening', fr: 'Compréhension orale', minutes: 35, color: 'sky' },
  ce: { label: 'Reading', fr: 'Compréhension écrite', minutes: 60, color: 'emerald' },
  ee: { label: 'Writing', fr: 'Expression écrite', minutes: 60, color: 'amber' },
  eo: { label: 'Speaking', fr: 'Expression orale', minutes: 12, color: 'fuchsia' },
}
const TONES = {
  sky: 'from-sky-500/20 ring-sky-400/30 text-sky-200',
  emerald: 'from-emerald-500/20 ring-emerald-400/30 text-emerald-200',
  amber: 'from-amber-500/20 ring-amber-400/30 text-amber-200',
  fuchsia: 'from-fuchsia-500/20 ring-fuchsia-400/30 text-fuchsia-200',
}
const tone = (s) => TONES[SECTIONS[s].color].split(' ')

// IRCC equivalency for TCF Canada listening (co) and reading (ce)
const CLB = {
  co: [[549, '10+'], [523, '9'], [503, '8'], [458, '7'], [398, '6'], [369, '5'], [331, '4']],
  ce: [[549, '10+'], [524, '9'], [499, '8'], [453, '7'], [406, '6'], [375, '5'], [342, '4']],
}
const clbFor = (s, score) => CLB[s].find(([min]) => score >= min)?.[1] || 'below 4'
const cefrFor = (score) => (score >= 600 ? 'C2' : score >= 500 ? 'C1' : score >= 400 ? 'B2' : score >= 300 ? 'B1' : score >= 200 ? 'A2' : score >= 100 ? 'A1' : '–')
const TASK_RULES = { 1: [60, 120], 2: [120, 150], 3: [120, 180] }
const EO_TIMES = { 1: 120, 2: 330, 3: 270 }

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}
function writeJSON(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

const words = (t) => (t.trim() ? t.trim().split(/\s+/).length : 0)
const mmss = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`

function Back({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800/80 text-slate-300 ring-1 ring-white/10 transition hover:bg-slate-700 hover:text-white"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}

function useCountdown(minutes, running) {
  const [left, setLeft] = useState(minutes * 60)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [running])
  return [left, () => setLeft(minutes * 60)]
}

function Timer({ left }) {
  const low = left <= 120
  return (
    <span className={`rounded-full px-3 py-1 font-mono text-sm tabular ring-1 ${left <= 0 ? 'bg-rose-500/15 text-rose-200 ring-rose-400/40' : low ? 'bg-amber-500/15 text-amber-200 ring-amber-400/40' : 'bg-slate-800 text-slate-200 ring-white/10'}`}>
      {left <= 0 ? 'Time’s up' : mmss(left)}
    </span>
  )
}

function PlayButton({ text, label = 'Play recording', small }) {
  const [playing, setPlaying] = useState(false)
  const [plays, setPlays] = useState(0)
  useEffect(() => () => stopSpeaking(), [text])
  if (!canSpeak) return <p className="text-sm text-amber-200">Audio isn’t available in this browser. Try Chrome, Edge or Safari.</p>
  return (
    <button
      onClick={() => {
        if (playing) {
          stopSpeaking()
          setPlaying(false)
          return
        }
        setPlaying(true)
        setPlays((p) => p + 1)
        speakPassage(text, { onEnd: () => setPlaying(false) })
      }}
      className={`inline-flex items-center gap-2 rounded-full ${small ? 'px-3 py-1.5 text-xs' : 'px-5 py-3 text-sm'} font-medium ring-1 transition ${playing ? 'bg-sky-400 text-slate-950 ring-sky-300' : 'bg-sky-500/15 text-sky-100 ring-sky-400/40 hover:bg-sky-500/25'}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        {playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
      </svg>
      {playing ? 'Stop' : plays ? 'Play again' : label}
      {plays > 0 && !playing && !small && <span className="text-sky-300/70">· played {plays}×</span>}
    </button>
  )
}

/* ---------- Multiple-choice sections (listening, reading) ---------- */

function McqSection({ exam, section, onDone, saved }) {
  const items = exam[section]
  const [answers, setAnswers] = useState(() => Array(items.length).fill(null))
  const [i, setI] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [left] = useCountdown(SECTIONS[section].minutes, !submitted)
  const q = items[i]
  const answered = answers.filter((a) => a !== null).length

  const result = useMemo(() => {
    if (!submitted) return null
    const correct = items.filter((it, k) => answers[k] === it.answer)
    const score = correct.reduce((n, it) => n + it.pts, 0)
    return { score, correct: correct.length }
  }, [submitted, answers, items])

  const submit = () => {
    stopSpeaking()
    setSubmitted(true)
    setConfirm(false)
    const score = items.reduce((n, it, k) => n + (answers[k] === it.answer ? it.pts : 0), 0)
    const correct = items.filter((it, k) => answers[k] === it.answer).length
    onDone({ score, correct, at: Date.now() })
    window.scrollTo(0, 0)
  }

  if (submitted) return <McqReview items={items} answers={answers} section={section} result={result} best={saved} />

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400 tabular">
          Question <span className="font-semibold text-white">{i + 1}</span> / {items.length} · {answered} answered
        </p>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">Level {q.level}</span>
          <Timer left={left} />
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900 p-5 ring-1 ring-white/[0.07] sm:p-6">
        {section === 'co' ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-slate-400">Listen to the recording, then answer. On the real test it plays only once.</p>
            <PlayButton key={q.n} text={q.text} label="Play recording" />
          </div>
        ) : (
          <div className="whitespace-pre-line rounded-2xl bg-slate-950/50 p-4 text-[15px] leading-relaxed text-slate-100 ring-1 ring-white/5">{q.text}</div>
        )}
        <p className="mt-5 font-medium text-white">{q.q}</p>
        <div className="mt-3 flex flex-col gap-2" role="radiogroup" aria-label={`Question ${i + 1}`}>
          {q.options.map((o, k) => {
            const on = answers[i] === k
            return (
              <button
                key={k}
                role="radio"
                aria-checked={on}
                onClick={() => setAnswers((a) => a.map((x, j) => (j === i ? k : x)))}
                className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-left text-[15px] ring-1 transition ${on ? 'bg-indigo-500/20 text-white ring-indigo-400/60' : 'bg-slate-950/40 text-slate-200 ring-white/10 hover:bg-slate-800/60'}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${on ? 'bg-indigo-400 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>{'ABCD'[k]}</span>
                <span className="min-w-0">{o}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button disabled={i === 0} onClick={() => setI(i - 1)} className="rounded-full bg-slate-800 px-5 py-2.5 text-sm text-slate-200 ring-1 ring-white/10 disabled:opacity-30">
          ← Previous
        </button>
        {i < items.length - 1 ? (
          <button onClick={() => setI(i + 1)} className="rounded-full bg-indigo-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-400">
            Next →
          </button>
        ) : (
          <button onClick={() => setConfirm(true)} className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400">
            Finish section
          </button>
        )}
      </div>

      <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(13,minmax(0,1fr))]" aria-label="Jump to question">
        {items.map((_, k) => (
          <button
            key={k}
            onClick={() => setI(k)}
            aria-label={`Question ${k + 1}${answers[k] !== null ? ', answered' : ''}`}
            className={`aspect-square rounded-lg text-[11px] font-medium tabular ${k === i ? 'bg-white text-slate-950' : answers[k] !== null ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-800/80 text-slate-500'}`}
          >
            {k + 1}
          </button>
        ))}
      </div>

      {confirm ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm ring-1 ring-emerald-400/30">
          <p className="min-w-0 flex-1 text-emerald-50">
            {answered < items.length ? `${items.length - answered} questions are still unanswered. ` : ''}Submit and see your score?
          </p>
          <button onClick={() => setConfirm(false)} className="rounded-full px-3 py-1.5 text-slate-300 hover:text-white">Keep going</button>
          <button onClick={submit} className="rounded-full bg-emerald-500 px-4 py-1.5 font-medium text-slate-950">Submit</button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} className="self-center text-sm text-slate-400 underline-offset-4 hover:text-white hover:underline">
          Submit section now
        </button>
      )}
    </div>
  )
}

function McqReview({ items, answers, section, result, best }) {
  const [open, setOpen] = useState(null)
  const pct = Math.round((result.score / 699) * 100)
  return (
    <div className="flex flex-col gap-5">
      <div className={`rounded-3xl bg-gradient-to-br ${tone(section)[0]} to-slate-900 p-6 ring-1 ${tone(section)[1]}`}>
        <p className="text-xs uppercase tracking-wider text-slate-400">Your score</p>
        <p className="mt-1 font-display text-5xl font-semibold text-white tabular">
          {result.score}
          <span className="text-xl font-normal text-slate-400"> / 699</span>
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-950/50">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Correct</p>
            <p className="font-semibold text-white tabular">{result.correct} / {items.length}</p>
          </div>
          <div>
            <p className="text-slate-400">Level</p>
            <p className="font-semibold text-white">{cefrFor(result.score)}</p>
          </div>
          <div>
            <p className="text-slate-400">Estimated CLB</p>
            <p className="font-semibold text-emerald-200">{clbFor(section, result.score)}</p>
          </div>
        </div>
        {best && best.score > result.score && <p className="mt-3 text-xs text-slate-400">Your best on this section: {best.score} / 699</p>}
        <p className="mt-3 text-xs leading-relaxed text-slate-500">Estimate only. Harder questions are worth more points, as on the real test, but official TCF scoring isn’t published.</p>
      </div>

      <h3 className="font-display text-xl font-semibold text-white">Answers</h3>
      <ol className="flex flex-col gap-2">
        {items.map((it, k) => {
          const ok = answers[k] === it.answer
          const isOpen = open === k
          return (
            <li key={k} className={`rounded-2xl ring-1 ${ok ? 'bg-emerald-500/[0.06] ring-emerald-400/25' : 'bg-rose-500/[0.06] ring-rose-400/25'}`}>
              <button onClick={() => setOpen(isOpen ? null : k)} className="flex w-full items-start gap-3 p-4 text-left" aria-expanded={isOpen}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${ok ? 'bg-emerald-400 text-slate-950' : 'bg-rose-400 text-slate-950'}`}>{ok ? '✓' : '✗'}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-slate-500 tabular">Q{k + 1} · {it.level} · {it.pts} pts</span>
                  <span className="block text-[15px] text-white">{it.q}</span>
                  <span className="mt-1 block text-sm text-emerald-200">Answer: {'ABCD'[it.answer]}. {it.options[it.answer]}</span>
                  {!ok && <span className="block text-sm text-rose-200">You chose: {answers[k] === null ? 'no answer' : `${'ABCD'[answers[k]]}. ${it.options[answers[k]]}`}</span>}
                </span>
                <span className="shrink-0 text-xs text-slate-500">{isOpen ? 'Hide' : section === 'co' ? 'Transcript' : 'Text'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-white/5 px-4 pb-4 pt-3">
                  {section === 'co' && <PlayButton text={it.text} label="Listen again" small />}
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">{it.text}</p>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

/* ---------- Writing ---------- */

function WritingSection({ exam }) {
  const key = `${exam.id}`
  const [drafts, setDrafts] = useState(() => readJSON(DRAFTS_KEY)[key] || {})
  const [shown, setShown] = useState({})
  const [left] = useCountdown(60, true)
  useEffect(() => {
    const all = readJSON(DRAFTS_KEY)
    all[key] = drafts
    writeJSON(DRAFTS_KEY, all)
  }, [drafts, key])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">3 tasks · do them in order · no dictionary</p>
        <Timer left={left} />
      </div>
      {exam.ee.map((t) => {
        const [min, max] = TASK_RULES[t.n]
        const n = words(drafts[t.n] || '')
        const inRange = n >= min && n <= max
        return (
          <article key={t.n} className="rounded-3xl bg-slate-900 p-5 ring-1 ring-white/[0.07] sm:p-6">
            <p className="font-mono text-xs text-amber-200">Task {t.n} · {min}–{max} words</p>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white">{t.prompt}</p>
            <textarea
              value={drafts[t.n] || ''}
              onChange={(e) => setDrafts((d) => ({ ...d, [t.n]: e.target.value }))}
              rows={8}
              placeholder="Écrivez votre réponse ici…"
              className="mt-4 w-full resize-y rounded-2xl bg-slate-950/60 p-4 text-[15px] leading-relaxed text-white ring-1 ring-white/10 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
              spellCheck={false}
              lang="fr"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className={`tabular ${n === 0 ? 'text-slate-500' : inRange ? 'text-emerald-300' : 'text-amber-200'}`}>
                {n} words {n > 0 && !inRange && (n < min ? `· aim for at least ${min}` : `· try to stay under ${max}`)}
              </span>
              <button onClick={() => setShown((s) => ({ ...s, [t.n]: !s[t.n] }))} className="text-amber-200 underline-offset-4 hover:underline">
                {shown[t.n] ? 'Hide model answer' : 'Show model answer'}
              </button>
            </div>
            {shown[t.n] && (
              <div className="mt-3 rounded-2xl bg-amber-500/[0.07] p-4 ring-1 ring-amber-400/20">
                <p className="text-xs uppercase tracking-wider text-amber-200/80">Model answer · {words(t.model.replace(/\n/g, ' '))} words</p>
                <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-100">{t.model}</p>
              </div>
            )}
          </article>
        )
      })}
      <p className="text-xs leading-relaxed text-slate-500">Your drafts are saved on this device. Compare them with the model answers: did you complete the task, organize your ideas, and use connectors and varied vocabulary?</p>
    </div>
  )
}

/* ---------- Speaking ---------- */

function SpeakingTask({ t }) {
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(EO_TIMES[t.n])
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setLeft((l) => (l <= 1 ? (setRunning(false), 0) : l - 1)), 1000)
    return () => clearInterval(id)
  }, [running])
  return (
    <article className="rounded-3xl bg-slate-900 p-5 ring-1 ring-white/[0.07] sm:p-6">
      <p className="font-mono text-xs text-fuchsia-200">Task {t.n}</p>
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white">{t.prompt}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            if (!running && left === 0) setLeft(EO_TIMES[t.n])
            setRunning((r) => !r)
          }}
          className="rounded-full bg-fuchsia-500/20 px-4 py-2 text-sm font-medium text-fuchsia-100 ring-1 ring-fuchsia-400/40 hover:bg-fuchsia-500/30"
        >
          {running ? 'Pause timer' : left === EO_TIMES[t.n] ? 'Start speaking timer' : left === 0 ? 'Restart timer' : 'Resume timer'}
        </button>
        <Timer left={left} />
      </div>
      <button onClick={() => setShown((s) => !s)} className="mt-4 text-sm text-fuchsia-200 underline-offset-4 hover:underline">
        {shown ? 'Hide sample answer' : 'Show sample answer'}
      </button>
      {shown && (
        <div className="mt-3 rounded-2xl bg-fuchsia-500/[0.07] p-4 ring-1 ring-fuchsia-400/20">
          {canSpeak && (
            <div className="mb-3">
              <PlayButton text={t.model.replace(/\n/g, ' ')} label="Hear the sample answer" small />
            </div>
          )}
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-100">{t.model}</p>
        </div>
      )}
    </article>
  )
}

function SpeakingSection({ exam }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-relaxed text-slate-400">
        On test day you speak with an examiner. To practise, start the timer and answer out loud, ideally recording yourself on your phone, then compare with the sample answer.
      </p>
      {exam.eo.map((t) => (
        <SpeakingTask key={t.n} t={t} />
      ))}
    </div>
  )
}

/* ---------- Screens ---------- */

function ExamHome({ meta, exam, results, onOpen }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Object.entries(SECTIONS).map(([s, info]) => {
        const r = results?.[s]
        const count = exam ? (s === 'co' || s === 'ce' ? `${exam[s].length} questions` : `${exam[s].length} tasks`) : ''
        return (
          <button
            key={s}
            onClick={() => onOpen(s)}
            disabled={!exam}
            className={`flex flex-col gap-2 rounded-3xl bg-gradient-to-br ${tone(s)[0]} to-slate-900 p-5 text-left ring-1 ${tone(s)[1]} transition hover:-translate-y-0.5 disabled:opacity-50`}
          >
            <span className={`font-mono text-xs ${tone(s)[2]}`}>{info.fr}</span>
            <span className="font-display text-xl font-semibold text-white">{info.label}</span>
            <span className="text-sm text-slate-400">{count} · {info.minutes} min</span>
            {r ? (
              <span className="text-sm font-medium text-emerald-200 tabular">Best: {r.score} / 699 · CLB {clbFor(s, r.score)}</span>
            ) : (
              <span className="text-sm text-slate-500">{s === 'co' || s === 'ce' ? 'Not taken yet' : 'Model answers included'}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default function SampleExams({ onBack }) {
  const [examId, setExamId] = useState(null)
  const [exam, setExam] = useState(null)
  const [section, setSection] = useState(null)
  const [results, setResults] = useState(() => readJSON(RESULTS_KEY))
  const top = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [examId, section])
  useEffect(() => () => stopSpeaking(), [])

  useEffect(() => {
    setExam(null)
    if (examId) loadExam(examId).then(setExam)
  }, [examId])

  const meta = INDEX.find((e) => e.id === examId)

  const saveResult = (r) => {
    setResults((all) => {
      const prev = all[examId]?.[section]
      const next = { ...all, [examId]: { ...all[examId], [section]: !prev || r.score >= prev.score ? r : prev } }
      writeJSON(RESULTS_KEY, next)
      return next
    })
  }

  const back = () => {
    stopSpeaking()
    if (section) setSection(null)
    else if (examId) setExamId(null)
    else onBack()
  }

  return (
    <div ref={top} className="gutter mx-auto max-w-3xl pb-20 pt-6">
      <header className="flex items-center gap-3">
        <Back onClick={back} label={section ? 'Back to exam' : examId ? 'Back to sample exams' : 'Back to profile'} />
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{section ? `Sample exam ${examId} · ${SECTIONS[section].fr}` : examId ? 'Sample exams' : 'Profile'}</p>
          <h1 className="truncate font-display text-xl font-semibold text-white">
            {section ? SECTIONS[section].label : examId ? `Sample exam ${examId}` : 'Sample exams'}
          </h1>
        </div>
      </header>

      <div className="mt-6">
        {!examId && (
          <>
            <p className="max-w-2xl leading-relaxed text-slate-300">
              {INDEX.length} full practice tests in the TCF Canada format: 39 listening and 39 reading questions that get harder as you go, plus 3 writing and 3 speaking tasks with model answers. Every question was written for FrenchFlash and none are taken from real exams.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {INDEX.map((e) => {
                const r = results[e.id] || {}
                return (
                  <button
                    key={e.id}
                    onClick={() => setExamId(e.id)}
                    className="flex flex-col gap-2 rounded-2xl bg-slate-900 p-5 text-left ring-1 ring-white/[0.07] transition hover:-translate-y-0.5 hover:bg-slate-800/80 hover:ring-indigo-400/40"
                  >
                    <span className="font-mono text-xs text-indigo-300/80">Sample exam {e.id}</span>
                    <span className="font-display text-lg font-semibold text-white">{e.title}</span>
                    <span className="flex flex-wrap gap-2 text-xs tabular">
                      {['co', 'ce'].map((s) => (
                        <span key={s} className={`rounded-full px-2.5 py-1 ${r[s] ? 'bg-emerald-500/15 text-emerald-200' : 'bg-slate-800 text-slate-400'}`}>
                          {SECTIONS[s].label}: {r[s] ? `${r[s].score}` : '—'}
                        </span>
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mt-6 text-xs text-slate-500">Scores are saved on this device.</p>
          </>
        )}

        {examId && !section && (
          <>
            <p className="mb-5 text-slate-300">{meta?.title}. Take the sections in any order. On the real test, they are timed separately.</p>
            <ExamHome meta={meta} exam={exam} results={results[examId]} onOpen={setSection} />
            {!exam && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
          </>
        )}

        {exam && (section === 'co' || section === 'ce') && (
          <McqSection key={`${examId}-${section}`} exam={exam} section={section} onDone={saveResult} saved={results[examId]?.[section]} />
        )}
        {exam && section === 'ee' && <WritingSection exam={exam} />}
        {exam && section === 'eo' && <SpeakingSection exam={exam} />}
      </div>
    </div>
  )
}
