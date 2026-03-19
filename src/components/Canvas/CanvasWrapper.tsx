import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Navigation, Edit3, Image as ImageIcon, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useWebGLCanvas } from "@/hooks/useWebGLCanvas";
import { insforge } from "@/utils/insforge/client";

// Dynamic import for performance
const CanvasContainer = dynamic(() => import("./CanvasContainer"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-background-light animate-pulse" />
});

export function CanvasWrapper() {
  const { 
    nodes, addNode, isGenerating, setIsGenerating, 
    activeTool, setActiveTool, activeContext, 
    edges, updateEdge, activeEdge, setActiveEdge 
  } = useAppStore();
  const { canvasRef, resetView, zoomLevel, getScreenPos, getEdgeScreenPos, clearMask } = useWebGLCanvas();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeNode = nodes.find(n => n.id === activeContext);
  const selectedEdge = edges.find(e => e.id === activeEdge);

  const { undo, redo } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleExport = () => {
    if (!activeNode) return;
    const link = document.createElement('a');
    link.href = activeNode.url;
    link.download = `spaceup-design-${activeNode.id.substring(0, 8)}.png`;
    link.click();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsGenerating(true);
    try {
      const { data, error } = await insforge.storage.from("spaceup-canvas").uploadAuto(file);
      if (error) throw error;
      if (data?.url) {
        addNode({ url: data.url, x: 0, y: 0, width: 512, height: 512 });
      }
    } catch (error) { console.error("Upload failed:", error); } finally {
      setIsGenerating(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const nodePos = activeNode ? getScreenPos(activeNode.x, activeNode.y) : null;
  const edgePos = activeEdge ? getEdgeScreenPos(activeEdge) : null;

  return (
    <section className="flex-1 relative bg-background-light overflow-hidden">
      <CanvasContainer isPanning={false} />

      {/* Floating Node UI (When Brushing or Selected) */}
      {activeNode && nodePos && (
        <div 
          className="absolute z-50 pointer-events-none"
          style={{ 
            left: nodePos.x, 
            top: nodePos.y - 60,
            transform: `translate(0, 0)` 
          }}
        >
          <div className="bg-[#E6E2D3] border border-black/5 rounded-xl shadow-xl px-4 py-2 flex items-center gap-3 pointer-events-auto backdrop-blur-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">
              {activeTool === 'brush' ? 'Brushing Area' : 'Selected Node'}
            </span>
            <button 
              onClick={handleExport}
              className="text-[9px] font-bold uppercase tracking-widest hover:text-black transition-colors"
            >
              Export
            </button>
            {activeTool === 'brush' && (
              <button 
                onClick={() => clearMask(activeNode.id)}
                className="text-[9px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Edge UI (Connection Prompts) */}
      {selectedEdge && edgePos && (
        <div 
          className="absolute z-50 pointer-events-none"
          style={{ 
            left: edgePos.x, 
            top: edgePos.y,
            transform: 'translate(-50%, -100%) translateY(-20px)'
          }}
        >
          <div className="bg-[#E6E2D3] border border-black/5 rounded-2xl shadow-2xl p-4 w-64 pointer-events-auto backdrop-blur-md">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">Connection Intent</span>
              <input 
                autoFocus
                type="text"
                placeholder="Describe connection (e.g. 'Add floor lamp')"
                className="bg-white/50 border-none rounded-lg p-2 text-sm focus:ring-0 placeholder:text-black/20"
                value={selectedEdge.label || ''}
                onChange={(e) => updateEdge(selectedEdge.id, { label: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-xl border border-white/10">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-widest">Processing</span>
        </div>
      )}

      {/* Zoom Indicator */}
      <div className="absolute bottom-8 left-8 z-40 hidden md:flex items-center gap-2">
        <button 
          onClick={resetView}
          className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/10 shadow-sm hover:bg-black hover:text-white transition-colors"
        >
          Reset View
        </button>
        <div className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-primary/10 shadow-sm cursor-default">
          {Math.round(zoomLevel * 100)}%
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 hidden md:block">
        <div className="bg-[#E6E2D3] text-black px-6 py-3 rounded-2xl flex items-center gap-6 border border-black/5 shadow-2xl backdrop-blur-md">
          <button 
            onClick={() => setActiveTool('select')}
            className={`transition-all ${activeTool === 'select' ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-60'}`} 
            title="Select"
          >
            <Navigation className={`w-4 h-4 ${activeTool === 'select' ? 'fill-black' : ''}`} />
          </button>

          <button 
            onClick={() => setActiveTool('brush')}
            className={`transition-all ${activeTool === 'brush' ? 'opacity-100 scale-110' : 'opacity-40 hover:opacity-60'}`} 
            title="Spatial Brush"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          
          <div className="w-px h-4 bg-black/10" />
          
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="opacity-40 hover:opacity-100 transition-opacity text-black" title="Add Image">
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

