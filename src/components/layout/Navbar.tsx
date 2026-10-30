"use client"

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Menu, 
  PlusCircle, 
  ShieldCheck, 
  Briefcase,
  Search,
  ChevronRight,
  UserCircle,
  Tag,
  FileText,
  BrainCircuit,
  MessageSquare,
  Zap,
  LogIn,
  LayoutDashboard,
  MessageCircle,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [cachedBranding, setCachedBranding] = useState<any>(null);
  const [hasMounted, setHasMounted] = useState(false);
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { t, lang, setLang } = useTranslation();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  const brandingRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "branding");
  }, [db]);
  const { data: liveBranding } = useDoc(brandingRef);

  useEffect(() => {
    setHasMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rojgarmatrix_branding');
        if (saved) {
          setCachedBranding(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Navbar branding load error:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (liveBranding) {
      setCachedBranding(liveBranding);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('rojgarmatrix_branding', JSON.stringify(liveBranding));
        } catch (e) {
          console.error("Navbar branding save error:", e);
        }
      }
    }
  }, [liveBranding]);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  const userPhoto = profile?.photoUrl;
  const displayBranding = liveBranding || cachedBranding;
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'logo-main');
  const logoUrl = displayBranding?.headerLogoUrl || defaultLogo?.imageUrl || "";

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const NavLink = ({ href, children, highlight, badge }: any) => (
    <Link 
      href={href} 
      className={cn(
        "relative text-sm font-bold transition-all duration-200 py-2 group flex items-center gap-1.5",
        highlight ? "text-primary hover:text-primary/80" : "text-slate-600 hover:text-primary"
      )}
    >
      {children}
      {badge && (
        <span className="bg-primary/10 text-primary text-[8px] font-black px-1.5 rounded-full uppercase leading-none py-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
          {badge}
        </span>
      )}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );

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
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md px-4 shadow-sm" suppressHydrationWarning>
      <div className="container mx-auto max-w-7xl h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-6 lg:gap-10">
          <Link href="/" className="flex items-center gap-2 group shrink-0 transition-transform active:scale-95">
            {logoUrl && !imgError ? (
              <div className="relative h-10 md:h-12 w-[140px] md:w-[180px]">
                <Image 
                  src={logoUrl} 
                  alt="Rojgar Matrix" 
                  fill
                  className="object-contain object-left group-hover:scale-[1.02] transition-transform duration-300"
                  priority
                  unoptimized
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <span className="font-black text-xl tracking-tighter">
                  <span className="text-[#F58220]">Rojgar</span><span className="text-[#003366]"> Matrix</span>
                </span>
              </div>
            )}
          </Link>
          
          <div className="hidden lg:flex items-center gap-x-6">
            <NavLink href="/">{t('home')}</NavLink>
            <NavLink href="/jobs">{t('jobs')}</NavLink>
            <NavLink href="/simulator" highlight>{t('demo')}</NavLink>
            <NavLink href="/pricing">Plans</NavLink>
            <NavLink href="/profile?tab=resume">Builder</NavLink>
            <NavLink href="/interview-coach">Coach</NavLink>
            <NavLink href="/job-adviser" badge="AI">Counselor</NavLink>
            <NavLink href="/ai-match">Discovery</NavLink>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-5">
          <div 
            onClick={toggleLanguage}
            className="hidden md:flex items-center bg-muted/50 border rounded-full px-1 py-1 cursor-pointer transition-all hover:border-primary/30 group"
          >
            <span className={cn(
              "px-3 py-1 text-[10px] font-black rounded-full transition-all uppercase",
              lang === 'en' ? "bg-primary text-white shadow-sm" : "text-muted-foreground group-hover:text-primary"
            )}>
              EN
            </span>
            <span className={cn(
              "px-3 py-1 text-[10px] font-black rounded-full transition-all uppercase",
              lang === 'hi' ? "bg-primary text-white shadow-sm" : "text-muted-foreground group-hover:text-primary"
            )}>
              हिंदी
            </span>
          </div>

          {hasMounted && !isUserLoading && !user ? (
            <Link href="/login" className="hidden md:block">
              <Button variant="default" className="font-black px-6 h-10 text-xs rounded-full shadow-lg shadow-primary/15 transition-all">
                {t('login')}
              </Button>
            </Link>
          ) : hasMounted && user ? (
            <div className="hidden md:flex items-center gap-4">
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="h-10 px-4 font-black text-[10px] uppercase gap-2 border-primary/20 text-primary rounded-full hover:bg-primary/5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/dashboard" className="hidden xl:block">
                <Button variant="ghost" className="h-10 px-4 font-black text-xs gap-2 rounded-full text-slate-700 hover:text-primary">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('dashboard')}
                </Button>
              </Link>
              <Link href="/post-job">
                <Button className="h-10 px-6 font-black text-xs gap-2 rounded-full shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <PlusCircle className="h-4 w-4" />
                  {t('post_job')}
                </Button>
              </Link>
              <Link href="/profile">
                <div className="rounded-full border-2 border-primary/20 hover:border-primary hover:scale-110 transition-all duration-300 overflow-hidden h-10 w-10 bg-muted cursor-pointer shadow-sm">
                  {userPhoto ? (
                    <Image 
                      src={userPhoto} 
                      alt="Profile" 
                      width={40} 
                      height={40} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
              </Link>
            </div>
          ) : null}

          <div className="lg:hidden flex items-center">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl border bg-background/50 hover:bg-muted active:scale-90 transition-all"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[380px] p-0 flex flex-col">
                <SheetHeader className="p-6 border-b text-left shrink-0">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Briefcase className="h-5 w-5 text-white" />
                      </div>
                      Rojgar Matrix
                    </SheetTitle>
                    <div 
                      onClick={toggleLanguage}
                      className="flex items-center bg-muted rounded-full p-0.5 cursor-pointer"
                    >
                      <span className={cn("px-2.5 py-1 text-[8px] font-black rounded-full transition-all", lang === 'en' ? "bg-white shadow-sm" : "")}>EN</span>
                      <span className={cn("px-2.5 py-1 text-[8px] font-black rounded-full transition-all", lang === 'hi' ? "bg-white shadow-sm" : "")}>हिंदी</span>
                    </div>
                  </div>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {hasMounted && user && (
                      <div className="bg-primary/5 rounded-[24px] p-5 border border-primary/10 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full border-2 border-white shadow-md overflow-hidden bg-muted relative">
                            {userPhoto ? <Image src={userPhoto} alt="User" width={56} height={56} className="object-cover h-full w-full" /> : <UserCircle className="h-full w-full text-muted-foreground/30" />}
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

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Marketplace</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <MobileNavLink href="/" icon={Briefcase} label={t('home')} sublabel="Start" />
                        <MobileNavLink href="/jobs" icon={Search} label={t('jobs')} sublabel="Browse" />
                        <MobileNavLink href="/post-job" icon={PlusCircle} label={t('post_job')} sublabel="For Employers" color="bg-orange-100 text-orange-600" />
                        <MobileNavLink href="/simulator" icon={MessageCircle} label={t('demo')} sublabel="Instant Matches" color="bg-green-100 text-green-600" />
                        <MobileNavLink href="/pricing" icon={Tag} label="Plans" sublabel="Top Offers" color="bg-blue-100 text-blue-600" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">AI Smart Features</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <MobileNavLink href="/profile?tab=resume" icon={FileText} label="AI Resume Builder" sublabel="Create PDF" color="bg-purple-100 text-purple-600" />
                        <MobileNavLink href="/job-adviser" icon={BrainCircuit} label="AI Counselor" sublabel="Career Strategy" color="bg-[#003366] text-white" />
                        <MobileNavLink href="/interview-coach" icon={MessageSquare} label="Coach" sublabel="Practice" color="bg-orange-100 text-orange-600" />
                        <MobileNavLink href="/ai-match" icon={Sparkles} label="AI Discovery" sublabel="Jobs & Business" color="bg-accent/10 text-accent" />
                      </div>
                    </div>
                  </div>
                </div>

                {hasMounted && !user && (
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
          </div>
        </div>
      </div>
    </nav>
  );
}