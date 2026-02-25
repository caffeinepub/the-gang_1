import { useState, useEffect, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSupported(true);

      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } else {
      setIsSupported(false);
    }
  }, []);

  const getBritishMaleVoice = useCallback(() => {
    // Try to find a British Male voice
    const britishMale = voices.find(
      (voice) =>
        voice.lang.startsWith('en-GB') &&
        (voice.name.toLowerCase().includes('male') || voice.name.toLowerCase().includes('daniel'))
    );

    if (britishMale) return britishMale;

    // Fallback to any British voice
    const britishVoice = voices.find((voice) => voice.lang.startsWith('en-GB'));
    if (britishVoice) return britishVoice;

    // Fallback to any English voice
    const englishVoice = voices.find((voice) => voice.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // Last resort: first available voice
    return voices[0] || null;
  }, [voices]);

  const speak = useCallback(
    (text: string, useBritishVoice = false) => {
      if (!isSupported || !text) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      if (useBritishVoice) {
        const voice = getBritishMaleVoice();
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, getBritishMaleVoice]
  );

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSupported]);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
    voices,
  };
}
