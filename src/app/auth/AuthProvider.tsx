// @ts-nocheck
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { supabase } from '../lib/supabase'
import { getMyProfile } from '../data/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  const [recovery, setRecovery] = useState(false)
  const { mutate: globalMutate } = useSWRConfig()

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => alive && setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
    })
    return () => {
      alive = false
      subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user?.id
  const { data: profile, mutate: refreshProfile } = useSWR(userId ? ['profile', userId] : null, () => getMyProfile(userId))

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setRecovery(false)
    // descarta dados privados em cache do usuário anterior
    globalMutate((key) => Array.isArray(key) && key[0] !== 'public', undefined, { revalidate: false })
  }, [globalMutate])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile: profile ?? null,
      isStaff: profile?.role === 'staff',
      loading: session === undefined || (!!userId && profile === undefined),
      recovery,
      clearRecovery: () => setRecovery(false),
      refreshProfile,
      signOut,
    }),
    [session, profile, userId, recovery, refreshProfile, signOut],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
