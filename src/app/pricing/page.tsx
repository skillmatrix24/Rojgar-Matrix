
"use client"

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { OfferBanner } from "@/components/layout/OfferBanner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Zap, 
  Sparkles, 
  MessageCircle, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight,
  Wallet,
  Crown,
  Info,
  Wand2,
  FileText,
  Target,
  Loader2,
  Smartphone,
  Trophy,
  Briefcase,
  Users,
  Star,
  Megaphone,
  Clock,
  IndianRupee,
  Plus,
  Minus,
  ShoppingCart,
  Scale,
  Tag,
  X,
  Gift
} from "lucide-react";
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import Script from "next/script";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppHeader } from "@/components/mobile-app/AppHeader";

const DEFAULT_PLANS = [
  { id: 'plan_basic', name: 'Standard Pack', credits: 50, price: 49, description: 'Ideal for freshers starting their career.', bonusPercentage: 5 },
  { id: 'plan_pro', name: 'Professional Pack', credits: 150, price: 99, description: 'Best for active job seekers.', featured: true, bonusPercentage: 10 },
  { id: 'plan_unlimited', name: 'Premium Member', credits: 1000, price: 299, description: 'Unlimited AI + Priority WhatsApp Support.', bonusPercentage: 15 }
];

export default function PricingPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);

  // Coupon States
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const razorpaySettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "razorpay");
  }, [db]);
  const { data: razorpayConfig } = useDoc(razorpaySettingsRef);

  const pricingRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "pricing");
  }, [db]);
  const { data: pricingConfig, isLoading: isPricingLoading } = useDoc(pricingRef);

  const displayPlans = pricingConfig?.plans?.map((p: any) => {
    const fallback = DEFAULT_PLANS.find(f => f.id === p.id);
    return { ...fallback, ...p };
  }) || DEFAULT_PLANS;

  const costs = pricingConfig?.serviceCosts || {
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

  const limits = pricingConfig?.serviceLimits || {
    featuredListingDays: 30,
    bannerPromotionDays: 30,
    maxBroadcastReach: 500,
    gstPercentage: 18
  };

  const handlePlanClick = (plan: any) => {
    if (!user) { router.push('/login?redirect=/pricing'); return; }
    setSelectedPlan(plan);
    setQuantity(1);
    setAppliedCoupon(null);
    setCouponInput("");
    setShowCouponInput(false);
    setIsRechargeOpen(true);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput || !db) return;
    setIsApplyingCoupon(true);
    try {
      const q = query(
        collection(db, "coupons"), 
        where("code", "==", couponInput.toUpperCase().trim()),
        where("isActive", "==", true),
        limit(1)
      );
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon", description: "This code does not exist or is inactive." });
        setIsApplyingCoupon(false);
        return;
      }

      const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;

      // Expiry Check
      if (coupon.expiryDate) {
        const expiry = new Date(coupon.expiryDate).getTime();
        if (Date.now() > expiry) {
          toast({ variant: "destructive", title: "Coupon Expired", description: "This code is no longer valid." });
          setIsApplyingCoupon(false);
          return;
        }
      }

      // Min Purchase Check (in credits)
      const totalCreditsToBuy = (selectedPlan?.credits || 0) * quantity;
      if (coupon.minPurchase && totalCreditsToBuy < coupon.minPurchase) {
        toast({ variant: "destructive", title: "Min Purchase Not Met", description: `Minimum ${coupon.minPurchase} credits required for this code.` });
        setIsApplyingCoupon(false);
        return;
      }

      setAppliedCoupon(coupon);
      toast({ title: "Coupon Applied!", description: "Discount has been added to your bill." });
    } catch (e) {
      console.error("Coupon validation error:", e);
      toast({ variant: "destructive", title: "Error", description: "Could not validate coupon." });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) return;
    setBuyingPlanId(selectedPlan.id);
    setPaymentLoading(true);
    try {
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: selectedPlan.id,
          quantity: quantity,
          couponCode: appliedCoupon?.code
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);
      const rzpKey = razorpayConfig?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!rzpKey) { toast({ variant: "destructive", title: "Config Error", description: "Payment gateway key missing." }); return; }
      
      const options = {
        key: rzpKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Rojgar Matrix",
        description: `${quantity}x ${selectedPlan.name}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              ...response, 
              planId: selectedPlan.id, 
              userId: user.uid,
              quantity: quantity,
              couponCode: appliedCoupon?.code
            })
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            toast({ title: "Purchase Successful!", description: `Credits have been added to your wallet.` });
            setIsRechargeOpen(false);
            router.push('/profile?tab=wallet');
          }
        },
        prefill: { name: user.displayName || '', email: user.email || '', contact: user.phoneNumber || '' },
        theme: { color: "#3b82f6" }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Pricing Razorpay checkout error:", error);
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setPaymentLoading(false);
      setBuyingPlanId(null);
    }
  };

  const SEEKER_USAGE = [
    { name: "AI Job Adviser", cost: costs.aiJobAdviser, icon: Sparkles, desc: "Selection probability & Hinglish tips." },
    { name: "AI Smart Match", cost: costs.aiSmartMatch, icon: Target, desc: "Contextual job recommendations." },
    { name: "AI Mock Interview", cost: costs.interviewCoach, icon: BrainCircuit, desc: "Live practice with performance score." },
    { name: "AI Resume Refine", cost: costs.resumeRefine, icon: Wand2, desc: "ATS optimization for your summary." },
    { name: "App Optimizer", cost: costs.appOptimizer, icon: FileText, desc: "Tailor applications to specific jobs." },
    { name: "WhatsApp Alerts", cost: costs.whatsappAlerts, icon: MessageCircle, desc: "Priority matching job notifications." }
  ];

  const EMPLOYER_USAGE = [
    { name: "Star Leads", cost: costs.starCandidateAlerts, icon: Crown, desc: "AI-verified candidate WhatsApp alerts." },
    { name: "WA Broadcast", cost: costs.whatsappBroadcasting, icon: Smartphone, desc: `Direct alerts. Max reach: ${limits.maxBroadcastReach} users.`, unit: "Per Msg" },
    { name: "AI Job Check", cost: costs.aiJobQuality, icon: Zap, desc: "Improve listing visibility with AI." },
    { name: "Featured Listing", cost: costs.featuredListing, icon: Star, desc: `Pin job to the top for ${limits.featuredListingDays} days.`, duration: `${limits.featuredListingDays} Days` },
    { name: "Banner Promotion", cost: costs.bannerPromotion, icon: Megaphone, desc: `Display ads to all for ${limits.bannerPromotionDays} days.`, duration: `${limits.bannerPromotionDays} Days` }
  ];

  // Bill Calculation Logic
  const subtotal = (selectedPlan?.price || 0) * quantity;
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = Math.round(subtotal * (appliedCoupon.discountValue / 100));
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstRate = limits.gstPercentage || 18;
  const gstAmount = Math.round(taxableAmount * (gstRate / 100));
  const totalPrice = taxableAmount + gstAmount;

  const baseCredits = (selectedPlan?.credits || 0) * quantity;
  const bonusCredits = quantity > 1 ? Math.round(baseCredits * ((selectedPlan?.bonusPercentage || 0) / 100)) : 0;
  const totalCredits = baseCredits + bonusCredits;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 pb-20">
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="md:hidden">
        <AppHeader />
      </div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <OfferBanner />
      <main className="flex-1 py-10 md:py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center space-y-4 mb-12 md:mb-16">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">Choose Your <span className="text-primary">Success Plan</span></h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto font-medium">Unlock AI tools and WhatsApp priority. 10x faster hiring journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-24">
            {displayPlans.map((plan: any) => (
              <Card key={plan.id} className={cn("border-none shadow-xl relative overflow-hidden transition-all duration-500 flex flex-col rounded-[32px] md:rounded-[40px]", plan.featured && "scale-100 md:scale-105 ring-8 ring-primary/10 z-10")}>
                {plan.featured && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] md:text-[10px] font-black px-4 md:px-5 py-2 uppercase rounded-bl-2xl shadow-lg">Best Value</div>}
                <CardHeader className="p-6 md:p-8 pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl md:text-2xl font-black">{plan.name}</CardTitle>
                    {plan.bonusPercentage > 0 && (
                      <Badge className="bg-accent text-white border-none font-black text-[8px] md:text-[9px] uppercase tracking-widest h-5">Up to +{plan.bonusPercentage}% Extra</Badge>
                    )}
                  </div>
                  <CardDescription className="font-bold text-muted-foreground text-xs md:text-sm">{plan.description}</CardDescription>
                  <div className="pt-6 md:pt-8 flex items-baseline gap-2"><span className="text-4xl md:text-6xl font-black">₹{plan.price}</span><span className="text-muted-foreground font-black uppercase text-[8px] md:text-[10px] tracking-widest">Per Pack</span></div>
                </CardHeader>
                <CardContent className="p-6 md:p-8 pt-4 flex-1 space-y-6 md:space-y-8">
                  <div className="flex items-center gap-3 md:gap-4 p-4 md:p-5 bg-primary/5 rounded-2xl md:rounded-3xl border-2 border-dashed border-primary/20">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-primary flex items-center justify-center shrink-0"><Wallet className="h-5 w-5 md:h-6 md:w-6 text-white" /></div>
                    <div><p className="text-lg md:text-xl font-black text-primary">{plan.credits} Credits</p><p className="text-[8px] md:text-[10px] text-muted-foreground font-black uppercase">Base credits per pack</p></div>
                  </div>
                  <div className="space-y-3 md:space-y-4">{["Priority WhatsApp Alerts", "AI Profile Analysis", "Professional PDF Resumes", "Direct Hiring Connections"].map((f, i) => (<div key={i} className="flex items-center gap-3"><div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Check className="h-3 md:h-3.5 w-3 md:w-3.5 text-green-600" /></div><span className="text-xs md:text-sm font-bold text-slate-700">{f}</span></div>))}</div>
                </CardContent>
                <CardFooter className="p-6 md:p-8 pt-0"><Button onClick={() => handlePlanClick(plan)} className="w-full h-14 md:h-16 text-base md:text-lg font-black gap-3 shadow-2xl rounded-xl md:rounded-2xl" variant={plan.featured ? "default" : "outline"}>RECHARGE NOW</Button></CardFooter>
              </Card>
            ))}
          </div>

          <section className="mb-20 md:mb-24 space-y-12 md:space-y-16">
             <div className="text-center space-y-3"><Badge variant="outline" className="h-8 px-4 md:px-5 border-primary/20 text-primary font-black uppercase gap-2 bg-primary/5"><Info className="h-4 w-4" /> Credit Usage Guide</Badge><h2 className="text-3xl md:text-5xl font-black">Platform <span className="text-primary">Service Costs</span></h2></div>
             <div className="space-y-12 md:space-y-16">
               <div className="space-y-6 md:space-y-8">
                 <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4"><Trophy className="h-5 w-5 md:h-6 md:w-6 text-orange-500" /><h3 className="text-lg md:text-xl font-black uppercase tracking-tight">For Job Seekers</h3></div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {SEEKER_USAGE.map((item, i) => (
                      <Card key={i} className="border-none shadow-sm group overflow-hidden bg-card rounded-[24px] md:rounded-[32px]"><CardContent className="p-6 md:p-8 flex flex-col items-center text-center space-y-4 md:space-y-5"><div className="h-14 w-14 md:h-16 md:w-16 rounded-[20px] md:rounded-[24px] bg-muted flex items-center justify-center group-hover:bg-primary/5 transition-all"><item.icon className="h-7 w-7 md:h-8 md:w-8 text-primary" /></div><div className="space-y-1"><h4 className="font-black text-base md:text-lg">{item.name}</h4><p className="text-[10px] md:text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{item.desc}</p></div><Badge className="h-8 md:h-9 px-5 md:px-6 font-black text-xs md:text-sm text-primary bg-primary/10 border-none rounded-full">{item.cost} Credits</Badge></CardContent></Card>
                    ))}
                 </div>
               </div>
               <div className="space-y-6 md:space-y-8">
                 <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4"><Briefcase className="h-5 w-5 md:h-6 md:w-6 text-primary" /><h3 className="text-lg md:text-xl font-black uppercase tracking-tight">For Employers</h3></div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {EMPLOYER_USAGE.map((item, i) => (
                      <Card key={i} className="border-none shadow-sm group overflow-hidden bg-white/50 rounded-[24px] md:rounded-[32px]">
                        <CardContent className="p-6 md:p-8 flex flex-col items-center text-center space-y-4 md:space-y-5">
                          <div className="h-14 w-14 md:h-16 md:w-16 rounded-[20px] md:rounded-[24px] bg-slate-100 flex items-center justify-center group-hover:rotate-3 transition-all">
                            <item.icon className="h-7 w-7 md:h-8 md:w-8 text-[#003366]" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-black text-base md:text-lg text-slate-800">{item.name}</h4>
                            <p className="text-[10px] md:text-[11px] text-slate-500 leading-relaxed line-clamp-2">{item.desc}</p>
                            {item.duration && (
                              <div className="flex items-center justify-center gap-1.5 text-[8px] md:text-[9px] font-black text-primary uppercase mt-1">
                                <Clock className="h-3 w-3" /> Duration: {item.duration}
                              </div>
                            )}
                          </div>
                          <Badge className="h-8 md:h-9 px-5 md:px-6 font-black text-xs md:text-sm text-[#003366] bg-slate-100 border-none rounded-full">{item.cost} Credits {item.unit && <span className="opacity-50 ml-1">/ {item.unit}</span>}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                 </div>
               </div>
             </div>
          </section>

          <Card className="border-none shadow-2xl bg-[#003366] text-white rounded-[32px] md:rounded-[48px] overflow-hidden relative">
            <CardContent className="p-8 md:p-20 flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-12 relative z-10">
               <div className="space-y-6 md:space-y-8 max-w-xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 md:px-5 py-2 rounded-full bg-white/10 text-white font-black text-[9px] md:text-[10px] uppercase border border-white/20"><ShieldCheck className="h-4 md:h-5 w-4 md:w-5 text-blue-300" /> Secure Payments by Razorpay</div>
                  <h2 className="text-3xl md:text-6xl font-black leading-[1.1] tracking-tighter">Enterprise Solutions?</h2>
                  <h3 className="text-blue-100 text-base md:text-xl font-medium">Bulk recruitment and training center packs available.</h3>
                  <Button variant="secondary" size="lg" className="h-14 md:h-16 px-10 md:px-12 font-black text-base md:text-lg gap-3 bg-white text-[#003366] rounded-xl md:rounded-2xl w-full sm:w-auto">Talk to Sales <ArrowRight className="h-5 w-5" /></Button>
               </div>
               <div className="grid grid-cols-2 gap-3 md:gap-4 shrink-0 w-full sm:w-auto">
                  <div className="space-y-3 md:space-y-4 mt-6 md:mt-8">
                     <div className="bg-white/10 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-white/10 text-center shadow-inner"><Trophy className="h-6 md:h-8 w-6 md:w-8 text-yellow-400 mx-auto mb-2" /><p className="font-black text-xs md:text-sm">Top Rated</p></div>
                     <div className="bg-white/10 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-white/10 text-center shadow-inner"><Users className="h-6 md:h-8 w-6 md:w-8 text-blue-300 mx-auto mb-2" /><p className="font-black text-xs md:text-sm">5k+ Users</p></div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                     <div className="bg-white/10 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-white/10 text-center shadow-inner"><ShieldCheck className="h-6 md:h-8 w-6 md:w-8 text-green-400 mx-auto mb-2" /><p className="font-black text-xs md:text-sm">Verified</p></div>
                     <div className="bg-white/10 p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-white/10 text-center shadow-inner"><Zap className="h-6 md:h-8 w-6 md:w-8 text-white mx-auto mb-2" /><p className="font-black text-xs md:text-sm">Instant Refill</p></div>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none bg-white max-h-[95vh] overflow-y-auto">
          <DialogHeader className="p-5 md:p-6 bg-muted/20 border-b">
            <DialogTitle className="text-xl md:text-2xl font-black flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-primary" /> Recharge Wallet
            </DialogTitle>
            <DialogDescription className="text-[10px] md:text-xs font-bold text-slate-700">
               Multiple packs (2+) add extra bonus credits!
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 md:p-6 space-y-6">
             {/* Total Credits Display */}
             <div className="text-center space-y-0.5 py-2 animate-in zoom-in duration-500">
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">You will receive</p>
                <div className="flex items-center justify-center gap-2 md:gap-3">
                   <span className="text-4xl md:text-6xl font-black text-primary drop-shadow-sm leading-none">{totalCredits}</span>
                   <span className="text-sm md:text-lg font-bold text-slate-400 uppercase tracking-widest pt-1">Credits</span>
                </div>
                {bonusCredits > 0 && (
                   <p className="text-[8px] md:text-[9px] font-black text-accent uppercase tracking-wider flex items-center justify-center gap-1.5 mt-2">
                      <Sparkles className="h-3 w-3" /> Includes {bonusCredits} Bonus Credits!
                   </p>
                )}
             </div>

             <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border-2 border-primary/20">
                <div className="space-y-0.5 min-w-0 pr-2">
                   <p className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest truncate">{selectedPlan?.name}</p>
                   <h4 className="text-base md:text-lg font-black text-slate-900">₹{selectedPlan?.price} / Pack</h4>
                </div>
                <div className="flex items-center gap-2 md:gap-3 bg-white p-1 rounded-xl shadow-sm border shrink-0">
                   <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-lg" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-3.5 w-3.5" /></Button>
                   <span className="text-sm md:text-lg font-black min-w-[20px] text-center">{quantity}</span>
                   <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 rounded-lg" onClick={() => setQuantity(q => q + 1)}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
             </div>

             {/* Coupon Section */}
             <div className="space-y-3">
                {!appliedCoupon ? (
                  showCouponInput ? (
                    <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                          placeholder="ENTER CODE" 
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="pl-9 h-10 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        className="h-10 rounded-xl px-4 md:px-6 font-black bg-accent text-white text-[10px]" 
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponInput}
                      >
                        {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "APPLY"}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" onClick={() => setShowCouponInput(false)}><X className="h-4 w-4" /></Button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowCouponInput(true)}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-accent/20 text-accent font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent/5 transition-all"
                    >
                      <Gift className="h-3.5 w-3.5" /> I have a coupon code
                    </button>
                  )
                ) : (
                  <div className="bg-green-50 border-2 border-green-200 p-3 rounded-xl flex items-center justify-between animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0"><Check className="h-4 w-4" /></div>
                       <div>
                          <p className="text-[8px] font-black uppercase text-green-700 tracking-widest">Code Applied</p>
                          <p className="text-xs font-black text-green-900">{appliedCoupon.code}</p>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => setAppliedCoupon(null)}><X className="h-4 w-4" /></Button>
                  </div>
                )}
             </div>

             <div className="space-y-2.5">
                <div className="flex justify-between items-center text-[10px] md:text-[11px]">
                   <span className="font-bold text-muted-foreground uppercase tracking-wider">Base Credits ({quantity}x)</span>
                   <span className="font-black text-sm">{baseCredits}</span>
                </div>
                {bonusCredits > 0 && (
                  <div className="flex justify-between items-center text-[10px] md:text-[11px] text-accent animate-in fade-in zoom-in duration-300">
                     <span className="font-black flex items-center gap-1.5 uppercase text-[8px] md:text-[9px]"><Gift className="h-3 w-3" /> Bonus Extra ({selectedPlan?.bonusPercentage}%)</span>
                     <span className="font-black">+{bonusCredits}</span>
                  </div>
                )}
                
                <div className="h-px bg-border w-full border-dashed my-1" />
                
                <div className="space-y-2 bg-muted/40 p-4 rounded-2xl border">
                   <div className="flex justify-between items-center text-[9px] md:text-[10px] font-bold text-slate-500">
                      <span className="uppercase tracking-widest">Subtotal</span>
                      <span className={cn(appliedCoupon && "line-through opacity-50")}>₹{subtotal}</span>
                   </div>
                   {appliedCoupon && (
                      <div className="flex justify-between items-center text-[9px] md:text-[10px] font-black text-green-600 animate-in slide-in-from-right-2 duration-300">
                        <span className="uppercase tracking-widest flex items-center gap-1">Discount <Tag className="h-3 w-3" /></span>
                        <span>- ₹{discountAmount}</span>
                      </div>
                   )}
                   <div className="flex justify-between items-center text-[9px] md:text-[10px] font-bold text-slate-500">
                      <span className="uppercase tracking-widest flex items-center gap-1.5">GST ({gstRate}%) <Scale className="h-3 w-3" /></span>
                      <span>₹{gstAmount}</span>
                   </div>
                   <div className="h-px bg-slate-200 w-full my-1.5" />
                   <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider">Total Bill</span>
                      <span className="text-lg md:text-xl font-black text-primary flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{totalPrice}</span>
                   </div>
                </div>
             </div>
          </div>
          <DialogFooter className="p-5 md:p-6 pt-0 flex flex-col sm:flex-row gap-3">
             <Button variant="ghost" className="font-bold h-11 md:h-12 rounded-xl sm:flex-1 text-xs text-slate-500" onClick={() => setIsRechargeOpen(false)}>Cancel</Button>
             <Button 
                onClick={handlePurchase} 
                disabled={paymentLoading} 
                className="h-12 md:h-14 font-black text-sm md:text-base sm:flex-[2] rounded-xl gap-2 shadow-xl shadow-primary/20 bg-primary text-white"
             >
                {paymentLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> PAY SECURELY</>}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
