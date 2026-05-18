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
    conversations,
    activeConversation,
    messages,
    documents,
    memories,
    settings,
    detectedEmotion,
    loading,
    sending,

    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,

    sendMessage,
    searchMessages,

    addDocument,
    removeDocument,

    fetchMemories,
    addMemory,
    deleteMemory,

    loadSettings,
    updateSettings,

    fetchFromInternet,
    extractTextFromImage,
    explainImage,
    translateText,
    generateReport,
  } = useChat();

  // load settings + memories
  useEffect(() => {
    loadSettings();
    fetchMemories();
  }, [loadSettings, fetchMemories]);

  // mobile check
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // create chat
  const handleCreate = useCallback(async () => {
    await createConversation();
    setSidebarOpen(false);
    setMobileTab('chat');
  }, [createConversation]);

  // select chat
  const handleSelect = useCallback(async (conv: any) => {
    await selectConversation(conv);
    setSidebarOpen(false);
    setMobileTab('chat');
  }, [selectConversation]);

  // jump from search
  const handleJumpToMessage = useCallback(async (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
      await selectConversation(conv);
      setSidebarOpen(false);
      setMobileTab('chat');
    }
  }, [conversations, selectConversation]);

  // ✅ FIXED DELETE FUNCTION (MAIN)
  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);

      // agar active chat delete ho
      if (activeConversation?.id === id) {
        await selectConversation(null as any);
      }

      await fetchConversations();

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleMobileTabChange = useCallback((tab: MobileTab) => {
    if (tab === 'settings') {
      setSettingsOpen(true);
    } else if (tab === 'search') {
      setSidebarOpen(true);
    } else {
      setMobileTab(tab);
    }
  }, []);

  // ================= DESKTOP =================
  if (!isMobile) {
    return (
      <div className="flex h-screen overflow-hidden relative">

        <div className="bg-scene" />

        {/* overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* sidebar */}
        <div className={`fixed md:relative z-30 w-[360px] h-full transform transition ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 z-40 w-8 h-8 flex items-center justify-center rounded-full glass"
            >
              <X size={16} />
            </button>
          )}

          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelect={handleSelect}
            onCreate={handleCreate}

            // ✅ FIXED HERE
            onDelete={handleDeleteConversation}

            onFetch={fetchConversations}
            onSearch={searchMessages}
            onJumpToMessage={handleJumpToMessage}
          />
        </div>

        {/* chat */}
        <div className="flex-1 flex flex-col relative z-10">

          <button
            className="md:hidden absolute top-3 left-3 z-10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>

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

  // ================= MOBILE =================
  return (
    <div className="flex flex-col h-screen">

      <div className="flex-1">

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

      <MobileNav
        activeTab={mobileTab}
        onTabChange={handleMobileTabChange}
        onNewChat={handleCreate}
      />

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