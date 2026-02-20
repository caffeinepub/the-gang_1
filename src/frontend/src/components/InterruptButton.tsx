import { Button } from '@/components/ui/button';
import { StopCircle } from 'lucide-react';
import { useAbortDebate } from '../hooks/useQueries';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface InterruptButtonProps {
  disabled?: boolean;
}

export function InterruptButton({ disabled }: InterruptButtonProps) {
  const abortDebate = useAbortDebate();
  const { cancel } = useSpeechSynthesis();

  const handleInterrupt = () => {
    // Stop any active speech synthesis
    cancel();

    // Call backend to abort debate
    abortDebate.mutate('User interrupted');
  };

  return (
    <Button
      onClick={handleInterrupt}
      disabled={disabled || abortDebate.isPending}
      variant="destructive"
      size="lg"
      className="w-full font-bold"
    >
      <StopCircle className="h-5 w-5 mr-2" />
      {abortDebate.isPending ? 'Interrupting...' : 'Interrupt / Stop'}
    </Button>
  );
}
