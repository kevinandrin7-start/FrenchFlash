let voice = null

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null
  const voices = speechSynthesis.getVoices()
  voice =
    voices.find((v) => v.lang === 'fr-FR' && /google|amélie|thomas|audrey|marie/i.test(v.name)) ||
    voices.find((v) => v.lang === 'fr-FR') ||
    voices.find((v) => v.lang?.startsWith('fr')) ||
    null
  return voice
}

if (typeof speechSynthesis !== 'undefined') {
  pickVoice()
  speechSynthesis.onvoiceschanged = pickVoice
}

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

// Drop study notes like "(m)", "(+ subj.)", "(Canada)" so they aren't read aloud
export function cleanForSpeech(text) {
  return text
    .replace(/\((?:m|f|pl|m\/f|\+ ?subj\.?|Canada|Québec|France|fam\.?|inf\.?)[^)]*\)/gi, '')
    .replace(/NOT .*/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function speak(text, { rate = 0.9 } = {}) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(cleanForSpeech(text))
  u.lang = 'fr-FR'
  u.rate = rate
  if (voice || pickVoice()) u.voice = voice
  speechSynthesis.speak(u)
}

// Read a longer passage: split into sentences so browsers don't cut it off, and alternate
// between two French voices on dialogue turns ("— ...") when the device has two.
export function speakPassage(text, { rate = 0.92, onEnd } = {}) {
  if (!canSpeak) return
  speechSynthesis.cancel()
  const fr = speechSynthesis.getVoices().filter((v) => v.lang?.startsWith('fr'))
  const primary = voice || pickVoice() || fr[0] || null
  const second = fr.find((v) => v !== primary && v.lang === 'fr-FR') || fr.find((v) => v !== primary) || primary
  const turns = text.split(/\s*—\s*/).filter(Boolean)
  const parts = []
  turns.forEach((t, i) => {
    const v = turns.length > 1 && i % 2 === 1 ? second : primary
    t.split(/(?<=[.!?…])\s+/).filter(Boolean).forEach((s) => parts.push([s, v]))
  })
  parts.forEach(([s, v], i) => {
    const u = new SpeechSynthesisUtterance(s.replace(/\/\//g, ' '))
    u.lang = 'fr-FR'
    u.rate = rate
    if (v) u.voice = v
    if (i === parts.length - 1 && onEnd) u.onend = onEnd
    speechSynthesis.speak(u)
  })
}

export const stopSpeaking = () => canSpeak && speechSynthesis.cancel()
