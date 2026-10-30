"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Sparkles, User, MessageCircle, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

export function BottomNav() {
  const pathname = usePathname() || "/";
  const { t } = useTranslation();

  const TABS = [
    { label: "Home", href: "/", icon: Home },
    { label: "Counselor", href: "/job-adviser", icon: BrainCircuit },
    { label: "Jobs", href: "/jobs", icon: Briefcase, isCenter: true },
    { label: "Bot", href: "/simulator", icon: MessageCircle },
    { label: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-2xl border-t pb-safe-area-inset-bottom shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] font-mukta md:hidden">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {TABS.map((tab) => {
          const isActive = tab.href === "/" 
            ? pathname === "/" 
            : pathname.startsWith(tab.href);

          if (tab.isCenter) {
            return (
              <Link 
                key={tab.href} 
                href={tab.href}
                className="flex flex-col items-center justify-center -mt-8 relative z-10 active:scale-95 transition-all duration-300"
              >
                <div className={cn(
                  "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl border-4 border-white transition-all duration-500",
                  isActive 
                    ? "bg-primary text-white scale-110 shadow-primary/40 rotate-0" 
                    : "bg-[#003366] text-white shadow-blue-900/40 hover:bg-[#002244]"
                )}>
                  <tab.icon className={cn("h-6 w-6", isActive ? "animate-pulse" : "")} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest mt-1.5 transition-all",
                  isActive ? "text-primary opacity-100" : "text-slate-800 opacity-90"
                )}>
                  {tab.label}
                </span>
              </Link>
            )
          }

          return (
            <Link 
              key={tab.href} 
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all active:scale-90 relative",
                isActive ? "text-primary" : "text-slate-500"
              )}
            >
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#F58220] rounded-b-full shadow-lg shadow-orange-500/40 animate-in fade-in duration-500" />
              )}
              <div className={cn(
                "p-1.5 rounded-[14px] transition-all duration-500",
                isActive ? "bg-primary/10" : "bg-transparent"
              )}>
                <tab.icon className={cn(
                  "h-4.5 w-4.5 transition-all duration-500", 
                  isActive ? "stroke-[2.5px] scale-110" : "stroke-[2px] text-slate-600"
                )} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-wider transition-all duration-500",
                isActive ? "opacity-100 scale-100" : "opacity-80 text-slate-700 scale-95"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
