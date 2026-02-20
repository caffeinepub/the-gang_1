import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, FileText, Lock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { parseTranscript } from '../utils/transcriptParser';
import type { DebateState } from '../backend';

interface DebateDisplayProps {
  debateState: DebateState | undefined;
  isAuthenticated: boolean;
}

export function DebateDisplay({ debateState, isAuthenticated }: DebateDisplayProps) {
  const { speak } = useSpeechSynthesis();
  const previousSpeakerRef = useRef<string>('');
  const previousTranscriptRef = useRef<string>('');
  const [hasSpokenRobby, setHasSpokenRobby] = useState(false);

  useEffect(() => {
    if (!debateState) return;

    const currentSpeaker = debateState.currentSpeaker;
    const currentTranscript = debateState.transcript;

    // Check if speaker changed to Robby and transcript has new content
    // ONLY speak if user is authenticated (High-Stakes UI lock)
    if (
      currentSpeaker === 'Robby' &&
      previousSpeakerRef.current !== 'Robby' &&
      currentTranscript !== previousTranscriptRef.current &&
      currentTranscript.length > 0 &&
      !hasSpokenRobby &&
      isAuthenticated // TTS disabled unless authenticated
    ) {
      // Extract Robby's response (last part of transcript)
      const lines = currentTranscript.split('\n').filter((line) => line.trim());
      const robbyResponse = lines[lines.length - 1] || currentTranscript;

      // Speak Robby's response with British Male voice
      speak(robbyResponse, true);
      setHasSpokenRobby(true);
    }

    // Reset hasSpokenRobby when debate ends or speaker changes away from Robby
    if (currentSpeaker !== 'Robby') {
      setHasSpokenRobby(false);
    }

    previousSpeakerRef.current = currentSpeaker;
    previousTranscriptRef.current = currentTranscript;
  }, [debateState, speak, hasSpokenRobby, isAuthenticated]);

  if (!debateState) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading debate status...
        </CardContent>
      </Card>
    );
  }

  const getSpeakerStatus = (speaker: string) => {
    if (speaker === 'None') return 'Waiting for debate to start...';
    return `${speaker} is speaking...`;
  };

  const parsedTranscript = parseTranscript(debateState.transcript);
  
  // Check if current speaker is Robby and user is not authenticated
  const isRobbyLocked = debateState.currentSpeaker === 'Robby' && !isAuthenticated;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Debate Monitor</CardTitle>
          <div className="flex items-center gap-2">
            {isRobbyLocked && (
              <Badge variant="outline" className="gap-1.5 border-primary/50 text-primary">
                <Lock className="h-3 w-3" />
                Locked
              </Badge>
            )}
            <Badge variant={debateState.isDebating ? 'default' : 'secondary'}>
              {debateState.isDebating ? 'Active' : 'Idle'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            Current Speaker
          </div>
          <div className="text-2xl font-bold">
            {getSpeakerStatus(debateState.currentSpeaker)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Transcript Stream
          </div>
          <ScrollArea className="h-[400px] rounded-md border border-border bg-muted/50 p-4 relative">
            {parsedTranscript ? (
              <div className={isRobbyLocked ? 'relative' : ''}>
                <div
                  className={`text-sm whitespace-pre-wrap font-mono leading-relaxed transition-all duration-300 ${
                    isRobbyLocked ? 'blur-[8px] select-none' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: parsedTranscript }}
                />
                {isRobbyLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="text-center space-y-3 max-w-md px-6">
                      <div className="flex justify-center">
                        <div className="rounded-full bg-primary/10 p-4">
                          <Lock className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold">Authentication Required</h3>
                      <p className="text-sm text-muted-foreground">
                        Robby's responses are restricted to authenticated users only. 
                        Please login with Internet Identity to view this content and enable Text-to-Speech.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No transcript yet. Start speaking to begin...
              </p>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
