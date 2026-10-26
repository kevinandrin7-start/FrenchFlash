import { useEffect, useMemo, useRef, useState } from 'react'
import { bumpDay, withGoal } from './srs'

export const KEYS = {
  learned: 'tcf-flashcards:learned:v1',
  'fr-en': 'tcf-flashcards:exam:fr-en:v1',
  'en-fr': 'tcf-flashcards:exam:en-fr:v1',
}
// Review schedule ({ id: [box, dueDay, lastDay] }) and daily goal/counts ({ goal, days })
const SRS_KEY = 'tcf-flashcards:srs:v1'
const STATS_KEY = 'tcf-flashcards:stats:v1'
const DIRTY_KEY = 'tcf-flashcards:unsynced'
const LISTS = Object.keys(KEYS)

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const read = (key) => new Set(readJSON(key, []))

const write = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage unavailable (private mode, sandbox): progress lasts for this visit only */
  }
}

export const isDirty = () => {
  try {
    return localStorage.getItem(DIRTY_KEY) === '1'
  } catch {
    return false
  }
}
export const setDirty = (v) => write(DIRTY_KEY, v ? '1' : '0')

const fromData = (data) => ({
  ...Object.fromEntries(LISTS.map((k) => [k, new Set(data?.[k] || [])])),
  srs: data?.srs || {},
  stats: data?.stats || {},
})

// All progress: learned words plus exam scores per direction (each a Set of word ids),
// the review schedule and the daily counts. `rev` counts local edits so the cloud sync knows when to save.
export function useProgress() {
  const [state, setState] = useState(() => ({
    ...Object.fromEntries(LISTS.map((k) => [k, read(KEYS[k])])),
    srs: readJSON(SRS_KEY, {}),
    stats: readJSON(STATS_KEY, {}),
  }))
  const [rev, setRev] = useState(0)

  useEffect(() => {
    LISTS.forEach((k) => write(KEYS[k], JSON.stringify([...state[k]])))
    write(SRS_KEY, JSON.stringify(state.srs))
    write(STATS_KEY, JSON.stringify(state.stats))
  }, [state])

  const touch = () => {
    setDirty(true)
    setRev((r) => r + 1)
  }
  const edit = (list, fn) => {
    setState((s) => ({ ...s, [list]: fn(new Set(s[list])) }))
    touch()
  }
  const update = (key, fn) => {
    setState((s) => ({ ...s, [key]: fn(s[key]) }))
    touch()
  }

  const lists = useMemo(
    () =>
      Object.fromEntries(
        LISTS.map((k) => [
          k,
          {
            ids: state[k],
            mark: (id) => edit(k, (s) => s.add(id)),
            unmark: (id) => edit(k, (s) => (s.delete(id), s)),
            resetIds: (ids) => edit(k, (s) => (ids.forEach((id) => s.delete(id)), s)),
          },
        ])
      ),
    [state]
  )

  const stateRef = useRef(state)
  stateRef.current = state

  return {
    ...lists,
    srs: state.srs,
    stats: state.stats,
    // Set (or, with null, remove) one word's review schedule
    setSrs: (id, entry) =>
      update('srs', (s) => {
        const next = { ...s }
        if (entry) next[id] = entry
        else delete next[id]
        return next
      }),
    countCard: (by = 1) => update('stats', (s) => bumpDay(s, by)),
    setGoal: (goal) => update('stats', (s) => withGoal(s, goal)),
    rev,
    snapshot: () => {
      const s = stateRef.current
      return { ...Object.fromEntries(LISTS.map((k) => [k, [...s[k]]])), srs: s.srs, stats: s.stats }
    },
    // Replace everything (data from the server); not counted as a local edit
    replaceAll: (data) => setState(fromData(data)),
    clear: () => {
      setState(fromData(null))
      setDirty(false)
    },
  }
}
