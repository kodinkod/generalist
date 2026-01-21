import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// To set up Supabase:
// 1. Go to https://supabase.com and create a free account
// 2. Create a new project
// 3. Get your project URL and anon key from Settings > API
// 4. Create a .env file in the root directory with:
//    VITE_SUPABASE_URL=your-project-url
//    VITE_SUPABASE_ANON_KEY=your-anon-key
// 5. Run the SQL schema from supabase-schema.sql in the SQL Editor

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Create a minimal dummy client for when Supabase is not configured
// This prevents errors but won't actually make any requests
const createDummyClient = () => {
  return {
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase not configured') }),
      insert: () => ({ data: null, error: new Error('Supabase not configured') }),
      update: () => ({ data: null, error: new Error('Supabase not configured') }),
      delete: () => ({ data: null, error: new Error('Supabase not configured') }),
      upsert: () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  } as any;
};

// Create Supabase client only if configured
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createDummyClient();
