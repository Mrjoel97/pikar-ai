import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function AgentConfigSection({ 
  agentKey, 
  onConfigChange 
}: { 
  agentKey: string; 
  onConfigChange: () => void; 
}) {
  const [useRag, setUseRag] = useState(false);
  const [useKgraph, setUseKgraph] = useState(false);
  
  const agentConfig = useQuery(api.aiAgents.getAgentConfig, { agent_key: agentKey });
  const updateConfig = useMutation(api.aiAgents.adminUpdateAgentConfig);

  React.useEffect(() => {
    if (agentConfig) {
      setUseRag(agentConfig.useRag || false);
      setUseKgraph(agentConfig.useKgraph || false);
    }
  }, [agentConfig]);

  const handleConfigUpdate = async (field: 'useRag' | 'useKgraph', value: boolean) => {
    try {
      await updateConfig({
        agent_key: agentKey,
        [field]: value,
      });
      
      if (field === 'useRag') setUseRag(value);
      if (field === 'useKgraph') setUseKgraph(value);
      
      toast.success(`${field === 'useRag' ? 'RAG' : 'Knowledge Graph'} ${value ? 'enabled' : 'disabled'}`);
      onConfigChange();
    } catch (error) {
      toast.error(`Failed to update ${field === 'useRag' ? 'RAG' : 'Knowledge Graph'} setting`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">Agent Capabilities</div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={useRag}
            onCheckedChange={(checked) => handleConfigUpdate('useRag', checked)}
          />
          <label className="text-sm">Enable RAG (Vectors)</label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={useKgraph}
            onCheckedChange={(checked) => handleConfigUpdate('useKgraph', checked)}
          />
          <label className="text-sm">Enable Knowledge Graph</label>
        </div>
      </div>
      {(useRag || useKgraph) && (
        <div className="text-xs text-muted-foreground">
          Note: Publishing with these features enabled requires corresponding data to be ingested and evaluations to pass.
        </div>
      )}
    </div>
  );
}
