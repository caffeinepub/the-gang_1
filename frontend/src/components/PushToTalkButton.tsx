import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useEffect, useRef } from 'react';

interface PushToTalkButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  disabled?: boolean;
}

export function PushToTalkButton({ onTranscriptComplete, disabled }: PushToTalkButtonProps) {
  const { isListening, transcript, error, isSupported, startListening, stopListening } =
    useSpeechRecognition();

  // Track the last processed transcript to avoid duplicate processing
  const lastProcessedTranscriptRef = useRef<string>('');

  // Process transcript when speech recognition stops and we have new content
  // FIX 1: Removed 'transcript' from dependency array to prevent infinite loop
  useEffect(() => {
    if (!isListening && transcript && transcript !== lastProcessedTranscriptRef.current) {
      // Speech recognition has stopped and we have a new transcript
      lastProcessedTranscriptRef.current = transcript;
      try {
        onTranscriptComplete(transcript);
      } catch (error) {
        console.error('Error in onTranscriptComplete callback:', error);
      }
    }
  }, [isListening, onTranscriptComplete]);

  const handlePushToTalk = () => {
    if (isListening) {
      stopListening();
    } else {
      // Reset the last processed transcript when starting new recording
      lastProcessedTranscriptRef.current = '';
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <Button disabled variant="outline" className="w-full">
        <MicOff className="h-5 w-5 mr-2" />
        Speech Recognition Not Supported
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={() => handlePushToTalk()}
        disabled={disabled}
        variant={isListening ? 'destructive' : 'default'}
        className={`w-full ${isListening ? 'animate-pulse' : ''}`}
        size="lg"
      >
        {isListening ? (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Listening... (Click to Stop)
          </>
        ) : (
          <>
            <Mic className="h-5 w-5 mr-2" />
            Push to Talk
          </>
        )}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
