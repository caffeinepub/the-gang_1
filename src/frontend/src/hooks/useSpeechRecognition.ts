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
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        try {
          const speechResult = event.results[0][0].transcript;
          setTranscript(speechResult);
          setError(null);
        } catch (err) {
          console.error('Error processing speech result:', err);
          setError('Failed to process speech result');
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        try {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        } catch (err) {
          console.error('Error in onerror handler:', err);
          setError('Speech recognition error occurred');
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        try {
          setIsListening(false);
        } catch (err) {
          console.error('Error in onend handler:', err);
          setIsListening(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error('Error stopping recognition on cleanup:', err);
        }
      }
    };
  }, []);

  const startListening = useCallback(() => {
    // CRITICAL: Clear transcript at the very start of new recording
    setTranscript('');
    setError(null);
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
        setError('Failed to start speech recognition');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
        setError('Failed to stop speech recognition');
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
