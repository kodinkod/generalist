-- =============================================================================
-- ПОЛНАЯ НАСТРОЙКА RLS ПОЛИТИК ДЛЯ SUPABASE
-- Выполните этот SQL скрипт в Supabase SQL Editor
-- =============================================================================

-- ШАГ 1: Удалить все старые политики
-- =============================================================================
DROP POLICY IF EXISTS "Items are viewable by everyone" ON items;
DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON ratings;
DROP POLICY IF EXISTS "Feedback is insertable by everyone" ON feedback;
DROP POLICY IF EXISTS "Enable insert for all users" ON feedback;
DROP POLICY IF EXISTS "Allow insert for all" ON feedback;
DROP POLICY IF EXISTS "allow_insert_feedback" ON feedback;
DROP POLICY IF EXISTS "User preferences are viewable by everyone" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- ШАГ 2: Включить RLS на всех таблицах
-- =============================================================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ШАГ 3: Дать права anon роли на схему и таблицы
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Права на items
GRANT SELECT, INSERT ON items TO anon;
GRANT SELECT, INSERT ON items TO authenticated;

-- Права на ratings
GRANT SELECT, INSERT, UPDATE, DELETE ON ratings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ratings TO authenticated;

-- Права на feedback
GRANT INSERT ON feedback TO anon;
GRANT INSERT ON feedback TO authenticated;
GRANT SELECT ON feedback TO authenticated; -- authenticated может читать

-- Права на user_preferences
GRANT SELECT, INSERT, UPDATE ON user_preferences TO anon;
GRANT SELECT, INSERT, UPDATE ON user_preferences TO authenticated;

-- ШАГ 4: Создать RLS политики для таблицы ITEMS
-- =============================================================================

-- Все могут читать items
CREATE POLICY "items_select_public"
ON items
FOR SELECT
TO anon, authenticated
USING (true);

-- Все могут добавлять items
CREATE POLICY "items_insert_public"
ON items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ШАГ 5: Создать RLS политики для таблицы RATINGS
-- =============================================================================

-- Все могут читать ratings
CREATE POLICY "ratings_select_public"
ON ratings
FOR SELECT
TO anon, authenticated
USING (true);

-- Все могут добавлять ratings
CREATE POLICY "ratings_insert_public"
ON ratings
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Все могут обновлять ratings
CREATE POLICY "ratings_update_public"
ON ratings
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Все могут удалять ratings
CREATE POLICY "ratings_delete_public"
ON ratings
FOR DELETE
TO anon, authenticated
USING (true);

-- ШАГ 6: Создать RLS политики для таблицы FEEDBACK
-- =============================================================================

-- Все могут добавлять feedback
CREATE POLICY "feedback_insert_public"
ON feedback
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Только authenticated могут читать feedback
CREATE POLICY "feedback_select_authenticated"
ON feedback
FOR SELECT
TO authenticated
USING (true);

-- ШАГ 7: Создать RLS политики для таблицы USER_PREFERENCES
-- =============================================================================

-- Все могут читать preferences
CREATE POLICY "preferences_select_public"
ON user_preferences
FOR SELECT
TO anon, authenticated
USING (true);

-- Все могут добавлять preferences
CREATE POLICY "preferences_insert_public"
ON user_preferences
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Все могут обновлять preferences
CREATE POLICY "preferences_update_public"
ON user_preferences
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- =============================================================================
-- ПРОВЕРКА НАСТРОЕК
-- =============================================================================

-- Проверить все политики для items
SELECT
  'items' as table_name,
  policyname,
  cmd,
  roles::text[],
  permissive
FROM pg_policies
WHERE tablename = 'items'
ORDER BY policyname;

-- Проверить все политики для ratings
SELECT
  'ratings' as table_name,
  policyname,
  cmd,
  roles::text[],
  permissive
FROM pg_policies
WHERE tablename = 'ratings'
ORDER BY policyname;

-- Проверить все политики для feedback
SELECT
  'feedback' as table_name,
  policyname,
  cmd,
  roles::text[],
  permissive
FROM pg_policies
WHERE tablename = 'feedback'
ORDER BY policyname;

-- Проверить все политики для user_preferences
SELECT
  'user_preferences' as table_name,
  policyname,
  cmd,
  roles::text[],
  permissive
FROM pg_policies
WHERE tablename = 'user_preferences'
ORDER BY policyname;

-- Проверить права на таблицы для anon роли
SELECT
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'anon'
  AND table_schema = 'public'
  AND table_name IN ('items', 'ratings', 'feedback', 'user_preferences')
ORDER BY table_name, privilege_type;
