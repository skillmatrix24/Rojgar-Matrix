"use client"

import { useState, useEffect, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { OfferBanner } from "@/components/layout/OfferBanner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, 
  FileText,
  Loader2,
  Sparkles,
  ChevronRight,
  Wallet,
  History,
  CreditCard,
  Crown,
  Settings,
  ArrowRight,
  Zap,
  ShieldCheck,
  Smartphone,
  LogOut,
  AlertCircle,
  ExternalLink,
  BellRing,
  Timer,
  Settings2,
  Target,
  BrainCircuit,
  MessageCircle,
  Wand2,
  CheckCircle2,
  MessageSquare,
  Building2,
  Trash2,
  Gift,
  Share2
} from "lucide-react";
import Image from "next/image";
import { useUser, useDoc, useMemoFirebase, useFirestore, useAuth } from "@/firebase";
import { doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ProfessionalCV } from "@/components/profile/ProfessionalCV";
import { EmployerProfile } from "@/components/profile/EmployerProfile";
import { ResumeBuilder } from "@/components/profile/ResumeBuilder";
import { WalletTab } from "@/components/profile/WalletTab";
import { ReferralTab } from "@/components/profile/ReferralTab";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

function ProfileContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"profile" | "resume" | "wallet" | "referrals">("profile");
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (tabParam === 'resume') setActiveTab('resume');
    if (tabParam === 'wallet') setActiveTab('wallet');
    if (tabParam === 'profile') setActiveTab('profile');
    if (tabParam === 'referrals') setActiveTab('referrals');
  }, [tabParam]);

  useEffect(() => {
    if (profile && profile.role === 'jobSeeker' && profile.agreedToTerms === true) {
      if (profile.firstName === "New" || !profile.skills?.length || !profile.experience) {
        const hasShown = localStorage.getItem(`has_shown_complete_popup_${user?.uid}`);
        if (!hasShown) {
          setShowCompletePopup(true);
          localStorage.setItem(`has_shown_complete_popup_${user?.uid}`, "true");
        }
      }
    }
  }, [profile, user?.uid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out" });
    } catch (error) {
      console.error("Profile logout error:", error);
      toast({ variant: "destructive", title: "Logout failed" });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !db || !userProfileRef) return;
    setIsDeleting(true);
    try {
      await deleteDoc(userProfileRef);
      await deleteUser(user);
      toast({ title: "Account Deleted", description: "Your data has been permanently removed." });
      router.push('/');
    } catch (error: any) {
      console.error("Account deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast({ variant: "destructive", title: "Security Check", description: "Please re-login and try again to delete your account." });
      } else {
        toast({ variant: "destructive", title: "Deletion Failed" });
      }
    } finally {
      setIsDeleting(false);
      setShowDeletePopup(false);
    }
  };

  const handleToggleService = async (serviceKey: string, currentValue: boolean) => {
    if (!userProfileRef) return;
    try {
      await updateDoc(userProfileRef, {
        [`services.${serviceKey}`]: !currentValue,
        updatedAt: serverTimestamp()
      });
      toast({ 
        title: !currentValue ? "Service Activated" : "Service Paused",
        description: `Preferences for ${serviceKey.replace(/([A-Z])/g, ' $1')} updated.`
      });
    } catch (e) {
      console.error("Profile toggle service error:", e);
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  if (isUserLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Authenticating</p>
      </div>
    );
  }

  if (isProfileLoading && !profile && user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-widest opacity-40">Syncing Profile</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/20">
          <Card className="max-w-md p-8 text-center border-none shadow-xl rounded-[40px]">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
               <UserIcon className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-4">{t('login_required')}</h1>
            <p className="text-muted-foreground mb-8 font-medium">Please login to manage your professional profile and resume.</p>
            <Link href="/login" className="w-full">
              <Button size="lg" className="w-full font-bold h-14 rounded-2xl shadow-lg shadow-primary/20">Login to RozgarMatrix</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  const isEmployer = profile?.role === 'employer';

  const SEEKER_SERVICES = [
    { key: 'whatsappJobAlerts', label: 'Priority WhatsApp Alerts', cost: '1 Credit/Msg', icon: MessageCircle, desc: 'Receive instant notifications for matching jobs before anyone else.', link: '/jobs' },
    { key: 'aiSmartMatch', label: 'AI Semantic Matching', cost: '10 Credits/Use', icon: Target, desc: 'Find hidden jobs that perfectly match your skills and experience contextually.', link: '/ai-match', btnLabel: 'FIND MATCHES' },
    { key: 'interviewCoach', label: 'AI Interview Coach', cost: '20 Credits/Session', icon: BrainCircuit, desc: 'Practice mock interviews with real-time feedback and Hinglish support.', link: '/interview-coach', btnLabel: 'OPEN COACH' },
    { key: 'resumeRefine', label: 'AI Resume Refinement', cost: '5 Credits/Use', icon: Wand2, desc: 'Optimize your resume summary for higher visibility with recruitment AI.', link: '/profile?tab=resume', btnLabel: 'REBUILD CV' }
  ];

  const userPhoto = profile?.photoUrl || `https://picsum.photos/seed/${user.uid}/200/200`;
  const isPriorityActive = (profile?.credits || 0) >= 10;

  return (
    <div className="min-h-screen flex flex-col bg-background print:bg-white pb-safe-area-inset-bottom">
      
      <div className="hidden md:flex flex-col flex-1">
        <div className="print:hidden">
          <Navbar />
          <OfferBanner />
        </div>
        <main className="flex-1 bg-muted/20 print:bg-white">
          <div className="container mx-auto max-w-7xl px-4 py-8 print:p-0 print:max-w-none">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start print:block">
              <aside className="hidden lg:block lg:col-span-3 space-y-6 print:hidden sticky top-24">
                <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
                  <CardContent className="p-0">
                    <div className="p-6 text-center border-b bg-gradient-to-br from-primary/5 to-accent/5">
                      <div className="relative h-20 w-20 mx-auto mb-4 rounded-full border-2 border-card shadow-sm overflow-hidden bg-muted">
                        <Image src={userPhoto} alt="Profile" fill className="object-cover" />
                      </div>
                      <h2 className="text-lg font-bold truncate">{profile?.firstName} {profile?.lastName}</h2>
                      <div className="flex items-center justify-center gap-2 mt-2">
                         {profile?.isPremium && <Badge className="bg-yellow-500 h-5 text-[8px] font-black uppercase"><Crown className="h-2.5 w-2.5 mr-1" /> Premium</Badge>}
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <Button variant={activeTab === 'profile' ? 'secondary' : 'ghost'} className="w-full justify-start gap-3 h-11 text-sm font-bold rounded-lg" onClick={() => setActiveTab('profile')}>
                        {isEmployer ? <Building2 className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                        {isEmployer ? "Hiring Profile" : "Professional CV"}
                      </Button>
                      {!isEmployer && (
                        <Button variant={activeTab === 'resume' ? 'secondary' : 'ghost'} className="w-full justify-start gap-3 h-11 text-sm font-bold rounded-lg" onClick={() => setActiveTab('resume')}>
                          <FileText className="h-4 w-4" /> AI Resume Builder
                        </Button>
                      )}
                      <Button variant={activeTab === 'referrals' ? 'secondary' : 'ghost'} className="w-full justify-start gap-3 h-11 text-sm font-bold rounded-lg text-purple-600 hover:text-purple-700 hover:bg-purple-50" onClick={() => setActiveTab('referrals')}>
                        <Gift className="h-4 w-4" /> Invite & Earn
                        <Badge className="ml-auto bg-purple-600 text-[10px] font-black uppercase">NEW</Badge>
                      </Button>
                      <Button variant={activeTab === 'wallet' ? 'secondary' : 'ghost'} className="w-full justify-start gap-3 h-11 text-sm font-bold rounded-lg" onClick={() => setActiveTab('wallet')}>
                        <Wallet className="h-4 w-4" /> {t('my_wallet')}
                        <Badge variant="outline" className="ml-auto text-[10px] font-black">{profile?.credits || 0}</Badge>
                      </Button>
                      <Button variant="ghost" className="w-full justify-start gap-3 h-11 text-sm font-bold rounded-lg text-destructive hover:bg-destructive/5 hover:text-destructive" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" /> {t('logout')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-[24px] overflow-hidden print:hidden">
                   <CardHeader className="p-4 border-b bg-muted/20">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Safety</CardTitle>
                   </CardHeader>
                   <CardContent className="p-2">
                      <Button variant="ghost" onClick={() => setShowDeletePopup(true)} className="w-full justify-start gap-3 h-11 text-xs font-bold rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600">
                         <Trash2 className="h-4 w-4" /> Delete Account
                      </Button>
                   </CardContent>
                </Card>

                {!isEmployer && (
                  <Card className={cn(
                    "border-none shadow-xl rounded-[32px] overflow-hidden transition-all duration-500",
                    isPriorityActive ? "bg-white border-green-100" : "bg-slate-900 text-white"
                  )}>
                    <CardContent className="p-6 space-y-4">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{t('priority_status_title')}</p>
                          {isPriorityActive ? (
                            <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] gap-1 px-3">
                               <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                               {t('priority_status_active')}
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-500 text-white border-none font-black text-[9px] gap-1 px-3">
                               <div className="h-1.5 w-1.5 rounded-full bg-white/20 animate-pulse" />
                               {t('priority_status_paused')}
                            </Badge>
                          )}
                       </div>
                       <div className="space-y-1">
                          <h4 className={cn("font-black text-sm", !isPriorityActive && "text-white")}>WhatsApp Success Booster</h4>
                          <p className={cn("text-[11px] leading-relaxed", isPriorityActive ? "text-slate-600" : "text-slate-400")}>
                             {t('priority_status_desc')}
                          </p>
                       </div>
                       {!isPriorityActive && (
                         <Link href="/profile?tab=wallet">
                           <Button className="w-full h-10 font-black text-xs gap-2 rounded-xl bg-primary shadow-lg shadow-primary/20">
                              GET PRIORITY <ArrowRight className="h-3 w-3" />
                           </Button>
                         </Link>
                       )}
                    </CardContent>
                  </Card>
                )}
              </aside>

              <div className="lg:col-span-9 print:w-full space-y-8">
                {activeTab === 'profile' && (
                  <>
                    {isEmployer ? (
                      <EmployerProfile profile={profile} userProfileRef={userProfileRef} />
                    ) : (
                      <>
                        <ProfessionalCV profile={profile} userProfileRef={userProfileRef} />
                        <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-gradient-to-br from-orange-50 to-white border-2 border-orange-100 print:hidden">
                           <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                              <div className="flex items-center gap-6">
                                 <div className="h-20 w-20 rounded-[28px] bg-orange-100 flex items-center justify-center shrink-0 shadow-inner">
                                    <BrainCircuit className="h-10 w-10 text-orange-600" />
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">AI Mock Interview Coach</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Build confidence with real-time feedback in Hinglish.</p>
                                    <div className="flex items-center gap-3 pt-2">
                                       <Badge className="bg-orange-600 text-white border-none font-black text-[9px] px-3">20 Credits/Session</Badge>
                                       <span className="text-[10px] font-black uppercase text-orange-700 tracking-widest animate-pulse">Practice Now</span>
                                    </div>
                                 </div>
                              </div>
                              <Link href="/interview-coach">
                                 <Button className="h-14 px-10 rounded-2xl font-black text-lg gap-2 bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/20 active:scale-95 transition-all">
                                    START COACHING <ArrowRight className="h-5 w-5" />
                                 </Button>
                              </Link>
                           </CardContent>
                        </Card>
                        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card print:hidden">
                           <CardHeader className="bg-accent/5 border-b p-8">
                              <div className="flex items-center justify-between">
                                 <div className="space-y-1">
                                    <CardTitle className="text-2xl flex items-center gap-2">
                                       <Settings2 className="h-6 w-6 text-accent" />
                                       Career Success Controls
                                    </CardTitle>
                                    <CardDescription className="text-base">Manage your active AI boosters and notification preferences.</CardDescription>
                                 </div>
                                 <Badge variant="outline" className="h-10 px-6 font-black uppercase text-xs bg-white text-accent border-accent/20">
                                    {profile?.credits || 0} Credits
                                 </Badge>
                              </div>
                           </CardHeader>
                           <CardContent className="p-0">
                              <div className="divide-y">
                                 {SEEKER_SERVICES.map((service) => {
                                    const isActive = profile?.services?.[service.key] ?? true;
                                    return (
                                      <div key={service.key} className="p-8 flex items-center gap-6 hover:bg-muted/30 transition-colors">
                                         <div className={cn(
                                           "h-14 w-14 rounded-[20px] flex items-center justify-center shrink-0 shadow-sm",
                                           isActive ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                                         )}>
                                            <service.icon className="h-7 w-7" />
                                         </div>
                                         <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                               <h4 className="font-black text-lg">{service.label}</h4>
                                               <Badge variant="secondary" className="text-[10px] h-5 px-3 font-black uppercase bg-accent/5 text-accent border-none">{service.cost}</Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">{service.desc}</p>
                                         </div>
                                         <div className="flex flex-col items-end gap-3 min-w-[120px]">
                                            <div className="flex items-center gap-3">
                                               <span className={cn("text-[10px] font-black uppercase tracking-widest", isActive ? "text-green-600" : "text-slate-400")}>
                                                  {isActive ? "ACTIVE" : "PAUSED"}
                                               </span>
                                               <Switch 
                                                 checked={isActive} 
                                                 onCheckedChange={() => handleToggleService(service.key, isActive)}
                                                 className="data-[state=checked]:bg-green-500"
                                               />
                                            </div>
                                            {service.btnLabel && (
                                              <Link href={service.link}>
                                                <Button variant="outline" size="sm" className="h-8 text-[10px] font-black border-primary/20 text-primary hover:bg-primary hover:text-white rounded-full px-4 transition-all active:scale-95">
                                                  {service.btnLabel}
                                                </Button>
                                              </Link>
                                            )}
                                         </div>
                                      </div>
                                    )
                                 })}
                              </div>
                           </CardContent>
                           <CardFooter className="bg-muted/10 p-6 border-t flex justify-center">
                              <p className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                 <CheckCircle2 className="h-4 w-4 text-green-500" />
                                 Settings sync instantly with our Meta Cloud API and AI Engine.
                              </p>
                           </CardFooter>
                        </Card>
                      </>
                    )}
                  </>
                )}
                {activeTab === 'resume' && !isEmployer && <ResumeBuilder profile={profile} userProfileRef={userProfileRef} />}
                {activeTab === 'wallet' && <WalletTab profile={profile} />}
                {activeTab === 'referrals' && <ReferralTab profile={profile} />}
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="md:hidden flex flex-col flex-1 pb-10 print:bg-white">
        <div className="print:hidden">
          <AppHeader />
          <OfferBanner />
        </div>
        <main className="flex-1 px-4 py-6 space-y-6 print:p-0 print:bg-white">
           <div className="flex items-center gap-4 bg-card p-5 rounded-[32px] shadow-sm border border-border/40 print:hidden">
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20 shrink-0 bg-muted shadow-sm">
                <Image src={userPhoto} alt="Profile" fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate leading-tight text-slate-900">{profile?.firstName} {profile?.lastName}</h2>
                <div className="flex items-center gap-4 mt-1">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                        {profile?.isPremium ? "Premium" : "Standard"}
                      </span>
                   </div>
                   <div className="flex items-center gap-1.5 border-l border-slate-100 pl-4">
                      <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">🪙</div>
                      <div className="flex flex-col leading-none">
                         <span className="text-[10px] font-extrabold text-[#003366]">{profile?.credits || 0}</span>
                         <span className="text-[8px] font-bold text-primary uppercase tracking-tighter">Credits</span>
                      </div>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowDeletePopup(true)} className="h-10 w-10 rounded-xl text-red-400 hover:bg-red-50">
                   <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-12 w-12 rounded-2xl text-red-500 bg-red-50 border border-red-100 active:scale-90 transition-transform">
                   <LogOut className="h-5 w-5" />
                </Button>
              </div>
           </div>

           {!isEmployer && (
             <Card className={cn(
               "border-none shadow-lg rounded-[24px] p-4 flex items-center gap-4 transition-all duration-500 print:hidden",
               isPriorityActive ? "bg-green-50 border-2 border-green-100" : "bg-slate-900 text-white"
             )}>
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                  isPriorityActive ? "bg-green-100" : "bg-white/10"
                )}>
                   <BellRing className={cn("h-6 w-6", isPriorityActive ? "text-green-600" : "text-white")} />
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status</p>
                      {isPriorityActive ? (
                        <span className="text-[9px] font-black text-green-600 uppercase">Priority Active</span>
                      ) : (
                        <span className="text-[9px] font-black text-red-400 uppercase">Priority Paused</span>
                      )}
                   </div>
                   <p className="text-xs font-bold truncate">
                      {isPriorityActive ? "Priority WhatsApp alerts active!" : "Keep 10+ credits for instant alerts."}
                   </p>
                </div>
                {!isPriorityActive && (
                  <Link href="/profile?tab=wallet">
                     <Button size="sm" className="h-9 px-4 rounded-xl font-black text-[10px] bg-primary shadow-lg">
                        RECHARGE
                     </Button>
                  </Link>
                )}
             </Card>
           )}

           <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className={cn(
                "grid w-full h-14 bg-card border-none shadow-md rounded-2xl p-1 mb-6 print:hidden",
                isEmployer ? "grid-cols-2" : "grid-cols-4"
              )}>
                <TabsTrigger value="profile" className="rounded-xl font-bold text-[10px] uppercase gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  {isEmployer ? <Building2 className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                  {isEmployer ? "Hiring" : "CV"}
                </TabsTrigger>
                {!isEmployer && (
                  <TabsTrigger value="resume" className="rounded-xl font-bold text-[10px] uppercase gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                    <FileText className="h-4 w-4" /> Builder
                  </TabsTrigger>
                )}
                <TabsTrigger value="referrals" className="rounded-xl font-bold text-[10px] uppercase gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Gift className="h-4 w-4" /> Share
                </TabsTrigger>
                <TabsTrigger value="wallet" className="rounded-xl font-bold text-[10px] uppercase gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                  <Wallet className="h-4 w-4" /> Wallet
                </TabsTrigger>
              </TabsList>

              <div className="animate-in fade-in duration-500">
                <TabsContent value="profile" className="space-y-6">
                  {isEmployer ? (
                    <EmployerProfile profile={profile} userProfileRef={userProfileRef} />
                  ) : (
                    <>
                      <Link href="/interview-coach" className="print:hidden">
                         <Card className="border-none shadow-lg bg-orange-600 text-white p-5 rounded-[24px] flex items-center justify-between active:scale-95 transition-all">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                                  <BrainCircuit className="h-6 w-6" />
                               </div>
                               <div className="space-y-0.5">
                                  <p className="text-[10px] font-black uppercase opacity-60">Practice Session</p>
                                  <p className="text-sm font-black">AI Mock Interview</p>
                               </div>
                            </div>
                            <ArrowRight className="h-5 w-5" />
                         </Card>
                      </Link>
                      <ProfessionalCV profile={profile} userProfileRef={userProfileRef} />
                      <Card className="border-none shadow-xl rounded-[32px] bg-white overflow-hidden p-6 space-y-6 print:hidden">
                         <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="font-black text-lg">My Services</h3>
                            <Badge variant="outline" className="text-[9px] font-black text-accent border-accent/20">{profile?.credits || 0} Credits</Badge>
                         </div>
                         <div className="space-y-6">
                            {SEEKER_SERVICES.map((service) => {
                               const isActive = profile?.services?.[service.key] ?? true;
                               return (
                                 <div key={service.key} className="flex items-center gap-4">
                                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", isActive ? "bg-accent/10 text-accent" : "bg-muted")}>
                                       <service.icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-xs font-black leading-tight">{service.label}</p>
                                       <p className="text-[8px] font-bold text-muted-foreground uppercase">{service.cost}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <Switch 
                                         checked={isActive} 
                                         onCheckedChange={() => handleToggleService(service.key, isActive)}
                                         className="scale-90"
                                       />
                                       {service.btnLabel && (
                                         <Link href={service.link}>
                                           <Button variant="ghost" size="icon" className="h-8 w-8 text-primary"><ArrowRight className="h-4 w-4" /></Button>
                                         </Link>
                                       )}
                                    </div>
                                 </div>
                               )
                            })}
                         </div>
                      </Card>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="resume">
                  {!isEmployer && <ResumeBuilder profile={profile} userProfileRef={userProfileRef} />}
                </TabsContent>
                <TabsContent value="referrals">
                  <ReferralTab profile={profile} />
                </TabsContent>
                <TabsContent value="wallet">
                  <WalletTab profile={profile} />
                </TabsContent>
              </div>
           </Tabs>
        </main>
      </div>

      <Dialog open={showCompletePopup} onOpenChange={setShowCompletePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <DialogTitle className="text-2xl font-bold">Complete Your Profile</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2 px-4">
              Sahi job matches paane ke liye apna profile update karein. Isse AI prediction accuracy 10x badh jayegi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button className="w-full font-bold h-12 rounded-2xl" onClick={() => setShowCompletePopup(false)}>
              Abhi Shuru Karein
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeletePopup} onOpenChange={setShowDeletePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900">Delete Account?</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2 px-6">
              This action is irreversible. All your profile data, credits, and application history will be permanently erased from our servers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setShowDeletePopup(false)} className="w-full sm:flex-1 h-12 rounded-2xl font-bold">Cancel</Button>
            <Button 
              onClick={handleDeleteAccount} 
              disabled={isDeleting}
              className="w-full sm:flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-xl shadow-red-600/20"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "DELETE PERMANENTLY"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
