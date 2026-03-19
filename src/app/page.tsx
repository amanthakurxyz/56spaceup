"use client";

import { useEffect, useState } from "react";
import { insforge } from "@/utils/insforge/client";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgentPanel } from "@/components/layout/AgentPanel";
import { MobileNav } from "@/components/layout/MobileNav";
import { CanvasWrapper } from "@/components/Canvas/CanvasWrapper";
import { useAppStore } from "@/store/useAppStore";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setLoading(false);
      return;
    }
    insforge.auth.getCurrentSession().then(({ data }) => {
      if (!data?.session) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background-light text-primary font-medium tracking-tight">Loading...</div>;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-light">
      {/* Sidebar - Navigation & Branding */}
      <Sidebar />

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Canvas Area (Infinite Grid) - Fills remaining space */}
        <CanvasWrapper />

        {/* Agent Panel (Conversational Interface) - Right Aligned */}
        <AgentPanel />
      </main>

      {/* Mobile Component - Simplified for speed */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}
