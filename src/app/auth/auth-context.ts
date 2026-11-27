import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Profile } from "../data/types";

export type AuthContextValue = {
  session: Session | null | undefined;
  user: Session["user"] | null;
  profile: Profile | null;
  isStaff: boolean;
  loading: boolean;
  profileError: Error | null;
  recovery: boolean;
  clearRecovery: () => void;
  refreshProfile: () => Promise<unknown>;
  signOut: () => Promise<void>;
};

const FALLBACK: AuthContextValue = {
  session: null,
  user: null,
  profile: null,
  profileError: null,
  isStaff: false,
  loading: true,
  recovery: false,
  clearRecovery: () => {},
  refreshProfile: async () => undefined,
  signOut: async () => {},
};

export const AuthContext = createContext<AuthContextValue>(FALLBACK);

export function useAuth() {
  return useContext(AuthContext) ?? FALLBACK;
}
