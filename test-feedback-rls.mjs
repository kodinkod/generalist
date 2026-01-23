#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testing Feedback RLS Policy\n');
console.log('Supabase URL:', supabaseUrl);
console.log('Using anon key:', supabaseAnonKey.substring(0, 20) + '...\n');

// Test 1: Try to read from feedback table
console.log('📖 Test 1: Reading from feedback table...');
try {
  const { data, error } = await supabase
    .from('feedback')
    .select('id')
    .limit(1);

  if (error) {
    console.log('❌ Read error:', error.message);
  } else {
    console.log('✅ Read successful, found', data?.length || 0, 'records');
  }
} catch (e) {
  console.log('❌ Exception:', e.message);
}

// Test 2: Try to insert test feedback
console.log('\n📝 Test 2: Inserting test feedback...');
const testFeedback = {
  user_id: `test_user_${Date.now()}`,
  item_id: null,
  system_id: 'test',
  type: 'test',
  message: 'Test feedback from RLS check script'
};

try {
  const { data, error } = await supabase
    .from('feedback')
    .insert([testFeedback])
    .select();

  if (error) {
    console.log('❌ Insert error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
    console.log('   Hint:', error.hint);

    if (error.code === '42501') {
      console.log('\n💡 This is the RLS policy error!');
      console.log('   You need to run fix-feedback-rls.sql in Supabase SQL Editor');
    }
  } else {
    console.log('✅ Insert successful!');
    console.log('   Created feedback ID:', data[0]?.id);

    // Clean up test record
    console.log('\n🧹 Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('feedback')
      .delete()
      .eq('id', data[0].id);

    if (deleteError) {
      console.log('⚠️  Could not delete test record:', deleteError.message);
    } else {
      console.log('✅ Test record deleted');
    }
  }
} catch (e) {
  console.log('❌ Exception:', e.message);
}

// Test 3: Check RLS policies (requires elevated permissions, may fail)
console.log('\n🔐 Test 3: Checking RLS policies...');
try {
  const { data, error } = await supabase
    .rpc('exec_sql', {
      query: "SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'feedback';"
    });

  if (error) {
    console.log('⚠️  Cannot check policies (requires elevated permissions)');
    console.log('   Error:', error.message);
  } else {
    console.log('✅ Current policies:', data);
  }
} catch (e) {
  console.log('⚠️  Cannot check policies:', e.message);
}

console.log('\n' + '='.repeat(60));
console.log('Summary:');
console.log('If you see RLS error (42501), run fix-feedback-rls.sql');
console.log('in your Supabase SQL Editor to fix the issue.');
console.log('='.repeat(60));
