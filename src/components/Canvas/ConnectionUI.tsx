import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { X, MessageSquare, Trash2 } from 'lucide-react';

interface ConnectionUIProps {
  edgeId: string;
  position: { x: number; y: number }; // Screen coordinates
}

export const ConnectionUI: React.FC<ConnectionUIProps> = ({ edgeId, position }) => {
  const edges = useAppStore((state) => state.edges);
  const updateEdge = useAppStore((state) => state.updateEdge);
  const deleteEdge = useAppStore((state) => state.deleteEdge);
  const setActiveEdge = useAppStore((state) => state.setActiveEdge);

  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return null;

  return (
    <div 
      className="absolute z-50 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-[#E6E2D3] border border-black/10 rounded-full px-3 py-1.5 shadow-xl animate-in fade-in zoom-in duration-200"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex items-center gap-2 border-r border-black/10 pr-2">
        <MessageSquare size={14} className="text-black/60" />
        <input 
          type="text"
          value={edge.label || ''}
          placeholder="What changed?"
          onChange={(e) => updateEdge(edgeId, { label: e.target.value })}
          className="bg-transparent text-xs font-medium focus:outline-none placeholder:text-black/30 w-32"
          autoFocus
        />
      </div>
      
      <button 
        onClick={() => deleteEdge(edgeId)}
        className="p-1 hover:bg-black/5 rounded-full transition-colors text-red-600/80 hover:text-red-600"
        title="Delete Connection"
      >
        <Trash2 size={14} />
      </button>

      <button 
        onClick={() => setActiveEdge(null)}
        className="p-1 hover:bg-black/5 rounded-full transition-colors"
        title="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
};
