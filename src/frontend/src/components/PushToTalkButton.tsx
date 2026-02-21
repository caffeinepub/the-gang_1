import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useEffect } from 'react';

interface PushToTalkButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  disabled?: boolean;
}

export function PushToTalkButton({ onTranscriptComplete, disabled }: PushToTalkButtonProps) {
  const { isListening, transcript, error, isSupported, startListening, stopListening } =
    useSpeechRecognition();

  useEffect(() => {
    if (transcript && !isListening) {
      // Speech recognition has stopped and we have a transcript
      try {
        onTranscriptComplete(transcript);
      } catch (error) {
        console.error('Error in onTranscriptComplete callback:', error);
      }
    }
  }, [transcript, isListening, onTranscriptComplete]);

  const handlePushToTalk = () => {
    if (isListening) {
      stopListening();
    } else {
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
        onClick={handlePushToTalk}
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
