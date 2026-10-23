import { AuthForms } from './AccountPanel'

const FEATURES = [
  ['6,250 words', '125 decks of 50, from greetings to advanced TCF vocabulary'],
  ['Swipe to learn', 'Right when you know it, left to see it again'],
  ['Exam mode', 'Test yourself French → English or English → French'],
  ['Hear every word', 'Native French audio, plus an example sentence for each card'],
]

// A small fanned stack of sample cards for the welcome screen
function CardStack() {
  const cards = [
    { fr: 'la bienveillance', pron: 'byan-vay-YAHNS', en: 'kindness, goodwill', tag: 'feminine', rot: 7, x: 34, y: 14, op: 0.45 },
    { fr: 'le tournant', pron: 'toor-NAHN', en: 'turning point', tag: 'masculine', rot: -6, x: -30, y: 8, op: 0.7 },
    { fr: 's’épanouir', pron: 'say-pa-NWEER', en: 'to flourish, to thrive', tag: 'verb', rot: 0, x: 0, y: 0, op: 1 },
  ]
  return (
    <div className="relative mx-auto h-56 w-full max-w-[17rem] sm:h-64" aria-hidden="true">
      {cards.map((c, i) => (
        <div
          key={c.fr}
          className="absolute inset-0 flex flex-col rounded-[24px] bg-gradient-to-b from-slate-800 to-slate-900 p-5 shadow-2xl shadow-black/60 ring-1 ring-white/10"
          style={{ transform: `translate(${c.x}px, ${c.y}px) rotate(${c.rot}deg)`, opacity: c.op, zIndex: i }}
        >
          {i === cards.length - 1 && (
            <>
          <div className="flex justify-end">
            <span className="rounded-full bg-slate-700/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-300">{c.tag}</span>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <p className="font-display text-3xl font-semibold text-white">{c.fr}</p>
            <p className="font-mono text-xs text-indigo-200/80">/{c.pron}/</p>
            <p className="text-sm text-slate-400">{c.en}</p>
          </div>
            </>
          )}
        </div>
      ))}
      <div className="absolute -left-3 top-8 z-10 -rotate-12 rounded-lg border-2 border-emerald-400 px-2 py-0.5 font-mono text-xs font-medium tracking-widest text-emerald-300">
        LEARNED
      </div>
    </div>
  )
}

export default function Welcome({ account }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <div className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="gutter relative mx-auto grid max-w-6xl content-center gap-8 py-10 md:min-h-[100dvh] md:grid-cols-[1.1fr_1fr] md:gap-x-16 md:gap-y-10">
        <header className="min-w-0 md:col-start-1 md:row-start-1 md:self-end">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">TCF Canada · objectif CLB 7</p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.95] text-white sm:text-6xl">
            French<span className="italic text-indigo-300">Flash</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
            Build the vocabulary you need for the TCF, one swipe at a time. Learn each deck, then prove it in exam mode. Your progress follows you on every device.
          </p>
        </header>

        <section className="min-w-0 md:col-start-2 md:row-span-2 md:row-start-1 md:self-center">
          <div className="rounded-3xl bg-slate-900/90 p-6 shadow-2xl shadow-black/40 ring-1 ring-white/[0.08] backdrop-blur sm:p-8">
            <h2 className="font-display text-2xl font-semibold text-white">Bienvenue</h2>
            <p className="mb-6 mt-1 text-sm text-slate-400">Sign in or create a free account to start studying.</p>
            {account.ready ? <AuthForms account={account} /> : <p className="text-sm text-slate-400">Loading…</p>}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">Word list from the <em>French Vocabulary for the TCF Exam</em> guide.</p>
        </section>

        <section className="flex min-w-0 flex-col gap-10 md:col-start-1 md:row-start-2 md:self-start">
          <ul className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(([title, text]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{title}</p>
                  <p className="text-sm leading-snug text-slate-400">{text}</p>
                </div>
              </li>
            ))}
          </ul>
          <CardStack />
        </section>
      </div>
    </div>
  )
}
