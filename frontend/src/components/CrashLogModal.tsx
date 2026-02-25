import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Agent } from '../backend';

interface CrashLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent | null;
}

export function CrashLogModal({ isOpen, onClose, agent }: CrashLogModalProps) {
  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        style={{
          backgroundColor: '#1a1a1a',
          borderColor: '#39FF14',
          maxWidth: '700px',
        }}
      >
        <DialogHeader>
          <DialogTitle
            style={{
              color: '#39FF14',
              fontFamily: 'monospace',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            DIAGNOSTICS: {agent.name}
          </DialogTitle>
          <DialogDescription
            style={{
              color: '#888',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
          >
            Agent ID: {agent.id.toString()} | Status: {agent.isEnabled ? 'ONLINE' : 'OFFLINE'}
          </DialogDescription>
        </DialogHeader>

        <div
          style={{
            backgroundColor: '#000000',
            border: '1px solid #39FF14',
            borderRadius: '4px',
            padding: '16px',
            minHeight: '300px',
            maxHeight: '500px',
            overflowY: 'auto',
            fontFamily: '"Courier New", monospace',
            fontSize: '13px',
            lineHeight: '1.6',
          }}
        >
          <div style={{ color: '#39FF14' }}>
            <span style={{ color: '#FFFFFF' }}>[SYS]</span> Telemetry link established. Agent nominal. Zero traps recorded.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
