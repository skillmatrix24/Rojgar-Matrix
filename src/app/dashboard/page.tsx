"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Briefcase, 
  PlusCircle, 
  MoreHorizontal,
  Loader2,
  Zap,
  Megaphone,
  Upload,
  Link as LinkIcon,
  Wallet,
  Clock,
  Sparkles,
  ShieldCheck,
  BellRing,
  ArrowRight,
  Settings2,
  CheckCircle2,
  FileText,
  BrainCircuit,
  Target,
  Smartphone,
  Eye,
  SwitchCamera,
  Power,
  User as UserIcon,
  MessageCircle,
  Wand2,
  History,
  FileSearch,
  SearchX
} from "lucide-react";
import Link from "next/link";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useUser, useMemoFirebase, useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, query, where, limit, doc, orderBy, updateDoc, addDoc, serverTimestamp, increment, getDocs } from "firebase/firestore";
import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { OfferBanner } from "@/components/layout/OfferBanner";

export default function SmartDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [promoLoading, setPromoLoading] = useState(false);
  const [tempBanner, setTempBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return undefined;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const pricingSettingsRef = useMemoFirebase(() => {
    if (!db) return undefined;
    return doc(db, "settings", "pricing");
  }, [db]);
  const { data: pricingConfig } = useDoc(pricingSettingsRef);

  const costs = pricingConfig?.serviceCosts || {
    aiJobAdviser: 10, aiSmartMatch: 10, interviewCoach: 20, resumeRefine: 5, appOptimizer: 10,
    whatsappAlerts: 1, starCandidateAlerts: 10, whatsappBroadcasting: 2, aiJobQuality: 5,
    featuredListing: 100, bannerPromotion: 100
  };

  const limits = pricingConfig?.serviceLimits || {
    featuredListingDays: 30, bannerPromotionDays: 30, maxBroadcastReach: 500
  };

  const EMPLOYER_SERVICES = [
    { key: 'starCandidateAlerts', label: 'Star Candidate Alerts', cost: `${costs.starCandidateAlerts} Credits`, icon: Sparkles, desc: 'AI verifies matches and sends you direct leads.' },
    { key: 'whatsappBroadcasting', label: 'WhatsApp Broadcast', cost: `${costs.whatsappBroadcasting} Cr/Msg`, icon: Smartphone, desc: `Direct alerts. Max reach: ${limits.maxBroadcastReach} users.` },
    { key: 'aiJobQuality', label: 'AI Listing Optimizer', cost: `${costs.aiJobQuality} Credits`, icon: BrainCircuit, desc: 'Gemini AI analyzes and improves your listing.' },
    { key: 'featuredListing', label: 'Featured Jobs', cost: `${costs.featuredListing} Credits`, icon: Zap, desc: `Keep job at top for ${limits.featuredListingDays} days.` }
  ];

  const SEEKER_SERVICES = [
    { key: 'whatsappJobAlerts', label: 'Priority WhatsApp Alerts', cost: `${costs.whatsappAlerts} Credit`, icon: MessageCircle, desc: 'Receive instant notifications for matching jobs before anyone else.' },
    { key: 'aiSmartMatch', label: 'AI Semantic Matching', cost: `${costs.aiSmartMatch} Credits`, icon: Target, desc: 'Find hidden jobs that perfectly match your skills and experience contextually.' },
    { key: 'interviewCoach', label: 'AI Interview Coach', cost: `${costs.interviewCoach} Credits`, icon: BrainCircuit, desc: 'Practice mock interviews with real-time feedback.' },
    { key: 'resumeRefine', label: 'AI Resume Refinement', cost: `${costs.resumeRefine} Credits`, icon: Wand2, desc: 'Optimize your summary for higher ATS visibility.' }
  ];

  // Queries for Employer
  const jobsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || profile?.role !== 'employer') return undefined;
    return query(collection(db, "jobs"), where("employerUserProfileId", "==", user.uid));
  }, [db, user?.uid, profile?.role]);
  const { data: employerJobs, isLoading: isJobsLoading } = useCollection(jobsQuery);

  const appsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || profile?.role !== 'employer') return undefined;
    return query(
      collection(db, "applications"), 
      where("employerId", "==", user.uid), 
      orderBy("appliedAt", "desc"), 
      limit(50)
    );
  }, [db, user?.uid, profile?.role]);
  const { data: applications, isLoading: isAppsLoading } = useCollection(appsQuery);

  // Queries for Job Seeker
  const seekerAppsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || profile?.role !== 'jobSeeker') return undefined;
    return query(
      collection(db, "applications"),
      where("seekerId", "==", user.uid),
      orderBy("appliedAt", "desc")
    );
  }, [db, user?.uid, profile?.role]);
  const { data: seekerApplications, isLoading: isSeekerAppsLoading } = useCollection(seekerAppsQuery);

  const userPromoQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || profile?.role !== 'employer') return undefined;
    return query(
      collection(db, "promotions"), 
      where("employerId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );
  }, [db, user?.uid, profile?.role]);
  const { data: userPromos } = useCollection(userPromoQuery);

  const handleUpdateAppStatus = async (appId: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "applications", appId), { status: newStatus });
      toast({ title: "Status Updated" });
    } catch (e) {
      console.error("Update application status error:", e);
      toast({ variant: "destructive", title: "Update Failed" });
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
        description: `Your preference for ${serviceKey.replace(/([A-Z])/g, ' $1')} has been updated.`
      });
    } catch (e) {
      console.error("Toggle service error in dashboard:", e);
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setTempBanner(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePromoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user || !profile || !userProfileRef) return;
    
    const promoPrice = costs.bannerPromotion;
    const promoDays = limits.bannerPromotionDays;

    if ((profile.credits || 0) < promoPrice) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Credits", 
        description: `Promotion costs ${promoPrice} credits. Please recharge your wallet.` 
      });
      return;
    }

    if (!tempBanner) {
      toast({ variant: "destructive", title: "Image Required" });
      return;
    }

    setPromoLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      // 1. Add Promotion Doc with deduction record
      await addDoc(collection(db, "promotions"), {
        employerId: user.uid,
        imageUrl: tempBanner,
        targetUrl: formData.get('targetUrl') as string,
        status: 'pending',
        validDays: promoDays,
        deductedCredits: promoPrice, // Store for potential refund
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Deduct Credits immediately
      await updateDoc(userProfileRef, {
        credits: increment(-promoPrice),
        updatedAt: serverTimestamp()
      });

      // 3. Log Transaction
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: promoPrice,
        type: 'usage',
        description: `Promotion Submission (${promoDays} days)`,
        status: 'success',
        createdAt: serverTimestamp()
      });

      toast({ title: t('promo_submitted'), description: `Deducted ${promoPrice} credits for ${promoDays} days.` });
      setTempBanner(null);
      (e.target as HTMLFormElement).reset();
    } catch (e) {
      console.error("Promotion submission error:", e);
      toast({ variant: "destructive", title: "Submission Failed" });
    } finally {
      setPromoLoading(false);
    }
  };

  const EmptyState = ({ label, desc, icon: Icon }: { label: string, desc: string, icon: any }) => (
    <div className="py-20 flex flex-col items-center justify-center text-center px-6 opacity-40">
       <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon className="h-10 w-10 text-muted-foreground" />
       </div>
       <h3 className="text-xl font-black">{label}</h3>
       <p className="text-sm font-medium mt-2 max-w-xs">{desc}</p>
    </div>
  );

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground font-medium">{t('dashboard_loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold mb-4">{t('login_required')}</h1>
          <Link href="/login">
            <Button className="font-bold px-8">{t('login')}</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isEmployer = profile?.role === 'employer';
  const SERVICES_LIST = isEmployer ? EMPLOYER_SERVICES : SEEKER_SERVICES;
  const promoPrice = costs.bannerPromotion;
  const promoDays = limits.bannerPromotionDays;
  const canAffordPromo = (profile?.credits || 0) >= promoPrice;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="md:hidden">
        <AppHeader />
      </div>
      <OfferBanner />
      <main className="flex-1 pb-10">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{isEmployer ? t('employer_dashboard') : t('seeker_dashboard')}</h1>
              <p className="text-muted-foreground">{t('namaste')} {profile?.firstName}!</p>
            </div>
            {isEmployer ? (
              <div className="flex gap-3">
                <Link href="/post-job">
                  <Button className="gap-2 font-black px-6 h-12 shadow-lg rounded-xl">
                    <PlusCircle className="h-4 w-4" />
                    {t('post_job_now')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/jobs">
                  <Button className="gap-2 font-black px-6 h-12 shadow-lg rounded-xl">
                    <Briefcase className="h-4 w-4" />
                    Find Jobs
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-card">
                 <CardHeader className={cn("border-b p-6", isEmployer ? "bg-primary/5" : "bg-accent/5")}>
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <CardTitle className="text-xl flex items-center gap-2">
                             <Settings2 className={cn("h-5 w-5", isEmployer ? "text-primary" : "text-accent")} />
                             {isEmployer ? "Hiring Profile" : "Career Success Controls"}
                          </CardTitle>
                          <CardDescription>Manage active tools and automated preferences.</CardDescription>
                       </div>
                       <Badge variant="outline" className={cn("h-8 px-4 font-black uppercase text-[10px] bg-white border-primary/20", isEmployer ? "text-primary" : "text-accent")}>
                          {profile?.credits || 0} Credits
                       </Badge>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y">
                       {SERVICES_LIST.map((service) => {
                          const isActive = profile?.services?.[service.key] ?? true;
                          return (
                            <div key={service.key} className="p-6 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                               <div className={cn(
                                 "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                                 isActive ? (isEmployer ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent") : "bg-muted text-muted-foreground"
                               )}>
                                  <service.icon className="h-6 w-6" />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                     <h4 className="font-bold text-sm">{service.label}</h4>
                                     <Badge variant="secondary" className={cn("text-[8px] h-4 font-black uppercase border-none", isEmployer ? "bg-primary/5 text-primary" : "bg-accent/5 text-accent")}>{service.cost}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">{service.desc}</p>
                               </div>
                               <div className="flex items-center justify-between gap-3">
                                  <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-green-600" : "text-slate-400")}>
                                     {isActive ? "ACTIVE" : "PAUSED"}
                                  </span>
                                  <Switch 
                                    checked={isActive} 
                                    onCheckedChange={() => handleToggleService(service.key, isActive)}
                                    className={cn(isActive && !isEmployer && "data-[state=checked]:bg-accent")}
                                  />
                               </div>
                            </div>
                          )
                       })}
                    </div>
                 </CardContent>
              </Card>

              <Tabs defaultValue={isEmployer ? "applications" : "my_apps"} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-card border rounded-xl shadow-sm mb-8">
                  {isEmployer ? (
                    <>
                      <TabsTrigger value="applications" className="font-bold rounded-lg text-[10px] md:text-sm">Incoming Leads</TabsTrigger>
                      <TabsTrigger value="jobs" className="font-bold rounded-lg text-[10px] md:text-sm">My Jobs</TabsTrigger>
                      <TabsTrigger value="promotions" className="font-bold rounded-lg text-[10px] md:text-sm">Ads & Promos</TabsTrigger>
                    </>
                  ) : (
                    <>
                      <TabsTrigger value="my_apps" className="font-bold rounded-lg text-[10px] md:text-sm">Applied Jobs</TabsTrigger>
                      <TabsTrigger value="history" className="font-bold rounded-lg text-[10px] md:text-sm">Activity</TabsTrigger>
                      <TabsTrigger value="referrals" className="font-bold rounded-lg text-[10px] md:text-sm">Referrals</TabsTrigger>
                    </>
                  )}
                </TabsList>

                {isEmployer ? (
                  <>
                    <TabsContent value="applications">
                       <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
                          <CardContent className="p-0">
                            {isAppsLoading ? (
                               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : applications?.length ? (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader><TableRow><TableHead className="pl-6">Candidate</TableHead><TableHead>Job Title</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {applications.map(app => (
                                      <TableRow key={app.id}>
                                        <TableCell className="pl-6 py-4 font-bold text-sm">{app.seekerName}</TableCell>
                                        <TableCell className="text-xs">{app.jobTitle}</TableCell>
                                        <TableCell><Badge variant="secondary" className="uppercase text-[8px] font-black">{app.status}</Badge></TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : <EmptyState icon={FileSearch} label="No leads yet" desc="Broadcast your jobs to start receiving WhatsApp leads." />}
                          </CardContent>
                       </Card>
                    </TabsContent>
                    
                    <TabsContent value="jobs">
                       <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
                          <CardContent className="p-0">
                            {isJobsLoading ? (
                               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : employerJobs?.length ? (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader><TableRow><TableHead className="pl-6">Title</TableHead><TableHead>Posted</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {employerJobs.map(job => (
                                      <TableRow key={job.id}>
                                        <TableCell className="pl-6 py-4 font-bold text-sm">{job.title}</TableCell>
                                        <TableCell className="text-[10px] text-muted-foreground">{job.postedDate?.toDate?.().toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant={job.isActive ? "default" : "outline"} className="uppercase text-[8px] font-black">{job.isActive ? 'Active' : 'Offline'}</Badge></TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : <EmptyState icon={Briefcase} label="No active jobs" desc="Click the 'Post Job' button to start hiring staff." />}
                          </CardContent>
                       </Card>
                    </TabsContent>

                    <TabsContent value="promotions" className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-6">
                          <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                            <CardHeader className="bg-primary/5 border-b p-6">
                              <CardTitle className="text-lg flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> {t('promote_work')}</CardTitle>
                              <CardDescription className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-primary"><Wallet className="h-3 w-3" /> {promoPrice} Credits</span>
                                <span className="flex items-center gap-1 text-[10px] font-black uppercase text-muted-foreground"><Clock className="h-3 w-3" /> {promoDays} Days</span>
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                              <form onSubmit={handlePromoSubmit} className="space-y-6">
                                <div className="space-y-2">
                                  <Label className="text-xs font-black uppercase tracking-widest">{t('upload_banner')}</Label>
                                  <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-40 w-full rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-primary/5 transition-all relative overflow-hidden bg-muted/30"
                                  >
                                    {tempBanner ? (
                                      <Image src={tempBanner} alt="Preview" fill className="object-cover" />
                                    ) : (
                                      <>
                                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                        <p className="text-[10px] font-bold text-muted-foreground">Banner (1200x400)</p>
                                      </>
                                    )}
                                  </div>
                                  <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-xs font-black uppercase tracking-widest">{t('target_link')}</Label>
                                  <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input name="targetUrl" placeholder="https://rojgarmatrix.com/jobs/..." className="pl-10 rounded-xl h-12" required />
                                  </div>
                                </div>
                                <Button type="submit" disabled={promoLoading || !canAffordPromo} className="w-full h-12 font-black shadow-lg shadow-primary/20 rounded-xl gap-2">
                                  {promoLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-4 w-4" />}
                                  {canAffordPromo ? t('submit_promo') : "RECHARGE TO PROMOTE"}
                                </Button>
                              </form>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="lg:col-span-6">
                          <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
                            <CardHeader className="bg-card border-b"><CardTitle className="text-lg">History</CardTitle></CardHeader>
                            <CardContent className="p-0">
                                {userPromos?.length ? (
                                  <Table>
                                    <TableHeader><TableRow><TableHead className="pl-6">Banner</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                      {userPromos?.map((promo) => (
                                        <TableRow key={promo.id}>
                                          <TableCell className="pl-6 py-3"><div className="h-10 w-24 relative rounded-md overflow-hidden border"><Image src={promo.imageUrl} alt="Banner" fill className="object-cover" /></div></TableCell>
                                          <TableCell><Badge variant={promo.status === 'approved' ? 'default' : promo.status === 'rejected' ? 'destructive' : 'outline'}>{promo.status}</Badge></TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : <EmptyState icon={Megaphone} label="No promos" desc="Promote your work with visual banners." />}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </TabsContent>
                  </>
                ) : (
                  <>
                    <TabsContent value="my_apps">
                       <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
                          <CardContent className="p-0">
                            {isSeekerAppsLoading ? (
                               <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                            ) : seekerApplications?.length ? (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader><TableRow><TableHead className="pl-6">Job Position</TableHead><TableHead>Employer</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                  <TableBody>
                                    {seekerApplications.map(app => (
                                      <TableRow key={app.id}>
                                        <TableCell className="pl-6 py-4 font-bold text-sm">{app.jobTitle}</TableCell>
                                        <TableCell className="text-xs">---</TableCell>
                                        <TableCell className="text-[10px] text-muted-foreground">{app.appliedAt?.toDate?.().toLocaleDateString()}</TableCell>
                                        <TableCell><Badge variant="secondary" className="uppercase text-[8px] font-black">{app.status}</Badge></TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ) : <EmptyState icon={SearchX} label="No applications" desc="Find a job and apply via WhatsApp to track it here." />}
                          </CardContent>
                       </Card>
                    </TabsContent>
                    
                    <TabsContent value="history">
                       <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
                          <CardContent className="p-0">
                             <EmptyState icon={History} label="Activity Logs" desc="AI interactions and search history will appear here soon." />
                          </CardContent>
                       </Card>
                    </TabsContent>

                    <TabsContent value="referrals">
                       <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
                          <CardContent className="p-0">
                             <EmptyState icon={Gift} label="Referral History" desc="Track your earnings from friends you invited." />
                          </CardContent>
                       </Card>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>

            <aside className="lg:col-span-4 space-y-6 md:sticky md:top-24">
              <Card className="border-none shadow-lg rounded-[32px] bg-card p-6">
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Wallet className="h-5 w-5 text-primary" /></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Balance</p>
                          <p className="text-2xl font-black text-slate-900">{profile?.credits || 0} Credits</p>
                       </div>
                    </div>
                    <Link href="/profile?tab=wallet">
                      <Button variant="outline" className="w-full h-11 font-black rounded-xl border-2">Recharge Wallet</Button>
                    </Link>
                 </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}