import React from "react";
import { Metadata } from "next";
import { AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Concept Preview | Sky's the Limit Signature Design Lab",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DesignLabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Discreet Concept Banner */}
      <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-md px-4 py-2 text-xs flex items-center justify-between text-amber-300">
        <div className="flex items-center gap-2 font-mono">
          <AlertCircle className="size-3.5 text-amber-400 shrink-0" />
          <span>Concept Preview — Source verification pending for candidate assets</span>
        </div>
        <span className="font-mono text-[10px] opacity-75 uppercase tracking-wider">
          Internal Vercel Preview Lab
        </span>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
