"use client"

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Briefcase, 
  MapPin, 
  Star, 
  Zap, 
  Loader2, 
  ArrowRight, 
  Wallet, 
  AlertCircle, 
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  Coins,
  Rocket,
  Search,
  IndianRupee,
  Building2,
  Info
} from "lucide-react";
import { aiJobRecommendation } from "@/ai/flows/ai-job-recommendation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc, collection, query, where, limit, getDocs, orderBy, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MATCH_COST = 10;

export default function AiMatchPage() {
  const [loading, setLoading] = useState(false);
  const [jobResults, setJobResults] = useState<any[]>([]);
  const [businessResults, setBusinessResults] = useState<any[]>([]);
  const [showCompletePopup, setShowCompletePopup] = useState(false);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const { toast } = useToast();
  
  const { user } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (user && profile) {
      const isIncomplete = !profile.skills?.length || !profile.experience || !profile.resumeSummary;
      if (isIncomplete) {
        const hasShown = sessionStorage.getItem(`shown_match_popup_${user.uid}`);
        if (!hasShown) {
          setShowCompletePopup(true);
          sessionStorage.setItem(`shown_match_popup_${user.uid}`, "true");
        }
      }
    }
  }, [user, profile]);

  const handleMatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !user || !profile || !userProfileRef) return;

    if ((profile.credits || 0) < MATCH_COST) {
      setShowRechargePopup(true);
      return;
    }
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const skillsString = (formData.get('skills') as string) || "";
    
    try {
      const jobsQuery = query(
        collection(db, "jobs"),
        where("isActive", "==", true),
        orderBy("postedDate", "desc"),
        limit(20)
      );
      
      const querySnapshot = await getDocs(jobsQuery);
      const liveJobs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || "Untitled",
        company: doc.data().companyName || "Unknown",
        location: doc.data().location || "India",
        description: doc.data().description || ""
      }));

      const input = {
        jobSeekerProfile: {
          skills: skillsString.split(',').map(s => s.trim()).filter(s => s !== ""),
          experience: (formData.get('experience') as string) || profile.experience || "",
          previousApplications: [],
          preferredJobTitles: [(formData.get('title') as string) || profile.preferredJobTitle || ""],
          preferredLocations: [profile.city || "India", "Remote"],
          resumeSummary: (formData.get('summary') as string) || profile.resumeSummary || "",
        },
        availableJobs: liveJobs
      };

      const { recommendedJobs, businessOpportunities } = await aiJobRecommendation(input);
      
      // Deduction - Non-blocking
      updateDoc(userProfileRef, {
        credits: increment(-MATCH_COST),
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("AI Match credit deduction error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: { credits: -MATCH_COST }
        }));
      });

      // Transaction - Non-blocking
      addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: MATCH_COST,
        type: 'usage',
        description: 'AI Opportunity Matrix Usage',
        status: 'success',
        createdAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("AI Match transaction log error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'transactions',
          operation: 'create'
        }));
      });

      setJobResults(recommendedJobs);
      setBusinessResults(businessOpportunities || []);
      toast({ title: "Opportunities Found", description: `${MATCH_COST} credits used for discovery.` });

    } catch (error: any) {
      console.error("Opportunity Matrix Error:", error);
      const isBusy = error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      toast({ 
        variant: "destructive", 
        title: isBusy ? "AI Service Busy" : "Scanning Fail", 
        description: isBusy ? "AI engine busy hai, kripya thodi der baad try karein." : (error.message || "Failed to find opportunities.")
      });
    } finally {
      setLoading(false);
    }
  };

  const canAfford = (profile?.credits || 0) >= MATCH_COST;

  if (isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="md:hidden">
        <AppHeader />
      </div>
      <main className="flex-1 bg-muted/20 pb-20">
        <div className="container mx-auto max-w-7xl px-4 py-8 md:py-12">
          <div className="text-center mb-10 md:mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] border border-primary/20 mx-auto">
              <Search className="h-3 md:h-3.5 w-3 md:h-3.5" /> AI Opportunity Matrix
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">Discovery <span className="text-primary">Engine</span></h1>
            <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed px-4">
              Aapke skills ke mutabiq best matching Jobs aur Business ideas ko ek saath scan karein.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-xl rounded-[24px] md:rounded-[32px] overflow-hidden bg-card">
                <CardHeader className="bg-primary/5 border-b p-6">
                  <CardTitle className="text-base md:text-lg">Opportunity Scanner</CardTitle>
                  <CardDescription className="text-xs">Enter details to scan the market.</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form suppressHydrationWarning onSubmit={handleMatch} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Role</Label>
                      <Input name="title" suppressHydrationWarning defaultValue={profile?.preferredJobTitle || ""} required className="h-11 md:h-12 rounded-xl border-2 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Key Skills</Label>
                      <Input name="skills" suppressHydrationWarning defaultValue={profile?.skills?.join(', ') || ""} required className="h-11 md:h-12 rounded-xl border-2 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Resume Summary</Label>
                      <Textarea name="summary" suppressHydrationWarning defaultValue={profile?.resumeSummary || ""} className="min-h-[100px] md:min-h-[120px] rounded-xl border-2 font-medium text-sm leading-relaxed" required />
                    </div>
                    <Button 
                      type="submit" 
                      className={cn(
                        "w-full h-14 text-base md:text-lg font-black rounded-xl md:rounded-2xl shadow-xl transition-all active:scale-95 mt-4",
                        canAfford ? "bg-primary shadow-primary/20" : "bg-orange-600"
                      )} 
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : canAfford ? <><Zap className="h-5 w-5" /> SCAN OPPORTUNITIES</> : "RECHARGE NOW"}
                    </Button>
                    <div className="flex items-center justify-center gap-2 text-primary font-bold text-[9px] md:text-[10px] uppercase pt-2">
                       <Wallet className="h-3 w-3" /> Analysis Cost: {MATCH_COST} Credits
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8">
              {loading ? (
                 <div className="py-20 md:py-32 text-center space-y-6 bg-card rounded-[32px] md:rounded-[48px] shadow-sm border-2 border-dashed">
                    <div className="relative inline-block">
                       <div className="h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                       <Rocket className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 md:h-10 md:w-10 text-primary animate-pulse" />
                    </div>
                    <p className="font-black text-primary uppercase tracking-[0.2em] text-[10px] md:text-xs">Scanning Jobs & Business Trends...</p>
                 </div>
              ) : (jobResults.length > 0 || businessResults.length > 0) ? (
                <Tabs defaultValue="jobs" className="space-y-6 md:space-y-8">
                  <TabsList className="grid w-full grid-cols-2 h-14 md:h-16 p-1 bg-white border-none shadow-xl rounded-2xl md:rounded-[24px]">
                    <TabsTrigger value="jobs" className="rounded-xl md:rounded-[20px] font-black text-[10px] md:text-sm uppercase gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                      <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4" /> Live Jobs
                    </TabsTrigger>
                    <TabsTrigger value="business" className="rounded-xl md:rounded-[20px] font-black text-[10px] md:text-sm uppercase gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all">
                      <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" /> Business Ideas
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="jobs" className="space-y-4 animate-in fade-in duration-500">
                    {jobResults.map((job) => (
                      <Card key={job.id} className="border-none shadow-lg overflow-hidden rounded-[24px] md:rounded-[32px] group hover:shadow-2xl transition-all">
                        <div className="p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
                          <div className="space-y-2 flex-1">
                             <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <h3 className="font-black text-lg md:text-xl leading-tight">{job.title}</h3>
                                <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">{job.relevanceScore}% Match</Badge>
                             </div>
                             <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase">{job.company} • {job.location}</p>
                             <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-primary/20">
                                <p className="text-xs md:text-sm text-slate-600 leading-relaxed italic font-medium">"{job.reasoning}"</p>
                             </div>
                          </div>
                          <Link href={`/jobs/${job.id}`} className="w-full sm:w-auto shrink-0">
                             <Button size="icon" className="w-full sm:w-14 h-12 sm:h-14 rounded-xl md:rounded-2xl bg-slate-900 sm:group-hover:scale-110 transition-transform">
                               <ArrowRight className="h-5 w-5 md:h-6 md:w-6" />
                             </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="business" className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {businessResults.map((biz, idx) => (
                         <Card key={idx} className="border-none shadow-xl rounded-[24px] md:rounded-[32px] bg-white border-t-8 border-amber-500 overflow-hidden flex flex-col">
                            <CardContent className="p-6 md:p-8 space-y-6 flex-1">
                               <div className="flex justify-between items-start">
                                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                                     <Lightbulb className="h-5 w-5 md:h-6 md:w-6" />
                                  </div>
                                  <Badge className="bg-green-100 text-green-700 border-none font-black uppercase text-[8px] tracking-widest">{biz.investmentLevel} Investment</Badge>
                               </div>
                               <div className="space-y-2">
                                  <h4 className="text-lg md:text-xl font-black text-slate-900 leading-tight">{biz.title}</h4>
                                  <p className="text-[11px] md:text-xs font-medium text-slate-600 leading-relaxed">{biz.description}</p>
                               </div>
                               <div className="bg-slate-50 p-4 rounded-xl md:rounded-2xl border-2 border-dashed">
                                  <p className="text-[9px] font-black uppercase text-amber-600 mb-1 flex items-center gap-1.5 tracking-widest"><Zap className="h-3 w-3" /> First Step</p>
                                  <p className="text-xs font-bold text-slate-800">{biz.firstStep}</p>
                               </div>
                               <div className="flex items-center justify-between pt-2 border-t">
                                  <span className="text-[9px] font-black uppercase text-slate-400">Potential Income</span>
                                  <span className="text-base md:text-lg font-black text-green-600 flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5 md:h-4 md:w-4" /> {biz.potentialMonthlyIncome} <span className="text-[9px] text-slate-400">/mo</span></span>
                               </div>
                            </CardContent>
                         </Card>
                       ))}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center p-8 md:p-12 text-center border-2 border-dashed rounded-[32px] md:rounded-[48px] bg-card/30 opacity-40 min-h-[400px] md:min-h-[500px]">
                    <Rocket className="h-12 w-12 md:h-16 md:w-16 mb-6 animate-bounce" />
                    <h3 className="text-xl md:text-2xl font-black">Ready to Scan?</h3>
                    <p className="max-w-xs text-xs md:text-sm font-medium mt-2">Profile data bhariye aur AI se Jobs + Business discovery shuru karein.</p>
                 </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Dialog open={showCompletePopup} onOpenChange={setShowCompletePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <DialogTitle className="text-xl md:text-2xl font-black">Profile Not Ready</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2 px-4">
              Sahi opportunities paane ke liye resume summary aur skills bharna zaroori hai.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Link href="/profile" className="w-full">
              <Button className="w-full font-black h-12 rounded-2xl">Complete Profile</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRechargePopup} onOpenChange={setShowRechargePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-black">Credits Low</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              Opportunity discovery ke liye {MATCH_COST} credits chahiye.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Link href="/profile?tab=wallet" className="w-full">
              <Button className="w-full font-black h-12 rounded-2xl">Recharge Now</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}