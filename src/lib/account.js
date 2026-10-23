import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { isDirty, setDirty } from './progress'

const TABLE = 'progress'
const SAVE_DELAY = 1200

const toRow = (userId, snap) => ({
  user_id: userId,
  learned: snap.learned,
  exam_fr_en: snap['fr-en'],
  exam_en_fr: snap['en-fr'],
  updated_at: new Date().toISOString(),
})
const fromRow = (row) => ({ learned: row.learned || [], 'fr-en': row.exam_fr_en || [], 'en-fr': row.exam_en_fr || [] })
const union = (a, b) => Object.fromEntries(Object.keys(a).map((k) => [k, [...new Set([...a[k], ...(b[k] || [])])]]))

// Signed-in user + syncing progress to the `progress` table.
// Server copy wins on load, except when this device has edits it never managed to save.
// Right after a sign-in from the form, guest progress on this device is merged into the account.
export function useAccount(progress) {
  const enabled = !!supabase
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!enabled)
  const [recovering, setRecovering] = useState(false)
  const [sync, setSync] = useState({ status: 'idle', at: null })
  const loadedFor = useRef(null)
  const mergeNext = useRef(false)
  const progressRef = useRef(progress)
  progressRef.current = progress
  const user = session?.user || null

  useEffect(() => {
    if (!enabled) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
      if (event === 'SIGNED_OUT') {
        loadedFor.current = null
        progressRef.current.clear()
      }
      setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [enabled])

  const save = useCallback(async (snap) => {
    if (!user || loadedFor.current !== user.id) return
    setSync((s) => ({ ...s, status: 'saving' }))
    const { error } = await supabase.from(TABLE).upsert(toRow(user.id, snap?.learned ? snap : progressRef.current.snapshot()))
    if (error) return setSync((s) => ({ ...s, status: 'error', message: error.message }))
    setDirty(false)
    setSync({ status: 'saved', at: new Date() })
  }, [user])

  const pull = useCallback(async () => {
    if (!user) return
    setSync((s) => ({ ...s, status: 'loading' }))
    const { data: row, error } = await supabase.from(TABLE).select('*').eq('user_id', user.id).maybeSingle()
    if (error) return setSync((s) => ({ ...s, status: 'error', message: error.message }))
    const local = progressRef.current.snapshot()
    const first = loadedFor.current !== user.id
    loadedFor.current = user.id
    if (!row) return save() // new account: start it from whatever is on this device
    if (first && mergeNext.current) {
      mergeNext.current = false
      const merged = union(fromRow(row), local)
      progressRef.current.replaceAll(merged)
      save(merged)
    } else if (isDirty()) {
      save() // this device has unsaved edits: they win
    } else {
      progressRef.current.replaceAll(fromRow(row))
      setSync({ status: 'saved', at: new Date(row.updated_at || Date.now()) })
    }
  }, [user, save])

  // Load when the user changes
  useEffect(() => {
    if (user && loadedFor.current !== user.id) pull()
  }, [user, pull])

  // Save shortly after each local edit
  useEffect(() => {
    if (!user || !progress.rev) return
    const t = setTimeout(() => save(), SAVE_DELAY)
    return () => clearTimeout(t)
  }, [progress.rev, user, save])

  // Coming back to the tab: save pending edits, or pick up progress from other devices
  useEffect(() => {
    if (!user) return
    const onVis = () => (document.visibilityState === 'visible' ? (isDirty() ? save() : pull()) : isDirty() && save())
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [user, save, pull])

  const redirectTo = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined

  return {
    enabled,
    ready,
    user,
    sync,
    recovering,
    signUp: async (email, password) => {
      mergeNext.current = true
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
      return { error, needsConfirm: !error && !data.session }
    },
    signIn: async (email, password) => {
      mergeNext.current = true
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) mergeNext.current = false
      return { error }
    },
    signOut: async () => {
      if (isDirty()) await save()
      await supabase.auth.signOut()
    },
    sendReset: (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo }),
    setPassword: async (password) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (!error) setRecovering(false)
      return { error }
    },
    cancelRecovery: () => setRecovering(false),
  }
}
