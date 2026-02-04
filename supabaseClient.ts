
import { createClient } from '@supabase/supabase-js';

// 从环境变量获取 Supabase 配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

/**
 * Mock client to prevent the application from crashing if Supabase 
 * environment variables are not yet configured.
 */
const createMockClient = () => {
  console.warn("Supabase configuration missing (VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY). Application is running in Offline/Local Mode.");
  
  const mockResult = (data: any = null) => ({
    data,
    error: null,
    count: 0,
    status: 200,
    statusText: 'OK'
  });

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
      onAuthStateChange: () => ({ 
        data: { subscription: { unsubscribe: () => {} } } 
      }),
      signInWithOtp: async () => ({ data: null, error: new Error("Supabase configuration missing.") }),
      signOut: async () => ({ error: null }),
    },
    from: () => chain,
  } as any;
};

// Ensure createClient is ONLY called if a valid URL string is provided
export const supabase = (typeof supabaseUrl === 'string' && supabaseUrl.length > 0 && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey || '')
  : createMockClient();
