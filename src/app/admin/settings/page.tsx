"use client"

import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  Save, 
  Loader2, 
  Key, 
  Eye, 
  EyeOff,
  Power,
  Copy,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Tag,
  Zap,
  Megaphone,
  Gift,
  Users,
  BrainCircuit,
  Target,
  Wand2,
  Smartphone,
  Crown,
  Briefcase,
  Star,
  Info,
  Clock,
  Percent,
  ReceiptIndianRupee,
  BellRing,
  RotateCcw,
  Building2,
  LayoutPanelTop
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { secureDispatch } from "@/actions/secure-dispatch";

const DEFAULT_PRICING = [
  { id: 'plan_basic', name: 'Standard Pack', credits: 50, price: 49, description: 'Ideal for freshers starting out.', bonusPercentage: 5 },
  { id: 'plan_pro', name: 'Professional Pack', credits: 150, price: 99, description: 'Best for active job seekers.', bonusPercentage: 10 },
  { id: 'plan_unlimited', name: 'Premium Member', credits: 1000, price: 299, description: 'Unlimited AI + Priority WhatsApp.', bonusPercentage: 15 }
];

const DEFAULT_SERVICE_COSTS = {
  aiJobAdviser: 10,
  aiSmartMatch: 10,
  interviewCoach: 20,
  resumeRefine: 5,
  appOptimizer: 10,
  whatsappAlerts: 1,
  starCandidateAlerts: 10,
  whatsappBroadcasting: 2,
  aiJobQuality: 5,
  featuredListing: 100,
  bannerPromotion: 100
};

const DEFAULT_LIMITS = {
  featuredListingDays: 30,
  bannerPromotionDays: 30,
  maxBroadcastReach: 500,
  gstPercentage: 18
};

const DEFAULT_OFFERS = {
  signupBonus: 10,
  profileBonus: 15,
  referralBonus: 5,
};

const DEFAULT_ADS_CONFIG = {
  isActive: true,
  publisherId: "ca-pub-3756451089935740",
  updatedAt: new Date().toISOString()
};

const DEFAULT_AUTOMATION = {
  lowBalanceAlerts: [
    "Namaste {first_name}, aapke wallet mein sirf {credits} credits bache hain. Job alerts paane ke liye recharge karein: {recharge_link}",
    "Namaste {first_name}, emergency alert! Sirf {credits} credit bacha hai. Balance khatam hote hi priority alerts ruk jayenge.",
    "Alert: Aapka balance 1 credit hai. Kripya turant recharge karein: {recharge_link}"
  ],
  recoveryMessages: [
    "Maaf kijiye {first_name}, aapka balance 0 ho gaya hai. Humne aapko naye jobs bhejna band kar diya hai. Recharge karein: {recharge_link}",
    "Final Offer: Recharge karein aur use karein code 'RECOVER10' for extra discount! {recharge_link}"
  ],
  isRecoveryEnabled: true,
  isAutomationActive: true
};

export default function AdminSettingsPage() {
  const db = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showRazorpaySecret, setShowRazorpaySecret] = useState(false);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);
  const [recoveryEnabled, setRecoveryEnabled] = useState(true);

  // Refs
  const whatsappSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "whatsapp");
  }, [db]);

  const razorpaySettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "razorpay");
  }, [db]);

  const pricingSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "pricing");
  }, [db]);

  const offersSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "offers");
  }, [db]);

  const automationRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "automation");
  }, [db]);

  const adSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "ads");
  }, [db]);

  const { data: settings, isLoading } = useDoc(whatsappSettingsRef);
  const { data: razorpaySettings, isLoading: isRazorpayLoading } = useDoc(razorpaySettingsRef);
  const { data: pricingSettings, isLoading: isPricingLoading } = useDoc(pricingSettingsRef);
  const { data: offersSettings, isLoading: isOffersLoading } = useDoc(offersSettingsRef);
  const { data: automationSettings, isLoading: isAutomationLoading } = useDoc(automationRef);
  const { data: adSettings, isLoading: isAdsLoading } = useDoc(adSettingsRef);

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (automationSettings) {
      setRecoveryEnabled(automationSettings.isRecoveryEnabled ?? true);
    }
  }, [automationSettings]);

  const DEFAULT_WEBHOOK_URL = `${origin}/api/whatsapp-webhook`;
  const DEFAULT_VERIFY_TOKEN = "chatmatrix_verify_123";

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  const handleToggleSystem = async (checked: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "settings", "whatsapp"), {
        isActive: checked,
        updatedAt: serverTimestamp()
      });
      toast({ title: checked ? "System Online" : "System Offline" });
    } catch (error) {
      console.error("Toggle WhatsApp system status error:", error);
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleSaveAds = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const isActive = formData.get('adActive') === 'on';
    const data = {
      isActive: isActive,
      publisherId: formData.get('publisherId') as string,
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, "settings", "ads"), data, { merge: true });
      toast({ title: "AdSense Settings Saved" });
    } catch (error) {
      console.error("Settings save error:", error);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWhatsapp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data: any = {
      phoneNumberId: formData.get('phoneNumberId') as string,
      whatsappBusinessAccountId: formData.get('whatsappBusinessAccountId') as string,
      webhookUrl: formData.get('webhookUrl') as string,
      verifyToken: formData.get('verifyToken') as string,
      updatedAt: serverTimestamp(),
    };
    if (isEditingToken || !settings?.accessToken) {
      const accessToken = formData.get('accessToken') as string;
      if (accessToken) data.accessToken = accessToken;
    }
    try {
      await setDoc(doc(db, "settings", "whatsapp"), data, { merge: true });
      toast({ title: "WhatsApp Settings Saved" });
      setIsEditingToken(false);
      setIsEditingWebhook(false);
    } catch (error) {
      console.error("Save WhatsApp settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRazorpay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      keyId: formData.get('keyId') as string,
      keySecret: formData.get('keySecret') as string,
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, "settings", "razorpay"), data, { merge: true });
      toast({ title: "Payment Settings Saved" });
    } catch (error) {
      console.error("Save Razorpay settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePricing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const plans = (pricingSettings?.plans || DEFAULT_PRICING).map(p => ({
      id: p.id,
      name: formData.get(`${p.id}_name`) as string,
      price: Number(formData.get(`${p.id}_price`)),
      credits: Number(formData.get(`${p.id}_credits`)),
      bonusPercentage: Number(formData.get(`${p.id}_bonus`) || 0),
      description: formData.get(`${p.id}_desc`) as string,
    }));

    const serviceCosts = {
      aiJobAdviser: Number(formData.get('cost_aiJobAdviser')),
      aiSmartMatch: Number(formData.get('cost_aiSmartMatch')),
      interviewCoach: Number(formData.get('cost_interviewCoach')),
      resumeRefine: Number(formData.get('cost_resumeRefine')),
      appOptimizer: Number(formData.get('cost_appOptimizer')),
      whatsappAlerts: Number(formData.get('cost_whatsappAlerts')),
      starCandidateAlerts: Number(formData.get('cost_starCandidateAlerts')),
      whatsappBroadcasting: Number(formData.get('cost_whatsappBroadcasting')),
      aiJobQuality: Number(formData.get('cost_aiJobQuality')),
      featuredListing: Number(formData.get('cost_featuredListing')),
      bannerPromotion: Number(formData.get('cost_bannerPromotion'))
    };

    const serviceLimits = {
      featuredListingDays: Number(formData.get('limit_featuredListingDays')),
      bannerPromotionDays: Number(formData.get('limit_bannerPromotionDays')),
      maxBroadcastReach: Number(formData.get('limit_maxBroadcastReach')),
      gstPercentage: Number(formData.get('limit_gstPercentage'))
    };

    try {
      await setDoc(doc(db, "settings", "pricing"), { 
        plans, 
        serviceCosts,
        serviceLimits,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: "Pricing & Limits Updated" });
    } catch (error) {
      console.error("Save pricing settings error:", error);
      toast({ variant: "destructive", title: "Pricing Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOffers = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      signupBonus: Number(formData.get('signupBonus')),
      profileBonus: Number(formData.get('profileBonus')),
      referralBonus: Number(formData.get('referralBonus')),
      updatedAt: serverTimestamp(),
    };
    try {
      await setDoc(doc(db, "settings", "offers"), data, { merge: true });
      toast({ title: "Growth Settings Saved" });
    } catch (error) {
      console.error("Save offers settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAutomation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      lowBalanceAlerts: [
        formData.get('alert_1') as string,
        formData.get('alert_2') as string,
        formData.get('alert_3') as string,
      ],
      recoveryMessages: [
        formData.get('recovery_1') as string,
        formData.get('recovery_2') as string,
      ],
      isAutomationActive: true,
      isRecoveryEnabled: recoveryEnabled,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "settings", "automation"), data, { merge: true });
      toast({ title: "Automation Rules Updated" });
    } catch (error) {
      console.error("Save automation settings error:", error);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || isRazorpayLoading || isPricingLoading || isOffersLoading || isAutomationLoading || isAdsLoading) {
    return <div className="p-8 flex justify-center items-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isSystemActive = !!settings?.isActive;
  const currentPlans = pricingSettings?.plans || DEFAULT_PRICING;
  const costs = pricingSettings?.serviceCosts || DEFAULT_SERVICE_COSTS;
  const limits = pricingSettings?.serviceLimits || DEFAULT_LIMITS;
  const currentOffers = offersSettings || DEFAULT_OFFERS;
  const automation = automationSettings || DEFAULT_AUTOMATION;
  const ads = adSettings || DEFAULT_ADS_CONFIG;

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            System Configuration
          </h1>
          <p className="text-muted-foreground mt-1">Manage API credentials, pricing, and feature limits.</p>
        </div>
        {isSystemActive && (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 px-4 py-1.5 gap-2 h-9 rounded-full">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            SYSTEM LIVE
          </Badge>
        )}
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-8">
        <TabsList className="bg-card border h-12 p-1 rounded-2xl shadow-sm overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger value="whatsapp" className="font-bold px-8 gap-2 rounded-xl">WhatsApp</TabsTrigger>
          <TabsTrigger value="payments" className="font-bold px-8 gap-2 rounded-xl">Razorpay</TabsTrigger>
          <TabsTrigger value="pricing" className="font-bold px-8 gap-2 rounded-xl">Pricing & Limits</TabsTrigger>
          <TabsTrigger value="automation" className="font-bold px-8 gap-2 rounded-xl text-primary">Automation</TabsTrigger>
          <TabsTrigger value="ads" className="font-bold px-8 gap-2 rounded-xl text-orange-600">Ads Control</TabsTrigger>
          <TabsTrigger value="growth" className="font-bold px-8 gap-2 rounded-xl text-accent">Growth Engine</TabsTrigger>
        </TabsList>

        <TabsContent value="ads" className="space-y-8">
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
             <div className="xl:col-span-8">
                <form onSubmit={handleSaveAds} className="space-y-8">
                  <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-orange-50 border-b p-8">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <LayoutPanelTop className="h-8 w-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-black text-orange-900">Google AdSense Control</CardTitle>
                          <CardDescription className="text-orange-700/70">Manage platform-wide advertisement visibility and revenue logic.</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="flex items-center justify-between p-6 bg-muted/30 rounded-2xl border-2 border-dashed">
                        <div className="space-y-1">
                          <Label className="text-lg font-black">Global Ads Toggle</Label>
                          <p className="text-xs text-muted-foreground font-medium">Turn ads ON or OFF for all non-active users instantly.</p>
                        </div>
                        <Switch name="adActive" defaultChecked={ads.isActive} className="scale-125 data-[state=checked]:bg-orange-500" />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="publisherId" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Publisher ID (ca-pub-...)</Label>
                        <Input id="publisherId" name="publisherId" defaultValue={ads.publisherId} placeholder="ca-pub-3756451089935740" className="h-14 rounded-2xl border-2 font-mono font-bold" required />
                      </div>

                      <div className="bg-blue-50 p-6 rounded-[24px] border-2 border-dashed border-blue-200 flex gap-4">
                        <Info className="h-6 w-6 text-blue-600 shrink-0" />
                        <div className="space-y-2">
                           <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">Smart Revenue Logic:</h4>
                           <ul className="text-xs text-blue-700 leading-relaxed space-y-1.5 font-medium list-disc pl-4">
                              <li>Ads sirf un users ko dikhte hain jinaka <strong>Balance 0</strong> hai aur koi <strong>Active Membership</strong> nahi hai.</li>
                              <li>Recharge khatam hote hi user ko automatically ads dikhna shuru ho jayenge.</li>
                              <li>Paid/Active users ko 100% clean VIP experience milega.</li>
                           </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/10 border-t p-8 flex justify-end">
                      <Button type="submit" disabled={saving} className="h-14 px-12 font-black text-lg gap-3 rounded-2xl shadow-xl shadow-orange-500/20 bg-orange-600 hover:bg-orange-700">
                        {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6" /> Update Ad Settings</>}
                      </Button>
                    </CardFooter>
                  </Card>
                </form>
             </div>
             
             <div className="xl:col-span-4">
                <Card className="border-none shadow-lg bg-slate-900 text-white rounded-[32px] overflow-hidden">
                   <CardHeader className="bg-slate-800 p-6">
                      <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                         <Zap className="h-4 w-4 text-orange-400" /> Revenue Insights
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="p-6 space-y-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400">Current Ad Status</p>
                        <Badge className={cn("h-7 px-4 font-black border-none", ads.isActive ? "bg-green-500" : "bg-red-500")}>
                           {ads.isActive ? "ADS RUNNING" : "ADS PAUSED"}
                        </Badge>
                      </div>
                      <div className="h-px bg-white/5" />
                      <p className="text-[11px] text-slate-400 leading-relaxed italic">
                        Note: Google AdSense optimization works best when units are placed natively between content. 
                        Aapki current placement Home, Job List aur Job Detail pages par optimized hai.
                      </p>
                   </CardContent>
                </Card>
             </div>
           </div>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-8">
          <form onSubmit={handleSavePricing} className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {currentPlans.map((plan: any) => (
                  <Card key={plan.id} className="border-none shadow-lg rounded-[24px] overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b py-5 flex flex-row items-center gap-3">
                       <Zap className="h-5 w-5 text-orange-500" />
                       <CardTitle className="text-sm font-black uppercase tracking-widest">{plan.id.replace('plan_', '').toUpperCase()} TIER</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                       <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Plan Name</Label>
                          <Input name={`${plan.id}_name`} defaultValue={plan.name} className="font-bold h-10" required />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Price (₹)</Label>
                            <Input name={`${plan.id}_price`} type="number" defaultValue={plan.price} className="font-black" required />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Base Credits</Label>
                            <Input name={`${plan.id}_credits`} type="number" defaultValue={plan.credits} className="font-black" required />
                          </div>
                       </div>
                       <div className="space-y-1 pt-2 border-t border-dashed">
                          <Label className="text-[10px] font-black uppercase text-accent flex items-center gap-1.5"><Percent className="h-3 w-3" /> Bonus Extra Credits (%)</Label>
                          <Input name={`${plan.id}_bonus`} type="number" defaultValue={plan.bonusPercentage || 0} placeholder="e.g. 10" className="font-black border-accent/20 focus-visible:ring-accent/20" />
                          <p className="text-[9px] text-muted-foreground italic">Applied on top of base credits for quantity &gt; 1.</p>
                       </div>
                    </CardContent>
                  </Card>
                ))}
             </div>

             <Card className="border-none shadow-xl rounded-[32px] overflow-hidden border-2 border-primary/10">
                <CardHeader className="bg-primary/5 border-b p-8">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                    Service Credit Costs & Limits
                  </CardTitle>
                  <CardDescription>Set credit costs and usage durations for each service.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                         <Users className="h-3 w-3" /> Job Seeker Tools
                       </h3>
                       {[
                         { id: 'aiJobAdviser', label: 'AI Job Adviser', icon: BrainCircuit },
                         { id: 'aiSmartMatch', label: 'AI Smart Match', icon: Target },
                         { id: 'interviewCoach', label: 'AI Interview Coach', icon: BrainCircuit },
                         { id: 'resumeRefine', label: 'Resume Refine', icon: Wand2 },
                         { id: 'appOptimizer', label: 'App Optimizer', icon: Tag },
                         { id: 'whatsappAlerts', label: 'WhatsApp Alerts', icon: MessageCircle }
                       ].map(s => (
                         <div key={s.id} className="flex items-center justify-between gap-4">
                            <Label className="text-sm font-bold flex items-center gap-2"><s.icon className="h-4 w-4 text-primary" /> {s.label}</Label>
                            <div className="flex items-center gap-2">
                              <Input name={`cost_${s.id}`} type="number" defaultValue={costs[s.id as keyof typeof costs] ?? DEFAULT_SERVICE_COSTS[s.id as keyof typeof DEFAULT_SERVICE_COSTS]} className="w-20 h-10 font-black text-center rounded-xl" />
                              <span className="text-[8px] font-black text-muted-foreground uppercase">CR</span>
                            </div>
                         </div>
                       ))}
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                         <Briefcase className="h-3 w-3" /> Employer Tools & Limits
                       </h3>
                       
                       <div className="space-y-4">
                          <div className="bg-muted/30 p-4 rounded-2xl space-y-4">
                             <div className="flex items-center justify-between gap-4">
                                <Label className="text-xs font-bold flex items-center gap-2"><Star className="h-4 w-4 text-orange-500" /> Featured Job</Label>
                                <div className="flex gap-2">
                                  <div className="text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Credits</p><Input name="cost_featuredListing" type="number" defaultValue={costs.featuredListing} className="w-16 h-9 font-black text-center" /></div>
                                  <div className="text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Days</p><Input name="limit_featuredListingDays" type="number" defaultValue={limits.featuredListingDays} className="w-16 h-9 font-black text-center" /></div>
                                </div>
                             </div>
                             <div className="flex items-center justify-between gap-4">
                                <Label className="text-xs font-bold flex items-center gap-2"><Megaphone className="h-4 w-4 text-blue-500" /> Banner Promo</Label>
                                <div className="flex gap-2">
                                  <div className="text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Credits</p><Input name="cost_bannerPromotion" type="number" defaultValue={costs.bannerPromotion} className="w-16 h-9 font-black text-center" /></div>
                                  <div className="text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Days</p><Input name="limit_bannerPromotionDays" type="number" defaultValue={limits.bannerPromotionDays} className="w-16 h-9 font-black text-center" /></div>
                                </div>
                             </div>
                          </div>

                          <div className="flex items-center justify-between gap-4">
                             <div className="space-y-0.5">
                                <Label className="text-sm font-bold flex items-center gap-2"><Smartphone className="h-4 w-4 text-primary" /> WA Broadcast</Label>
                                <p className="text-[9px] text-muted-foreground italic ml-6">Per message cost</p>
                             </div>
                             <div className="flex gap-2">
                               <div className="text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Per Msg</p><Input name="cost_whatsappBroadcasting" type="number" defaultValue={costs.whatsappBroadcasting} className="w-16 h-10 font-black text-center" /></div>
                               <div className="text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Max Reach</p><Input name="limit_maxBroadcastReach" type="number" defaultValue={limits.maxBroadcastReach} className="w-20 h-10 font-black text-center" /></div>
                             </div>
                          </div>

                          {[
                            { id: 'starCandidateAlerts', label: 'Star Alerts', icon: Crown },
                            { id: 'aiJobQuality', label: 'AI Job Check', icon: Zap }
                          ].map(s => (
                            <div key={s.id} className="flex items-center justify-between gap-4">
                               <Label className="text-sm font-bold flex items-center gap-2"><s.icon className="h-4 w-4 text-primary" /> {s.label}</Label>
                               <Input name={`cost_${s.id}`} type="number" defaultValue={costs[s.id as keyof typeof costs] ?? DEFAULT_SERVICE_COSTS[s.id as keyof typeof DEFAULT_SERVICE_COSTS]} className="w-20 h-10 font-black text-center rounded-xl" />
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-2 flex items-center gap-2">
                         <ReceiptIndianRupee className="h-3 w-3" /> Billing & Tax
                       </h3>
                       <div className="bg-muted/30 p-6 rounded-[24px] space-y-4">
                          <div className="space-y-1">
                             <Label className="text-xs font-bold">GST Percentage (%)</Label>
                             <div className="flex items-center gap-3">
                                <Input name="limit_gstPercentage" type="number" defaultValue={limits.gstPercentage || 18} className="h-10 font-black text-lg w-full rounded-xl" />
                                <span className="font-black text-slate-400">%</span>
                             </div>
                             <p className="text-[9px] text-muted-foreground leading-relaxed italic pt-1">Applied to all credit pack recharges.</p>
                          </div>
                       </div>
                    </div>
                  </div>
                </CardContent>
             </Card>
             
             <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="h-14 px-12 font-black text-lg gap-3 rounded-2xl shadow-xl shadow-primary/20">
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6" /> Save Pricing & Limits</>}
                </Button>
             </div>
          </form>
        </TabsContent>

        <TabsContent value="automation" className="space-y-8">
           <form onSubmit={handleSaveAutomation} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <Card className="border-none shadow-lg rounded-[32px] overflow-hidden">
                       <CardHeader className="bg-blue-50 border-b p-6">
                          <CardTitle className="text-lg flex items-center gap-3 text-blue-900">
                             <BellRing className="h-5 w-5 text-blue-600" />
                             Low Balance Alerts (Reserve Mode)
                          </CardTitle>
                          <CardDescription className="text-blue-700/70">Messages sent when user has 3, 2, and 1 credit remaining.</CardDescription>
                       </CardHeader>
                       <CardContent className="p-8 space-y-6">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Alert 1: 3 Credits Remaining</Label>
                             <Textarea name="alert_1" defaultValue={automation.lowBalanceAlerts[0]} className="min-h-[100px] border-blue-100 focus-visible:ring-blue-200" required />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Alert 2: 2 Credits Remaining</Label>
                             <Textarea name="alert_2" defaultValue={automation.lowBalanceAlerts[1]} className="min-h-[100px] border-blue-100 focus-visible:ring-blue-200" required />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Alert 3: 1 Credit Remaining</Label>
                             <Textarea name="alert_3" defaultValue={automation.lowBalanceAlerts[2]} className="min-h-[100px] border-blue-100 focus-visible:ring-blue-200" required />
                          </div>

                          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-4">
                            <p className="text-[10px] text-blue-800 font-black uppercase mb-2 tracking-widest">Available Dynamic Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono shadow-sm">{`{first_name}`}</code>
                              <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono shadow-sm">{`{credits}`}</code>
                              <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono shadow-sm">{`{recharge_link}`}</code>
                            </div>
                          </div>
                       </CardContent>
                    </Card>
                 </div>

                 <div className="space-y-6">
                    <Card className="border-none shadow-lg rounded-[32px] overflow-hidden">
                       <CardHeader className="bg-orange-50 border-b p-6 flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-3 text-orange-900">
                               <RotateCcw className="h-5 w-5 text-orange-600" />
                               Platform Recovery Messages (Free)
                            </CardTitle>
                            <CardDescription className="text-orange-700/70">Sent when balance is 0 to encourage refill.</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-black uppercase", recoveryEnabled ? "text-green-600" : "text-muted-foreground")}>{recoveryEnabled ? "ON" : "OFF"}</span>
                            <Switch checked={recoveryEnabled} onCheckedChange={setRecoveryEnabled} />
                          </div>
                       </CardHeader>
                       <CardContent className="p-8 space-y-6">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Recovery Message 1</Label>
                             <Textarea name="recovery_1" defaultValue={automation.recoveryMessages[0]} className="min-h-[100px] border-orange-100 focus-visible:ring-orange-200" required />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-orange-600 tracking-widest">Recovery Message 2 (Final Offer)</Label>
                             <Textarea name="recovery_2" defaultValue={automation.recoveryMessages[1]} className="min-h-[100px] border-orange-100 focus-visible:ring-orange-200" required />
                          </div>

                          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mt-4">
                            <p className="text-[10px] text-orange-800 font-black uppercase mb-2 tracking-widest">Available Dynamic Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono shadow-sm">{`{first_name}`}</code>
                              <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono shadow-sm">{`{recharge_link}`}</code>
                              <code className="bg-white px-2 py-1 rounded border text-[10px] font-mono shadow-sm">{`{coupon_code}`}</code>
                            </div>
                          </div>
                          
                          <div className="bg-muted/30 p-6 rounded-[24px] border border-dashed border-muted-foreground/20 space-y-4">
                             <div className="flex items-center gap-3">
                                <Info className="h-5 w-5 text-primary" />
                                <h4 className="font-bold text-sm">How it works</h4>
                             </div>
                             <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Automation sequence automatically trigger hogi jab koi naya job post hoga aur user priority list mein hoga. 
                                <br/><br/>
                                <strong>Logic:</strong>
                                <br/>- Step 1-3: Credits deduct honge (Reservation).
                                <br/>- Step 4-5: Platform-paid honge (No deduction).
                                <br/>- User recharge karte hi step 0 par reset ho jayega.
                             </p>
                          </div>
                       </CardContent>
                    </Card>
                 </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="h-14 px-12 font-black text-lg gap-3 rounded-2xl shadow-xl shadow-primary/20">
                    {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6" /> Update Automation Rules</>}
                </Button>
              </div>
           </form>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-8">
           <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div className="xl:col-span-8 space-y-8">
              <form onSubmit={handleSaveWhatsapp} className="space-y-8">
                <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden rounded-2xl">
                  <CardHeader className="bg-slate-800/50 border-b border-slate-700/50 flex flex-row items-center justify-between py-5">
                    <CardTitle className="text-lg flex items-center gap-2">Webhook Configuration</CardTitle>
                    {!isEditingWebhook && (
                      <Button type="button" variant="ghost" size="sm" className="text-xs font-bold text-blue-400" onClick={() => setIsEditingWebhook(true)}>Edit</Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Callback URL</Label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-slate-950 px-4 py-3 rounded-lg border border-slate-700 text-xs font-mono text-blue-300 truncate h-11 flex items-center">{settings?.webhookUrl || DEFAULT_WEBHOOK_URL}</div>
                          <Button type="button" size="icon" variant="ghost" className="shrink-0 h-11 w-11" onClick={() => handleCopy(settings?.webhookUrl || DEFAULT_WEBHOOK_URL, "Callback URL")}><Copy className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Verify Token</Label>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-slate-950 px-4 py-3 rounded-lg border border-slate-700 text-xs font-mono text-green-300 h-11 flex items-center">{settings?.verifyToken || DEFAULT_VERIFY_TOKEN}</div>
                          <Button type="button" size="icon" variant="ghost" className="shrink-0 h-11 w-11" onClick={() => handleCopy(settings?.verifyToken || DEFAULT_VERIFY_TOKEN, "Verify Token")}><Copy className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-lg overflow-hidden rounded-2xl">
                  <CardHeader className="bg-muted/30 border-b py-5"><CardTitle className="text-lg flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> API Credentials</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumberId" className="font-bold text-xs uppercase">Phone Number ID</Label>
                        <Input id="phoneNumberId" name="phoneNumberId" defaultValue={settings?.phoneNumberId} required className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsappBusinessAccountId" className="font-bold text-xs uppercase flex items-center gap-2">
                          <Building2 className="h-3 w-3" /> WABA Account ID
                        </Label>
                        <Input id="whatsappBusinessAccountId" name="whatsappBusinessAccountId" defaultValue={settings?.whatsappBusinessAccountId} placeholder="Required for Templates" className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="font-bold text-xs uppercase">Permanent Access Token</Label>
                      {settings?.accessToken && !isEditingToken ? (
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border-2 border-dashed">
                          <p className="font-mono text-sm tracking-widest">****************{settings.accessToken.slice(-6)}</p>
                          <Button type="button" variant="ghost" size="sm" className="font-bold text-primary" onClick={() => setIsEditingToken(true)}>Change</Button>
                        </div>
                      ) : (
                        <div className="relative">
                          <Input id="accessToken" name="accessToken" type={showToken ? "text" : "password"} className="pr-12 h-12 border-2 rounded-xl" required />
                          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full w-12" onClick={() => setShowToken(!showToken)}>{showToken ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t p-6 flex justify-end"><Button type="submit" disabled={saving} className="font-black px-12 h-12 shadow-xl shadow-primary/20 rounded-xl">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save WhatsApp</Button></CardFooter>
                </Card>
              </form>
            </div>
            <div className="xl:col-span-4 space-y-6">
              <Card className="border-none shadow-lg overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b py-5"><CardTitle className="text-lg flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Service Status</CardTitle></CardHeader>
                <CardContent className="p-6 flex flex-col items-center gap-4 text-center">
                  <div className={cn("h-16 w-16 rounded-[24px] flex items-center justify-center shadow-lg transition-all", isSystemActive ? "bg-green-50 text-white" : "bg-slate-400 text-white")}><Power className="h-8 w-8" /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Bot Engine Status</h3>
                  <Switch checked={isSystemActive} onCheckedChange={handleToggleSystem} className="scale-150 my-2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-8">
           <form onSubmit={handleSaveRazorpay} className="max-w-3xl space-y-8">
            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
              <CardHeader className="bg-primary/5 border-b py-8 px-8">
                <div className="flex items-center gap-4"><div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"><CreditCard className="h-8 w-8 text-white" /></div><CardTitle className="text-2xl font-black">Razorpay Settings</CardTitle></div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-3"><Label htmlFor="keyId" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Key ID</Label><Input id="keyId" name="keyId" defaultValue={razorpaySettings?.keyId} placeholder="rzp_test_..." className="h-14 rounded-2xl border-2 font-mono" required /></div>
                <div className="space-y-3">
                  <Label htmlFor="keySecret" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Key Secret</Label>
                  <div className="relative">
                    <Input id="keySecret" name="keySecret" type={showRazorpaySecret ? "text" : "password"} defaultValue={razorpaySettings?.keySecret} className="h-14 pr-12 rounded-2xl border-2 font-mono" required />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10" onClick={() => setShowRazorpaySecret(!showRazorpaySecret)}>{showRazorpaySecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-8 flex justify-end"><Button type="submit" disabled={saving} className="h-14 px-12 font-black text-lg gap-3 rounded-2xl shadow-xl shadow-primary/20">{saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ShieldCheck className="h-6 w-6" /> Save Payment Keys</>}</Button></CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="growth" className="space-y-8">
           <form onSubmit={handleSaveOffers} className="max-w-4xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="border-none shadow-lg rounded-[32px] overflow-hidden">
                    <CardHeader className="bg-accent/5 border-b p-6"><CardTitle className="text-lg flex items-center gap-2"><Gift className="h-5 w-5 text-accent" />Bonus Offers</CardTitle></CardHeader>
                    <CardContent className="p-8 space-y-8">
                       <div className="space-y-3"><Label htmlFor="signupBonus" className="text-xs font-black uppercase tracking-widest">Sign-up Bonus</Label><Input id="signupBonus" name="signupBonus" type="number" defaultValue={currentOffers.signupBonus} className="h-12 rounded-xl border-2 font-black" required /></div>
                       <div className="space-y-3"><Label htmlFor="profileBonus" className="text-xs font-black uppercase tracking-widest">Profile Bonus (100%)</Label><Input id="profileBonus" name="profileBonus" type="number" defaultValue={currentOffers.profileBonus} className="h-12 rounded-xl border-2 font-black" required /></div>
                       <div className="space-y-3"><Label htmlFor="referralBonus" className="text-xs font-black uppercase tracking-widest">Referral Bonus</Label><Input id="referralBonus" name="referralBonus" type="number" defaultValue={currentOffers.referralBonus} className="h-12 rounded-xl border-2 font-black" required /></div>
                    </CardContent>
                    <CardFooter className="bg-accent/5 border-t p-6 flex justify-end"><Button type="submit" disabled={saving} className="h-12 px-8 font-black gap-2 rounded-xl bg-accent hover:bg-accent/90">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Update Growth Rules</Button></CardFooter>
                 </Card>
              </div>
           </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
