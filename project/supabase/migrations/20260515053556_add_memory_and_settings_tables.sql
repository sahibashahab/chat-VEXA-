/*
  # Add Memory System and User Settings

  1. New Tables
    - `memories` - stores AI memory facts about the user
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `key` (text) - category/label for the memory
      - `content` (text) - the memory fact
      - `created_at` (timestamp)
    - `user_settings` - stores per-user preferences
      - `id` (uuid, primary key)
      - `user_id` (text, unique)
      - `voice_gender` (text: 'male' | 'female', default 'female')
      - `language` (text, default 'en')
      - `offline_mode` (boolean, default false)
      - `emotion_mode` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Modified Tables
    - `documents` - add `file_type` column (text) and `file_data` column (text for base64 images)

  3. Security
    - Enable RLS on new tables
    - Open access for demo (anon) mode
*/

-- Add file_type and file_data columns to documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE documents ADD COLUMN file_type text NOT NULL DEFAULT 'text';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'file_data'
  ) THEN
    ALTER TABLE documents ADD COLUMN file_data text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Create memories table
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'anonymous',
  key text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE DEFAULT 'anonymous',
  voice_gender text NOT NULL DEFAULT 'female' CHECK (voice_gender IN ('male', 'female')),
  language text NOT NULL DEFAULT 'en',
  offline_mode boolean NOT NULL DEFAULT false,
  emotion_mode boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read memories"
  ON memories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert memories"
  ON memories FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can delete memories"
  ON memories FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can read user_settings"
  ON user_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert user_settings"
  ON user_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update user_settings"
  ON user_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
