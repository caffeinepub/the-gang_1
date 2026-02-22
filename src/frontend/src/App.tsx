import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mic, LogIn, LogOut, Shield, AlertTriangle, Download, Trash2 } from 'lucide-react';
import { useState, useCallback } from 'react';
import { useDebateStatus, useStartBoardroomDebate, useClearBoardroom } from './hooks/useQueries';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { DebateDisplay } from './components/DebateDisplay';
import { PushToTalkButton } from './components/PushToTalkButton';
import { InterruptButton } from './components/InterruptButton';
import { SensoryCortexTab } from './components/SensoryCortexTab';
import { AgentRegistryTable } from './components/AgentRegistryTable';
import { toast } from 'sonner';

type TabType = 'boardroom' | 'sensory' | 'health';

function BoardroomTab() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const { data: debateState, isLoading, error } = useDebateStatus();
  const startDebate = useStartBoardroomDebate();
  const clearBoardroom = useClearBoardroom();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  
  const [systemError, setSystemError] = useState<string | null>(null);
  const [isDebating, setIsDebating] = useState(false);

  // CRITICAL FIX: useCallback MUST be called at the top level, before any early returns
  const handleTranscriptComplete = useCallback(async (transcriptText: string) => {
    if (!actor) {
      console.warn('Backend not ready - cannot process transcript');
      toast.error('Backend not initialized. Please wait.');
      return;
    }

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
  }, [actor, startDebate]);

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

  // Strict early returns - only ONE message at a time (AFTER all hooks)
  if (isLoading) return <div className="mt-10 text-center text-green-500">Checking session...</div>;
  if (!isAuthenticated) return <div className="mt-10 text-center text-yellow-500">Please authenticate.</div>;
  if (!actor) return <div className="mt-10 text-center text-red-500">Actor missing. Check console for errors.</div>;

  // Main UI
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
          Voice-enabled boardroom debate system. Use Push to Talk to speak your prompt, and the
          system will automatically route through Skippy, GLaDOS, and Robby.
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
    </div>
  );
}

function SwarmHealthTab() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Strict early returns - only ONE message at a time
  if (isFetching) return <div className="mt-10 text-center text-green-500">Checking session...</div>;
  if (!isAuthenticated) return <div className="mt-10 text-center text-yellow-500">Please authenticate.</div>;
  if (!actor) return <div className="mt-10 text-center text-red-500">Actor missing. Check console for errors.</div>;

  // Main UI
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
      {/* Header - ALWAYS RENDERS */}
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

      {/* Navigation Header - ALWAYS RENDERS */}
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
                transition: 'all 0.2s',
              }}
            >
              BOARDROOM
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
                transition: 'all 0.2s',
              }}
            >
              SENSORY CORTEX
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
                transition: 'all 0.2s',
              }}
            >
              SWARM HEALTH
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area - Tab content handles its own loading/auth states */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {activeTab === 'boardroom' && <BoardroomTab />}
          {activeTab === 'sensory' && <SensoryCortexTab />}
          {activeTab === 'health' && <SwarmHealthTab />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16" style={{ borderColor: '#333', backgroundColor: '#1a1a1a' }}>
        <div className="container mx-auto px-4 py-6">
          <div className="text-center" style={{ color: '#888' }}>
            <p className="text-sm">
              © {new Date().getFullYear()} Built with love using{' '}
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                  typeof window !== 'undefined' ? window.location.hostname : 'unknown-app'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#39FF14', textDecoration: 'none' }}
                className="hover:underline"
              >
                caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
