import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const REMEMBER_ME_KEY = 'nfnj_remember_me';

/** Storage that uses localStorage when "Remember me" is on, sessionStorage when off (log out when tab closes). */
function createRememberMeStorage() {
  const getBackend = () => {
    if (typeof localStorage === 'undefined') return localStorage as Storage;
    return localStorage.getItem(REMEMBER_ME_KEY) === 'false' ? sessionStorage : localStorage;
  };
  return {
    getItem: (key: string) => getBackend().getItem(key),
    setItem: (key: string, value: string) => getBackend().setItem(key, value),
    removeItem: (key: string) => getBackend().removeItem(key),
  };
}

const createMockClient = () => {
  console.warn("Supabase configuration missing (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY). Application is running in Offline/Local Mode.");
  const mockResult = (data: any = null) => ({ data, error: null, count: 0, status: 200, statusText: 'OK' });
  const chain = {
    select: () => chain,
    eq: () => chain,
    single: async () => mockResult(null),
    order: async () => mockResult([]),
    update: () => chain,
    insert: async () => mockResult(null),
    delete: () => chain,
    limit: () => chain,
    range: () => chain
  };
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOtp: async () => ({ data: null, error: new Error("Supabase configuration missing.") }),
      signInWithPassword: async () => ({ data: null, error: new Error("Supabase configuration missing.") }),
      signUp: async () => ({ data: null, error: new Error("Supabase configuration missing.") }),
      resetPasswordForEmail: async () => ({ data: null, error: new Error("Supabase configuration missing.") }),
      signOut: async () => ({ error: null }),
    },
    from: () => chain,
  } as any;
};

const hasValidConfig = typeof supabaseUrl === 'string' && supabaseUrl.length > 0 && supabaseUrl.startsWith('http');

export const supabase = hasValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey || '', {
      auth: {
        persistSession: true,
        storage: createRememberMeStorage(),
        storageKey: 'nfnj_sb_auth',
      },
    })
  : createMockClient();

/** Call before login/signup to persist "Remember me" choice; affects where session is stored. */
export function setRememberMe(remember: boolean) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
  }
}

// Optional: In Supabase Dashboard → Authentication → Settings → JWT expiry, set to 2592000 (seconds) for ~30-day session.
