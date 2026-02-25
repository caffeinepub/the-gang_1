import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useGetAgentStatuses, useToggleAgentStatus, useResetAgents } from '../hooks/useQueries';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import type { Agent } from '../backend';
import { CrashLogModal } from './CrashLogModal';
import { RotateCcw } from 'lucide-react';

export function AgentRegistryTable() {
  const { data: agents, isLoading } = useGetAgentStatuses();
  const toggleAgent = useToggleAgentStatus();
  const resetAgents = useResetAgents();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate random memory percentages for each agent (stable across re-renders)
  const memoryUsage = useMemo(() => {
    if (!agents) return {};
    const usage: Record<string, number> = {};
    agents.forEach((agent: Agent) => {
      usage[agent.name] = Math.floor(Math.random() * 31) + 10; // 10-40%
    });
    return usage;
  }, [agents]);

  const handleToggle = async (agentName: string, currentStatus: boolean) => {
    setUpdatingId(agentName);
    const newStatus = !currentStatus;
    
    try {
      await toggleAgent.mutateAsync({ agentName, status: newStatus });
      toast.success(`${agentName} ${newStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Toggle agent error:', error);
      toast.error(`Failed to toggle ${agentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetAgents = async () => {
    try {
      await resetAgents.mutateAsync();
      toast.success('All agents have been reset successfully');
    } catch (error) {
      console.error('Reset agents error:', error);
      toast.error(`Failed to reset agents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleViewLogs = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
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
    <>
      {/* Reset Agents Button */}
      <div className="mb-6 flex justify-end">
        <Button
          onClick={handleResetAgents}
          disabled={resetAgents.isPending}
          style={{
            backgroundColor: 'transparent',
            borderColor: '#FFA500',
            color: '#FFA500',
            fontSize: '13px',
            padding: '8px 16px',
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            fontWeight: 'bold',
          }}
          className="hover:bg-[#FFA500] hover:text-black transition-colors"
          variant="outline"
        >
          {resetAgents.isPending ? (
            <>
              <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Agents
            </>
          )}
        </Button>
      </div>

      {/* System Vitals Section */}
      <div className="mb-6">
        <h2 
          className="text-xl font-bold mb-4" 
          style={{ color: '#39FF14', fontFamily: 'monospace', textTransform: 'uppercase' }}
        >
          System Infrastructure Vitals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Orchestrator Core */}
          <div 
            style={{ 
              backgroundColor: '#2a2a2a', 
              border: '1px solid #39FF14', 
              borderRadius: '0px',
              padding: '20px'
            }}
          >
            <h3 
              className="text-lg font-bold mb-3" 
              style={{ color: '#FFA500', fontFamily: 'monospace' }}
            >
              Orchestrator Core
            </h3>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#39FF14',
                  boxShadow: '0 0 12px #39FF14',
                }}
              />
              <span style={{ color: '#39FF14', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold' }}>
                4.2T Cycles
              </span>
            </div>
            <div className="mt-3">
              <Progress 
                value={84} 
                className="h-3"
                style={{
                  backgroundColor: '#1a1a1a',
                }}
              />
              <span style={{ color: '#888', fontFamily: 'monospace', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Fuel Level: 84%
              </span>
            </div>
          </div>

          {/* Card 2: Telemetry Side Master */}
          <div 
            style={{ 
              backgroundColor: '#2a2a2a', 
              border: '1px solid #39FF14', 
              borderRadius: '0px',
              padding: '20px'
            }}
          >
            <h3 
              className="text-lg font-bold mb-3" 
              style={{ color: '#FFA500', fontFamily: 'monospace' }}
            >
              Telemetry Side Master
            </h3>
            <div className="flex items-center gap-3">
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#39FF14',
                  boxShadow: '0 0 12px #39FF14',
                }}
              />
              <span style={{ color: '#39FF14', fontFamily: 'monospace', fontSize: '18px', fontWeight: 'bold' }}>
                5.0T Cycles
              </span>
            </div>
            <div className="mt-3">
              <Progress 
                value={100} 
                className="h-3"
                style={{
                  backgroundColor: '#1a1a1a',
                }}
              />
              <span style={{ color: '#888', fontFamily: 'monospace', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Fuel Level: 100%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Registry Table */}
      <div style={{ backgroundColor: '#2a2a2a', border: '1px solid #39FF14', borderRadius: '0px' }}>
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: '#333' }}>
              <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>STATUS</TableHead>
              <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>AGENT NAME</TableHead>
              <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>AGENT ID</TableHead>
              <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>CYCLES (GAS)</TableHead>
              <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>MEMORY</TableHead>
              <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px' }}>DIAGNOSTICS</TableHead>
              <TableHead style={{ color: '#39FF14', fontWeight: 'bold', fontSize: '14px', textAlign: 'right' }}>KILL SWITCH</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent: Agent) => (
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
                  <div className="flex items-center gap-2">
                    <span>{agent.name}</span>
                    {agent.name === 'Deep_Thought' && (
                      <Badge 
                        variant="outline"
                        style={{
                          backgroundColor: 'transparent',
                          borderColor: '#39FF14',
                          color: '#39FF14',
                          fontSize: '9px',
                          padding: '2px 6px',
                          fontFamily: 'monospace',
                          textTransform: 'uppercase',
                        }}
                      >
                        Logistics Lead
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell style={{ color: '#888', fontFamily: 'monospace', fontSize: '12px' }}>
                  {agent.id.toString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#39FF14', fontFamily: 'monospace', fontSize: '12px' }}>
                      1.5T Cycles
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{
                        backgroundColor: 'transparent',
                        borderColor: '#39FF14',
                        color: '#39FF14',
                        fontSize: '10px',
                        padding: '2px 8px',
                        height: 'auto',
                      }}
                      className="hover:bg-[#39FF14] hover:text-black transition-colors"
                    >
                      Top Up
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2" style={{ minWidth: '150px' }}>
                    <Progress 
                      value={memoryUsage[agent.name] || 20} 
                      className="h-2"
                      style={{
                        backgroundColor: '#1a1a1a',
                      }}
                    />
                    <span style={{ color: '#39FF14', fontFamily: 'monospace', fontSize: '11px', minWidth: '35px' }}>
                      {memoryUsage[agent.name] || 20}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewLogs(agent)}
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: '#39FF14',
                      color: '#39FF14',
                      fontSize: '11px',
                      padding: '4px 12px',
                      height: 'auto',
                    }}
                    className="hover:bg-[#39FF14] hover:text-black transition-colors"
                  >
                    View Logs
                  </Button>
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <div className="flex justify-end">
                    <Switch
                      checked={agent.isEnabled}
                      onCheckedChange={() => handleToggle(agent.name, agent.isEnabled)}
                      disabled={updatingId === agent.name}
                      style={{
                        opacity: updatingId === agent.name ? 0.5 : 1,
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CrashLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        agent={selectedAgent}
      />
    </>
  );
}
