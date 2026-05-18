import { useEffect, useState } from 'react';

type Props = {
  isListening?: boolean;
  isSpeaking?: boolean;
  isTyping?: boolean;
};

export default function AiAvatar({
  isListening,
  isSpeaking,
  isTyping,
}: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(!!(isSpeaking || isListening));
  }, [isSpeaking, isListening]);

  return (
    <div className="flex flex-col items-center justify-center relative">

      {/* OUTER GLOW (NO BUBBLES NOW) */}
      <div
        className={`absolute rounded-full transition-all duration-500
        ${isListening
            ? 'w-40 h-40 bg-red-500/20 animate-ping'
            : isSpeaking
            ? 'w-40 h-40 bg-green-500/20 animate-pulse'
            : 'w-36 h-36 bg-[#00a884]/10'
        }`}
      />

      {/* MAIN AVATAR */}
      <div
        className={`relative rounded-full overflow-hidden border-2 transition-all duration-300
        ${isSpeaking
            ? 'border-green-400 scale-110'
            : isListening
            ? 'border-red-400 scale-110'
            : 'border-[#00a884]'
        }`}
        style={{
          width: '140px',
          height: '140px',
        }}
      >
        <img
          src="/ai-avatar.jpg"
          alt="AI Avatar"
          className={`w-full h-full object-cover transition-all duration-300
          ${isTyping ? 'blur-[1px] scale-105' : ''}`}
        />

        {/* SPEAKING MOUTH ANIMATION */}
        {isSpeaking && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-1">
            <span className="w-1 h-3 bg-white animate-bounce" />
            <span className="w-1 h-5 bg-white animate-bounce delay-100" />
            <span className="w-1 h-2 bg-white animate-bounce delay-200" />
          </div>
        )}
      </div>

      {/* STATUS TEXT (optional clean look) */}
     
    </div>
  );
}