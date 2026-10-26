// Spaced repetition (a Leitner-style box per word), daily counts and the typing-answer check.
// Days are whole local days since 1970, so "due today" doesn't flip at midnight UTC.

export const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000)

// Days until the next review for each box. Box 0 is "missed": due again today.
export const INTERVALS = [0, 1, 3, 7, 16, 35, 80]
const MAX_BOX = INTERVALS.length - 1

export const DEFAULT_GOAL = 50
export const REVIEW_SESSION = 50 // cards per review session
export const AGAIN_GAP = 3 // a missed card comes back after this many others

// Words learned before spaced repetition existed have no schedule yet:
// spread them over two weeks from this day so they don't all land at once.
const SEED_DAY = dayNum(new Date(2026, 9, 27))
const seeded = (id) => [2, SEED_DAY + (id % 14), 0]

// srs[id] = [box, dueDay, lastReviewedDay]
export const entryFor = (srs, id) => srs[id] || seeded(id)

export function schedule(prev, knew, missedThisSession) {
  const today = dayNum()
  if (!knew) return [0, today, today]
  const box = missedThisSession ? 1 : Math.min(MAX_BOX, Math.max(prev?.[0] || 0, 1) + 1)
  return [box, today + INTERVALS[box], today]
}

// Learned words whose review day has come, the longest-waiting first
export function dueIds(learned, srs, today = dayNum()) {
  const due = []
  for (const id of learned) {
    const e = entryFor(srs, id)
    if (e[1] <= today) due.push([e[1], e[0], id])
  }
  return due.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]).map((d) => d[2])
}

export function nextDueDay(learned, srs) {
  let next = Infinity
  for (const id of learned) next = Math.min(next, entryFor(srs, id)[1])
  return next === Infinity ? null : next
}

// stats = { goal, days: { [day]: [cardsDone, goalThatDay] } }
export const goalOf = (stats) => stats?.goal || DEFAULT_GOAL
export const doneOn = (stats, day = dayNum()) => stats?.days?.[day]?.[0] || 0
const met = (stats, day) => {
  const d = stats?.days?.[day]
  return !!d && d[0] >= d[1]
}

// Consecutive days the goal was met, ending today (or yesterday, while today is still in play)
export function streak(stats, today = dayNum()) {
  let day = met(stats, today) ? today : today - 1
  let n = 0
  while (met(stats, day)) {
    n++
    day--
  }
  return n
}

export function bumpDay(stats, by) {
  const today = dayNum()
  const goal = goalOf(stats)
  const days = {}
  for (const [k, v] of Object.entries(stats?.days || {})) if (+k > today - 400) days[k] = v
  days[today] = [Math.max(0, (days[today]?.[0] || 0) + by), goal]
  return { ...stats, goal, days }
}

export function withGoal(stats, goal) {
  const today = dayNum()
  const days = { ...(stats?.days || {}) }
  if (days[today]) days[today] = [days[today][0], goal]
  return { ...stats, goal, days }
}

// Two copies of the schedule (this device and the account): per word, keep the later review
export function mergeSrs(a = {}, b = {}) {
  const out = { ...a }
  for (const [id, e] of Object.entries(b)) {
    const o = out[id]
    if (!o || e[2] > o[2] || (e[2] === o[2] && e[0] > o[0])) out[id] = e
  }
  return out
}

export function mergeStats(a = {}, b = {}) {
  const days = { ...(a.days || {}) }
  for (const [k, v] of Object.entries(b.days || {})) if (!days[k] || v[0] > days[k][0]) days[k] = v
  return { goal: a.goal || b.goal || DEFAULT_GOAL, days }
}

// ---- Typing answers ----

// "l'année (f)" → "l'année"; "lourd / lourde" → ["lourd", "lourde"]
const clean = (s) =>
  s
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/\([^)]*\)/g, '')
    .replace(/[.!?¡¿…,;:«»"]/g, ' ')
    .replace(/\s*'\s*/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const ARTICLE = /^(le |la |les |l'|un |une |des |du |de la |de l')/
const bare = (s) => s.replace(ARTICLE, '')

export const answersFor = (fr) => {
  const full = clean(fr)
  const parts = full.split(/\s*\/\s*/).filter(Boolean)
  return [...new Set([full, ...parts])]
}

// 'correct' | 'accents' (right letters, wrong accents) | 'article' (missing or wrong le/la) | 'wrong'
export function checkTyped(typed, fr) {
  const t = clean(typed)
  if (!t) return 'wrong'
  const answers = answersFor(fr)
  if (answers.includes(t)) return 'correct'
  if (answers.some((a) => stripAccents(a) === stripAccents(t))) return 'accents'
  if (answers.some((a) => ARTICLE.test(a) && stripAccents(bare(a)) === stripAccents(bare(t)))) return 'article'
  return 'wrong'
}
