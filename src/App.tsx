import { useState, useEffect, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsPanel from './components/SettingsPanel';
import MobileNav from './components/MobileNav';
import { useChat } from './hooks/useChat';

type MobileTab = 'chat' | 'search' | 'settings';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('chat');
  const [isMobile, setIsMobile] = useState(false);

  const {
    conversations, activeConversation, messages, documents, memories, settings,
    detectedEmotion, loading, sending,
    fetchConversations, createConversation, selectConversation, deleteConversation,
    sendMessage, searchMessages,
    addDocument, removeDocument,
    fetchMemories, addMemory, deleteMemory,
    loadSettings, updateSettings,
    fetchFromInternet, extractTextFromImage, explainImage, translateText, generateReport,
  } = useChat();

  useEffect(() => { loadSettings(); fetchMemories(); }, [loadSettings, fetchMemories]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleCreate = useCallback(async () => {
    await createConversation();
    setSidebarOpen(false);
    setMobileTab('chat');
  }, [createConversation]);

  const handleSelect = useCallback(async (conv: Parameters<typeof selectConversation>[0]) => {
    await selectConversation(conv);
    setSidebarOpen(false);
    setMobileTab('chat');
  }, [selectConversation]);

  const handleJumpToMessage = useCallback(async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) { await selectConversation(conv); setSidebarOpen(false); setMobileTab('chat'); }
  }, [conversations, selectConversation]);

  const handleMobileTabChange = useCallback((tab: MobileTab) => {
    if (tab === 'settings') {
      setSettingsOpen(true);
    } else if (tab === 'search') {
      setSidebarOpen(true);
    } else {
      setMobileTab(tab);
    }
  }, []);

  // Desktop layout
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden relative">
        <div className="bg-scene" />

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setSidebarOpen(false)} style={{ backdropFilter: 'blur(4px)' }} />
        )}

        <div
          className={`fixed md:relative z-30 md:z-auto w-[85vw] md:w-[360px] lg:w-[380px] h-full flex-shrink-0 transform transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          style={{ perspective: '1200px' }}
        >
          {sidebarOpen && (
            <button className="absolute top-3 right-3 z-40 md:hidden w-8 h-8 flex items-center justify-center rounded-full glass text-[#aebac1] hover:scale-110 transition-transform" onClick={() => setSidebarOpen(false)}>
              <X size={16} />
            </button>
          )}
          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelect={handleSelect}
            onCreate={handleCreate}
            onDelete={deleteConversation}
            onFetch={fetchConversations}
            onSearch={searchMessages}
            onJumpToMessage={handleJumpToMessage}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <div className="md:hidden absolute top-3 left-3 z-10">
            <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-full glass text-[#aebac1] hover:scale-110 transition-all duration-200 hover:bg-[#3a4a54]/80">
              <Menu size={18} />
            </button>
          </div>

          <ChatArea
            conversation={activeConversation}
            messages={messages}
            documents={documents}
            loading={loading}
            sending={sending}
            settings={settings}
            memories={memories}
            detectedEmotion={detectedEmotion}
            onSend={sendMessage}
            onAddDocument={addDocument}
            onRemoveDocument={removeDocument}
            onCreateConversation={handleCreate}
            onOpenSettings={() => setSettingsOpen(true)}
            onFetchInternet={fetchFromInternet}
            onOCR={extractTextFromImage}
            onImageExplain={explainImage}
            onTranslate={translateText}
            onGenerateReport={generateReport}
          />
        </div>

        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            memories={memories}
            onUpdateSettings={updateSettings}
            onAddMemory={addMemory}
            onDeleteMemory={deleteMemory}
            onClose={() => setSettingsOpen(false)}
          />
        )}
      </div>
    );
  }

  // Mobile layout - full screen panels with bottom nav
  return (
    <div className="flex flex-col h-screen overflow-hidden relative">
      <div className="bg-scene" />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-30" onClick={() => setSidebarOpen(false)} style={{ backdropFilter: 'blur(4px)' }} />
          <div className="fixed inset-0 z-40 transform transition-transform duration-300" style={{ maxWidth: '100vw' }}>
            <div className="h-full w-full max-w-sm">
              <Sidebar
                conversations={conversations}
                activeConversation={activeConversation}
                onSelect={handleSelect}
                onCreate={handleCreate}
                onDelete={deleteConversation}
                onFetch={fetchConversations}
                onSearch={searchMessages}
                onJumpToMessage={handleJumpToMessage}
              />
            </div>
            <button className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full glass text-white" onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </button>
          </div>
        </>
      )}

      {/* Main content area with bottom padding for nav */}
      <div className="flex-1 min-h-0 relative z-10 pb-16">
        <ChatArea
          conversation={activeConversation}
          messages={messages}
          documents={documents}
          loading={loading}
          sending={sending}
          settings={settings}
          memories={memories}
          detectedEmotion={detectedEmotion}
          onSend={sendMessage}
          onAddDocument={addDocument}
          onRemoveDocument={removeDocument}
          onCreateConversation={handleCreate}
          onOpenSettings={() => setSettingsOpen(true)}
          onFetchInternet={fetchFromInternet}
          onOCR={extractTextFromImage}
          onImageExplain={explainImage}
          onTranslate={translateText}
          onGenerateReport={generateReport}
        />
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        onNewChat={handleCreate}
      />

      {/* Settings modal */}
      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          memories={memories}
          onUpdateSettings={updateSettings}
          onAddMemory={addMemory}
          onDeleteMemory={deleteMemory}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
