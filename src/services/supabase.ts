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

// Track if Supabase is working or if we should fallback to localStorage
let supabaseAvailable = Boolean(supabaseUrl && supabaseAnonKey);
const SUPABASE_DISABLED_KEY = 'supabase_disabled';

// Check if Supabase was previously disabled due to errors
if (typeof window !== 'undefined' && localStorage.getItem(SUPABASE_DISABLED_KEY) === 'true') {
  supabaseAvailable = false;
}

// Check if Supabase is configured and available
export const isSupabaseConfigured = () => {
  return supabaseAvailable;
};

// Disable Supabase and fallback to localStorage
export const disableSupabase = () => {
  console.warn('🔴 Supabase disabled due to connection errors. Falling back to localStorage.');
  supabaseAvailable = false;
  if (typeof window !== 'undefined') {
    localStorage.setItem(SUPABASE_DISABLED_KEY, 'true');
  }
};

// Re-enable Supabase (clear the disabled flag)
export const enableSupabase = () => {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseAvailable = true;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SUPABASE_DISABLED_KEY);
    }
    console.log('✅ Supabase re-enabled');
  } else {
    console.error('❌ Cannot enable Supabase: missing URL or anon key');
  }
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

// Test database connection and provide detailed diagnostics
export const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');

  // Step 1: Check environment variables
  console.log('📋 Configuration check:');
  console.log(`  - VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Database connection FAILED: Missing environment variables');
    console.log('💡 To fix:');
    console.log('  1. Create a .env file in the root directory');
    console.log('  2. Add your Supabase credentials:');
    console.log('     VITE_SUPABASE_URL=your-project-url');
    console.log('     VITE_SUPABASE_ANON_KEY=your-anon-key');
    console.log('  3. Restart the development server');
    return { success: false, error: 'Missing environment variables' };
  }

  // Step 2: Check if Supabase was previously disabled
  if (!isSupabaseConfigured()) {
    console.warn('⚠️  Supabase is currently disabled (fallback to localStorage)');
    console.log('💡 To re-enable, call: enableSupabase()');
    return { success: false, error: 'Supabase disabled due to previous errors' };
  }

  // Step 3: Test actual connection
  try {
    console.log('🔌 Testing connection to Supabase...');
    const { data, error } = await supabase
      .from('items')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Database connection FAILED:', error.message);
      console.error('📝 Error details:', {
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details,
      });

      // Provide specific help based on error type
      if (error.message.includes('CORS')) {
        console.log('💡 CORS Error - Possible fixes:');
        console.log('  1. Check if your Supabase project URL is correct');
        console.log('  2. Verify your domain is allowed in Supabase > Settings > API > CORS');
        console.log('  3. Check browser console for detailed CORS errors');
      } else if (error.code === 'PGRST301') {
        console.log('💡 JWT/Auth Error - Possible fixes:');
        console.log('  1. Verify your anon key is correct');
        console.log('  2. Check if Row Level Security (RLS) policies are configured');
        console.log('  3. Make sure tables exist in your database');
      } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('💡 Table Missing Error - Possible fixes:');
        console.log('  1. Run the SQL schema from supabase-schema.sql');
        console.log('  2. Check table names match your schema');
        console.log('  3. Verify you\'re connected to the correct project');
      }

      return { success: false, error: error.message };
    }

    console.log('✅ Database connection SUCCESSFUL!');
    console.log(`📊 Connected to: ${supabaseUrl}`);
    return { success: true, data };

  } catch (err: any) {
    console.error('❌ Network/Connection error:', err.message);
    console.log('💡 Network Error - Possible fixes:');
    console.log('  1. Check your internet connection');
    console.log('  2. Verify the Supabase URL is reachable');
    console.log('  3. Check if a firewall is blocking the connection');
    console.log('  4. Try accessing the Supabase dashboard directly');

    return { success: false, error: err.message };
  }
};

// Initialize and log connection status
if (typeof window !== 'undefined') {
  console.log('🚀 Supabase Service Initialized');
  console.log(`📍 Mode: ${isSupabaseConfigured() ? 'Supabase Database' : 'LocalStorage (Offline Mode)'}`);

  if (isSupabaseConfigured()) {
    // Test connection on initialization (don't await to not block loading)
    testDatabaseConnection().catch(err => {
      console.error('Failed to test database connection on init:', err);
    });
  } else {
    console.log('💡 Running in offline mode. To use Supabase:');
    console.log('  - Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env');
    console.log('  - Restart the dev server');
  }

  // Make test functions available in browser console for debugging
  (window as any).testDatabaseConnection = testDatabaseConnection;
  (window as any).enableSupabase = enableSupabase;
  (window as any).disableSupabase = disableSupabase;

  console.log('🛠️  Debug commands available:');
  console.log('  - testDatabaseConnection() - Test connection to Supabase');
  console.log('  - enableSupabase() - Re-enable Supabase after errors');
  console.log('  - disableSupabase() - Switch to localStorage mode');
}
