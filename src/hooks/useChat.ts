import { useState, useCallback } from 'react';
import { supabase, type Conversation, type Message, type Document, type Memory, type UserSettings, LANGUAGES } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  return response.json();
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    id: '', user_id: 'anonymous', voice_gender: 'female',
    language: 'en', offline_mode: false, emotion_mode: true,
    created_at: '', updated_at: '',
  });
  const [detectedEmotion, setDetectedEmotion] = useState('neutral');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // --- Settings ---
  const loadSettings = useCallback(async () => {
    const { data } = await supabase.from('user_settings').select('*').eq('user_id', 'anonymous').maybeSingle();
    if (data) setSettings(data);
  }, []);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const { data } = await supabase
      .from('user_settings')
      .upsert({ user_id: 'anonymous', ...updates, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select()
      .maybeSingle();
    if (data) setSettings(data);
  }, []);

  // --- Conversations ---
  const fetchConversations = useCallback(async () => {
    const { data } = await supabase.from('conversations').select('*').order('updated_at', { ascending: false });
    if (data) setConversations(data);
  }, []);

  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim()) return [];
    const { data } = await supabase
      .from('messages')
      .select('id, conversation_id, role, content, created_at')
      .ilike('content', `%${query.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(20);
    return (data || []) as (Message & { conversation_id: string })[];
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, []);

  const fetchDocuments = useCallback(async (conversationId: string) => {
    const { data } = await supabase.from('documents').select('*').eq('conversation_id', conversationId);
    if (data) setDocuments(data);
  }, []);

  const createConversation = useCallback(async (title = 'New Chat') => {
    const { data } = await supabase.from('conversations').insert({ title, user_id: 'anonymous' }).select().maybeSingle();
    if (data) {
      setConversations(prev => [data, ...prev]);
      setActiveConversation(data);
      setMessages([]);
      setDocuments([]);
    }
    return data;
  }, []);

  const selectConversation = useCallback(async (conv: Conversation) => {
    setLoading(true);
    setActiveConversation(conv);
    await Promise.all([fetchMessages(conv.id), fetchDocuments(conv.id)]);
    setLoading(false);
  }, [fetchMessages, fetchDocuments]);

  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from('conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
      setMessages([]);
      setDocuments([]);
    }
  }, [activeConversation]);

  // --- Messages ---
  const sendMessage = useCallback(async (content: string) => {
    if (!activeConversation || !content.trim()) return;
    setSending(true);

    const userMsg = { conversation_id: activeConversation.id, role: 'user' as const, content: content.trim() };
    const { data: savedUserMsg } = await supabase.from('messages').insert(userMsg).select().maybeSingle();
    if (savedUserMsg) setMessages(prev => [...prev, savedUserMsg]);

    // Update title if first message
    if (messages.length === 0) {
      const title = content.trim().slice(0, 40) + (content.length > 40 ? '...' : '');
      await supabase.from('conversations').update({ title, updated_at: new Date().toISOString() }).eq('id', activeConversation.id);
      setConversations(prev => prev.map(c => c.id === activeConversation.id ? { ...c, title } : c));
      setActiveConversation(prev => prev ? { ...prev, title } : prev);
    } else {
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', activeConversation.id);
    }

    const allMessages = [...messages, savedUserMsg].filter(Boolean).map(m => ({ role: m!.role, content: m!.content }));
    const documentContext = documents.map(d => `[${d.filename}]\n${d.content}`).join('\n\n---\n\n');
    const memoryContext = memories.map(m => ({ key: m.key, content: m.content }));

    try {
      const data = await callEdgeFunction('chat', {
        messages: allMessages,
        documentContext: documentContext || null,
        language: settings.language,
        emotion: detectedEmotion,
        emotionMode: settings.emotion_mode,
        memories: memoryContext,
        offlineMode: settings.offline_mode,
      });

      const replyContent = data.reply || data.error || 'Sorry, I could not generate a response.';
      if (data.detectedEmotion) setDetectedEmotion(data.detectedEmotion);

      const { data: savedReply } = await supabase
        .from('messages')
        .insert({ conversation_id: activeConversation.id, role: 'assistant', content: replyContent })
        .select().maybeSingle();
      if (savedReply) setMessages(prev => [...prev, savedReply]);
    } catch {
      const { data: errMsg } = await supabase
        .from('messages')
        .insert({ conversation_id: activeConversation.id, role: 'assistant', content: 'Connection error. Please try again.' })
        .select().maybeSingle();
      if (errMsg) setMessages(prev => [...prev, errMsg]);
    }

    setSending(false);
  }, [activeConversation, messages, documents, memories, settings, detectedEmotion]);

  // --- Documents ---
  const addDocument = useCallback(async (filename: string, content: string, fileType = 'text', fileData = '') => {
    if (!activeConversation) return;
    const { data } = await supabase
      .from('documents')
      .insert({ conversation_id: activeConversation.id, filename, content, file_type: fileType, file_data: fileData })
      .select().maybeSingle();
    if (data) setDocuments(prev => [...prev, data]);
  }, [activeConversation]);

  const removeDocument = useCallback(async (id: string) => {
    await supabase.from('documents').delete().eq('id', id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  }, []);

  // --- Memories ---
  const fetchMemories = useCallback(async () => {
    const { data } = await supabase.from('memories').select('*').eq('user_id', 'anonymous').order('created_at', { ascending: false });
    if (data) setMemories(data);
  }, []);

  const addMemory = useCallback(async (key: string, content: string) => {
    const { data } = await supabase.from('memories').insert({ user_id: 'anonymous', key, content }).select().maybeSingle();
    if (data) setMemories(prev => [data, ...prev]);
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    await supabase.from('memories').delete().eq('id', id);
    setMemories(prev => prev.filter(m => m.id !== id));
  }, []);

  // --- Internet Fetch ---
  const fetchFromInternet = useCallback(async (query: string, type: string) => {
    return callEdgeFunction('internet-fetch', { query, type });
  }, []);

  // --- OCR ---
  const extractTextFromImage = useCallback(async (imageBase64: string, language?: string) => {
    return callEdgeFunction('ocr', { imageBase64, language });
  }, []);

  // --- Image Explain ---
  const explainImage = useCallback(async (imageBase64: string, question?: string, language?: string) => {
    return callEdgeFunction('image-explain', { imageBase64, question, language });
  }, []);

  // --- Translate ---
  const translateText = useCallback(async (text: string, sourceLang: string, targetLang: string) => {
    return callEdgeFunction('translate', { text, sourceLang, targetLang });
  }, []);

  // --- Report / Summary / Voice Note / References ---
  const generateReport = useCallback(async (content: string, type: string, language?: string) => {
    return callEdgeFunction('report', { content, type, language });
  }, []);

  return {
    conversations, activeConversation, messages, documents, memories, settings,
    detectedEmotion, loading, sending,
    fetchConversations, createConversation, selectConversation, deleteConversation,
    sendMessage, searchMessages,
    addDocument, removeDocument,
    fetchMemories, addMemory, deleteMemory,
    loadSettings, updateSettings,
    fetchFromInternet, extractTextFromImage, explainImage, translateText, generateReport,
  };
}
