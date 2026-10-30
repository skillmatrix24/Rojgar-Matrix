"use client"

import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Phone, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  Loader2, 
  MessageSquare, 
  AlertTriangle, 
  Settings,
  MessageCircle,
  ChevronRight,
  Smartphone,
  User,
  MapPin,
  Layers,
  Briefcase,
  Check,
  Sparkles,
  BrainCircuit,
  Target,
  Languages,
  RotateCcw,
  Send,
  Play,
  Activity,
  UserRound,
  CircleAlert,
  Terminal,
  BarChart4,
  Cpu,
  History,
  HardDrive,
  ExternalLink,
  ArrowLeft,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { secureDispatch } from "@/actions/secure-dispatch";

export default function SimulatorPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [simReply, setSimReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    if (profile?.phoneNumber) {
      setPhoneNumber(profile.phoneNumber.replace(/\D/g, '').slice(-10));
    }
  }, [profile]);

  const interactionRef = useMemoFirebase(() => {
    if (!db || !phoneNumber || phoneNumber.length < 10) return null;
    return doc(db, 'interactions', `91${phoneNumber}`);
  }, [db, phoneNumber]);

  const { data: botState } = useDoc(interactionRef);
  const liveChat = botState?.history || [];

  useEffect(() => {
    if (chatScrollRef.current) {
      const viewport = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [liveChat]);

  const triggerWhatsApp = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await secureDispatch('/api/start-whatsapp', { phoneNumber: `91${phoneNumber}` });
      if (result.ok) toast({ title: "Bot Triggered" });
      else toast({ variant: "destructive", title: "Failed", description: result.data?.details });
    } finally { setLoading(false); }
  };

  const simulateReply = async (text: string) => {
    if (!text || !phoneNumber || replyLoading) return;
    setReplyLoading(true);
    try {
      await fetch('/api/whatsapp-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: `91${phoneNumber}`, text, source: 'simulator' })
      });
      setSimReply("");
    } finally { setReplyLoading(false); }
  };

  const handleResetSession = async () => {
    if (!interactionRef || !db) return;
    setResetLoading(true);
    try {
      await updateDoc(interactionRef, {
        history: [],
        lastStep: 'START',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Session Cleared" });
    } catch (e) {
      console.error("Simulator reset error:", e);
      toast({ variant: "destructive", title: "Reset Failed" });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="md:hidden">
        <AppHeader />
      </div>
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-6 md:py-12 space-y-6 md:space-y-8 pb-20 flex flex-col">
          <div className="flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-4xl font-black tracking-tight flex items-center gap-4">
                  <Terminal className="h-6 w-6 md:h-10 md:w-10 text-primary" />
                  Logic Simulator
                </h1>
                <p className="text-muted-foreground text-sm md:text-lg">Test bot flows and NLU extraction logic.</p>
              </div>
              <div className="flex items-center gap-3 md:gap-4 bg-muted/50 p-2 md:p-3 rounded-2xl border w-full md:w-auto">
                <div className="h-10 w-10 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0"><Activity className="h-6 w-6 animate-pulse" /></div>
                <div className="pr-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Meta Engine</p>
                    <p className="text-sm font-bold text-green-700">ONLINE</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 mt-8">
              <div className="xl:col-span-4 space-y-6">
                <Card className="rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-xl bg-card border-none">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Simulated Number</Label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm md:text-lg">+91</span>
                          <Input value={phoneNumber} readOnly className="pl-12 h-12 md:h-14 rounded-xl md:rounded-2xl font-black bg-muted/50 border-none text-base md:text-lg" />
                          <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button onClick={triggerWhatsApp} disabled={loading || phoneNumber.length < 10} className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl font-black text-sm md:text-base shadow-xl shadow-primary/20 gap-3 group">
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5 fill-white group-hover:scale-110 transition-transform" />}
                          START FLOW
                      </Button>

                      <Button onClick={handleResetSession} disabled={resetLoading} variant="outline" className="w-full h-11 md:h-12 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm gap-2 border-2">
                          {resetLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                          Clear Logic
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-[24px] md:rounded-[32px] overflow-hidden border-none shadow-lg hidden md:block">
                  <CardHeader className="bg-muted/30 border-b py-4 md:py-5"><CardTitle className="text-[10px] md:text-sm font-black uppercase tracking-widest flex items-center gap-2"><BarChart4 className="h-4 w-4 text-primary" /> Session Insights</CardTitle></CardHeader>
                  <CardContent className="p-4 md:p-6 space-y-4">
                      <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                        <span className="text-muted-foreground flex items-center gap-2"><History className="h-4 w-4" /> Messages</span>
                        <span className="font-black">{liveChat.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs md:text-sm font-medium">
                        <span className="text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" /> Step</span>
                        <Badge variant="secondary" className="uppercase text-[9px] font-black">{botState?.lastStep || 'START'}</Badge>
                      </div>
                  </CardContent>
                </Card>
              </div>

              <div className="xl:col-span-8 flex flex-col h-[60vh] md:h-[750px]">
                <Card className="flex-1 rounded-[32px] md:rounded-[48px] overflow-hidden bg-slate-100 flex flex-col border-4 md:border-[12px] border-white shadow-2xl relative">
                    <header className="bg-white border-b px-4 md:px-8 py-3 md:py-5 flex items-center justify-between z-10 shrink-0">
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">
                          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shrink-0"><Smartphone className="h-5 w-5 md:h-7 md:w-7 text-white" /></div>
                          <div className="min-w-0">
                            <h3 className="font-black text-sm md:text-lg truncate">WhatsApp Web</h3>
                            <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[8px] md:text-[9px] font-black uppercase text-green-600 tracking-widest">Live Preview</span></div>
                          </div>
                      </div>
                      <Badge variant="outline" className="h-7 md:h-9 px-2 md:px-4 font-black uppercase text-[8px] md:text-[10px] border-2 bg-slate-50 shrink-0">+91 {phoneNumber}</Badge>
                    </header>

                    <ScrollArea className="flex-1 p-4 md:p-8" ref={chatScrollRef}>
                      <div className="space-y-4 md:space-y-6 flex flex-col">
                        {liveChat.length === 0 && (
                          <div className="py-12 md:py-24 text-center space-y-4 opacity-20"><MessageCircle className="h-12 w-12 md:h-16 md:w-16 mx-auto" /><p className="font-black uppercase text-[10px] md:text-xs tracking-[0.3em]">Ready to simulate</p></div>
                        )}
                        {liveChat.map((msg: any, i: number) => (
                          <div key={i} className={cn(
                            "flex flex-col gap-1.5 max-w-[90%] md:max-w-[85%] animate-in slide-in-from-bottom-2 duration-300",
                            msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                          )}>
                            <div className={cn(
                              "p-3 md:p-4 rounded-[18px] md:rounded-[28px] text-[11px] md:text-[13px] font-medium shadow-sm leading-relaxed",
                              msg.role === 'user' 
                                ? "bg-primary text-white rounded-tr-none" 
                                : "bg-white text-slate-800 border-none rounded-tl-none"
                            )}>
                              {msg.text}
                            </div>
                            <span className="text-[8px] md:text-[9px] font-black uppercase opacity-30 tracking-widest px-2">
                              {msg.role === 'user' ? 'You' : 'RozgarMatrix Bot'} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="bg-white p-4 md:p-6 border-t shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.05)] z-10 shrink-0">
                      <form onSubmit={(e) => { e.preventDefault(); simulateReply(simReply); }} className="flex gap-2 md:gap-3">
                          <Input 
                            placeholder="Reply to bot..." 
                            value={simReply} 
                            onChange={(e) => setSimReply(e.target.value)} 
                            disabled={replyLoading}
                            className="h-12 md:h-14 flex-1 rounded-xl md:rounded-2xl bg-slate-50 border-none focus-visible:ring-primary/20 font-bold px-4 md:px-6 shadow-inner text-sm" 
                          />
                          <button type="submit" disabled={replyLoading || !simReply.trim()} className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 transition-all active:scale-90 shrink-0">
                            {replyLoading ? <Loader2 className="h-5 w-5 md:h-6 md:w-6 animate-spin" /> : <Send className="h-5 w-5 md:h-7 md:w-7" />}
                          </button>
                      </form>
                    </div>
                </Card>
              </div>
            </div>
          </div>
      </main>
    </div>
  );
}