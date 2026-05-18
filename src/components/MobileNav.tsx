import { MessageSquare, Settings, Search, Bot, Download } from 'lucide-react';
import { useState, useEffect } from 'react';

type Tab = 'chat' | 'search' | 'settings';

type Props = {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onNewChat: () => void;
};

export default function MobileNav({ activeTab, onTabChange, onNewChat }: Props) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstall(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden safe-area-bottom">
      {/* Install banner */}
      {showInstall && (
        <div className="mx-3 mb-1 glass rounded-xl p-3 flex items-center gap-3 stagger-item">
          <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center flex-shrink-0">
            <Bot size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#e9edef] text-sm font-medium">Install AI ChatBot</p>
            <p className="text-[#8696a0] text-xs">Add to home screen for app experience</p>
          </div>
          <button onClick={handleInstall} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00a884] text-white text-xs font-medium flex-shrink-0">
            <Download size={12} /> Install
          </button>
          <button onClick={() => setShowInstall(false)} className="text-[#8696a0] text-xs flex-shrink-0">x</button>
        </div>
      )}

      {/* Bottom nav bar */}
      <div className="header-glass border-t border-white/5">
        <div className="flex items-center justify-around px-2 py-1.5">
          <button
            onClick={() => onTabChange('chat')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
              activeTab === 'chat' ? 'text-[#00a884] bg-[#00a884]/10' : 'text-[#8696a0]'
            }`}
          >
            <MessageSquare size={20} />
            <span className="text-[10px] font-medium">Chats</span>
          </button>

          <button
            onClick={onNewChat}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-[#00a884] text-white -mt-4 shadow-lg shadow-[#00a884]/30 transition-all duration-300 active:scale-90"
          >
            <Bot size={24} />
          </button>

          <button
            onClick={() => onTabChange('search')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
              activeTab === 'search' ? 'text-[#00a884] bg-[#00a884]/10' : 'text-[#8696a0]'
            }`}
          >
            <Search size={20} />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          <button
            onClick={() => onTabChange('settings')}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
              activeTab === 'settings' ? 'text-[#00a884] bg-[#00a884]/10' : 'text-[#8696a0]'
            }`}
          >
            <Settings size={20} />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
