"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Gift, 
  MessageCircle, 
  Copy, 
  Check, 
  Target, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  CircleArrowRight,
  Share2,
  Smartphone
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ReferralTabProps {
  profile: any;
}

export function ReferralTab({ profile }: ReferralTabProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const db = useFirestore();
  const [copied, setCopied] = useState(false);

  const offersRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "offers");
  }, [db]);
  const { data: offers } = useDoc(offersRef);

  const referralLink = useMemo(() => {
    if (typeof window === 'undefined' || !profile?.id) return "";
    return `${window.location.origin}/login?ref=${profile.id}`;
  }, [profile?.id]);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Link Copied!", description: "Doston ko share karein aur credits kamayein." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(`Namaste! RozgarMatrix par AI Resume aur WhatsApp Job Alerts bilkul free mein mil rahe hain. Mere link se join kijiye aur aapko bhi free credits milenge: ${referralLink}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="md:col-span-2 border-none shadow-2xl bg-purple-600 text-white rounded-[40px] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Gift className="h-32 w-32" />
            </div>
            <CardContent className="p-10 space-y-8 relative z-10">
               <div className="space-y-2">
                  <Badge className="bg-white/20 text-white border-none font-black uppercase text-[10px] tracking-widest px-4 py-1">Growth Program</Badge>
                  <h2 className="text-4xl font-black tracking-tight">Invite doston ko aur <br /><span className="text-yellow-300">Credits Kamayein!</span></h2>
               </div>
               <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-8">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Friends Joined</p>
                     <h4 className="text-4xl font-black">{profile?.referralCount || 0}</h4>
                  </div>
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Lifetime Earnings</p>
                     <h4 className="text-4xl font-black text-yellow-300">+{profile?.totalReferralEarnings || 0}</h4>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[40px] flex flex-col justify-center items-center text-center p-8 space-y-6 overflow-hidden relative">
            <div className="h-20 w-20 rounded-[32px] bg-white/5 flex items-center justify-center text-purple-400">
               <Award className="h-10 w-10" />
            </div>
            <div className="space-y-1">
               <h4 className="font-black text-xl">Earn {offers?.referralBonus || 10} Credits</h4>
               <p className="text-xs font-medium text-slate-400 leading-relaxed px-2">
                  Every successful signup via your link gives you bonus credits instantly.
               </p>
            </div>
         </Card>
      </div>

      {/* Share Section */}
      <Card className="border-none shadow-xl rounded-[40px] bg-card overflow-hidden">
         <CardHeader className="bg-muted/30 border-b p-8">
            <CardTitle className="text-xl font-black flex items-center gap-3">
               <Share2 className="h-6 w-6 text-primary" /> Your Referral Hub
            </CardTitle>
            <CardDescription className="text-sm font-medium">Use your unique link to start inviting your network.</CardDescription>
         </CardHeader>
         <CardContent className="p-8 space-y-10">
            <div className="space-y-4">
               <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Unique Referral Link</Label>
               <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-slate-50 px-6 py-4 rounded-[20px] border-2 border-dashed border-slate-200 font-mono text-xs text-slate-600 truncate flex items-center h-14">
                     {referralLink}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleCopyLink} variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black gap-2 active:scale-95 transition-all">
                       {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-primary" />}
                       {copied ? "COPIED" : "COPY LINK"}
                    </Button>
                    <Button onClick={handleShareWhatsApp} className="h-14 px-8 bg-green-600 hover:bg-green-700 font-black rounded-2xl gap-3 shadow-xl shadow-green-100 active:scale-95 transition-all">
                       <MessageCircle className="h-6 w-6" /> WHATSAPP
                    </Button>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-dashed">
               <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                     <Smartphone className="h-5 w-5" />
                  </div>
                  <h5 className="font-black text-sm uppercase tracking-tight">1. Share Link</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">Send your link to friends or post on social media.</p>
               </div>
               <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                     <UserCheck className="h-5 w-5" />
                  </div>
                  <h5 className="font-black text-sm uppercase tracking-tight">2. Friend Joins</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">They register on RozgarMatrix using your link.</p>
               </div>
               <div className="space-y-3">
                  <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                     <Sparkles className="h-5 w-5" />
                  </div>
                  <h5 className="font-black text-sm uppercase tracking-tight">3. Both Earn</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">You get {offers?.referralBonus || 10} credits, they get signup bonus!</p>
               </div>
            </div>
         </CardContent>
      </Card>

      {/* Reward Summary */}
      <div className="bg-primary/5 p-8 rounded-[40px] border-2 border-dashed border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
               <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
               <h4 className="text-xl font-black text-slate-900">Need more credits?</h4>
               <p className="text-sm text-muted-foreground font-medium">Inviting friends is the fastest way to get free AI analysis sessions.</p>
            </div>
         </div>
         <Link href="/pricing">
            <Button variant="link" className="font-black text-primary gap-2 text-base">Check Pricing Plans <ArrowRight className="h-5 w-5" /></Button>
         </Link>
      </div>
    </div>
  );
}
