import { useState } from 'react';
import {
  CloudSun, Newspaper, Cpu, FileText, Image, Languages,
  FileBarChart, Mic, BookOpen, X, Loader2, ScanText, List,
} from 'lucide-react';
import type { LanguageCode } from '../lib/supabase';
import { LANGUAGES } from '../lib/supabase';

type Props = {
  language: string;
  onFetchInternet: (query: string, type: string) => Promise<{ results?: { title: string; snippet: string }[] }>;
  onOCR: (imageBase64: string, language?: string) => Promise<{ text?: string; error?: string }>;
  onImageExplain: (imageBase64: string, question?: string, language?: string) => Promise<{ explanation?: string; error?: string }>;
  onTranslate: (text: string, source: string, target: string) => Promise<{ translation?: string; error?: string }>;
  onGenerateReport: (content: string, type: string, language?: string) => Promise<{ output?: string; error?: string }>;
  onSendResult: (text: string) => void;
};

type ToolPanel = 'none' | 'internet' | 'ocr' | 'image' | 'translate' | 'report';

export default function Toolbar({
  language, onFetchInternet, onOCR, onImageExplain, onTranslate, onGenerateReport, onSendResult,
}: Props) {
  const [activePanel, setActivePanel] = useState<ToolPanel>('none');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [imagePreview, setImagePreview] = useState('');

  const tools = [
    { id: 'internet' as ToolPanel, icon: CloudSun, label: 'Weather', sub: 'news' },
    { id: 'internet' as ToolPanel, icon: Newspaper, label: 'News', sub: 'news' },
    { id: 'internet' as ToolPanel, icon: Cpu, label: 'AI Updates', sub: 'ai_updates' },
    { id: 'ocr' as ToolPanel, icon: ScanText, label: 'OCR' },
    { id: 'image' as ToolPanel, icon: Image, label: 'Image AI' },
    { id: 'translate' as ToolPanel, icon: Languages, label: 'Translate' },
    { id: 'report' as ToolPanel, icon: List, label: 'Summary', sub: 'summary' },
    { id: 'report' as ToolPanel, icon: FileBarChart, label: 'Report', sub: 'report' },
    { id: 'report' as ToolPanel, icon: Mic, label: 'Voice Note', sub: 'voice_note' },
    { id: 'report' as ToolPanel, icon: BookOpen, label: 'References', sub: 'references' },
  ];

  const handleInternetFetch = async (type: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const data = await onFetchInternet(query, type);
      if (data.results?.length) {
        const text = data.results.map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}`).join('\n\n');
        setResult(text);
      } else {
        setResult('No results found.');
      }
    } catch { setResult('Error fetching data.'); }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'ocr' | 'image') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setResult('');

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImagePreview(base64);

      try {
        if (mode === 'ocr') {
          const data = await onOCR(base64, language);
          setResult(data.text || data.error || 'No text detected.');
        } else {
          const data = await onImageExplain(base64, query || undefined, language);
          setResult(data.explanation || data.error || 'Could not analyze image.');
        }
      } catch { setResult('Error processing image.'); }
      setLoading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTranslate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const data = await onTranslate(query, language, targetLang);
      setResult(data.translation || data.error || 'Translation failed.');
    } catch { setResult('Error translating.'); }
    setLoading(false);
  };

  const handleReport = async (type: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const data = await onGenerateReport(query, type, language);
      setResult(data.output || data.error || 'Generation failed.');
    } catch { setResult('Error generating content.'); }
    setLoading(false);
  };

  const sendToChat = () => {
    if (result.trim()) {
      onSendResult(result);
      setResult('');
      setActivePanel('none');
      setQuery('');
      setImagePreview('');
    }
  };

  return (
    <div className="relative">
      {/* Tool buttons row */}
      <div className="flex items-center gap-1 px-2 md:px-3 py-2 overflow-x-auto scrollbar-hide">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          const isActive = activePanel !== 'none' && (
            tool.id === activePanel ||
            (activePanel === 'internet' && tool.id === 'internet' && tool.sub === ['news', 'weather', 'ai_updates'][['news', 'weather', 'ai_updates'].indexOf(tool.sub || '')]) ||
            (activePanel === 'report' && tool.id === 'report')
          );
          return (
            <button
              key={i}
              onClick={() => {
                if (tool.sub === 'weather') { setActivePanel('internet'); setQuery(''); }
                else if (tool.sub === 'ai_updates') { setActivePanel('internet'); setQuery(''); }
                else if (tool.sub === 'news') { setActivePanel('internet'); setQuery(''); }
                else if (tool.id === 'ocr') setActivePanel('ocr');
                else if (tool.id === 'image') setActivePanel('image');
                else if (tool.id === 'translate') setActivePanel('translate');
                else if (tool.id === 'report') setActivePanel('report');
              }}
              className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? 'bg-[#00a884] text-white'
                  : 'glass text-[#aebac1] hover:bg-[#2a3942] hover:text-[#e9edef]'
              }`}
            >
              <Icon size={13} />
              {tool.label}
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      {activePanel !== 'none' && (
        <div className="mx-2 md:mx-3 mb-2 glass rounded-xl p-3 stagger-item">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#00a884] text-xs font-medium uppercase tracking-wider">
              {activePanel === 'internet' ? 'Internet Fetch' : activePanel === 'ocr' ? 'OCR - Text Extract' : activePanel === 'image' ? 'AI Image Explain' : activePanel === 'translate' ? 'Live Translation' : 'Content Generator'}
            </span>
            <button onClick={() => { setActivePanel('none'); setResult(''); setImagePreview(''); }} className="hover:scale-110 transition-transform">
              <X size={14} className="text-[#8696a0]" />
            </button>
          </div>

          {/* Internet Fetch Panel */}
          {activePanel === 'internet' && (
            <div className="space-y-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter city for weather, topic for news..."
                className="w-full px-3 py-2 rounded-lg bg-[#1a2731] text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:ring-1 focus:ring-[#00a884]/50"
              />
              <div className="flex gap-2">
                <button onClick={() => handleInternetFetch('weather')} disabled={loading} className="flex-1 py-2 rounded-lg bg-[#00a884] text-white text-xs font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                  <CloudSun size={13} className="inline mr-1" />Weather
                </button>
                <button onClick={() => handleInternetFetch('news')} disabled={loading} className="flex-1 py-2 rounded-lg bg-[#00a884] text-white text-xs font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                  <Newspaper size={13} className="inline mr-1" />News
                </button>
                <button onClick={() => handleInternetFetch('ai_updates')} disabled={loading} className="flex-1 py-2 rounded-lg bg-[#00a884] text-white text-xs font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                  <Cpu size={13} className="inline mr-1" />AI Updates
                </button>
              </div>
            </div>
          )}

          {/* OCR Panel */}
          {activePanel === 'ocr' && (
            <div className="space-y-2">
              <p className="text-[#8696a0] text-xs">Upload an image to extract text using AI-powered OCR.</p>
              <label className="flex items-center justify-center gap-2 py-3 rounded-lg bg-[#1a2731] hover:bg-[#2a3942] cursor-pointer transition-colors">
                <ScanText size={18} className="text-[#00a884]" />
                <span className="text-[#aebac1] text-sm">Choose Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'ocr')} />
              </label>
              {imagePreview && <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg mx-auto" />}
            </div>
          )}

          {/* Image Explain Panel */}
          {activePanel === 'image' && (
            <div className="space-y-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ask about the image (optional)..."
                className="w-full px-3 py-2 rounded-lg bg-[#1a2731] text-[#e9edef] placeholder-[#8696a0] text-sm outline-none focus:ring-1 focus:ring-[#00a884]/50"
              />
              <label className="flex items-center justify-center gap-2 py-3 rounded-lg bg-[#1a2731] hover:bg-[#2a3942] cursor-pointer transition-colors">
                <Image size={18} className="text-[#00a884]" />
                <span className="text-[#aebac1] text-sm">Upload Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'image')} />
              </label>
              {imagePreview && <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg mx-auto" />}
            </div>
          )}

          {/* Translate Panel */}
          {activePanel === 'translate' && (
            <div className="space-y-2">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Enter text to translate..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#1a2731] text-[#e9edef] placeholder-[#8696a0] text-sm outline-none resize-none focus:ring-1 focus:ring-[#00a884]/50"
              />
              <div className="flex items-center gap-2">
                <span className="text-[#8696a0] text-xs">To:</span>
                <div className="flex gap-1 flex-wrap">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => setTargetLang(lang.code)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                        targetLang === lang.code ? 'bg-[#00a884] text-white' : 'glass text-[#aebac1]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleTranslate} disabled={loading} className="w-full py-2 rounded-lg bg-[#00a884] text-white text-sm font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                <Languages size={14} className="inline mr-1" />Translate
              </button>
            </div>
          )}

          {/* Report Panel */}
          {activePanel === 'report' && (
            <div className="space-y-2">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Paste content to summarize, generate report, voice note, or references..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[#1a2731] text-[#e9edef] placeholder-[#8696a0] text-sm outline-none resize-none focus:ring-1 focus:ring-[#00a884]/50"
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleReport('summary')} disabled={loading} className="py-2 rounded-lg bg-[#00a884] text-white text-xs font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                  <List size={13} className="inline mr-1" />Summary
                </button>
                <button onClick={() => handleReport('report')} disabled={loading} className="py-2 rounded-lg bg-[#00a884] text-white text-xs font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                  <FileBarChart size={13} className="inline mr-1" />Report
                </button>
                <button onClick={() => handleReport('voice_note')} disabled={loading} className="py-2 rounded-lg bg-[#00a884] text-white text-xs font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                  <Mic size={13} className="inline mr-1" />Voice Note
                </button>
                <button onClick={() => handleReport('references')} disabled={loading} className="py-2 rounded-lg bg-[#00a884] text-white text-xs font-medium hover:bg-[#009573] transition-all disabled:opacity-50">
                  <BookOpen size={13} className="inline mr-1" />References
                </button>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader2 size={20} className="animate-spin text-[#00a884]" />
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="mt-2 space-y-2">
              <div className="p-3 rounded-lg bg-[#1a2731] text-[#e9edef] text-sm whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {result}
              </div>
              <button onClick={sendToChat} className="w-full py-2 rounded-lg bg-[#00a884]/20 border border-[#00a884]/30 text-[#00a884] text-sm font-medium hover:bg-[#00a884]/30 transition-all">
                Send to Chat
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
