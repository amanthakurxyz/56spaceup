import { Home, MessageSquare, LayoutGrid, User } from "lucide-react";

export function MobileNav() {
  return (
    <nav className="md:hidden flex border-t border-primary/10 bg-background-light px-4 py-2 justify-around shrink-0 z-50">
      <a className="p-2 text-primary hover:bg-neutral-gray rounded-lg transition-colors" href="#">
        <Home className="w-6 h-6" />
      </a>
      <a className="p-2 text-primary/40 hover:text-primary hover:bg-neutral-gray rounded-lg transition-colors" href="#">
        <MessageSquare className="w-6 h-6" />
      </a>
      <a className="p-2 text-primary/40 hover:text-primary hover:bg-neutral-gray rounded-lg transition-colors" href="#">
        <LayoutGrid className="w-6 h-6" />
      </a>
      <a className="p-2 text-primary/40 hover:text-primary hover:bg-neutral-gray rounded-lg transition-colors" href="#">
        <User className="w-6 h-6" />
      </a>
    </nav>
  );
}
