import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  contextImages?: string[]; // Array of image URLs attached as context
}

export interface CanvasNode {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected?: boolean;
  parentId?: string; // For Design Tree branching (Basic hierarchy)
  groupId?: string;  // For "Board" grouping
  maskData?: string; // Base64 or URL to a mask image for targeted edits
}

export interface CanvasEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;    // Prompt/Action summary
  isSelected?: boolean;
}

interface AppState {
  // Chat State
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  generatingNodeId: string | null;
  setGeneratingNodeId: (id: string | null) => void;

  // Canvas State (Nodes)
  nodes: CanvasNode[];
  addNode: (node: Omit<CanvasNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  createBranch: (parentId: string, updates?: Partial<Omit<CanvasNode, 'id' | 'parentId'>>) => string;
  updateNodeImage: (id: string, url: string) => void;
  activeContext: string | null; // ID of the currently selected Canvas Node
  setActiveContext: (id: string | null) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  
  // Tools
  activeTool: 'select' | 'brush';
  setActiveTool: (tool: 'select' | 'brush') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  getMaskData: (id: string) => string | null;
  setGetMaskData: (fn: (id: string) => string | null) => void;
  clearMask: (id: string) => void;
  setClearMask: (fn: (id: string) => void) => void;
  
  // Board/Grouping
  toggleGroup: (nodeIds: string[]) => void;

  // Canvas State (Edges/Connections)
  edges: CanvasEdge[];
  addEdge: (edge: Omit<CanvasEdge, 'id'>) => void;
  updateEdge: (id: string, updates: Partial<CanvasEdge>) => void;
  deleteEdge: (id: string) => void;
  activeEdge: string | null;
  setActiveEdge: (id: string | null) => void;

  // Layout State
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // History State
  history: { nodes: CanvasNode[], edges: CanvasEdge[] }[];
  future: { nodes: CanvasNode[], edges: CanvasEdge[] }[];
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
}

// --- Store ---

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Layout
      sidebarCollapsed: false,
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      
      // Chat
      messages: [],
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            { ...message, id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}` },
          ],
        })),
      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      generatingNodeId: null,
      setGeneratingNodeId: (generatingNodeId) => set({ generatingNodeId }),

      // Canvas Nodes
      nodes: [],
      addNode: (node) => {
        get().pushHistory();
        set((state) => ({
          nodes: [
            ...state.nodes,
            { ...node, id: `node_${Date.now()}_${Math.random().toString(36).substring(7)}` },
          ],
        }));
      },
      updateNode: (id, updates) => {
        set((state) => ({
          nodes: state.nodes.map((node) => node.id === id ? { ...node, ...updates } : node),
        }));
      },
      createBranch: (parentId, updates) => {
        get().pushHistory();
        const state = get();
        const parent = state.nodes.find(n => n.id === parentId);
        if (!parent) return '';

        const newId = `node_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const spacingX = 120; 
        const spacingY = 40; 

        // Base position
        let targetX = updates?.x ?? (parent.x + parent.width + spacingX);
        let targetY = updates?.y ?? parent.y;
        const width = updates?.width ?? parent.width;
        const height = updates?.height ?? parent.height;

        // Overlap prevention
        const isOccupied = (x: number, y: number) => {
          return state.nodes.some(node => 
            x < node.x + node.width &&
            x + width > node.x &&
            y < node.y + node.height &&
            y + height > node.y
          );
        };

        while (isOccupied(targetX, targetY)) {
          targetY += (height + spacingY);
        }

        const newNode: CanvasNode = {
          id: newId,
          parentId,
          url: updates?.url || parent.url,
          x: targetX,
          y: targetY,
          width,
          height,
          isSelected: true,
        };

        // Create the edge automatically
        const newEdge: CanvasEdge = {
          id: `edge_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          sourceId: parentId,
          targetId: newId,
        };

        set((state) => ({
          nodes: state.nodes.map(n => ({ ...n, isSelected: false })),
          edges: [...state.edges, newEdge],
          activeContext: newId,
        }));
        
        set((state) => ({
          nodes: [...state.nodes, newNode],
        }));

        return newId;
      },
      updateNodeImage: (id, url) =>
        set((state) => ({
          nodes: state.nodes.map((node) => node.id === id ? { ...node, url } : node),
        })),
      activeContext: null,
      setActiveContext: (id) =>
        set((state) => ({
          activeContext: id,
          activeEdge: null,
          nodes: state.nodes.map((node) => ({
            ...node,
            isSelected: node.id === id,
          })),
          edges: state.edges.map((edge) => ({
            ...edge,
            isSelected: false,
          })),
        })),
      deleteNode: (id) => {
        get().pushHistory();
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== id),
          edges: state.edges.filter((edge) => edge.sourceId !== id && edge.targetId !== id),
          activeContext: state.activeContext === id ? null : state.activeContext,
        }));
      },
      duplicateNode: (id) => {
        get().pushHistory();
        set((state) => {
          const nodeToDuplicate = state.nodes.find((n) => n.id === id);
          if (!nodeToDuplicate) return state;

          const newId = `node_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          const offset = 40; 
          
          const newNode: CanvasNode = {
            ...nodeToDuplicate,
            id: newId,
            x: nodeToDuplicate.x + offset,
            y: nodeToDuplicate.y + offset,
            isSelected: true,
          };

          return {
            nodes: [...state.nodes.map(n => ({ ...n, isSelected: false })), newNode],
            activeContext: newId,
          };
        });
      },
      
      // Tools
      activeTool: 'select',
      setActiveTool: (activeTool) => set({ activeTool }),
      brushSize: 20,
      setBrushSize: (brushSize) => set({ brushSize }),

      getMaskData: (_id: string) => null as string | null,
      setGetMaskData: (fn: (id: string) => string | null) => set({ getMaskData: fn }),
      clearMask: (_id: string) => {},
      setClearMask: (fn: (id: string) => void) => set({ clearMask: fn }),

      toggleGroup: (nodeIds) => {
        const groupId = `group_${Date.now()}`;
        set((state) => ({
          nodes: state.nodes.map(node => 
            nodeIds.includes(node.id) ? { ...node, groupId } : node
          )
        }));
      },

      // Canvas Edges
      edges: [],
      activeEdge: null,
      addEdge: (edge) => {
        get().pushHistory();
        set((state) => ({
          edges: [...state.edges, { ...edge, id: `edge_${Date.now()}_${Math.random().toString(36).substring(7)}` }]
        }));
      },
      updateEdge: (id, updates) => set((state) => ({
        edges: state.edges.map(e => e.id === id ? { ...e, ...updates } : e)
      })),
      deleteEdge: (id) => {
        get().pushHistory();
        set((state) => ({
          edges: state.edges.filter(e => e.id !== id),
          activeEdge: state.activeEdge === id ? null : state.activeEdge
        }));
      },
      setActiveEdge: (id) => set((state) => ({
        activeEdge: id,
        activeContext: null,
        edges: state.edges.map(e => ({ ...e, isSelected: e.id === id })),
        nodes: state.nodes.map(n => ({ ...n, isSelected: false }))
      })),

      // History Impl
      history: [],
      future: [],
      pushHistory: () => {
        const { nodes, edges } = get();
        set((state) => ({
          history: [...state.history.slice(-20), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
          future: [],
        }));
      },
      undo: () => {
        const { history, nodes, edges } = get();
        if (history.length === 0) return;
        const last = history[history.length - 1];
        set((state) => ({
          future: [{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }, ...state.future],
          history: state.history.slice(0, -1),
          nodes: last.nodes,
          edges: last.edges,
        }));
      },
      redo: () => {
        const { future, nodes, edges } = get();
        if (future.length === 0) return;
        const next = future[0];
        set((state) => ({
          history: [...state.history, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }],
          future: state.future.slice(1),
          nodes: next.nodes,
          edges: next.edges,
        }));
      },
    }),
    {
      name: 'spaceup-app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        messages: state.messages,
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
