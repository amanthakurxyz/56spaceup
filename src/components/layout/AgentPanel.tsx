"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Plus } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function AgentPanel() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useAppStore((s) => s.messages);
  const addMessage = useAppStore((s) => s.addMessage);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const setIsGenerating = useAppStore((s) => s.setIsGenerating);
  const activeContext = useAppStore((s) => s.activeContext);
  const getMaskData = useAppStore((s) => s.getMaskData);
  const createBranch = useAppStore((s) => s.createBranch);
  const updateNodeImage = useAppStore((s) => s.updateNodeImage);
  const updateNode = useAppStore((s) => s.updateNode);
  const setGeneratingNodeId = useAppStore((s) => s.setGeneratingNodeId);
  const nodes = useAppStore((s) => s.nodes);

  const activeNode = nodes.find((n) => n.id === activeContext) ?? null;
  const edges = useAppStore((s) => s.edges);

  // Recursive context: nodes connected to the active node
  const contextualNodes = activeNode 
    ? edges.filter(e => e.sourceId === activeNode.id || e.targetId === activeNode.id)
          .map(e => e.sourceId === activeNode.id ? e.targetId : e.sourceId)
          .map(id => nodes.find(n => n.id === id))
          .filter((n): n is NonNullable<typeof n> => !!n)
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const TWEAK_KEYWORDS = ['bright', 'dark', 'contrast', 'saturation', 'warm', 'cool', 'exposure', 'shadow', 'highlight', 'tone', 'color', 'hue', 'temperature'];
  const STRUCTURAL_KEYWORDS = ['style', 'layout', 'baroque', 'modern', 'minimalist', 'furniture', 'room', 'replace', 'redesign', 'new', 'add', 'remove'];

  function classifyIntent(text: string): 'tweak' | 'structural' {
    const lower = text.toLowerCase();
    if (TWEAK_KEYWORDS.some((kw) => lower.includes(kw))) return 'tweak';
    if (STRUCTURAL_KEYWORDS.some((kw) => lower.includes(kw))) return 'structural';
    return 'structural'; // default to branch when ambiguous
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isGenerating) return;

    const targetNodeId = activeContext;
    const maskData = targetNodeId ? getMaskData(targetNodeId) : null;
    const contextUrls = [
      ...(activeNode ? [activeNode.url] : []),
      ...contextualNodes.map(n => n.url)
    ];

    setInput("");

    addMessage({
      role: "user",
      content: text,
      contextImages: contextUrls,
    });

    setIsGenerating(true);

    let assistantContent: string;

    if (targetNodeId && activeNode) {
      const intent = classifyIntent(text);
      let newNodeId: string | null = null;

      if (intent === 'structural') {
        newNodeId = createBranch(targetNodeId);
      }

      setGeneratingNodeId(intent === 'structural' ? newNodeId! : targetNodeId);

      try {
        const inspirationCount = contextualNodes.length;
        const connectionPrompts = edges
          .filter(e => e.sourceId === targetNodeId || e.targetId === targetNodeId)
          .map(e => e.label)
          .filter(Boolean);

        const systemPrompt = `You are Spaceup Agent, an expert interior design visualizer. Perform a ${
          intent === 'tweak' ? 'LIGHT REFINEMENT' : 'STRUCTURAL REDESIGN'
        } on this interior space. Instructions: ${text}.

Context:
- Base: [attached base image]${inspirationCount > 0 ? `\n- Inspiration/Moodboard: ${inspirationCount} connected image(s) attached` : ''}${
          connectionPrompts.length > 0 ? `\n- Additional Designer Intent: ${connectionPrompts.join(', ')}` : ''
        }

Generate a photorealistic interior design image maintaining spatial consistency.${
          maskData ? ' The user has highlighted a specific area to focus on.' : ''
        }${inspirationCount > 0 ? ' Use the inspiration images as guidance for materials, textures, and style.' : ''}`;

        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            prompt: systemPrompt, 
            baseImageUrl: activeNode.url, 
            maskUrl: maskData,
            targetNodeId, 
            intent 
          }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? `Server error ${res.status}`);

        if (intent === "tweak") {
          updateNodeImage(targetNodeId, json.url);
          assistantContent = `Done — image refined in-place.`;
        } else {
          updateNode(newNodeId!, { url: json.url });
          assistantContent = `New variation created.`;
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        assistantContent = `Error: ${msg}`;
      } finally {
        setGeneratingNodeId(null);
      }
    } else {
      assistantContent = "Select an image on the canvas to apply your edit.";
    }

    addMessage({ role: "assistant", content: assistantContent });

    setIsGenerating(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSend();
  }

  return (
    <aside className="w-full md:w-[400px] border-l border-primary/10 bg-background-light flex flex-col z-50 shrink-0 h-[50vh] md:h-auto transition-all duration-300">
      {/* Top Utility Row */}
      <div className="px-6 py-4 border-b border-primary/5 flex items-center justify-between bg-background-light/50 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-primary/20 animate-pulse" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-primary/40">Agent Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-xs font-bold text-primary/40 hover:text-primary transition-colors uppercase tracking-tight">Share</button>
          <button className="text-xs font-bold text-primary/40 hover:text-primary transition-colors uppercase tracking-tight">Export</button>
          <div className="w-6 h-6 rounded-full bg-neutral-gray flex items-center justify-center text-[10px] font-bold text-primary/60 border border-primary/5">
            JD
          </div>
        </div>
      </div>

      {/* Feed Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-primary/40 text-center mt-10">
            Describe your design to get started.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1`}
          >
            {/* Context image thumbnails */}
            {msg.contextImages && msg.contextImages.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end mb-1">
                {msg.contextImages.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt="context"
                    className="w-12 h-12 rounded-lg object-cover border border-primary/10"
                  />
                ))}
              </div>
            )}

            <div
              className={`p-4 rounded-lg max-w-[90%] text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-neutral-gray"
                  : "border border-primary/10"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Thinking block */}
        {isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 animate-pulse" />
              <p className="text-xs font-bold uppercase tracking-widest">AI Agent is thinking...</p>
            </div>
            <div className="border border-primary/10 p-4 rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Processing request</p>
              </div>
              <p className="text-xs text-primary/40 leading-relaxed italic">
                Analyzing your prompt and spatial constraints...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Active context indicator */}
      {activeNode && (
        <div className="px-6 pt-2 space-y-2">
          <div className="flex items-center justify-between bg-neutral-gray rounded-lg px-3 py-2 border border-primary/5">
            <div className="flex items-center gap-2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeNode.url}
                alt="context"
                className="w-7 h-7 rounded object-cover shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60 truncate">Target Node</span>
                <span className="text-[9px] text-primary/40 truncate">
                  {contextualNodes.length > 0 ? `+ ${contextualNodes.length} connected sources` : 'No secondary context'}
                </span>
              </div>
            </div>
            {getMaskData(activeNode.id) && (
              <button 
                onClick={() => useAppStore.getState().clearMask(activeNode.id)}
                className="text-[9px] font-bold uppercase tracking-widest bg-black text-white px-2 py-1 rounded hover:bg-black/80 transition-colors"
                title="Clear Mask"
              >
                Clear Mask
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-6 border-t border-primary/10 bg-background-light">
        <div className="relative flex items-center gap-2 bg-neutral-gray rounded-full p-2 border border-primary/5 focus-within:border-primary/20 transition-all">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-primary/5 transition-colors shrink-0">
            <Plus className="w-5 h-5" />
          </button>
          <input
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-primary/40 outline-none"
            placeholder="Type your prompt..."
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="bg-primary text-background-light px-5 py-2.5 rounded-full text-sm font-bold hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ideate
          </button>
        </div>
      </div>
    </aside>
  );
}
