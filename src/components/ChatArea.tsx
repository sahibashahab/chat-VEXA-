import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, Loader2, Bot, Paperclip, Settings, CloudOff } from 'lucide-react';
import type { Conversation, Message, Document, UserSettings, Memory, LanguageCode } from '../lib/supabase';
import MessageBubble from './MessageBubble';
import { useSpeech } from '../hooks/useSpeech';
import AiAvatar from './AiAvatar';

type Props = {
  conversation: Conversation | null;
  messages: Message[];
  documents: Document[];
  loading: boolean;
  sending: boolean;
  settings: UserSettings;
  memories: Memory[];
  detectedEmotion: string;
  isTyping: boolean;
isSpeaking: boolean;
isListening: boolean;
  onSend: (text: string) => void;
  onAddDocument: (filename: string, content: string, fileType: string, fileData: string) => void;
  onRemoveDocument: (id: string) => void;
  onCreateConversation: () => void;
  onOpenSettings: () => void;
  onFetchInternet: (query: string, type: string) => Promise<{ results?: { title: string; snippet: string }[] }>;
  onOCR: (imageBase64: string, language?: string) => Promise<{ text?: string; error?: string }>;
  onImageExplain: (imageBase64: string, question?: string, language?: string) => Promise<{ explanation?: string; error?: string }>;
  onTranslate: (text: string, source: string, target: string) => Promise<{ translation?: string; error?: string }>;
  onGenerateReport: (content: string, type: string, language?: string) => Promise<{ output?: string; error?: string }>;
};

export default function ChatArea({
  conversation, messages, documents, loading, sending, settings, memories, detectedEmotion,
  onSend, onAddDocument, onRemoveDocument, onCreateConversation, onOpenSettings,
  onFetchInternet, onOCR, onImageExplain, onTranslate, onGenerateReport,
}: Props) {
  const [_memories] = [memories];
  const [input, setInput] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking, hasSpeechRecognition } = useSpeech();
  useEffect(() => {
  const msg = new SpeechSynthesisUtterance("Welcome to Vexa AI assistant");
  msg.lang = "en-US";
  msg.rate = 1;
  msg.volume = 1;

  window.speechSynthesis.speak(msg);
}, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setInput(text);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, settings.language as LanguageCode);
    }
  };

  const handleSpeak = (id: string, text: string) => {
    setSpeakingId(id);
    speak(text, settings.voice_gender, settings.language as LanguageCode);
  };

  const handleStop = () => { stopSpeaking(); setSpeakingId(null); };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
    const fileTypeMap: Record<string, string> = { pdf: 'pdf', docx: 'docx', doc: 'docx', ppt: 'ppt', pptx: 'ppt', txt: 'text', md: 'text' };
    onAddDocument(file.name, text, fileTypeMap[ext] || 'text', '');
  };

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onAddDocument(file.name, `[Image uploaded: ${file.name}]`, 'image', base64);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const emotionEmoji: Record<string, string> = {
    happy: ':)', sad: ':(', angry: '>(', neutral: ':|', excited: '!', curious: '?',
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 relative">
        
        <div className="welcome-icon w-70 h-70 flex items-center justify-center relative z-30">
          <AiAvatar
            isListening={isListening}
            isSpeaking={isSpeaking}
            isTyping={sending}
          />
        </div>
        <div className="text-center relative z-10">
          <h2 className="text-[#e9edef] text-2xl font-semibold mb-2">VEXA</h2>
          <p className="text-[#8696a0] text-sm max-w-xs leading-relaxed">
            Chat with AI
          </p>
        </div>
        <button onClick={onCreateConversation} className="welcome-btn px-6 py-3 bg-[#00a884] text-white rounded-full font-medium text-sm relative z-10">
          Start New Chat
        </button>
        {/* <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-2 relative z-10">
          {[
            { label: 'Voice Input', icon: '🎙' },
            { label: 'Image AI', icon: '🖼' },
            { label: 'Internet', icon: '🌐' },
            { label: 'Translate', icon: '🔄' },
            { label: 'OCR', icon: '📝' },
            { label: 'Reports', icon: '📊' },
          ].map((f, i) => (
            <div key={f.label} className="feature-card glass rounded-xl p-3 text-center stagger-item" style={{ animationDelay: `${300 + i * 100}ms` }}>
              <p className="text-[#00a884] text-lg mb-1">{f.icon}</p>
              <p className="text-[#aebac1] text-xs font-medium">{f.label}</p>
            </div>
          ))}
        </div> */}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 header-glass z-10">
     <div className="w-20 h-20 rounded-full bg-[#00a884] flex items-center justify-center overflow-hidden">    
        <Bot size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#e9edef] font-medium text-sm truncate">{conversation.title}</p>
          <div className="flex items-center gap-2">
            <p className="text-[#8696a0] text-xs">{sending ? 'typing...' : 'AI Assistant'}</p>
            {settings.emotion_mode && detectedEmotion !== 'neutral' && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#00a884]/20 text-[#00a884]">{emotionEmoji[detectedEmotion] || detectedEmotion}</span>
            )}
            {settings.offline_mode && (
              <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                <CloudOff size={10} /> Offline
              </span>
            )}
          </div>
        </div>
        <button onClick={onOpenSettings} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#3a4a54] transition-all hover:scale-110" title="Settings">
          <Settings size={18} className="text-[#aebac1]" />
        </button>
      </div>

      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        </div>

        <div className="relative z-10">
          {loading ? (
            <div className="flex justify-center pt-8"><Loader2 size={24} className="animate-spin text-[#00a884]" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8696a0] gap-2">
              <p className="text-sm">Send a message to get started</p>
              {documents.length > 0 && <p className="text-xs text-[#00a884]">{documents.length} file(s) loaded</p>}
            </div>
          ) : (
            messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSpeak={(text) => handleSpeak(msg.id, text)}
                onStop={handleStop}
                isSpeaking={isSpeaking}
                isThisSpeaking={speakingId === msg.id && isSpeaking}
              />
            ))
          )}

          {sending && (
            <div className="flex mb-1.5 px-4 justify-start">
              <div className="glass rounded-xl rounded-tl-sm px-4 py-3 shadow-lg">
                <div className="flex gap-1.5 items-center h-4">
                  <span className="typing-dot w-2 h-2 rounded-full" />
                  <span className="typing-dot w-2 h-2 rounded-full" />
                  <span className="typing-dot w-2 h-2 rounded-full" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="px-3 py-3 relative z-10 md:pb-3 pb-16">
        {isListening && (
          <div className="flex items-center gap-2 px-3 py-1.5 mb-2 glass rounded-full w-fit mx-auto">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[#e9edef] text-xs">Listening... {transcript && `"${transcript}"`}</span>
          </div>
        )}
        <div className="input-glow flex items-end gap-2 glass rounded-2xl px-3 py-2 transition-all duration-300">
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center hover:bg-[#3a4a54] rounded-full transition-all"
            >
              <Paperclip size={20} className="text-[#aebac1]" />
            </button>
            {showAttachMenu && (
                <div className="absolute bottom-12 left-0 glass rounded-2xl p-2 w-64 z-50">

                  {/* Image Upload */}
                  <label className="flex items-center gap-3 p-3 hover:bg-[#3a4a54] rounded-xl cursor-pointer text-[#e9edef]">
                    🖼 Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        setShowAttachMenu(false);
                      }}
                    />
                  </label>

                  {/* Document Upload */}
                  <label className="flex items-center gap-3 p-3 hover:bg-[#3a4a54] rounded-xl cursor-pointer text-[#e9edef]">
                    📄 Upload File
                    <input
                      type="file"
                      accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.md"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                        setShowAttachMenu(false);
                      }}
                    />
                  </label>

                  <div className="border-t border-white/10 my-2"></div>

                  {/* <Toolbar
                    language={settings.language}
                    onFetchInternet={onFetchInternet}
                    onOCR={onOCR}
                    onImageExplain={onImageExplain}
                    onTranslate={onTranslate}
                    onGenerateReport={onGenerateReport}
                    onSendResult={(text) => {
                      onSend(text);
                      setShowAttachMenu(false);
                    }}
                  /> */}
                </div>
              )}
           
          </div>


          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            rows={1}
            className="flex-1 bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm resize-none outline-none py-1.5 leading-relaxed"
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />

          {hasSpeechRecognition && (
            <button
              onClick={handleVoice}
              className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ${
                isListening ? 'mic-active bg-red-500 hover:bg-red-600 text-white' : 'hover:bg-[#3a4a54] text-[#aebac1] hover:scale-110'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}

          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className={`btn-send flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full ${
              input.trim() && !sending ? 'bg-[#00a884] text-white' : 'text-[#8696a0] cursor-not-allowed'
            }`}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}
