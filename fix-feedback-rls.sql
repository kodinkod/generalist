-- Fix Feedback RLS Policy
-- Run this in Supabase SQL Editor

-- Step 1: Drop all existing policies for feedback table
DROP POLICY IF EXISTS "Feedback is insertable by everyone" ON feedback;
DROP POLICY IF EXISTS "Enable insert for all users" ON feedback;
DROP POLICY IF EXISTS "Allow insert for all" ON feedback;

-- Step 2: Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT ON feedback TO anon;

-- Step 3: Create new INSERT policy for feedback
CREATE POLICY "allow_insert_feedback"
ON feedback
FOR INSERT
TO anon
WITH CHECK (true);

-- Step 4: Verify the setup
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'feedback';
