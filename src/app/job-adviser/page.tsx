"use client"

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
  TrendingUp, 
  BrainCircuit, 
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  CircleArrowRight,
  Award as AwardIcon,
  ArrowLeft,
  GraduationCap,
  MessageSquare,
  Target
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
import { useTranslation } from "@/lib/i18n";
import { secureDispatch } from "@/actions/secure-dispatch";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const ADVISER_COST = 10;

export default function JobAdviserPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const [showIncompletePopup, setShowIncompletePopup] = useState(false);
  const { toast } = useToast();
  
  const { user } = useUser();
  const db = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const handleGetAdvice = async () => {
    if (!db || !user || !profile || !userProfileRef) return;
    
    const hasSkills = profile.skills && profile.skills.length > 0;
    const hasSummary = profile.resumeSummary && profile.resumeSummary.trim().length > 20;

    if (!hasSkills || !hasSummary) {
      setShowIncompletePopup(true);
      return;
    }

    if ((profile.credits || 0) < ADVISER_COST) {
      setShowRechargePopup(true);
      return;
    }
    
    setLoading(true);
    try {
      const jobsSnap = await getDocs(query(collection(db, "jobs"), where("isActive", "==", true), orderBy("postedDate", "desc"), limit(30)));
      const liveJobs = jobsSnap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        company: doc.data().companyName,
        location: doc.data().location,
        description: doc.data().description
      }));

      const { recommendedJobs } = await aiJobRecommendation({
        jobSeekerProfile: {
          skills: profile.skills || [],
          experience: profile.experience || "",
          previousApplications: [],
          preferredJobTitles: [profile.preferredJobTitle || ""],
          preferredLocations: [profile.city || "India"],
          resumeSummary: profile.resumeSummary || "",
        },
        availableJobs: liveJobs
      });
      
      // Deduction
      updateDoc(userProfileRef, {
        credits: increment(-ADVISER_COST),
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("Job adviser credit deduction error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: { credits: -ADVISER_COST }
        }));
      });

      // Transaction
      addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: ADVISER_COST,
        type: 'usage',
        description: 'AI Career Counseling',
        status: 'success',
        createdAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("Job adviser transaction creation error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'transactions',
          operation: 'create'
        }));
      });

      setResults(recommendedJobs);
      toast({ title: "Counseling Complete", description: `Aapka Career Score ready hai.` });

      const topMatch = recommendedJobs.find(rj => rj.relevanceScore >= 85);
      if (topMatch) {
        secureDispatch('/api/star-candidate-alert', { seekerId: user.uid }).catch((err) => {
          console.error("Star candidate alert error:", err);
        });
      }
    } catch (error: any) {
      console.error("AI Adviser Error:", error);
      const isBusy = error.message?.includes('busy') || error.message?.includes('503') || error.message?.includes('UNAVAILABLE');
      toast({ 
        variant: "destructive", 
        title: isBusy ? "AI Service Busy" : "Counseling Failed", 
        description: isBusy ? "AI engine busy hai, kripya thodi der baad try karein." : "Failed to process recommendations."
      });
    } finally {
      setLoading(false);
    }
  };

  const canAfford = (profile?.credits || 0) >= ADVISER_COST;

  if (isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 bg-muted/20 pb-10">
        <div className="container mx-auto max-w-5xl px-4 py-12">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#003366]/10 text-[#003366] font-black text-[10px] uppercase tracking-widest border border-[#003366]/20">
              <GraduationCap className="h-3.5 w-3.5" /> AI Career Counselor
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">AI Career <span className="text-primary">Strategy</span></h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">Aapka personal career coach jo batayega aapki selection probability aur career improvement tips.</p>
          </div>

          {!results.length && !loading ? (
             <Card className="max-w-2xl mx-auto rounded-[48px] overflow-hidden border-none shadow-2xl bg-card">
                <CardHeader className="p-12 text-center space-y-6">
                   <div className="mx-auto h-24 w-24 rounded-[32px] bg-primary/10 flex items-center justify-center shadow-inner">
                      <BrainCircuit className="h-12 w-12 text-primary animate-pulse" />
                   </div>
                   <div className="space-y-2">
                      <CardTitle className="text-2xl font-black">Get Your Career Insights</CardTitle>
                      <CardDescription className="text-base">AI analyze karega aapke current skills aur batayega ki aapko aur kya sikhne ki zaroorat hai.</CardDescription>
                   </div>
                </CardHeader>
                <CardContent className="px-12 pb-12 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-5 rounded-[24px] border-2 border-dashed border-primary/20 flex flex-col items-center gap-2">
                         <Target className="h-5 w-5 text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Selection Probability</span>
                      </div>
                      <div className="bg-accent/5 p-5 rounded-[24px] border-2 border-dashed border-accent/20 flex flex-col items-center gap-2">
                         <MessageSquare className="h-5 w-5 text-accent" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Interview Tips</span>
                      </div>
                   </div>
                   <Button 
                    onClick={handleGetAdvice} 
                    disabled={loading || !canAfford}
                    className={cn(
                      "w-full h-16 text-xl font-black rounded-[24px] gap-3 shadow-2xl transition-all active:scale-95",
                      canAfford ? "bg-primary shadow-primary/20" : "bg-orange-600"
                    )}
                   >
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Sparkles className="h-6 w-6 fill-white" /> GET CAREER ADVICE</>}
                   </Button>
                   <p className="text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center justify-center gap-2">
                      <Wallet className="h-4 w-4" /> ANALYSIS COST: {ADVISER_COST} CREDITS
                   </p>
                </CardContent>
             </Card>
          ) : loading ? (
             <div className="py-24 text-center space-y-8 max-w-lg mx-auto">
                <div className="relative inline-block">
                   <div className="h-32 w-32 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                   <BrainCircuit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-2xl font-black">Consulting the AI Coach...</h3>
                   <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-[0.3em]">Mapping your skills to market trends</p>
                </div>
             </div>
          ) : (
             <div className="space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black tracking-tight">AI Strategy & Probability Results</h3>
                   <Button variant="outline" onClick={() => setResults([])} className="rounded-xl font-bold h-10 border-2">Reset Counselor</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {results.map((job, idx) => (
                      <Card key={idx} className="border-none shadow-xl rounded-[40px] overflow-hidden bg-card flex flex-col h-full group hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-primary/10">
                         <CardHeader className="p-8 bg-muted/20 border-b">
                            <div className="flex justify-between items-start">
                               <div className="space-y-1.5">
                                  <h4 className="text-xl font-black text-slate-900 leading-tight">{job.title}</h4>
                                  <p className="text-xs font-black uppercase text-muted-foreground">{job.company}</p>
                               </div>
                               <div className="flex flex-col items-end gap-1">
                                  <Badge className={cn(
                                    "h-8 px-4 rounded-full font-black text-sm shadow-lg",
                                    job.relevanceScore >= 80 ? "bg-green-600" : "bg-primary"
                                  )}>{job.relevanceScore}%</Badge>
                                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Selection Odds</span>
                               </div>
                            </div>
                         </CardHeader>
                         <CardContent className="p-8 flex-1 space-y-6">
                            <div className="bg-primary/5 p-6 rounded-[28px] border border-primary/10 relative overflow-hidden">
                               <p className="text-[10px] font-black uppercase text-primary tracking-[0.2em] mb-2 flex items-center gap-2"><Lightbulb className="h-3 w-3" /> Career Strategy</p>
                               <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{job.reasoning}"</p>
                            </div>
                         </CardContent>
                         <CardFooter className="p-8 pt-0 mt-auto">
                            <Link href={`/jobs/${job.id}`} className="w-full">
                               <Button variant="outline" className="w-full h-14 rounded-[20px] font-black text-sm border-2 active:scale-95 transition-all">CHECK ELIGIBILITY DETAILS</Button>
                            </Link>
                         </CardFooter>
                      </Card>
                   ))}
                </div>
                
                <Card className="border-none shadow-lg rounded-[32px] bg-slate-900 text-white p-10">
                   <CardContent className="p-0 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                         <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0"><AwardIcon className="h-8 w-8 text-yellow-400" /></div>
                         <div>
                            <h4 className="text-xl font-black">AI Coaching Success</h4>
                            <p className="text-sm text-blue-100/60 font-medium">Aapka career path clear hai. Behtar results ke liye AI Mock Interview try karein.</p>
                         </div>
                      </div>
                      <Link href="/interview-coach"><Button variant="secondary" className="h-12 px-8 rounded-xl font-black">Open Interview Coach</Button></Link>
                   </CardContent>
                </Card>
             </div>
          )}
        </div>
      </main>

      <Dialog open={showIncompletePopup} onOpenChange={setShowIncompletePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-black">Profile Update Needed</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2 px-4">
              AI Counseling ke liye Resume Summary aur Skills zaroori hain. Isse AI aapko 100% accurate strategy de payega.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Link href="/profile" className="w-full">
              <Button className="w-full font-black h-12 rounded-2xl" onClick={() => setShowIncompletePopup(false)}>Update Profile</Button>
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
            <DialogTitle className="text-2xl font-black">Low Credits</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              Career Counselor session ke liye {ADVISER_COST} credits lagte hain.
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
