import { useEffect, useMemo, useRef, useState } from 'react'

export const KEYS = {
  learned: 'tcf-flashcards:learned:v1',
  'fr-en': 'tcf-flashcards:exam:fr-en:v1',
  'en-fr': 'tcf-flashcards:exam:en-fr:v1',
}
const DIRTY_KEY = 'tcf-flashcards:unsynced'
const LISTS = Object.keys(KEYS)

function read(key) {
  try {
    const raw = localStorage.getItem(key)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

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

// All progress: learned words plus exam scores per direction, each a Set of word ids.
// `rev` counts local edits so the cloud sync knows when to save.
export function useProgress() {
  const [state, setState] = useState(() => Object.fromEntries(LISTS.map((k) => [k, read(KEYS[k])])))
  const [rev, setRev] = useState(0)

  useEffect(() => {
    LISTS.forEach((k) => write(KEYS[k], JSON.stringify([...state[k]])))
  }, [state])

  const edit = (list, fn) => {
    setState((s) => ({ ...s, [list]: fn(new Set(s[list])) }))
    setDirty(true)
    setRev((r) => r + 1)
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
    rev,
    snapshot: () => Object.fromEntries(LISTS.map((k) => [k, [...stateRef.current[k]]])),
    // Replace everything (data from the server); not counted as a local edit
    replaceAll: (data) => setState(Object.fromEntries(LISTS.map((k) => [k, new Set(data?.[k] || [])]))),
    clear: () => {
      setState(Object.fromEntries(LISTS.map((k) => [k, new Set()])))
      setDirty(false)
    },
  }
}
