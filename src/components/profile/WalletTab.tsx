"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Wallet, 
  Zap, 
  History, 
  TrendingUp, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Crown, 
  CheckCircle2, 
  Clock, 
  Loader2,
  Gift,
  Target,
  UserCheck,
  Users,
  Minus,
  Plus,
  IndianRupee,
  ShoppingCart,
  Scale,
  Tag,
  X,
  Share2,
  Copy,
  Check,
  MessageCircle
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCollection, useMemoFirebase, useFirestore, useDoc, useUser } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, getDocs } from "firebase/firestore";
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
import Link from "next/link";

interface WalletTabProps {
  profile: any;
}

const DEFAULT_PLANS = [
  { id: 'plan_basic', name: 'Standard Pack', credits: 50, price: 49, description: 'Ideal for freshers', color: 'border-blue-200 bg-blue-50/30', bonusPercentage: 5 },
  { id: 'plan_pro', name: 'Professional Pack', credits: 150, price: 99, description: 'Best for active seekers', color: 'border-primary/20 bg-primary/5', featured: true, bonusPercentage: 10 },
  { id: 'plan_unlimited', name: 'Premium Member', credits: 1000, price: 299, description: 'Unlimited AI + WhatsApp Priority', color: 'border-yellow-200 bg-yellow-50/30', bonusPercentage: 15 }
];

export function WalletTab({ profile }: WalletTabProps) {
  const { t } = useTranslation();
  const db = useFirestore();
  const { user } = useUser();
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

  const pricingSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "pricing");
  }, [db]);
  const { data: pricingConfig, isLoading: isPricingLoading } = useDoc(pricingSettingsRef);

  const displayPlans = pricingConfig?.plans?.map((p: any) => {
    const fallback = DEFAULT_PLANS.find(f => f.id === p.id);
    return { ...fallback, ...p };
  }) || DEFAULT_PLANS;

  const txQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [db, user?.uid]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(txQuery);

  const handlePlanClick = (plan: any) => {
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

      if (coupon.expiryDate) {
        const expiry = new Date(coupon.expiryDate).getTime();
        if (Date.now() > expiry) {
          toast({ variant: "destructive", title: "Coupon Expired", description: "This code is no longer valid." });
          setIsApplyingCoupon(false);
          return;
        }
      }

      const totalCreditsToBuy = (selectedPlan?.credits || 0) * quantity;
      if (coupon.minPurchase && totalCreditsToBuy < coupon.minPurchase) {
        toast({ variant: "destructive", title: "Min Purchase Not Met", description: `Minimum ${coupon.minPurchase} credits required for this code.` });
        setIsApplyingCoupon(false);
        return;
      }

      setAppliedCoupon(coupon);
      toast({ title: "Coupon Applied!", description: "Discount added." });
    } catch (e) {
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

      const options = {
        key: rzpKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "RozgarMatrix",
        description: `${quantity}x ${selectedPlan.name}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                planId: selectedPlan.id,
                userId: user?.uid,
                quantity: quantity,
                couponCode: appliedCoupon?.code
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              toast({ 
                title: "Payment Successful!", 
                description: `Credits have been added to your wallet.` 
              });
              setIsRechargeOpen(false);
            } else {
              throw new Error(verifyData.message);
            }
          } catch (err: any) {
            toast({ variant: "destructive", title: "Verification Failed", description: err.message });
          }
        },
        prefill: {
          name: profile ? `${profile.firstName} ${profile.lastName}` : '',
          email: profile?.email || '',
          contact: profile?.phoneNumber || ''
        },
        theme: { color: "#3b82f6" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Recharge Failed", 
        description: error.message || "Something went wrong. Try again." 
      });
    } finally {
      setPaymentLoading(false);
      setBuyingPlanId(null);
    }
  };

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
  const gstRate = pricingConfig?.serviceLimits?.gstPercentage || 18;
  const gstAmount = Math.round(taxableAmount * (gstRate / 100));
  const totalPrice = taxableAmount + gstAmount;

  const baseCredits = (selectedPlan?.credits || 0) * quantity;
  const bonusCredits = quantity > 1 ? Math.round(baseCredits * ((selectedPlan?.bonusPercentage || 0) / 100)) : 0;
  const totalCreditsToAward = baseCredits + bonusCredits;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="md:col-span-2 border-none shadow-lg bg-primary text-primary-foreground overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
               <Wallet className="h-32 w-32" />
            </div>
            <CardContent className="p-8 space-y-6 relative z-10">
               <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                  <ShieldCheck className="h-4 w-4" /> RozgarMatrix Secure Wallet
               </div>
               <div className="space-y-1">
                  <h3 className="text-sm font-bold opacity-80">{t('available_credits')}</h3>
                  <div className="flex items-baseline gap-3">
                     <span className="text-6xl font-black">{profile?.credits || 0}</span>
                     <span className="text-xl font-bold opacity-60">Credits</span>
                  </div>
               </div>
               <div className="flex items-center gap-4 pt-4">
                  {profile?.isPremium ? (
                    <Badge className="bg-yellow-400 text-yellow-900 font-black px-4 py-1.5 gap-2 border-none">
                      <Crown className="h-4 w-4" /> PREMIUM MEMBER
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-white border-white/20 font-bold px-4 py-1.5">
                      STANDARD ACCOUNT
                    </Badge>
                  )}
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-xl bg-accent text-white flex flex-col justify-center items-center text-center p-6 space-y-4 rounded-[32px] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
               <Sparkles className="h-20 w-20" />
            </div>
            <div className="h-16 w-16 rounded-3xl bg-white/20 flex items-center justify-center relative z-10 shadow-inner">
               <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div className="space-y-1 relative z-10 px-2">
               <h4 className="font-black text-lg">Pro Savings Tip</h4>
               <p className="text-xs font-bold text-blue-50 leading-relaxed">
                  Quantity badhane par aapko 15% tak <span className="text-white underline decoration-wavy underline-offset-4">Extra Bonus</span> milta hai!
               </p>
            </div>
            <Link href="/profile?tab=referrals" className="relative z-10 w-full">
              <Button variant="secondary" className="w-full font-black text-[10px] h-8 uppercase bg-white text-accent hover:bg-slate-50">Earn Free Credits</Button>
            </Link>
         </Card>
      </div>

      <div className="space-y-6 pt-4">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
               <CreditCard className="h-6 w-6 text-primary" /> {t('recharge_plans')}
            </h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayPlans.map((plan: any) => (
               <Card key={plan.id} className={cn(
                 "border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden",
                 plan.color,
                 plan.featured ? "border-primary" : ""
               )}>
                  {plan.featured && <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[8px] font-black px-3 py-1 uppercase rounded-bl-lg">Best Value</div>}
                  <CardHeader className="pb-4">
                     <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-black">{plan.name}</CardTitle>
                        {plan.bonusPercentage > 0 && <Badge className="bg-accent text-white border-none text-[8px] font-black uppercase tracking-widest h-4">Up to +{plan.bonusPercentage}%</Badge>}
                     </div>
                     <CardDescription className="text-xs font-medium">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">₹{plan.price}</span>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">/ Pack</span>
                     </div>
                  </CardContent>
                  <CardFooter>
                     <Button onClick={() => handlePlanClick(plan)} className="w-full font-black gap-2 h-11" variant={plan.featured ? "default" : "outline"}>
                        {t('buy_credits')} <ArrowRight className="h-3.5 w-3.5" />
                     </Button>
                  </CardFooter>
               </Card>
            ))}
         </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-[24px]">
        <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-4 px-6">
           <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Recent Transactions
           </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
           {isTxLoading ? (
             <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground">
                     <tr>
                        <th className="px-6 py-3">Description</th>
                        <th className="px-6 py-3">Credits</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Date</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y">
                     {transactions?.map((tx) => (
                       <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                             <p className="text-xs font-bold text-slate-800">{tx.description}</p>
                             <p className="text-[9px] text-muted-foreground uppercase">{tx.type}</p>
                          </td>
                          <td className="px-6 py-4">
                             <Badge variant={tx.type === 'topup' ? 'default' : 'secondary'} className={cn("font-black", tx.type === 'topup' ? "bg-green-100 text-green-700" : "")}>
                                {tx.type === 'topup' ? '+' : '-'}{tx.amount}
                             </Badge>
                          </td>
                          <td className="px-6 py-4"><Badge variant="outline" className="text-[9px] uppercase font-bold">{tx.status}</Badge></td>
                          <td className="px-6 py-4 text-right text-[10px] text-muted-foreground font-medium">{tx.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}</td>
                       </tr>
                     ))}
                     {!transactions?.length && <tr className="opacity-40 italic"><td colSpan={4} className="py-12 text-center text-xs">No transactions yet.</td></tr>}
                  </tbody>
               </table>
             </div>
           )}
        </CardContent>
      </Card>

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden bg-white max-h-[95vh] overflow-y-auto">
          <DialogHeader className="p-5 md:p-6 bg-muted/20 border-b">
            <DialogTitle className="text-xl md:text-2xl font-black flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-primary" /> Recharge Wallet
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-700">
               Multiple packs (2+) add extra bonus credits!
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 md:p-6 space-y-4">
             <div className="text-center space-y-0.5 py-1 animate-in zoom-in duration-500">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">You will receive</p>
                <div className="flex items-center justify-center gap-3">
                   <span className="text-4xl md:text-6xl font-black text-primary drop-shadow-sm leading-none">{totalCreditsToAward}</span>
                   <span className="text-lg font-bold text-slate-400 uppercase tracking-widest pt-1">Credits</span>
                </div>
                {bonusCredits > 0 && (
                   <p className="text-[9px] font-black text-accent uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Sparkles className="h-3 w-3" /> Includes {bonusCredits} Bonus Credits!
                   </p>
                )}
             </div>

             <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border-2 border-primary/20">
                <div className="space-y-0.5">
                   <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{selectedPlan?.name}</p>
                   <h4 className="text-lg font-black">₹{selectedPlan?.price} / Pack</h4>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border">
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-3.5 w-3.5" /></Button>
                   <span className="text-lg font-black min-w-[25px] text-center">{quantity}</span>
                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setQuantity(q => q + 1)}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
             </div>

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
                          className="pl-9 h-10 rounded-xl font-bold uppercase tracking-widest"
                        />
                      </div>
                      <Button 
                        size="sm" 
                        className="h-10 rounded-xl px-6 font-black bg-accent text-white" 
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
                      className="w-full py-2.5 rounded-xl border-2 border-dashed border-accent/20 text-accent font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-accent/5 transition-all"
                    >
                      <Gift className="h-3.5 w-3.5" /> I have a coupon code
                    </button>
                  )
                ) : (
                  <div className="bg-green-50 border-2 border-green-200 p-3 rounded-xl flex items-center justify-between animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2">
                       <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0"><Check className="h-4 w-4" /></div>
                       <div>
                          <p className="text-[10px] font-black uppercase text-green-700 tracking-widest">Code Applied</p>
                          <p className="text-xs font-black text-green-900">{appliedCoupon.code}</p>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => setAppliedCoupon(null)}><X className="h-4 w-4" /></Button>
                  </div>
                )}
             </div>

             <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                   <span className="font-bold text-muted-foreground">Base Credits ({quantity}x)</span>
                   <span className="font-black text-base">{baseCredits}</span>
                </div>
                {bonusCredits > 0 && (
                  <div className="flex justify-between items-center text-xs text-accent animate-in fade-in zoom-in duration-300">
                     <span className="font-black flex items-center gap-1.5 uppercase text-[9px]"><Gift className="h-3 w-3" /> Bonus Extra ({selectedPlan?.bonusPercentage}%)</span>
                     <span className="font-black">+{bonusCredits}</span>
                  </div>
                )}
                
                <div className="h-px bg-border w-full border-dashed my-1" />
                
                <div className="space-y-2.5 bg-muted/30 p-4 rounded-xl border">
                   <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                      <span className="uppercase tracking-widest">Subtotal</span>
                      <span className={cn(appliedCoupon && "line-through opacity-50")}>₹{subtotal}</span>
                   </div>
                   {appliedCoupon && (
                      <div className="flex justify-between items-center text-[11px] font-black text-green-600 animate-in slide-in-from-right-2 duration-300">
                        <span className="uppercase tracking-widest flex items-center gap-1">Discount <Tag className="h-3 w-3" /></span>
                        <span>- ₹{discountAmount}</span>
                      </div>
                   )}
                   <div className="flex justify-between items-center text-[11px] font-bold text-slate-500">
                      <span className="uppercase tracking-widest flex items-center gap-1.5">GST ({gstRate}%) <Scale className="h-3 w-3" /></span>
                      <span>₹{gstAmount}</span>
                   </div>
                   <div className="h-px bg-slate-200 w-full" />
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-slate-700">Total Bill</span>
                      <span className="text-xl font-black text-primary flex items-center gap-1"><IndianRupee className="h-4 w-4" />{totalPrice}</span>
                   </div>
                </div>
             </div>
          </div>
          <DialogFooter className="p-5 md:p-6 pt-0 flex flex-col sm:flex-row gap-2">
             <Button variant="ghost" className="font-bold h-12 rounded-xl sm:flex-1" onClick={() => setIsRechargeOpen(false)}>Cancel</Button>
             <Button 
                onClick={handlePurchase} 
                disabled={paymentLoading} 
                className="h-12 font-black text-base sm:flex-[2] rounded-xl gap-2 shadow-xl shadow-primary/20"
             >
                {paymentLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShieldCheck className="h-5 w-5" /> PAY SECURELY</>}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
