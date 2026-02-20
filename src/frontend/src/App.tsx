import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mic, LogIn, LogOut, Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useDebateStatus, useStartBoardroomDebate } from './hooks/useQueries';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { DebateDisplay } from './components/DebateDisplay';
import { PushToTalkButton } from './components/PushToTalkButton';
import { InterruptButton } from './components/InterruptButton';
import { SensoryCortexTab } from './components/SensoryCortexTab';
import { AgentRegistryTable } from './components/AgentRegistryTable';
import { toast } from 'sonner';

type TabType = 'boardroom' | 'sensory' | 'health';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('boardroom');
  const { data: debateState, isLoading, error } = useDebateStatus();
  const startDebate = useStartBoardroomDebate();
  const { login, clear, loginStatus, identity, isLoggingIn, isLoginSuccess } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const handleTranscriptComplete = (transcript: string) => {
    if (!transcript.trim()) {
      toast.error('No speech detected. Please try again.');
      return;
    }

    startDebate.mutate(transcript, {
      onSuccess: () => {
        toast.success('Debate started successfully!');
      },
      onError: (error) => {
        toast.error(`Failed to start debate: ${error instanceof Error ? error.message : 'Unknown error'}`);
      },
    });
  };

  const handleLogin = () => {
    login();
    toast.info('Redirecting to Internet Identity...');
  };

  const handleLogout = () => {
    clear();
    toast.success('Logged out successfully');
  };

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

      {/* Navigation Header */}
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

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {debateState?.emergencyMode && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong className="font-semibold">Emergency Mode Active (Steel Rain):</strong> All requests are routed exclusively through Skippy. 
                GLaDOS and Robby are bypassed. Say "Stand Down" to return to normal Boardroom protocol.
              </AlertDescription>
            </Alert>
          )}

          {!isAuthenticated && (
            <Alert variant="default" className="border-primary/50 bg-primary/5">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong className="font-semibold">High-Stakes Content Locked:</strong> Robby's transcript output and voice synthesis 
                are restricted. Please authenticate with Internet Identity to access premium features.
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

          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Initializing voice interface...
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Boardroom Tab */}
              {activeTab === 'boardroom' && (
                <div className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Voice-enabled boardroom debate system. Use Push to Talk to speak your prompt, and the
                      system will automatically route through Skippy, GLaDOS, and Robby. 
                      <strong className="font-semibold"> Authentication required to view Robby's responses and enable Text-to-Speech.</strong>
                    </AlertDescription>
                  </Alert>

                  <DebateDisplay debateState={debateState} isAuthenticated={isAuthenticated} />

                  <div className="grid gap-6 md:grid-cols-2">
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
                          disabled={debateState?.isDebating || startDebate.isPending}
                        />
                        {startDebate.isPending && (
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
                            Interrupt the debate and stop speech synthesis immediately.
                          </p>
                        </div>
                        <InterruptButton disabled={!debateState?.isDebating} />
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <h3 className="font-semibold mb-1">The Gang (Agent Interfaces)</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          8 external agent interfaces for inter-canister communication
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          'Robby',
                          'Skippy',
                          'The_Architect',
                          'Deep_Thought',
                          'GLaDOS',
                          'VINCENT',
                          'Janet',
                          'The_Librarian',
                        ].map((agent) => (
                          <div
                            key={agent}
                            className={`px-3 py-2 rounded-md text-sm font-mono text-center transition-all ${
                              debateState?.emergencyMode && agent === 'Skippy'
                                ? 'bg-destructive text-destructive-foreground font-bold ring-2 ring-destructive'
                                : debateState?.emergencyMode && (agent === 'GLaDOS' || agent === 'Robby')
                                ? 'bg-muted/50 text-muted-foreground line-through opacity-50'
                                : 'bg-muted'
                            }`}
                          >
                            {agent}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Sensory Cortex Tab */}
              {activeTab === 'sensory' && <SensoryCortexTab />}

              {/* Swarm Health Tab */}
              {activeTab === 'health' && (
                <div className="space-y-6">
                  <Card style={{ backgroundColor: '#2a2a2a', border: '1px solid #39FF14', borderRadius: '0px' }}>
                    <CardContent className="py-8">
                      <h2 className="text-2xl font-bold mb-2" style={{ color: '#39FF14' }}>
                        C2 DASHBOARD - SWARM HEALTH
                      </h2>
                      <p className="mb-6" style={{ color: '#FFA500', fontSize: '14px' }}>
                        Command & Control interface for AI agent registry and kill switches
                      </p>
                      
                      {!isAuthenticated && (
                        <Alert variant="default" className="mb-6 border-primary/50 bg-primary/5">
                          <Shield className="h-4 w-4" />
                          <AlertDescription>
                            <strong className="font-semibold">Admin Access Required:</strong> Please authenticate with Internet Identity to manage agent status.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <AgentRegistryTable />
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t mt-24" style={{ borderColor: '#333', backgroundColor: '#1a1a1a' }}>
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm" style={{ color: '#888' }}>
            © {new Date().getFullYear()} Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'the-gang-voice-assistant'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#39FF14', textDecoration: 'underline' }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
