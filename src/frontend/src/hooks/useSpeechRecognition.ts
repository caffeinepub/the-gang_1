import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        // CRITICAL FIX: Use functional update pattern to prevent stale closure issues
        recognitionRef.current.onresult = (event: any) => {
          try {
            const speechResult = event.results[0][0].transcript;
            // Use functional update pattern instead of direct state update
            setTranscript(() => speechResult);
            setError(null);
          } catch (err) {
            console.error('Speech recognition result error:', err);
            setError('Failed to process speech result');
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          try {
            console.error('Speech recognition error:', event.error);
            setError(`Speech recognition error: ${event.error}`);
            setIsListening(false);
          } catch (err) {
            console.error('Error handler failed:', err);
            setError('Critical speech recognition error');
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          try {
            setIsListening(false);
          } catch (err) {
            console.error('Speech recognition end error:', err);
            setIsListening(false);
          }
        };
      } else {
        setIsSupported(false);
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        setError('Failed to start recording');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop speech recognition:', err);
        setError('Failed to stop recording');
        setIsListening(false);
      }
    }
  }, [isListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  };
}
