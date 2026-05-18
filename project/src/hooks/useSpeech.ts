import { useState, useRef, useCallback } from 'react';
import { LANGUAGES, type LanguageCode } from '../lib/supabase';

type VoiceGender = 'male' | 'female';

function getSpeechLang(code: LanguageCode) {
  return LANGUAGES.find(l => l.code === code)?.speechCode || 'en-US';
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const startListening = useCallback((onResult: (text: string) => void, language: LanguageCode = 'en') => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getSpeechLang(language);

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t;
        else interimTranscript += t;
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) onResult(finalTranscript);
    };

    recognition.onend = () => { setIsListening(false); setTranscript(''); };
    recognition.onerror = () => { setIsListening(false); setTranscript(''); };

    recognitionRef.current = recognition;
    recognition.start();
    return true;
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript('');
  }, []);

  const speak = useCallback((text: string, voiceGender: VoiceGender = 'female', language: LanguageCode = 'en') => {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    const speechLang = getSpeechLang(language);
    utterance.lang = speechLang;

    // Load voices (some browsers load them async)
    const voices = window.speechSynthesis.getVoices();

    // Try to find a voice matching gender and language
    const genderKeywords = voiceGender === 'male'
      ? ['Male', 'David', 'Daniel', 'Google UK English Male', 'Microsoft David', 'Sam', 'Alex', 'Fred', 'Ralph', 'Jorge', 'Diego']
      : ['Female', 'Zira', 'Samantha', 'Google UK English Female', 'Microsoft Zira', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Alice'];

    let voice = voices.find(v =>
      v.lang.startsWith(speechLang.split('-')[0]) &&
      genderKeywords.some(kw => v.name.includes(kw))
    );

    if (!voice) {
      voice = voices.find(v => v.lang.startsWith(speechLang.split('-')[0]));
    }

    if (!voice) {
      voice = voices.find(v => genderKeywords.some(kw => v.name.includes(kw)));
    }

    if (!voice) {
      voice = voices.find(v => v.lang === 'en-US') || voices[0];
    }

    if (voice) utterance.voice = voice;

    // Adjust pitch slightly for gender feel
    if (voiceGender === 'male') {
      utterance.pitch = 0.85;
    } else {
      utterance.pitch = 1.15;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking, hasSpeechRecognition };
}
