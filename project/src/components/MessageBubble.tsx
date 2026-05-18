import { Volume2, VolumeX } from 'lucide-react';
import type { Message } from '../lib/supabase';

type Props = {
  message: Message;
  onSpeak: (text: string) => void;
  onStop: () => void;
  isSpeaking: boolean;
  isThisSpeaking: boolean;
};

export default function MessageBubble({ message, onSpeak, onStop, isSpeaking, isThisSpeaking }: Props) {
  const isUser = message.role === 'user';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex mb-1.5 px-3 md:px-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] md:max-w-[65%] group relative`}>
        <div
          className={`msg-bubble ${isUser ? 'msg-user' : 'msg-assistant'} relative px-3 py-2.5 rounded-xl shadow-lg ${
            isUser
              ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-sm'
              : 'glass text-[#e9edef] rounded-tl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>

          <div className="flex items-center justify-end gap-1.5 mt-1">
            <span className="text-[10px] text-[#8696a0]">{formatTime(message.created_at)}</span>
            <button
              onClick={() => isThisSpeaking ? onStop() : onSpeak(message.content)}
              className={`transition-all duration-200 w-8 h-8 md:w-auto md:h-auto flex items-center justify-center rounded-full md:rounded-none ${
                isSpeaking && !isThisSpeaking ? 'opacity-30 cursor-not-allowed' : 'opacity-70 md:opacity-0 group-hover:opacity-100'
              } hover:scale-110 active:scale-95`}
              disabled={isSpeaking && !isThisSpeaking}
              title={isThisSpeaking ? 'Stop speaking' : 'Read aloud'}
            >
              {isThisSpeaking ? (
                <VolumeX size={13} className="text-[#00a884]" />
              ) : (
                <Volume2 size={13} className="text-[#8696a0]" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
