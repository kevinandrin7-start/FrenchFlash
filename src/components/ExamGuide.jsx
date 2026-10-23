// Beginner's guide to the TCF Canada (plus a short look at TCF Tout Public and TCF Québec).
// Facts checked Oct 2026 against IRCC's equivalency tables and France Éducation international test-centre pages.

const SECTIONS = [
  {
    fr: 'Compréhension orale',
    en: 'Listening',
    qs: '39 questions',
    time: '35 min',
    score: '0–699',
    accent: 'from-sky-500/20 ring-sky-400/30 text-sky-200',
    what: 'You hear short recordings: announcements, phone messages, conversations, interviews and radio clips. Each is followed by a multiple-choice question with 4 options and one right answer.',
    tips: ['Most recordings play only once, so read the question before it starts.', 'The first questions are easy (A1) and they get harder, up to C2.'],
  },
  {
    fr: 'Compréhension écrite',
    en: 'Reading',
    qs: '39 questions',
    time: '60 min',
    score: '0–699',
    accent: 'from-emerald-500/20 ring-emerald-400/30 text-emerald-200',
    what: 'You read texts that go from signs, ads and short notes to articles and opinion pieces. Each comes with one multiple-choice question.',
    tips: ['About 90 seconds per question. Don’t get stuck on one text.', 'Harder questions near the end are worth more points, so leave time for them.'],
  },
  {
    fr: 'Expression écrite',
    en: 'Writing',
    qs: '3 tasks',
    time: '60 min',
    score: '0–20',
    accent: 'from-amber-500/20 ring-amber-400/30 text-amber-200',
    what: 'Three writing tasks, done in order:',
    tasks: [
      ['Task 1', '60–120 words', 'A short message to a friend, colleague or group: describe something, invite, give news.'],
      ['Task 2', '120–150 words', 'A longer text, like a blog post, article or letter, telling about an experience.'],
      ['Task 3', '120–180 words', 'Summarize two opposing opinions on a topic, then give and defend your own.'],
    ],
    tips: ['Stay inside the word ranges.', 'Connectors like cependant, par ailleurs and en somme make your writing sound like B2 or higher.'],
  },
  {
    fr: 'Expression orale',
    en: 'Speaking',
    qs: '3 tasks',
    time: '12 min',
    score: '0–20',
    accent: 'from-fuchsia-500/20 ring-fuchsia-400/30 text-fuchsia-200',
    what: 'A recorded face-to-face conversation with an examiner:',
    tasks: [
      ['Task 1', '2 min, no prep', 'Guided interview (entretien dirigé): talk about yourself, your work, your interests.'],
      ['Task 2', '5 min 30 incl. 2 min prep', 'Role play (exercice en interaction): you ask the examiner questions to get information, e.g. about a course or an apartment.'],
      ['Task 3', '4 min 30, no prep', 'Give your opinion (point de vue) on a topic and back it up with reasons and examples.'],
    ],
    tips: ['Keep talking: silence costs more than small mistakes.', 'In Task 2, the score comes from asking lots of varied questions.'],
  },
]

const CEFR = [
  ['A1', 'Beginner', '100–199', '1–3'],
  ['A2', 'Elementary', '200–299', '4–5'],
  ['B1', 'Intermediate', '300–399', '6–9'],
  ['B2', 'Upper intermediate', '400–499', '10–13'],
  ['C1', 'Advanced', '500–599', '14–15'],
  ['C2', 'Mastery', '600–699', '16–20'],
]

// IRCC: TCF Canada → CLB / NCLC
const NCLC = [
  ['10+', '549–699', '549–699', '16–20', '16–20'],
  ['9', '523–548', '524–548', '14–15', '14–15'],
  ['8', '503–522', '499–523', '12–13', '12–13'],
  ['7', '458–502', '453–498', '10–11', '10–11'],
  ['6', '398–457', '406–452', '7–9', '7–9'],
  ['5', '369–397', '375–405', '6', '6'],
  ['4', '331–368', '342–374', '4–5', '4–5'],
]

const FACTS = [
  ['4', 'sections, all required'],
  ['≈ 2 h 50', 'total test time'],
  ['2–3 weeks', 'to get your results'],
  ['2 years', 'results stay valid'],
]

function H2({ kicker, children }) {
  return (
    <div className="mb-4">
      {kicker && <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-indigo-300/80">{kicker}</p>}
      <h2 className="mt-1 font-display text-2xl font-semibold text-white [text-wrap:balance]">{children}</h2>
    </div>
  )
}

function Table({ head, rows, highlight }) {
  return (
    <div className="overflow-x-auto rounded-2xl ring-1 ring-white/[0.07]">
      <table className="w-full min-w-[22rem] text-left text-sm tabular">
        <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400">
          <tr>{head.map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map((r) => (
            <tr key={r[0]} className={highlight?.(r) ? 'bg-emerald-500/10 text-emerald-100' : 'text-slate-300'}>
              {r.map((c, i) => <td key={i} className={`whitespace-nowrap px-3 py-2.5 ${i === 0 ? 'font-semibold text-white' : ''}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ExamGuide({ onBack }) {
  return (
    <div className="gutter mx-auto max-w-3xl pb-20 pt-6">
      <header className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-800/80 text-slate-300 ring-1 ring-white/10 transition hover:bg-slate-700 hover:text-white"
          aria-label="Back to profile"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-sm text-slate-400">Profile</p>
      </header>

      <section className="mt-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-indigo-300/80">Guide · Test de connaissance du français</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-white sm:text-5xl [text-wrap:balance]">
          The TCF Canada, <span className="italic text-indigo-300">explained</span>
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-slate-300">
          The TCF Canada is the French test IRCC accepts for Express Entry, permanent residence and citizenship. France Éducation international runs it at approved test centres, usually on a computer. Here’s everything to know before you book it.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FACTS.map(([n, l]) => (
            <div key={l} className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/[0.07]">
              <p className="font-display text-2xl font-semibold text-white">{n}</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-400">{l}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <H2 kicker="Section by section">The four parts of the test</H2>
        <div className="flex flex-col gap-4">
          {SECTIONS.map((s, i) => (
            <article key={s.en} className={`rounded-3xl bg-gradient-to-br ${s.accent.split(' ')[0]} to-slate-900 p-5 ring-1 ${s.accent.split(' ')[1]} sm:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-mono text-xs ${s.accent.split(' ')[2]}`}>Part {i + 1}</p>
                  <h3 className="font-display text-xl font-semibold text-white">{s.en}</h3>
                  <p className="text-sm italic text-slate-400">{s.fr}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[s.qs, s.time, `Score ${s.score}`].map((t) => (
                    <span key={t} className="rounded-full bg-slate-950/50 px-3 py-1 text-slate-200 ring-1 ring-white/10">{t}</span>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-200">{s.what}</p>
              {s.tasks && (
                <ol className="mt-3 flex flex-col gap-2">
                  {s.tasks.map(([t, len, d]) => (
                    <li key={t} className="rounded-2xl bg-slate-950/40 p-3 ring-1 ring-white/5">
                      <p className="text-sm font-medium text-white">
                        {t} <span className="font-normal text-slate-400">· {len}</span>
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{d}</p>
                    </li>
                  ))}
                </ol>
              )}
              <ul className="mt-4 flex flex-col gap-1.5">
                {s.tips.map((t) => (
                  <li key={t} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                    <span className="text-emerald-300">✓</span>
                    {t}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <H2 kicker="Scoring">How you’re scored</H2>
        <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-300">
          <p>
            <strong className="text-white">Listening and reading</strong> are scored automatically from 0 to 699. The questions go from easy to hard, and harder questions are worth more points.
          </p>
          <p>
            <strong className="text-white">Writing and speaking</strong> are graded by trained examiners from 0 to 20. They look at whether you completed the task, how well your ideas hang together, and the range and accuracy of your vocabulary and grammar.
          </p>
          <p>Each score is also matched to a level of the Common European Framework (CEFR):</p>
        </div>
        <div className="mt-4">
          <Table head={['Level', 'Meaning', 'Listening / Reading', 'Writing / Speaking']} rows={CEFR} />
        </div>
      </section>

      <section className="mt-12">
        <H2 kicker="For Canadian immigration">What score do you need? CLB / NCLC</H2>
        <p className="text-[15px] leading-relaxed text-slate-300">
          IRCC converts your four TCF Canada scores into Canadian Language Benchmark levels (CLB, or NCLC in French). Each skill counts separately, so you need the target level in all four. <strong className="text-emerald-200">CLB 7</strong> is the usual target for Express Entry (Federal Skilled Worker), and higher levels earn more points.
        </p>
        <div className="mt-4">
          <Table head={['CLB', 'Listening', 'Reading', 'Writing', 'Speaking']} rows={NCLC} highlight={(r) => r[0] === '7'} />
        </div>
        <p className="mt-2 text-xs text-slate-500">Source: IRCC language test equivalency charts.</p>
      </section>

      <section className="mt-12">
        <H2 kicker="Practical">Booking and test day</H2>
        <ul className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-300">
          {[
            ['Book early.', 'Register with an approved centre (often an Alliance Française or a university). Seats fill up weeks ahead, and the fee is set by each centre.'],
            ['Bring the same ID you registered with.', 'Usually a valid passport. Check your centre’s rules.'],
            ['Results', 'arrive by email in about 2–3 weeks. For IRCC they must be less than 2 years old when you apply.'],
            ['Retaking', 'is allowed, but there’s normally a 30-day wait between attempts. Each attempt is a full new test.'],
          ].map(([b, t]) => (
            <li key={b} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              <span>
                <strong className="text-white">{b}</strong> {t}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <H2 kicker="Other versions">TCF Canada vs. TCF Tout Public vs. TCF Québec</H2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['TCF Canada', 'For federal immigration and citizenship (IRCC). All 4 sections, as described above.'],
            ['TCF Tout Public', 'For studies, work or personal goals. 76 multiple-choice questions in 1 h 25 (listening 25 min, language structures 15 min, reading 45 min). Writing and speaking are optional add-ons.'],
            ['TCF Québec', 'For Québec immigration (MIFI). Same kinds of sections, but you take only the ones your application requires.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl bg-slate-900 p-4 ring-1 ring-white/[0.07]">
              <p className="font-medium text-white">{t}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-3xl bg-indigo-500/10 p-6 ring-1 ring-indigo-400/25">
        <H2 kicker="Using FrenchFlash">How this app helps</H2>
        <ul className="flex flex-col gap-2 text-[15px] leading-relaxed text-slate-200">
          <li>• Vocabulary is the base of all four sections, and it matters most in reading and listening.</li>
          <li>• Use <strong>Learning</strong> mode for new decks, then <strong>Exam</strong> mode in both directions. English → French trains the recall you need for writing and speaking.</li>
          <li>• Tap the speaker on every card. Hearing words helps with the listening section.</li>
          <li>• Read each example sentence aloud. It’s quick speaking practice.</li>
        </ul>
      </section>

      <p className="mt-10 text-xs leading-relaxed text-slate-500">
        Test details can change. Before you book, check the official pages:{' '}
        <a className="text-indigo-300 underline-offset-2 hover:underline" href="https://www.france-education-international.fr/test/tcf-canada" target="_blank" rel="noreferrer">France Éducation international · TCF Canada</a>{' '}
        and{' '}
        <a className="text-indigo-300 underline-offset-2 hover:underline" href="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.htm" target="_blank" rel="noreferrer">IRCC · Language testing</a>.
      </p>
    </div>
  )
}
