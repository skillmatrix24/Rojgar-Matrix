"use client"

import { useFirestore, useCollection, useMemoFirebase, useDoc, useUser } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { usePathname } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, X, Copy, Check, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const THEME_CLASSES: Record<string, string> = {
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  green: "bg-green-600",
  orange: "bg-orange-600",
  dark: "bg-slate-900"
};

/**
 * @fileOverview Dynamic banner component that displays active marketing offers.
 * Automatically filters offers based on the current page path and user role.
 * Includes scheduling logic (expiry date check) and coupon code support.
 */
export function OfferBanner() {
  const db = useFirestore();
  const { user } = useUser();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch current user profile to determine role for dashboard targeting
  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // Identify the target page key from pathname
  const getPageKey = () => {
    if (pathname === "/") return "home";
    if (pathname?.startsWith("/jobs")) return "jobs";
    if (pathname?.startsWith("/pricing")) return "pricing";
    if (pathname?.startsWith("/profile")) return "profile";
    
    if (pathname?.startsWith("/dashboard")) {
      if (profile?.role === 'employer') return "employer_dashboard";
      return "seeker_dashboard";
    }
    
    return "all";
  };

  const pageKey = getPageKey();

  const offersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "offers"),
      where("isActive", "==", true),
      orderBy("createdAt", "desc")
    );
  }, [db]);

  const { data: allOffers, isLoading } = useCollection(offersQuery);

  const activeOffer = allOffers?.find(o => {
    const matchesPage = o.targetPage === pageKey || o.targetPage === "all";
    if (!matchesPage) return false;

    if (o.expiryDate) {
      const expiry = new Date(o.expiryDate).getTime();
      const now = Date.now();
      if (now > expiry) return false;
    }

    return true;
  });

  const handleCopy = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Code Copied!", description: `Coupon ${code} is ready to use.` });
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !activeOffer || !isVisible) return null;

  const themeClass = THEME_CLASSES[activeOffer.theme] || "bg-primary";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 animate-in fade-in slide-in-from-top-4 duration-700 print:hidden">
      <Card className={cn(
        "border-none shadow-2xl rounded-[32px] overflow-hidden text-white relative group",
        themeClass
      )}>
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
          <Sparkles className="h-24 w-24" />
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-20"
        >
          <X className="h-4 w-4" />
        </button>

        <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 text-center md:text-left flex-1">
            <div className="flex flex-col md:flex-row items-center gap-4">
               {activeOffer.badgeText && (
                 <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1 h-7">
                   {activeOffer.badgeText}
                 </Badge>
               )}
               {activeOffer.couponCode && (
                 <div 
                   onClick={(e) => handleCopy(e, activeOffer.couponCode)}
                   className="bg-yellow-400 hover:bg-yellow-500 text-black border-2 border-dashed border-black/10 px-4 py-1.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all active:scale-95 shadow-lg group/coupon animate-pulse hover:animate-none"
                 >
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 font-black" />
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-60">Code:</span>
                    </div>
                    <span className="text-sm md:text-lg font-mono font-black tracking-widest">{activeOffer.couponCode}</span>
                    {copied ? <Check className="h-4 w-4 text-green-700" /> : <Copy className="h-4 w-4 opacity-40 group-hover/coupon:opacity-100" />}
                 </div>
               )}
            </div>
            <h2 className="text-3xl md:text-4xl font-black leading-tight tracking-tight">
              {activeOffer.title}
            </h2>
            <p className="text-sm md:text-lg font-medium text-white/80 max-w-xl italic">
              "{activeOffer.subtitle}"
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link href={activeOffer.buttonLink || "/pricing"}>
              <Button 
                variant="secondary" 
                className="w-full md:w-auto h-14 px-10 text-lg font-black rounded-2xl bg-white text-slate-900 gap-3 group hover:scale-[1.02] transition-all shadow-xl"
              >
                {activeOffer.buttonText || "Claim Now"} 
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}