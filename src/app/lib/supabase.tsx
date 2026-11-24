// @ts-nocheck
import { supabase } from '@/integrations/supabase/client'
export { supabase }
export const isSupabaseConfigured = true
export const PHOTO_BUCKET = 'item-photos'

/** Destination for e-mail links (confirmation and password reset). */
export const authRedirectUrl = () =>
  `${window.location.origin}/auth/callback`

const NEXT_KEY = 'auth:next'
export const rememberNextPath = (path) => {
  try { localStorage.setItem(NEXT_KEY, path) } catch { /* storage unavailable */ }
}
export const takeNextPath = () => {
  try {
    const path = localStorage.getItem(NEXT_KEY)
    localStorage.removeItem(NEXT_KEY)
    return path && path.startsWith('/') && !path.startsWith('//') ? path : null
  } catch {
    return null
  }
}
