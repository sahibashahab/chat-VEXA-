import { X, Volume2, Globe, WifiOff, Heart, Brain, Trash2 } from 'lucide-react';
import type { UserSettings, Memory, LanguageCode } from '../lib/supabase';
import { LANGUAGES } from '../lib/supabase';

type Props = {
  settings: UserSettings;
  memories: Memory[];
  onUpdateSettings: (updates: Partial<UserSettings>) => void;
  onAddMemory: (key: string, content: string) => void;
  onDeleteMemory: (id: string) => void;
  onClose: () => void;
};

export default function SettingsPanel({ settings, memories, onUpdateSettings, onAddMemory, onDeleteMemory, onClose }: Props) {
  const handleAddMemory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const key = fd.get('memoryKey') as string;
    const content = fd.get('memoryContent') as string;
    if (key.trim() && content.trim()) {
      onAddMemory(key.trim(), content.trim());
      e.currentTarget.reset();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4" style={{ backdropFilter: 'blur(8px)', background: 'rgba(0,0,0,0.5)' }}>
      <div className="glass rounded-t-2xl md:rounded-2xl w-full md:max-w-md max-h-[90vh] md:max-h-[85vh] overflow-y-auto stagger-item safe-area-bottom">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-[#e9edef] font-semibold text-lg">Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#3a4a54] transition-all hover:scale-110">
            <X size={18} className="text-[#aebac1]" />
          </button>
        </div>

        <div className="p-4 md:p-5 space-y-5 md:space-y-6">
          {/* Voice Gender */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={16} className="text-[#00a884]" />
              <h3 className="text-[#e9edef] text-sm font-medium">Voice</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['female', 'male'] as const).map(gender => (
                <button
                  key={gender}
                  onClick={() => onUpdateSettings({ voice_gender: gender })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    settings.voice_gender === gender
                      ? 'bg-[#00a884] text-white translate3d(0,-2px,8px) shadow-lg shadow-[#00a884]/25'
                      : 'glass text-[#aebac1] hover:bg-[#2a3942]'
                  }`}
                >
                  {gender === 'female' ? 'Female Voice' : 'Male Voice'}
                </button>
              ))}
            </div>
          </section>

          {/* Language */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={16} className="text-[#00a884]" />
              <h3 className="text-[#e9edef] text-sm font-medium">Language</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => onUpdateSettings({ language: lang.code as LanguageCode })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    settings.language === lang.code
                      ? 'bg-[#00a884] text-white translate3d(0,-2px,8px) shadow-lg shadow-[#00a884]/25'
                      : 'glass text-[#aebac1] hover:bg-[#2a3942]'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </section>

          {/* Emotion Mode */}
          <section>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-[#00a884]" />
                <h3 className="text-[#e9edef] text-sm font-medium">Emotion-Based Responses</h3>
              </div>
              <button
                onClick={() => onUpdateSettings({ emotion_mode: !settings.emotion_mode })}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                  settings.emotion_mode ? 'bg-[#00a884]' : 'bg-[#3a4a54]'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                  settings.emotion_mode ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>
          </section>

          {/* Offline Mode */}
          <section>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff size={16} className="text-[#00a884]" />
                <h3 className="text-[#e9edef] text-sm font-medium">Offline Mode</h3>
              </div>
              <button
                onClick={() => onUpdateSettings({ offline_mode: !settings.offline_mode })}
                className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                  settings.offline_mode ? 'bg-[#00a884]' : 'bg-[#3a4a54]'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300 ${
                  settings.offline_mode ? 'left-[22px]' : 'left-0.5'
                }`} />
              </button>
            </div>
            {settings.offline_mode && (
              <p className="text-[#8696a0] text-xs mt-2">AI responses will be queued until connectivity is restored.</p>
            )}
          </section>

          {/* Memory System */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-[#00a884]" />
              <h3 className="text-[#e9edef] text-sm font-medium">Memory</h3>
            </div>
            <p className="text-[#8696a0] text-xs mb-3">Add facts about yourself so the AI can remember them in conversations.</p>

            <form onSubmit={handleAddMemory} className="space-y-2 mb-3">
              <input
                name="memoryKey"
                placeholder="Label (e.g. name, job, hobby)"
                className="w-full px-3 py-2 rounded-lg glass text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:ring-1 focus:ring-[#00a884]/50"
              />
              <input
                name="memoryContent"
                placeholder="Value (e.g. Ali, developer, chess)"
                className="w-full px-3 py-2 rounded-lg glass text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:ring-1 focus:ring-[#00a884]/50"
              />
              <button type="submit" className="w-full py-2 rounded-lg bg-[#00a884] text-white text-sm font-medium hover:bg-[#009573] transition-all hover:translate3d(0,-1px,4px)">
                Save Memory
              </button>
            </form>

            {memories.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {memories.map(mem => (
                  <div key={mem.id} className="flex items-center gap-2 px-3 py-2 rounded-lg glass group">
                    <span className="text-[#00a884] text-xs font-medium min-w-[60px]">{mem.key}</span>
                    <span className="text-[#aebac1] text-xs flex-1 truncate">{mem.content}</span>
                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <Trash2 size={12} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
