import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, AlertTriangle } from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { useEffect, useRef } from 'react';
import type { DebateState } from '../backend';

interface DebateDisplayProps {
  debateState?: DebateState;
  isAuthenticated: boolean;
}

export function DebateDisplay({ debateState, isAuthenticated }: DebateDisplayProps) {
  const { speak, isSpeaking, cancel } = useSpeechSynthesis();
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      cancel();
    }
    speak(text);
  };

  const parseTranscript = (transcript: string) => {
    const lines = transcript.split('\n').filter((line) => line.trim());
    return lines.map((line, index) => {
      const match = line.match(/^(Skippy|GLaDOS|Robby|SYSTEM|User):\s*(.+)$/);
      if (match) {
        const [, speaker, text] = match;
        return { speaker, text, key: `${speaker}-${index}` };
      }
      return { speaker: 'SYSTEM', text: line, key: `system-${index}` };
    });
  };

  const messages = debateState?.transcript ? parseTranscript(debateState.transcript) : [];

  // Auto-scroll effect
  useEffect(() => {
    if (scrollAnchorRef.current && debateState?.transcript) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [debateState?.transcript]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Boardroom Transcript</CardTitle>
          {debateState?.emergencyMode && (
            <Badge variant="destructive" className="gap-1.5">
              <AlertTriangle className="h-3 w-3" />
              Emergency Mode
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="space-y-3 overflow-y-auto min-h-[400px] max-h-[600px] p-4 rounded-md"
          style={{ backgroundColor: '#0a0a0a', border: '1px solid #333' }}
        >
          {messages.length === 0 ? (
            <p className="text-center" style={{ color: '#888' }}>
              No transcript yet. Start a debate to see the conversation.
            </p>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.key} className="flex gap-3">
                  <div className="flex-shrink-0">
                    <Badge
                      variant={
                        msg.speaker === 'SYSTEM'
                          ? 'outline'
                          : msg.speaker === 'Skippy'
                            ? 'default'
                            : msg.speaker === 'GLaDOS'
                              ? 'secondary'
                              : 'destructive'
                      }
                      style={{
                        backgroundColor:
                          msg.speaker === 'Skippy'
                            ? '#39FF14'
                            : msg.speaker === 'GLaDOS'
                              ? '#FFA500'
                              : msg.speaker === 'Robby'
                                ? '#FF4500'
                                : '#2a2a2a',
                        color:
                          msg.speaker === 'SYSTEM'
                            ? '#888'
                            : msg.speaker === 'Skippy'
                              ? '#1a1a1a'
                              : '#1a1a1a',
                        border: msg.speaker === 'SYSTEM' ? '1px solid #444' : 'none',
                      }}
                    >
                      {msg.speaker}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p style={{ color: '#e0e0e0' }}>{msg.text}</p>
                    {msg.speaker === 'Robby' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSpeak(msg.text)}
                        className="h-7 px-2"
                        style={{ color: '#39FF14' }}
                      >
                        <Volume2 className="h-3 w-3 mr-1" />
                        {isSpeaking ? 'Stop' : 'Speak'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={scrollAnchorRef} />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
