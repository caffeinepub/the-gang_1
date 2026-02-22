import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Mic, LogIn, LogOut, Shield, AlertTriangle, Download, Trash2, Send } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDebateStatus, useStartBoardroomDebate, useClearBoardroom } from './hooks/useQueries';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { DebateDisplay } from './components/DebateDisplay';
import { PushToTalkButton } from './components/PushToTalkButton';
import { InterruptButton } from './components/InterruptButton';
import { SensoryCortexTab } from './components/SensoryCortexTab';
import { AgentRegistryTable } from './components/AgentRegistryTable';
import { toast } from 'sonner';

type TabType = 'boardroom' | 'sensory' | 'health';

function BoardroomTab() {
  const { identity } = useInternetIdentity();
  const { data: debateState, isLoading, error } = useDebateStatus();
  const startDebate = useStartBoardroomDebate();
  const clearBoardroom = useClearBoardroom();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  
  const [systemError, setSystemError] = useState<string | null>(null);
  const [isDebating, setIsDebating] = useState(false);
  const [commandText, setCommandText] = useState('');

  const handleTranscriptComplete = useCallback(async (transcriptText: string) => {
    if (!transcriptText.trim()) {
      toast.error('No speech detected. Please try again.');
      return;
    }

    setSystemError(null);
    setIsDebating(true);
    
    try {
      await startDebate.mutateAsync(transcriptText);
      toast.success('Debate started successfully!');
    } catch (error) {
      console.error('Failed to start debate:', error);
      toast.error('Failed to start debate. Please try again.');
    } finally {
      setIsDebating(false);
    }
  }, [startDebate]);

  const handleSendCommand = useCallback(async () => {
    if (!commandText.trim()) {
      toast.error('Please enter a command.');
      return;
    }

    setSystemError(null);
    setIsDebating(true);
    
    try {
      await startDebate.mutateAsync(commandText);
      toast.success('Command sent successfully!');
      setCommandText('');
    } catch (error) {
      console.error('Failed to send command:', error);
      toast.error('Failed to send command. Please try again.');
    } finally {
      setIsDebating(false);
    }
  }, [startDebate, commandText]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendCommand();
    }
  }, [handleSendCommand]);

  const handleDownloadTranscript = useCallback(() => {
    if (!debateState?.transcript) {
      toast.error('No transcript available to download');
      return;
    }

    const blob = new Blob([debateState.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'boardroom-archive.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded successfully');
  }, [debateState?.transcript]);

  if (isLoading) return <div className="mt-10 text-center text-green-500">Checking session...</div>;
  if (!isAuthenticated) return <div className="mt-10 text-center text-yellow-500">Please authenticate.</div>;

  return (
    <div className="space-y-6">
      {debateState?.emergencyMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong className="font-semibold">Emergency Mode Active (Steel Rain):</strong> All requests are routed exclusively through Skippy. 
            GLaDOS and Robby are bypassed. Say "Stand Down" to return to normal Boardroom protocol.
          </AlertDescription>
        </Alert>
      )}

      {systemError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {systemError}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to connect to backend: {error instanceof Error ? error.message : 'Unknown error'}
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Voice-enabled boardroom debate system. Use Push to Talk to speak your prompt, or type commands manually below.
          The system will automatically route through Skippy, GLaDOS, and Robby.
        </AlertDescription>
      </Alert>

      <DebateDisplay debateState={debateState} isAuthenticated={isAuthenticated} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Push to Talk</h3>
              <p className="text-sm text-muted-foreground">
                Click to start recording your prompt. Release or click again to stop.
                {debateState?.emergencyMode && (
                  <span className="block mt-1 text-destructive font-semibold">
                    Emergency Mode: Only Skippy will respond
                  </span>
                )}
              </p>
            </div>
            <PushToTalkButton
              onTranscriptComplete={handleTranscriptComplete}
              disabled={debateState?.isDebating || startDebate.isPending || isDebating}
            />
            {(startDebate.isPending || isDebating) && (
              <p className="text-sm text-muted-foreground text-center">
                Starting debate...
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Barge-In Control</h3>
              <p className="text-sm text-muted-foreground">
                Interrupt the current debate and stop all agent responses immediately.
              </p>
            </div>
            <InterruptButton disabled={!debateState?.isDebating} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Archive session transcripts or reset the boardroom for a fresh start.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadTranscript}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Archive
              </Button>
              <Button
                variant="destructive"
                onClick={() => clearBoardroom.mutate()}
                disabled={clearBoardroom.isPending}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Boardroom
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Text Command Console</CardTitle>
          <CardDescription>
            Type commands manually instead of using voice input. Press Enter to send, Shift+Enter for new line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Textarea
              placeholder="Enter your command here..."
              value={commandText}
              onChange={(e) => setCommandText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] resize-none"
              disabled={debateState?.isDebating || startDebate.isPending || isDebating}
            />
            <Button
              onClick={handleSendCommand}
              disabled={!commandText.trim() || debateState?.isDebating || startDebate.isPending || isDebating}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {startDebate.isPending || isDebating ? 'Sending...' : 'Send Command'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SwarmHealthTab() {
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  if (!isAuthenticated) return <div className="mt-10 text-center text-yellow-500">Please authenticate.</div>;

  return <AgentRegistryTable />;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('boardroom');
  
  const { data: debateState } = useDebateStatus();
  const { login, clear, identity, isLoggingIn } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const handleLogin = useCallback(() => {
    login();
    toast.info('Redirecting to Internet Identity...');
  }, [login]);

  const handleLogout = useCallback(() => {
    clear();
    toast.success('Logged out successfully');
  }, [clear]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a1a1a' }}>
      <header className="border-b" style={{ borderColor: '#333', backgroundColor: '#1a1a1a' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="h-8 w-8" style={{ color: '#39FF14' }} />
              <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#39FF14' }}>
                  The Gang Voice Assistant
                </h1>
                <p className="mt-1" style={{ color: '#FFA500' }}>
                  Phase 7: Command & Control Registry
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {debateState?.emergencyMode && (
                <Badge variant="destructive" className="gap-1.5 animate-pulse">
                  <AlertTriangle className="h-3 w-3" />
                  Emergency Mode
                </Badge>
              )}
              {isAuthenticated ? (
                <>
                  <Badge variant="default" className="gap-1.5">
                    <Shield className="h-3 w-3" />
                    Authenticated
                  </Badge>
                  <button
                    onClick={handleLogout}
                    style={{
                      backgroundColor: '#2a2a2a',
                      color: '#39FF14',
                      border: '1px solid #39FF14',
                      borderRadius: '0px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  style={{
                    backgroundColor: '#39FF14',
                    color: '#1a1a1a',
                    border: 'none',
                    borderRadius: '0px',
                    padding: '12px 24px',
                    cursor: isLoggingIn ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    opacity: isLoggingIn ? 0.6 : 1,
                  }}
                  className="flex items-center gap-2"
                >
                  <LogIn className="h-5 w-5" />
                  {isLoggingIn ? 'Connecting...' : 'Login with Internet Identity'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav style={{ backgroundColor: '#1a1a1a', borderBottom: '2px solid #333' }}>
        <div className="container mx-auto px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab('boardroom')}
              style={{
                backgroundColor: activeTab === 'boardroom' ? '#2a2a2a' : '#1a1a1a',
                color: activeTab === 'boardroom' ? '#39FF14' : '#888',
                border: 'none',
                borderRadius: '0px',
                padding: '16px 32px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                borderBottom: activeTab === 'boardroom' ? '3px solid #39FF14' : '3px solid transparent',
              }}
            >
              Boardroom
            </button>
            <button
              onClick={() => setActiveTab('sensory')}
              style={{
                backgroundColor: activeTab === 'sensory' ? '#2a2a2a' : '#1a1a1a',
                color: activeTab === 'sensory' ? '#39FF14' : '#888',
                border: 'none',
                borderRadius: '0px',
                padding: '16px 32px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                borderBottom: activeTab === 'sensory' ? '3px solid #39FF14' : '3px solid transparent',
              }}
            >
              Sensory Cortex
            </button>
            <button
              onClick={() => setActiveTab('health')}
              style={{
                backgroundColor: activeTab === 'health' ? '#2a2a2a' : '#1a1a1a',
                color: activeTab === 'health' ? '#39FF14' : '#888',
                border: 'none',
                borderRadius: '0px',
                padding: '16px 32px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
                borderBottom: activeTab === 'health' ? '3px solid #39FF14' : '3px solid transparent',
              }}
            >
              Swarm Health
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'boardroom' && <BoardroomTab />}
        {activeTab === 'sensory' && <SensoryCortexTab />}
        {activeTab === 'health' && <SwarmHealthTab />}
      </main>

      <footer className="border-t mt-16" style={{ borderColor: '#333', backgroundColor: '#1a1a1a' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#888' }}>
            <span>© {new Date().getFullYear()}</span>
            <span>•</span>
            <span>Built with ❤️ using</span>
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#39FF14', textDecoration: 'none' }}
              className="hover:underline"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
