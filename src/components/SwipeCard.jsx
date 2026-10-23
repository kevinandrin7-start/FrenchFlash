import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { POS_LABELS } from '../lib/words'
import { canSpeak, speak } from '../lib/speech'

const SWIPE_RATIO = 0.42 // drag this share of the card's width to commit a swipe
const MIN_SWIPE = 150 // px, floor for narrow cards
const FLICK_VELOCITY = 1.1 // px per ms; a fast flick also counts, but only past FLICK_MIN
const FLICK_MIN = 110
const TAP_SLOP = 10 // movement below this is a tap (flip), and the card stays put
const FLY_MS = 480

const GENDER_LABELS = { m: 'masculine', f: 'feminine', 'm/f': 'masc. / fem.' }
const GENDER_STYLES = {
  m: 'bg-sky-500/15 text-sky-200 ring-sky-400/30',
  f: 'bg-fuchsia-500/15 text-fuchsia-200 ring-fuchsia-400/30',
  'm/f': 'bg-violet-500/15 text-violet-200 ring-violet-400/30',
}

function GenderPill({ word }) {
  if (!word.g) return null
  const plural = /^les /i.test(word.fr)
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ring-1 ${GENDER_STYLES[word.g]}`}>
      {GENDER_LABELS[word.g]}
      {plural ? ' pl.' : ''}
    </span>
  )
}

function SpeakButton({ text, label, size = 'md' }) {
  if (!canSpeak) return null
  const dims = size === 'sm' ? 'h-9 w-9' : 'h-11 w-11'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation()
        speak(text)
      }}
      className={`${dims} shrink-0 grid place-items-center rounded-full bg-indigo-500/15 text-indigo-200 ring-1 ring-indigo-400/30 transition hover:bg-indigo-500/30 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" fillOpacity=".25" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  )
}

const SwipeCard = forwardRef(function SwipeCard({ word, depth, onSwipe, mode = 'learn', direction = 'fr-en', stamps = ['KEEP', 'LEARNED'] }, ref) {
  const isTop = depth === 0
  const isExam = mode === 'exam'
  const enFirst = isExam && direction === 'en-fr'
  const [flipped, setFlipped] = useState(false)
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [leaving, setLeaving] = useState(0) // -1 left, 1 right
  const start = useRef(null)
  const el = useRef(null)
  const cardWidth = useRef(360)
  const threshold = () => Math.max(MIN_SWIPE, cardWidth.current * SWIPE_RATIO)

  const fly = (dir) => {
    if (leaving) return
    setDragging(false)
    setLeaving(dir)
    setDrag((d) => ({ x: dir * (window.innerWidth * 0.6 + 420), y: d.y + 60 }))
    setTimeout(() => onSwipe(dir), FLY_MS)
  }

  useImperativeHandle(ref, () => ({ fly, flip: () => setFlipped((f) => !f) }))

  const onPointerDown = (e) => {
    if (!isTop || leaving || (e.pointerType === 'mouse' && e.button !== 0)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    cardWidth.current = e.currentTarget.offsetWidth || 360
    start.current = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false }
    setDragging(true)
  }

  const onPointerMove = (e) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.moved && Math.hypot(dx, dy) < TAP_SLOP) return
    if (!s.moved) {
      // start the drag from here so the card doesn't jump by the slop distance
      s.moved = true
      s.ox = dx
      s.oy = dy
    }
    s.dx = dx - s.ox
    setDrag({ x: s.dx, y: (dy - s.oy) * 0.3 })
  }

  // Uses the last dx seen in pointermove: a pointercancel (the phone or the host app
  // claiming the gesture) can report clientX 0, which used to turn a right swipe into a left one.
  const onPointerUp = () => {
    const s = start.current
    start.current = null
    if (!s) return
    setDragging(false)
    const dx = s.moved ? s.dx || 0 : 0
    const v = Math.abs(dx) / Math.max(1, performance.now() - s.t)
    if (Math.abs(dx) > threshold() || (v > FLICK_VELOCITY && Math.abs(dx) > FLICK_MIN)) {
      fly(Math.sign(dx))
    } else {
      setDrag({ x: 0, y: 0 })
      if (!s.moved) setFlipped((f) => !f)
    }
  }

  // Keep horizontal drags on the card from becoming a browser or app swipe gesture
  useEffect(() => {
    const node = el.current
    if (!node || !isTop) return
    const stop = (e) => {
      if (e.target.closest?.('button')) return // let the speaker buttons get their tap
      if (e.cancelable) e.preventDefault()
    }
    node.addEventListener('touchmove', stop, { passive: false })
    node.addEventListener('touchstart', stop, { passive: false })
    return () => {
      node.removeEventListener('touchmove', stop)
      node.removeEventListener('touchstart', stop)
    }
  }, [isTop])

  const rotate = drag.x / 20
  const intent = Math.max(-1, Math.min(1, drag.x / threshold()))
  const stackTransform = `translateY(${depth * 16}px) scale(${1 - depth * 0.055})`
  const transform = isTop
    ? `translate(${drag.x}px, ${drag.y}px) rotate(${rotate}deg)`
    : stackTransform

  const pos = POS_LABELS[word.pos] || word.pos

  return (
    <div
      ref={el}
      className={`absolute inset-0 select-none touch-none ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
      style={{
        transform,
        zIndex: 10 - depth,
        opacity: depth > 2 ? 0 : 1,
        transition: dragging ? 'none' : leaving ? `transform ${FLY_MS}ms cubic-bezier(.4,0,.6,1), opacity .3s` : 'transform .5s cubic-bezier(.2,.9,.25,1.15), opacity .3s',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      aria-hidden={!isTop}
    >
      <div className="h-full w-full perspective animate-card-in">
        <div
          className="relative h-full w-full preserve-3d transition-transform duration-500"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          {/* Front: the prompt side */}
          <div
            className={`absolute inset-0 backface-hidden flex flex-col rounded-[28px] p-6 ring-1 ring-white/10 shadow-2xl shadow-black/50 ${
              depth === 0 ? 'bg-gradient-to-b from-slate-800 to-slate-900' : depth === 1 ? 'bg-slate-800/95' : 'bg-slate-800/80'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400 tabular">
                № {word.id.toLocaleString('en-US')}
              </span>
              <div className="flex flex-wrap justify-end gap-1.5">
              {!enFirst && <GenderPill word={word} />}
              {pos && (
                <span className="rounded-full bg-slate-700/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-slate-300">
                  {pos}
                </span>
              )}
              </div>
            </div>

            {enFirst ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-300/70">English</span>
                <h2 className="font-display text-[clamp(1.7rem,7vw,2.4rem)] font-semibold leading-tight text-white [text-wrap:balance] break-words max-w-full">
                  {word.en}
                </h2>
                <p className="text-sm text-slate-400">What is it in French?</p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <h2 className="font-display text-[clamp(1.9rem,8vw,2.75rem)] font-semibold leading-tight text-white [text-wrap:balance] break-words max-w-full">
                  {word.fr}
                </h2>
                <div className="flex flex-col items-center gap-1.5">
                  <p className="font-mono text-sm text-indigo-200/80">/{word.pron}/</p>
                  {!isExam && <p className="max-w-full text-sm leading-snug text-slate-400 [text-wrap:balance]">{word.en}</p>}
                </div>
                {isTop && <SpeakButton text={word.fr} label="Hear it in French" />}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="truncate">{word.section}</span>
              <span className="shrink-0">{isExam ? 'Tap to reveal' : 'Tap to flip'}</span>
            </div>
          </div>

          {/* Back: the answer side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col rounded-[28px] bg-gradient-to-b from-indigo-950 to-slate-900 p-6 ring-1 ring-indigo-400/20 shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-3">
              <span className={`truncate ${enFirst ? 'text-sm text-indigo-200/80' : 'font-display text-lg text-indigo-200/90'}`}>
                {enFirst ? word.en : word.fr}
              </span>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              <GenderPill word={word} />
              {pos && (
                <span className="rounded-full bg-indigo-500/15 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-indigo-200">
                  {pos}
                </span>
              )}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center gap-6 overflow-y-auto py-2">
              {enFirst ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="font-display text-[clamp(1.7rem,7vw,2.4rem)] font-semibold leading-tight text-white [text-wrap:balance] break-words max-w-full">
                    {word.fr}
                  </p>
                  <p className="font-mono text-sm text-indigo-200/80">/{word.pron}/</p>
                  {isTop && <SpeakButton text={word.fr} label="Hear it in French" size="sm" />}
                </div>
              ) : (
                <p className="text-center font-display text-[clamp(1.5rem,6.5vw,2.1rem)] font-medium leading-snug text-white [text-wrap:balance]">
                  {word.en}
                </p>
              )}
              {word.ex && (
                <div className="rounded-2xl bg-slate-950/50 p-4 ring-1 ring-white/5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] leading-relaxed text-slate-100 italic">{word.ex}</p>
                      {word.exEn && <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{word.exEn}</p>}
                    </div>
                    {isTop && <SpeakButton text={word.ex} label="Hear the example sentence" size="sm" />}
                  </div>
                </div>
              )}
            </div>
            <div className="text-right text-xs text-slate-500">Tap to flip back</div>
          </div>
        </div>
      </div>

      {/* Swipe feedback stamps */}
      {isTop && (
        <>
          <div
            className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-xl border-[3px] border-emerald-400 px-3 py-1 font-mono text-lg font-medium tracking-widest text-emerald-300"
            style={{ opacity: Math.max(0, intent) }}
          >
            {stamps[1]}
          </div>
          <div
            className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-xl border-[3px] border-rose-400 px-3 py-1 font-mono text-lg font-medium tracking-widest text-rose-300"
            style={{ opacity: Math.max(0, -intent) }}
          >
            {stamps[0]}
          </div>
          <div
            className="pointer-events-none absolute inset-0 rounded-[28px] transition-colors"
            style={{
              boxShadow:
                intent > 0
                  ? `inset 0 0 0 2px rgba(52,211,153,${intent * 0.8})`
                  : `inset 0 0 0 2px rgba(251,113,133,${-intent * 0.8})`,
            }}
          />
        </>
      )}
    </div>
  )
})

export default SwipeCard
