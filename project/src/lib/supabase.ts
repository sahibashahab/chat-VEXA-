import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Conversation = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

export type Document = {
  id: string;
  conversation_id: string;
  filename: string;
  content: string;
  file_type: string;
  file_data: string;
  created_at: string;
};

export type Memory = {
  id: string;
  user_id: string;
  key: string;
  content: string;
  created_at: string;
};

export type UserSettings = {
  id: string;
  user_id: string;
  voice_gender: 'male' | 'female';
  language: string;
  offline_mode: boolean;
  emotion_mode: boolean;
  created_at: string;
  updated_at: string;
};

export const LANGUAGES = [
  { code: 'en', label: 'English', speechCode: 'en-US' },
  { code: 'ur', label: 'Urdu', speechCode: 'ur-PK' },
  { code: 'roman_ur', label: 'Roman Urdu', speechCode: 'ur-PK' },
  { code: 'hi', label: 'Hindi', speechCode: 'hi-IN' },
] as const;

export type LanguageCode = typeof LANGUAGES[number]['code'];
