import { Plus, ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function Sidebar() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  if (sidebarCollapsed) {
    return (
      <aside className="hidden md:flex w-[60px] flex-col border-r border-primary/10 bg-background-light p-4 items-center gap-6 shrink-0 z-50 transition-all duration-300">
        <button onClick={toggleSidebar} className="p-2 hover:bg-neutral-gray rounded-lg transition-colors">
          <PanelLeftOpen className="w-5 h-5 text-primary/60" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="hidden md:flex w-[260px] flex-col border-r border-primary/10 bg-background-light overflow-y-auto shrink-0 z-50 transition-all duration-300">
      <div className="p-6 h-full flex flex-col">
        {/* Branding & Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1 font-bold text-xl tracking-tighter cursor-default">
            <span className="text-neutral-grey">Space</span>
            <span className="text-black">Up</span>
          </div>
          <button onClick={toggleSidebar} className="p-2 hover:bg-neutral-gray rounded-lg transition-colors">
            <PanelLeftClose className="w-5 h-5 text-primary/60" />
          </button>
        </div>

        <button className="w-full flex items-center gap-2 border border-primary/10 bg-neutral-gray px-4 py-2.5 rounded-xl font-medium hover:bg-neutral-gray/50 transition-colors mb-8">
          <Plus className="w-4 h-4" />
          <span className="text-sm">New project</span>
        </button>
        
        <div className="space-y-6 flex-1">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary/30">History</p>
            <nav className="space-y-1">
              <a className="block px-3 py-2.5 text-sm rounded-lg hover:bg-neutral-gray/40 transition-colors text-primary/70" href="#">Modern Loft Layout</a>
              <a className="block px-3 py-2.5 text-sm rounded-lg hover:bg-neutral-gray/40 transition-colors text-primary/70" href="#">Studio Apartment Render</a>
            </nav>
          </div>
          
          <details className="group" open>
            <summary className="flex items-center justify-between cursor-pointer list-none py-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary/30">Workspaces</p>
              <ChevronDown className="w-4 h-4 text-primary/30 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="mt-2 space-y-1 pl-2">
              <p className="text-sm py-2 px-3 border-l border-primary/10 text-primary/60 hover:text-primary cursor-pointer">Project Alpha</p>
              <p className="text-sm py-2 px-3 border-l border-primary/10 text-primary/60 hover:text-primary cursor-pointer">Project Beta</p>
            </div>
          </details>
        </div>
        
        <div className="mt-auto pt-6 border-t border-primary/10 space-y-3">
          <a className="block text-xs text-primary/40 hover:text-primary transition-colors" href="#">Settings</a>
          <a className="block text-xs text-primary/40 hover:text-primary transition-colors" href="#">Support</a>
        </div>
      </div>
    </aside>
  );
}
