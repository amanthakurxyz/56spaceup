import { useWebGLCanvas } from "@/hooks/useWebGLCanvas";
import { useAppStore } from "@/store/useAppStore";
import { NodeContextMenu } from "./NodeContextMenu";
import { ConnectionUI } from "./ConnectionUI";
import { NodeLoadingOverlay } from "./NodeLoadingOverlay";

export default function CanvasContainer({ isPanning }: { isPanning: boolean }) {
  const { canvasRef, getScreenPos, getEdgeScreenPos, zoomLevel } = useWebGLCanvas();
  const activeContext = useAppStore((state) => state.activeContext);
  const activeEdge = useAppStore((state) => state.activeEdge);
  const generatingNodeId = useAppStore((state) => state.generatingNodeId);

  const edgePos = activeEdge ? getEdgeScreenPos(activeEdge) : null;

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} outline-none`}
      />

      {activeContext && (
        <NodeContextMenu
          nodeId={activeContext}
          getScreenPos={getScreenPos}
          zoomLevel={zoomLevel}
        />
      )}

      {activeEdge && edgePos && (
        <ConnectionUI
          edgeId={activeEdge}
          position={edgePos}
        />
      )}

      {generatingNodeId && (
        <NodeLoadingOverlay
          nodeId={generatingNodeId}
          getScreenPos={getScreenPos}
          zoomLevel={zoomLevel}
        />
      )}
    </div>
  );
}
