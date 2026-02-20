import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useGetAgentStatuses, useToggleAgentStatus } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useState } from 'react';

export function AgentRegistryTable() {
  const { data: agents, isLoading } = useGetAgentStatuses();
  const toggleAgent = useToggleAgentStatus();
  const [togglingAgent, setTogglingAgent] = useState<string | null>(null);

  const handleToggle = async (agentName: string, currentStatus: boolean) => {
    setTogglingAgent(agentName);
    const newStatus = !currentStatus;
    
    try {
      await toggleAgent.mutateAsync({ agentName, status: newStatus });
      toast.success(`${agentName} ${newStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      toast.error(`Failed to toggle ${agentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTogglingAgent(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12" style={{ color: '#888' }}>
        Loading agent registry...
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: '#888' }}>
        No agents found in registry
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#2a2a2a', border: '1px solid #39FF14', borderRadius: '0px' }}>
      <Table>
        <TableHeader>
          <TableRow style={{ borderColor: '#333' }}>
            <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>STATUS</TableHead>
            <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>AGENT NAME</TableHead>
            <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>AGENT ID</TableHead>
            <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px', textAlign: 'right' }}>KILL SWITCH</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.name} style={{ borderColor: '#333' }}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: agent.isEnabled ? '#39FF14' : '#FF0000',
                      boxShadow: agent.isEnabled 
                        ? '0 0 8px #39FF14' 
                        : '0 0 8px #FF0000',
                    }}
                  />
                  <span
                    style={{
                      color: agent.isEnabled ? '#39FF14' : '#FF0000',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {agent.isEnabled ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </TableCell>
              <TableCell style={{ color: '#FFA500', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {agent.name}
              </TableCell>
              <TableCell style={{ color: '#888', fontFamily: 'monospace', fontSize: '12px' }}>
                {agent.id.toString()}
              </TableCell>
              <TableCell style={{ textAlign: 'right' }}>
                <div className="flex justify-end">
                  <Switch
                    checked={agent.isEnabled}
                    onCheckedChange={() => handleToggle(agent.name, agent.isEnabled)}
                    disabled={togglingAgent === agent.name}
                    style={{
                      opacity: togglingAgent === agent.name ? 0.5 : 1,
                    }}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
