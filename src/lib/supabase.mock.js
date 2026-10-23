// In-memory stand-in for Supabase, used only by `vite build --mode mock` for testing the account flows.
// State lives in localStorage under tcf-mock:* so it survives reloads like the real backend would.
const LS = {
  get: (k, d) => {
    try { return JSON.parse(localStorage.getItem('tcf-mock:' + k)) ?? d } catch { return d }
  },
  set: (k, v) => localStorage.setItem('tcf-mock:' + k, JSON.stringify(v)),
}
const listeners = new Set()
const emit = (event, session) => listeners.forEach((fn) => fn(event, session))
const sessionFor = (u) => ({ user: { id: u.id, email: u.email, created_at: u.created_at }, access_token: 'mock' })
const err = (message) => ({ data: { user: null, session: null }, error: { message } })

const auth = {
  async getSession() {
    if (location.hash.includes('type=recovery')) {
      const u = LS.get('users', []).find((x) => x.email === LS.get('recoveryEmail', ''))
      history.replaceState(null, '', location.pathname)
      if (u) {
        LS.set('session', u.id)
        setTimeout(() => emit('PASSWORD_RECOVERY', sessionFor(u)), 0)
        return { data: { session: sessionFor(u) }, error: null }
      }
    }
    const u = LS.get('users', []).find((x) => x.id === LS.get('session', null))
    return { data: { session: u ? sessionFor(u) : null }, error: null }
  },
  onAuthStateChange(fn) {
    listeners.add(fn)
    return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } }
  },
  async signUp({ email, password }) {
    const users = LS.get('users', [])
    if (users.some((u) => u.email === email)) return err('User already registered')
    if (password.length < 6) return err('Password should be at least 6 characters.')
    const u = { id: 'u' + Date.now(), email, password, created_at: new Date().toISOString() }
    LS.set('users', [...users, u])
    LS.set('session', u.id)
    const session = sessionFor(u)
    emit('SIGNED_IN', session)
    return { data: { user: session.user, session }, error: null }
  },
  async signInWithPassword({ email, password }) {
    const u = LS.get('users', []).find((x) => x.email === email && x.password === password)
    if (!u) return err('Invalid login credentials')
    LS.set('session', u.id)
    const session = sessionFor(u)
    emit('SIGNED_IN', session)
    return { data: { user: session.user, session }, error: null }
  },
  async signOut() {
    LS.set('session', null)
    emit('SIGNED_OUT', null)
    return { error: null }
  },
  async resetPasswordForEmail(email) {
    LS.set('recoveryEmail', email)
    return { data: {}, error: null }
  },
  async updateUser({ password }) {
    const users = LS.get('users', [])
    const u = users.find((x) => x.id === LS.get('session', null))
    if (!u) return err('Auth session missing!')
    u.password = password
    LS.set('users', users)
    emit('USER_UPDATED', sessionFor(u))
    return { data: { user: sessionFor(u).user }, error: null }
  },
}

function from(table) {
  const rows = () => LS.get('table:' + table, {})
  return {
    select() {
      return {
        eq(_col, id) {
          return { maybeSingle: async () => ({ data: rows()[id] ?? null, error: null }) }
        },
      }
    },
    async upsert(row) {
      LS.set('table:' + table, { ...rows(), [row.user_id]: row })
      return { error: null }
    },
  }
}

export const supabase = { auth, from }
