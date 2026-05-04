import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { localDb } from '@/lib/localDb';
import type { BusinessProfile } from '@/types';

interface AuthContextState {
  user: User | null;
  session: Session | null;
  profile: BusinessProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, businessName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const defaultContext: AuthContextState = {
  user: null,
  session: null,
  profile: null,
  loading: true,
  profileLoading: true,
  signIn: async () => ({ error: new Error('AuthContext not initialized') }),
  signUp: async () => ({ error: new Error('AuthContext not initialized') }),
  signOut: async () => {},
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextState>(defaultContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const data = await localDb.getProfile(userId);
      if (data) {
        setProfile({
          ...data,
          plan: data.plan || 'Free',
          plan_status: data.plan_status || 'active',
          customer_limit: data.customer_limit || 50,
        });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('[AuthContext] Error fetching profile:', err);
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      if (!supabase) {
        return { error: new Error('Supabase not configured') };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        localDb.setAuth({ id: data.user.id, email: data.user.email });
        await fetchProfile(data.user.id);
      }

      return { error: null };
    } catch (err) {
      console.error('[AuthContext] Sign in error:', err);
      return { error: err as Error };
    }
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, businessName?: string) => {
    try {
      if (!supabase) {
        return { error: new Error('Supabase not configured') };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName || email.split('@')[0] + "'s Business",
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        localDb.setAuth({ id: data.user.id, email: data.user.email });
        await fetchProfile(data.user.id);
      }

      return { error: null };
    } catch (err) {
      console.error('[AuthContext] Sign up error:', err);
      return { error: err as Error };
    }
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      localDb.setAuth(null);
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      const cachedUser = localDb.getAuth();
      if (cachedUser) {
        setUser({ id: cachedUser.id, email: cachedUser.email } as User);
      }
      return;
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setLoading(false);

      if (initialSession?.user) {
        localDb.setAuth({ 
          id: initialSession.user.id, 
          email: initialSession.user.email ?? '' 
        });
        fetchProfile(initialSession.user.id);
      } else {
        setProfileLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          localDb.setAuth({ 
            id: newSession.user.id, 
            email: newSession.user.email ?? '' 
          });
          await fetchProfile(newSession.user.id);
        } else if (event === 'SIGNED_OUT') {
          localDb.setAuth(null);
          setProfile(null);
          setProfileLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const value: AuthContextState = {
    user,
    session,
    profile,
    loading,
    profileLoading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}