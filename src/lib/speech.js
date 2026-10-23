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
