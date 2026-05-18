import { useEffect, useState, useRef } from 'react';
import { MessageSquare, Plus, Trash2, Bot, Search, X, ArrowRight } from 'lucide-react';
import type { Conversation, Message } from '../lib/supabase';

type Props = {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelect: (conv: Conversation) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onFetch: () => void;
  onSearch: (query: string) => Promise<(Message & { conversation_id: string })[]>;
  onJumpToMessage: (conversationId: string) => void;
};

export default function Sidebar({ conversations, activeConversation, onSelect, onCreate, onDelete, onFetch, onSearch, onJumpToMessage }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Message & { conversation_id: string })[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { onFetch(); }, [onFetch]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await onSearch(value);
      setSearchResults(results);
      setSearching(false);
    }, 300);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-[#00a884]/40 text-[#e9edef] rounded px-0.5">{part}</mark> : part
    );
  };

  const getConversationTitle = (convId: string) =>
    conversations.find(c => c.id === convId)?.title || 'Chat';

  return (
    <div className="flex flex-col h-full bg-[#111b21]/95 md:bg-[#111b21]/90 text-white w-full sidebar-enter">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 header-glass">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center glow-ring">
            <Bot size={20} className="text-white" />
          </div>
          <span className="font-semibold text-base text-[#e9edef]">AI ChatBot</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#3a4a54] transition-all duration-300 hover:scale-110"
            title="Search messages"
          >
            <Search size={18} className="text-[#aebac1]" />
          </button>
          <button
            onClick={onCreate}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#3a4a54] transition-all duration-300 hover:scale-110"
            title="New chat"
          >
            <Plus size={20} className="text-[#aebac1]" />
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="px-3 py-2 bg-[#111b21]/95 border-b border-[#2a3942]/50 stagger-item">
          <div className="input-glow flex items-center gap-2 glass rounded-xl px-3 py-2 transition-all duration-300">
            <Search size={16} className="text-[#00a884] flex-shrink-0" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search messages..."
              className="flex-1 bg-transparent text-[#e9edef] placeholder-[#8696a0] text-sm outline-none"
            />
            {searching && <div className="w-4 h-4 border-2 border-[#00a884] border-t-transparent rounded-full animate-spin flex-shrink-0" />}
            {searchQuery && (
              <button onClick={closeSearch} className="flex-shrink-0 hover:scale-110 transition-transform">
                <X size={14} className="text-[#8696a0]" />
              </button>
            )}
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-[50vh] overflow-y-auto space-y-1">
              <p className="text-[#8696a0] text-xs px-2 mb-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
              {searchResults.map(msg => (
                <div
                  key={msg.id}
                  onClick={() => { onJumpToMessage(msg.conversation_id); closeSearch(); }}
                  className="doc-chip flex items-start gap-2 p-2.5 rounded-xl bg-[#202c33]/80 hover:bg-[#2a3942] cursor-pointer transition-all duration-200 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#00a884] text-xs font-medium truncate">{getConversationTitle(msg.conversation_id)}</span>
                      <span className="text-[#8696a0] text-[10px]">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="text-[#aebac1] text-xs leading-relaxed line-clamp-2">
                      {highlightMatch(msg.content.slice(0, 150), searchQuery)}
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-[#8696a0] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}

          {searchQuery && !searching && searchResults.length === 0 && (
            <p className="text-[#8696a0] text-xs text-center py-4">No messages found</p>
          )}
        </div>
      )}

      {/* Chats label */}
      {!searchOpen && (
        <div className="px-3 py-2 bg-[#111b21]/50">
          <div className="glass rounded-lg px-4 py-2 flex items-center gap-2">
            <MessageSquare size={14} className="text-[#00a884]" />
            <span className="text-[#8696a0] text-sm">Chats</span>
          </div>
        </div>
      )}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8696a0] px-6 text-center gap-3">
            <MessageSquare size={40} className="opacity-40" />
            <p className="text-sm">No chats yet. Start a new conversation.</p>
          </div>
        ) : (
          conversations.map((conv, i) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`conv-item flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-[#222d34]/50 stagger-item ${
                activeConversation?.id === conv.id ? 'bg-[#2a3942]/90' : ''
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:scale-110">
                <Bot size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[#e9edef] text-sm font-medium truncate">{conv.title}</span>
                  <span className="text-[#8696a0] text-xs flex-shrink-0 ml-2">{formatTime(conv.updated_at)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[#8696a0] text-xs truncate">Tap to open chat</span>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
                    className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 transition-all duration-200 ml-1 flex-shrink-0 hover:scale-110"
                  >
                    <Trash2 size={13} className="text-[#8696a0] hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
