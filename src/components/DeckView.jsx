import { useCallback, useEffect, useRef, useState } from 'react'
import SwipeCard from './SwipeCard'
import { GROUPS, GROUP_SIZE, fmt } from '../lib/words'

let uidCounter = 0
const entry = (id) => ({ id, uid: ++uidCounter })

function Icon({ d, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

const ICONS = {
  back: 'M15 18l-6-6 6-6',
  keep: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  flip: 'M4 7h13l-3-3M20 17H7l3 3',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  reset: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6',
}

export default function DeckView({ mode, direction, groupIndex, known: learned, markKnown: markLearned, unmark, resetIds, nextIndex, onBack, onOpenGroup }) {
  const isExam = mode === 'exam'
  const L = isExam
    ? { done: 'correct', left: 'Again', right: 'Got it', leftStamp: 'AGAIN', rightStamp: 'GOT IT' }
    : { done: 'learned', left: 'Keep', right: 'Learned', leftStamp: 'KEEP', rightStamp: 'LEARNED' }
  const group = GROUPS[groupIndex - 1]
  const byId = useRef(Object.fromEntries(group.words.map((w) => [w.id, w])))
  const [queue, setQueue] = useState(() => group.ids.filter((id) => !learned.has(id)).map(entry))
  const [history, setHistory] = useState([])
  const [confirmReset, setConfirmReset] = useState(false)
  const topRef = useRef(null)

  const learnedCount = group.ids.filter((id) => learned.has(id)).length
  const pct = (learnedCount / GROUP_SIZE) * 100

  const queueRef = useRef(queue)
  queueRef.current = queue

  const handleSwipe = useCallback(
    (dir) => {
      const q = queueRef.current
      if (!q.length) return
      const [top, ...rest] = q
      setHistory((h) => [...h.slice(-30), { queue: q, learnedId: dir > 0 ? top.id : null }])
      if (dir > 0) markLearned(top.id)
      const nextQueue = dir > 0 ? rest : [...rest, entry(top.id)] // Keep: back of the deck
      queueRef.current = nextQueue
      setQueue(nextQueue)
    },
    [markLearned]
  )

  const undo = () => {
    const last = history[history.length - 1]
    if (!last) return
    if (last.learnedId != null) unmark(last.learnedId)
    setQueue(last.queue.map((e) => entry(e.id)))
    setHistory((h) => h.slice(0, -1))
  }

  const reset = () => {
    resetIds(group.ids)
    setQueue(group.ids.map(entry))
    setHistory([])
    setConfirmReset(false)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.closest?.('input,textarea')) return
      if (e.key === 'ArrowRight') topRef.current?.fly(1)
      else if (e.key === 'ArrowLeft') topRef.current?.fly(-1)
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return
        e.preventDefault()
        topRef.current?.flip()
      } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'z') undo()
      else if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const visible = queue.slice(0, 3)
  const done = queue.length === 0

  return (
    <div className="gutter mx-auto flex h-full max-w-xl flex-col pb-4 pt-3">
      {/* Header */}
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800/80 text-slate-300 ring-1 ring-white/10 transition hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          aria-label="Back to all levels"
        >
          <Icon d={ICONS.back} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold leading-tight text-white">
            Level {groupIndex}
            {isExam && (
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-sans text-[11px] font-medium uppercase tracking-wider text-amber-200 ring-1 ring-amber-300/30">
                Exam · {direction === 'fr-en' ? 'FR → EN' : 'EN → FR'}
              </span>
            )}
          </h1>
          <p className="truncate text-xs text-slate-400 tabular">
            Words {fmt(group.from)}–{fmt(group.to)} · {group.sections.join(' · ')}
          </p>
        </div>
        <button
          onClick={() => setConfirmReset(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800/80 px-3.5 py-2 text-sm text-slate-300 ring-1 ring-white/10 transition hover:bg-slate-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <Icon d={ICONS.reset} className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </header>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-sm text-slate-300 tabular">
          <span className="font-semibold text-emerald-300">{learnedCount}</span> / {GROUP_SIZE} {L.done}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-500 tabular">{queue.length} cards left in rotation</p>

      {/* Reset confirm */}
      {confirmReset && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-rose-500/10 p-3 text-sm ring-1 ring-rose-400/30 animate-fade-up">
          <p className="min-w-0 flex-1 text-rose-100">{isExam ? "Put all 50 cards back and clear this level's exam score for this direction?" : "Put all 50 cards back into rotation and clear this level's learned progress?"}</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmReset(false)} className="rounded-full px-3 py-1.5 text-slate-300 hover:text-white">
              Cancel
            </button>
            <button onClick={reset} className="rounded-full bg-rose-500 px-3.5 py-1.5 font-medium text-white hover:bg-rose-400">
              Reset deck
            </button>
          </div>
        </div>
      )}

      {/* Stack */}
      <div className="relative mx-auto mt-6 w-full max-w-sm flex-1" style={{ minHeight: 360, maxHeight: 520 }}>
        {done ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 rounded-[28px] bg-emerald-500/10 p-8 text-center ring-1 ring-emerald-400/30">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-slate-950 animate-pop">
              <Icon d={ICONS.check} className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Level {groupIndex} {isExam ? 'exam passed' : 'mastered'}</h2>
              <p className="mt-2 text-slate-300">{isExam ? 'You got all 50 words right.' : 'All 50 words are marked as learned.'}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {nextIndex && (
                <button onClick={() => onOpenGroup(nextIndex)} className="rounded-full bg-indigo-500 px-5 py-2.5 font-medium text-white hover:bg-indigo-400">
                  {isExam ? 'Exam for' : 'Start'} level {nextIndex}
                </button>
              )}
              <button onClick={() => setConfirmReset(true)} className="rounded-full bg-slate-800 px-5 py-2.5 text-slate-200 ring-1 ring-white/10 hover:bg-slate-700">
                {isExam ? 'Retake exam' : 'Study again'}
              </button>
            </div>
          </div>
        ) : (
          visible
            .map((e, depth) => (
              <SwipeCard
                key={e.uid}
                ref={depth === 0 ? topRef : undefined}
                word={byId.current[e.id]}
                depth={depth}
                onSwipe={handleSwipe}
                mode={mode}
                direction={direction}
                stamps={[L.leftStamp, L.rightStamp]}
              />
            ))
            .reverse()
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-center gap-4 sm:gap-6">
        <button
          onClick={() => topRef.current?.fly(-1)}
          disabled={done}
          className="group flex flex-col items-center gap-1.5 disabled:opacity-30"
          aria-label={`${L.left}: keep in rotation (left arrow)`}
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-rose-500/10 text-rose-300 ring-2 ring-rose-400/50 transition group-hover:bg-rose-500/20 group-active:scale-90 group-focus-visible:ring-rose-300">
            <Icon d={ICONS.keep} className="h-7 w-7" />
          </span>
          <span className="text-xs font-medium text-rose-300">{L.left}</span>
        </button>
        <button
          onClick={undo}
          disabled={!history.length}
          className="group flex flex-col items-center gap-1.5 disabled:opacity-30"
          aria-label="Undo last swipe"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-800 text-slate-300 ring-1 ring-white/10 transition group-hover:bg-slate-700 group-active:scale-90">
            <Icon d={ICONS.undo} className="h-5 w-5" />
          </span>
          <span className="text-xs text-slate-400">Undo</span>
        </button>
        <button
          onClick={() => topRef.current?.flip()}
          disabled={done}
          className="group flex flex-col items-center gap-1.5 disabled:opacity-30"
          aria-label="Flip card (space)"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30 transition group-hover:bg-indigo-500/25 group-active:scale-90">
            <Icon d={ICONS.flip} className="h-5 w-5" />
          </span>
          <span className="text-xs text-slate-400">Flip</span>
        </button>
        <button
          onClick={() => topRef.current?.fly(1)}
          disabled={done}
          className="group flex flex-col items-center gap-1.5 disabled:opacity-30"
          aria-label={`${L.right}: mark as ${L.done} (right arrow)`}
        >
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-300 ring-2 ring-emerald-400/50 transition group-hover:bg-emerald-500/20 group-active:scale-90 group-focus-visible:ring-emerald-300">
            <Icon d={ICONS.check} className="h-7 w-7" />
          </span>
          <span className="text-xs font-medium text-emerald-300">{L.right}</span>
        </button>
      </div>
      <p className="mt-4 hidden text-center text-xs text-slate-500 sm:block">
        Keyboard: ← {L.left.toLowerCase()} · → {L.right.toLowerCase()} · space flip · Z undo · Esc back
      </p>
    </div>
  )
}
