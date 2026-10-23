import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// No keys (e.g. the single-file preview build): the app runs in local-only mode
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: true, detectSessionInUrl: true } }) : null
