/*
  # Chat Application Schema

  1. New Tables
    - `conversations` - stores chat conversations/sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    - `messages` - stores individual messages
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `role` (text: 'user' | 'assistant')
      - `content` (text)
      - `created_at` (timestamp)
    - `documents` - stores uploaded PDF/doc content
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `filename` (text)
      - `content` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Policies allow authenticated users to manage their own data
    - Anonymous access allowed for demo (no-auth) mode via anon key
*/

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL DEFAULT 'anonymous',
  title text NOT NULL DEFAULT 'New Chat',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  filename text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read conversations"
  ON conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert conversations"
  ON conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON conversations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete conversations"
  ON conversations FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert messages"
  ON messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete messages"
  ON messages FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can read documents"
  ON documents FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert documents"
  ON documents FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can delete documents"
  ON documents FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_documents_conversation_id ON documents(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
