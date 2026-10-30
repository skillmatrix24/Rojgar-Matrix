"use client"

import Link from "next/link";
import Image from "next/image";
import { Briefcase, Bell, Menu, LogIn, LayoutDashboard, Search, MessageCircle, Tag, BrainCircuit, MessageSquare, Sparkles, UserCircle, PlusCircle, User, LogOut, ShieldCheck, FileText } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { useUser, useDoc, useMemoFirebase, useFirestore, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export function AppHeader() {
  const { t, lang, setLang } = useTranslation();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [imgError, setImgError] = useState(false);
  const [cachedBranding, setCachedBranding] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(profileRef);

  const brandingRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "branding");
  }, [db]);
  const { data: liveBranding } = useDoc(brandingRef);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rozgarmatrix_branding');
      if (saved) {
        try { setCachedBranding(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, []);

  const displayBranding = liveBranding || cachedBranding;
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'logo-main');
  const logoUrl = displayBranding?.headerLogoUrl || defaultLogo?.imageUrl || "";

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsOpen(false);
      toast({ title: "Logged Out" });
    } catch (e) {
      toast({ variant: "destructive", title: "Logout failed" });
    }
  };

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const MobileNavLink = ({ href, icon: Icon, label, sublabel, color }: any) => (
    <Link 
      href={href} 
      onClick={() => setIsOpen(false)}
      className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all active:scale-[0.98] group"
    >
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", color || "bg-primary/10 text-primary")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold group-hover:text-primary transition-colors">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest leading-none mt-1">{sublabel}</p>}
      </div>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between shadow-sm font-mukta">
      <div className="flex items-center gap-3">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-muted/50 border active:scale-90">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85%] p-0 flex flex-col">
            <SheetHeader className="p-6 border-b text-left shrink-0">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  RozgarMatrix
                </SheetTitle>
                <div onClick={toggleLanguage} className="flex items-center bg-muted rounded-full p-0.5 cursor-pointer">
                  <span className={cn("px-2.5 py-1 text-[8px] font-black rounded-full transition-all", lang === 'en' ? "bg-white shadow-sm" : "")}>EN</span>
                  <span className={cn("px-2.5 py-1 text-[8px] font-black rounded-full transition-all", lang === 'hi' ? "bg-white shadow-sm" : "")}>हिंदी</span>
                </div>
              </div>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {user && (
                  <div className="bg-primary/5 rounded-[24px] p-5 border border-primary/10 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-muted relative">
                        {profile?.photoUrl ? <Image src={profile.photoUrl} alt="User" fill className="object-cover" /> : <UserCircle className="h-full w-full text-muted-foreground/30" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-sm truncate">{profile?.firstName || "User"}</p>
                        <p className="text-[9px] font-black uppercase text-primary tracking-widest">{profile?.credits || 0} Credits</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild variant="outline" size="sm" className="h-9 font-black text-[10px] rounded-xl" onClick={() => setIsOpen(false)}>
                        <Link href="/profile">Profile</Link>
                      </Button>
                      <Button asChild variant="default" size="sm" className="h-9 font-black text-[10px] rounded-xl" onClick={() => setIsOpen(false)}>
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                    </div>
                  </div>
                )}

                {profile?.role === 'admin' && (
                   <div className="space-y-3">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-primary px-1">Management</h4>
                      <MobileNavLink href="/admin" icon={ShieldCheck} label="Admin Console" sublabel="Control Panel" color="bg-primary text-white" />
                   </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Marketplace</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <MobileNavLink href="/" icon={Briefcase} label={t('home')} sublabel="Start" />
                    <MobileNavLink href="/jobs" icon={Search} label={t('jobs')} sublabel="Browse" />
                    <MobileNavLink href="/post-job" icon={PlusCircle} label={t('post_job')} sublabel="For Employers" color="bg-orange-100 text-orange-600" />
                    <MobileNavLink href="/simulator" icon={MessageCircle} label={t('demo')} sublabel="Instant Matches" color="bg-green-100 text-green-600" />
                    <MobileNavLink href="/pricing" icon={Tag} label="Plans" sublabel="Top Offers" color="bg-blue-100 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">AI Smart Features</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <MobileNavLink href="/profile?tab=resume" icon={FileText} label="AI Resume Builder" sublabel="Create PDF" color="bg-purple-100 text-purple-600" />
                    <MobileNavLink href="/job-adviser" icon={BrainCircuit} label="AI Counselor" sublabel="Career Strategy" color="bg-[#003366] text-white" />
                    <MobileNavLink href="/interview-coach" icon={MessageSquare} label="Coach" sublabel="Practice" color="bg-orange-100 text-orange-600" />
                    <MobileNavLink href="/ai-match" icon={Sparkles} label="AI Discovery" sublabel="Jobs & Business" color="bg-accent/10 text-accent" />
                  </div>
                </div>

                {user && (
                  <Button variant="ghost" className="w-full justify-start gap-4 p-4 h-auto rounded-2xl text-red-500 hover:bg-red-50" onClick={handleLogout}>
                    <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-sm">Logout</span>
                  </Button>
                )}
              </div>
            </div>

            {!user && (
              <div className="p-6 border-t bg-muted/20">
                <Button asChild className="w-full h-12 font-black text-sm rounded-xl" onClick={() => setIsOpen(false)}>
                  <Link href="/login" className="gap-2">
                    <LogIn className="h-5 w-5" />
                    {t('login')}
                  </Link>
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
        
        <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
          {logoUrl && !imgError ? (
            <div className="relative h-10 w-[140px]">
              <Image 
                src={logoUrl} 
                alt="RozgarMatrix" 
                fill
                className="object-contain object-left"
                priority
                unoptimized
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <span className="font-extrabold text-lg tracking-tighter">
              <span className="text-primary">RM</span>
            </span>
          )}
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {profile?.credits !== undefined && (
          <Link href="/profile?tab=wallet">
            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold h-8 gap-1 px-3">
              {profile.credits} 🪙
            </Badge>
          </Link>
        )}
        <button className="h-10 w-10 rounded-full bg-muted flex items-center justify-center relative active:bg-muted/80">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-destructive rounded-full border-2 border-background animate-pulse"></span>
        </button>
      </div>
    </header>
  );
}
