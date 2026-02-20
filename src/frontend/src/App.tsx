import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mic, LogIn, LogOut, Shield } from 'lucide-react';
import { useDebateStatus, useStartBoardroomDebate } from './hooks/useQueries';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { DebateDisplay } from './components/DebateDisplay';
import { PushToTalkButton } from './components/PushToTalkButton';
import { InterruptButton } from './components/InterruptButton';
import { toast } from 'sonner';

export default function App() {
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mic className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">The Gang Voice Assistant</h1>
                <p className="text-muted-foreground mt-1">Phase 4: Security & Authentication</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Badge variant="default" className="gap-1.5">
                    <Shield className="h-3 w-3" />
                    Authenticated
                  </Badge>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="default"
                    className="gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  size="lg"
                  className="gap-2 font-semibold"
                >
                  <LogIn className="h-5 w-5" />
                  {isLoggingIn ? 'Connecting...' : 'Login with Internet Identity'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Voice-enabled boardroom debate system. Use Push to Talk to speak your prompt, and the
              system will automatically route through Skippy, GLaDOS, and Robby. 
              <strong className="font-semibold"> Authentication required to view Robby's responses and enable Text-to-Speech.</strong>
            </AlertDescription>
          </Alert>

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
              <DebateDisplay debateState={debateState} isAuthenticated={isAuthenticated} />

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Push to Talk</CardTitle>
                    <CardDescription>
                      Click to start recording your prompt. Release or click again to stop.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PushToTalkButton
                      onTranscriptComplete={handleTranscriptComplete}
                      disabled={debateState?.isDebating || startDebate.isPending}
                    />
                    {startDebate.isPending && (
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        Starting debate...
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Barge-In Control</CardTitle>
                    <CardDescription>
                      Interrupt the debate and stop speech synthesis immediately.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InterruptButton disabled={!debateState?.isDebating} />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>The Gang (Agent Interfaces)</CardTitle>
                  <CardDescription>
                    8 external agent interfaces for inter-canister communication
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                        className="px-3 py-2 rounded-md bg-muted text-sm font-mono text-center"
                      >
                        {agent}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Built with love using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                typeof window !== 'undefined' ? window.location.hostname : 'the-gang-voice-assistant'
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
