"use client";

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Trash2, Copy, X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface NodeContextMenuProps {
  nodeId: string;
  getScreenPos: (x: number, y: number) => { x: number, y: number };
  zoomLevel: number;
}

export function NodeContextMenu({ nodeId, getScreenPos, zoomLevel }: NodeContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteNode = useAppStore((state) => state.deleteNode);
  const duplicateNode = useAppStore((state) => state.duplicateNode);
  const nodes = useAppStore((state) => state.nodes);
  
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return null;

  // Calculate screen position for the top-right corner
  const pos = getScreenPos(node.x + node.width, node.y);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNode(nodeId);
    setIsOpen(false);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateNode(nodeId);
    setIsOpen(false);
  };

  return (
    <div 
      ref={menuRef}
      className="absolute z-50 pointer-events-auto"
      style={{ 
        left: `${pos.x}px`, 
        top: `${pos.y}px`,
        transform: 'translate(-100%, 0)' // Position inside the node bounds
      }}
    >
      {/* 3 Dots Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-center w-8 h-8 bg-black/80 hover:bg-black text-white rounded-bl-xl transition-colors shadow-lg border-l border-b border-white/10"
        title="Options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-9 right-0 bg-black border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px] animate-in fade-in zoom-in duration-100 origin-top-right">
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-widest text-left"
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate
          </button>
          <div className="h-px bg-white/5" />
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors uppercase tracking-widest text-left"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
