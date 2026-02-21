import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Volume2, AlertTriangle } from 'lucide-react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import type { DebateState } from '../backend';

interface DebateDisplayProps {
  debateState?: DebateState;
  isAuthenticated: boolean;
}

export function DebateDisplay({ debateState, isAuthenticated }: DebateDisplayProps) {
  const { speak, isSpeaking, cancel } = useSpeechSynthesis();

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
      return { speaker: 'System', text: line, key: `system-${index}` };
    });
  };

  const messages = debateState?.transcript ? parseTranscript(debateState.transcript) : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Debate Transcript
            {debateState?.emergencyMode && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                Emergency Mode
              </Badge>
            )}
          </CardTitle>
          {debateState?.isDebating && (
            <Badge variant="default" className="animate-pulse">
              Debate in Progress
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto min-h-[400px]">
          {messages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No debate transcript yet. Use Push to Talk to start a conversation.
            </p>
          ) : (
            messages.map(({ speaker, text, key }) => (
              <div
                key={key}
                className={`p-4 rounded-lg border ${
                  speaker === 'Skippy'
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                    : speaker === 'GLaDOS'
                      ? 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
                      : speaker === 'Robby'
                        ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800'
                        : speaker === 'SYSTEM'
                          ? 'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
                          : 'bg-muted border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm mb-1">{speaker}</p>
                    <p className="text-sm">{text}</p>
                  </div>
                  {speaker === 'Robby' && isAuthenticated && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSpeak(text)}
                      className="shrink-0"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
