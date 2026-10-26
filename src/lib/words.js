import WORDS from '../data/words.json'

export const GROUP_SIZE = 50
export { WORDS }

export const BATCHES = [
  { n: 1, name: 'Foundations' },
  { n: 2, name: 'Society & Opinion' },
  { n: 3, name: 'Ideas & Abstract Language' },
  { n: 4, name: 'Exam Skills & Real-Life French' },
  { n: 5, name: 'Advanced & Everyday Mastery' },
]

// Sequential decks of 50: group 1 = words 1–50, group 125 = words 6,201–6,250
export const GROUPS = Array.from({ length: Math.ceil(WORDS.length / GROUP_SIZE) }, (_, i) => {
  const words = WORDS.slice(i * GROUP_SIZE, (i + 1) * GROUP_SIZE)
  const sections = [...new Set(words.map((w) => w.section))]
  return {
    index: i + 1,
    from: words[0].id,
    to: words[words.length - 1].id,
    batch: words[0].batch,
    sections,
    ids: words.map((w) => w.id),
    words,
  }
})

export const POS_LABELS = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  prep: 'preposition',
  conj: 'connector',
  pron: 'pronoun',
  det: 'determiner',
  num: 'number',
  expr: 'expression',
  interj: 'interjection',
}

export const fmt = (n) => n.toLocaleString('en-US')

export const WORD_BY_ID = Object.fromEntries(WORDS.map((w) => [w.id, w]))
