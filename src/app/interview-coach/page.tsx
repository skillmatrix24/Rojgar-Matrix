"use client"

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Mic, 
  Send, 
  Sparkles, 
  Loader2, 
  Trophy, 
  RotateCcw, 
  ArrowRight,
  User,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  Wallet,
  ArrowLeft
} from "lucide-react";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, addDoc, serverTimestamp, collection } from "firebase/firestore";
import { aiInterviewCoach } from "@/ai/flows/ai-interview-coach";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const COACH_COST = 20;

export default function InterviewCoachPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [isStarted, setIsStarted] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      } else {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !user || !profile || !userProfileRef || !db) {
      toast({ title: "Syncing...", description: "Please wait for profile data." });
      return;
    }

    if ((profile.credits || 0) < COACH_COST) {
      setShowRechargePopup(true);
      return;
    }
    
    setLoading(true);
    try {
      const result = await aiInterviewCoach({
        jobTitle,
        userProfile: {
          skills: profile?.skills || [],
          experience: profile?.experience || ""
        },
        history: []
      });

      // Deduction - Non-blocking
      updateDoc(userProfileRef, {
        credits: increment(-COACH_COST),
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("Interview coach credit deduction error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: { credits: -COACH_COST }
        }));
      });

      // Transaction - Non-blocking
      addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: COACH_COST,
        type: 'usage',
        description: `AI Coach: ${jobTitle}`,
        status: 'success',
        createdAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("Interview coach transaction log error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'transactions',
          operation: 'create'
        }));
      });

      setMessages([{ role: 'model', text: result.nextMessage }]);
      setIsStarted(true);
      toast({ title: "Session Started", description: `${COACH_COST} credits deducted.` });
    } catch (err: any) {
      console.error("Coach Start Error:", err);
      toast({ variant: "destructive", title: "Coach unreachable", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    const newHistory = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory as any);

    setLoading(true);
    try {
      const result = await aiInterviewCoach({
        jobTitle,
        userProfile: {
          skills: profile?.skills || [],
          experience: profile?.experience || ""
        },
        history: newHistory as any
      });
      setMessages([...newHistory, { role: 'model', text: result.nextMessage }] as any);
    } catch (err: any) {
      console.error("Coach Interaction Error:", err);
      toast({ variant: "destructive", title: "Connection Lost", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGetFeedback = async () => {
    setLoading(true);
    try {
      const result = await aiInterviewCoach({
        jobTitle,
        userProfile: {
          skills: profile?.skills || [],
          experience: profile?.experience || ""
        },
        history: messages as any,
        isFinishing: true
      });
      setFeedback(result.feedback);
    } catch (err: any) {
      console.error("Coach Feedback Error:", err);
      toast({ variant: "destructive", title: "Analysis Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    setMessages([]);
    setFeedback(null);
    setIsStarted(false);
    setJobTitle("");
  };

  const canAfford = (profile?.credits || 0) >= COACH_COST;

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      {/* DESKTOP VIEW */}
      <div className="hidden md:flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8 bg-muted/20">
          {!isStarted ? (
            <Card className="w-full max-w-lg border-none shadow-2xl rounded-[40px] overflow-hidden">
               <div className="h-2 bg-primary"></div>
               <CardHeader className="text-center space-y-4 p-10">
                  <div className="mx-auto h-20 w-20 rounded-[28px] bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-black tracking-tight">{t('interview_coach')}</CardTitle>
                    <CardDescription className="font-medium">{t('coach_subtitle')}</CardDescription>
                    <div className="flex items-center justify-center gap-2 text-primary font-black text-xs pt-4 uppercase">
                      <Wallet className="h-4 w-4" /> Cost: {COACH_COST} Credits
                    </div>
                  </div>
               </CardHeader>
               <CardContent className="px-10 pb-10">
                  <form suppressHydrationWarning onSubmit={handleStart} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t('role_label')}</Label>
                      <Input 
                        suppressHydrationWarning
                        placeholder={t('role_placeholder')}
                        className="h-14 text-lg font-bold border-2 rounded-2xl focus-visible:ring-primary/20"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className={cn(
                        "w-full h-14 text-lg font-black rounded-2xl shadow-xl transition-all",
                        canAfford ? "bg-primary shadow-primary/20" : "bg-orange-600 shadow-orange-600/20"
                      )} 
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : canAfford ? t('start_mock_interview') : "Recharge to Continue"}
                    </Button>
                  </form>
               </CardContent>
            </Card>
          ) : feedback ? (
            <div className="container mx-auto max-w-4xl space-y-8 py-12">
               <div className="text-center space-y-2">
                  <h1 className="text-4xl font-black tracking-tight">Performance Analysis</h1>
                  <p className="text-muted-foreground font-bold">Feedback for <span className="text-primary">{jobTitle}</span></p>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-none shadow-xl bg-primary text-white p-8 rounded-[40px] text-center flex flex-col items-center justify-center gap-4">
                     <Trophy className="h-12 w-12" />
                     <h2 className="text-6xl font-black">{feedback.score}%</h2>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{t('performance_score')}</p>
                  </Card>
                  <Card className="md:col-span-2 border-none shadow-xl p-8 rounded-[40px] flex items-center italic text-lg leading-relaxed text-muted-foreground">
                     "{feedback.overallSummary}"
                  </Card>
               </div>
               <div className="flex justify-center pt-8">
                  <Button onClick={resetSession} size="lg" className="h-14 px-12 font-black gap-2 rounded-2xl">
                    <RotateCcw className="h-5 w-5" /> {t('next_session')}
                  </Button>
               </div>
            </div>
          ) : (
            <div className="container mx-auto max-w-4xl h-[80vh] flex flex-col gap-6">
               <Card className="flex-1 border-none shadow-2xl rounded-[48px] overflow-hidden flex flex-col bg-card/80 backdrop-blur-sm">
                  <div className="p-6 border-b flex justify-between items-center bg-muted/20">
                     <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white"><BrainCircuit className="h-5 w-5" /></div>
                        <h2 className="font-black">Coach: {jobTitle}</h2>
                     </div>
                     <Button variant="outline" size="sm" className="font-black text-[10px] uppercase h-9 px-6 rounded-full" onClick={handleGetFeedback}>Finish Interview</Button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 space-y-6" ref={scrollRef}>
                     {messages.map((msg, i) => (
                        <div key={i} className={cn("flex items-start gap-4", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                           <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border", msg.role === 'user' ? "bg-primary text-white" : "bg-card text-primary")}>
                              {msg.role === 'user' ? <User className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                           </div>
                           <div className={cn("p-4 rounded-[24px] max-w-[80%] text-sm leading-relaxed shadow-sm", msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white border rounded-tl-none")}>
                              {msg.text}
                           </div>
                        </div>
                     ))}
                  </div>
                  <CardFooter className="p-6 border-t bg-muted/10">
                     <form onSubmit={handleSend} className="w-full flex gap-3">
                        <Input suppressHydrationWarning value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your response..." className="h-14 flex-1 bg-white border-2 rounded-2xl font-bold" />
                        <Button type="submit" disabled={loading || !input.trim()} className="h-14 w-14 rounded-2xl bg-primary shadow-lg shadow-primary/20"><Send className="h-6 w-6" /></Button>
                     </form>
                  </CardFooter>
               </Card>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE APP VIEW */}
      <div className="md:hidden flex flex-col flex-1 pb-10 overflow-hidden">
        {!isStarted ? (
           <>
            <AppHeader />
            <main className="flex-1 px-5 py-6 space-y-8">
               <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight leading-none">Interview Coach</h1>
                  <p className="text-sm text-muted-foreground font-bold">Practice with our intelligent AI HR manager.</p>
               </div>

               <Card className="border-none shadow-xl rounded-[32px] overflow-hidden p-6 space-y-6 bg-card">
                  <div className="h-16 w-16 rounded-[24px] bg-primary/10 flex items-center justify-center">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                  </div>
                  <form suppressHydrationWarning onSubmit={handleStart} className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Applied Role</Label>
                        <Input suppressHydrationWarning placeholder="e.g. Sales Manager" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-12 rounded-xl bg-muted/30 border-none font-bold" required />
                     </div>
                     <Button 
                        type="submit" 
                        disabled={loading} 
                        className={cn(
                          "w-full h-14 rounded-2xl font-black text-lg gap-3 shadow-xl active:scale-[0.98] transition-all",
                          canAfford ? "bg-primary shadow-primary/20" : "bg-orange-600 shadow-orange-600/20"
                        )}
                     >
                        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Sparkles className="h-6 w-6 fill-white" /> {canAfford ? "START PRACTICE" : "RECHARGE TO START"}</>}
                     </Button>
                     <p className="text-center text-[9px] font-black uppercase text-muted-foreground mt-2 tracking-widest flex items-center justify-center gap-2">
                        <Wallet className="h-3 w-3" /> Cost: {COACH_COST} Credits
                     </p>
                  </form>
               </Card>
            </main>
           </>
        ) : feedback ? (
           <>
            <AppHeader />
            <main className="flex-1 px-5 py-8 space-y-8">
               <div className="text-center space-y-2">
                  <div className="h-16 w-16 bg-primary text-white rounded-3xl flex items-center justify-center mx-auto shadow-lg"><Trophy className="h-8 w-8" /></div>
                  <h2 className="text-2xl font-black tracking-tight">Practice Score: {feedback.score}%</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase">{jobTitle}</p>
               </div>
               <Card className="border-none shadow-md rounded-[32px] p-6 text-sm italic font-medium text-muted-foreground leading-relaxed">
                  "{feedback.overallSummary}"
               </Card>
               <Button onClick={resetSession} className="w-full h-14 rounded-2xl font-black gap-2 bg-slate-900 shadow-xl">
                  <RotateCcw className="h-5 w-5" /> START NEW SESSION
               </Button>
            </main>
           </>
        ) : (
           <div className="flex flex-col h-full bg-slate-50">
              <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
                 <Link href="/profile" className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center"><ArrowLeft className="h-5 w-5 text-slate-900" /></Link>
                 <div className="text-center min-w-0 flex-1 mx-4">
                    <h1 className="text-sm font-black truncate">{jobTitle}</h1>
                    <p className="text-[8px] font-black uppercase text-primary animate-pulse">Live Practice Session</p>
                 </div>
                 <Button onClick={handleGetFeedback} variant="ghost" className="h-8 text-[9px] font-black uppercase text-destructive border-destructive/20 border rounded-full px-3">End</Button>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 flex flex-col" ref={scrollRef}>
                 {messages.map((msg, i) => (
                    <div key={i} className={cn("flex flex-col gap-1.5 max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                       <div className={cn("p-4 rounded-[24px] text-[13px] font-medium shadow-sm", msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-800 border-none rounded-tl-none")}>
                          {msg.text}
                       </div>
                    </div>
                 ))}
              </div>

              <div className="p-4 bg-white border-t pb-8">
                 <form onSubmit={handleSend} className="flex gap-2">
                    <Input suppressHydrationWarning value={input} onChange={(e) => setInput(e.target.value)} disabled={loading} placeholder="Reply to coach..." className="h-12 flex-1 rounded-2xl bg-slate-50 border-none font-bold text-sm" />
                    <Button type="submit" disabled={loading || !input.trim()} className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20"><Send className="h-5 w-5" /></Button>
                 </form>
              </div>
           </div>
        )}
      </div>

      <Dialog open={showRechargePopup} onOpenChange={setShowRechargePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-black">Credits Low</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              Coach session ke liye {COACH_COST} credits chahiye. Kripya wallet recharge karein.
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