-- Fix for feedback table RLS policy error (Error 42501)
-- Run this SQL in your Supabase SQL Editor to fix the "new row violates row-level security policy" error
--
-- This script:
-- 1. Drops any existing conflicting policies
-- 2. Grants the necessary permissions to the anon role
-- 3. Creates the correct RLS policy for feedback insertion

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Feedback is insertable by everyone" ON feedback;
DROP POLICY IF EXISTS "Enable insert for anon users" ON feedback;

-- Grant INSERT permission to the anon role (required for unauthenticated users)
GRANT INSERT ON feedback TO anon;

-- Grant SELECT permission on the feedback table's sequence (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create the RLS policy that allows anyone to insert feedback
CREATE POLICY "Feedback is insertable by everyone" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Verify the changes (optional - comment out if you don't want to see results)
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
