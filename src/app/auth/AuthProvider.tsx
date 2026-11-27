import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import useSWR, { useSWRConfig } from "swr";
import { supabase } from "../lib/supabase";
import { getMyProfile } from "../data/api";
import type { Profile } from "../data/types";
import { AuthContext, type AuthContextValue } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [recovery, setRecovery] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;
  const {
    data: profile,
    error: profileError,
    mutate: refreshProfile,
  } = useSWR<Profile | null>(userId ? ["profile", userId] : null, () =>
    userId ? getMyProfile(userId) : Promise.resolve(null),
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRecovery(false);
    // descarta dados privados em cache do usuário anterior
    globalMutate((key) => Array.isArray(key) && key[0] !== "public", undefined, {
      revalidate: false,
    });
  }, [globalMutate]);

  const value = useMemo(
    (): AuthContextValue => ({
      session,
      user: session?.user ?? null,
      profile: profile ?? null,
      isStaff: profile?.role === "staff",
      loading: session === undefined || (!!userId && profile === undefined && !profileError),
      profileError: profileError ?? null,
      recovery,
      clearRecovery: () => setRecovery(false),
      refreshProfile,
      signOut,
    }),
    [session, profile, profileError, userId, recovery, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
