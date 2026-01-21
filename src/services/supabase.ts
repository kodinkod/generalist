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

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
