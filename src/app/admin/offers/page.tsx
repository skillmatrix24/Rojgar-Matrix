
"use client"

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Loader2, 
  Sparkles, 
  Zap, 
  Save,
  ArrowRight,
  Monitor,
  Calendar,
  Copy,
  Tag,
  Percent,
  Coins,
  BadgePercent,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const PAGE_OPTIONS = [
  { value: "home", label: "Home Page" },
  { value: "jobs", label: "Jobs List" },
  { value: "pricing", label: "Pricing / Recharge" },
  { value: "profile", label: "User Profile" },
  { value: "seeker_dashboard", label: "Seeker Dashboard" },
  { value: "employer_dashboard", label: "Employer Dashboard" },
  { value: "all", label: "All Pages" }
];

const THEME_OPTIONS = [
  { value: "blue", label: "Professional Blue", class: "bg-blue-600" },
  { value: "purple", label: "Distinguished Purple", class: "bg-purple-600" },
  { value: "green", label: "Success Green", class: "bg-green-600" },
  { value: "orange", label: "Warning Orange", class: "bg-orange-600" },
  { value: "dark", label: "Premium Dark", class: "bg-slate-900" }
];

export default function AdminOffersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // Banner Offer Form State
  const [bannerForm, setBannerForm] = useState({
    title: "Special Offer!",
    subtitle: "Unlock advanced features today.",
    badgeText: "LIMITED TIME",
    couponCode: "",
    targetPage: "home",
    theme: "purple",
    buttonText: "Claim Now",
    buttonLink: "/pricing",
    expiryDate: "",
    isActive: true
  });

  // Standalone Coupon Form State
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    minPurchase: 0,
    description: "",
    expiryDate: "",
    isActive: true
  });

  // Queries
  const offersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "offers"), orderBy("createdAt", "desc"));
  }, [db]);
  const { data: offers, isLoading: isOffersLoading } = useCollection(offersQuery);

  const couponsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "coupons"), orderBy("createdAt", "desc"));
  }, [db]);
  const { data: coupons, isLoading: isCouponsLoading } = useCollection(couponsQuery);

  const handleBannerSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "offers"), {
        ...bannerForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Offer Banner Created" });
    } catch (e) {
      console.error("Failed to create offer banner:", e);
      toast({ variant: "destructive", title: "Failed to create offer" });
    } finally {
      setSaving(false);
    }
  };

  const handleCouponSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "coupons"), {
        ...couponForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Coupon Created Successfully" });
      setCouponForm({
        code: "",
        discountType: "percentage",
        discountValue: 10,
        minPurchase: 0,
        description: "",
        expiryDate: "",
        isActive: true
      });
    } catch (e) {
      console.error("Failed to create coupon:", e);
      toast({ variant: "destructive", title: "Failed to create coupon" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!db || !confirm("Delete this banner?")) return;
    try { await deleteDoc(doc(db, "offers", id)); toast({ title: "Offer Removed" }); } catch (e) {
      console.error("Failed to delete offer banner:", e);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!db || !confirm("Delete this coupon?")) return;
    try { await deleteDoc(doc(db, "coupons", id)); toast({ title: "Coupon Removed" }); } catch (e) {
      console.error("Failed to delete coupon:", e);
    }
  };

  const toggleOfferStatus = async (id: string, current: boolean) => {
    if (!db) return;
    try { await updateDoc(doc(db, "offers", id), { isActive: !current, updatedAt: serverTimestamp() }); } catch (e) {
      console.error("Failed to update offer status:", e);
    }
  };

  const toggleCouponStatus = async (id: string, current: boolean) => {
    if (!db) return;
    try { await updateDoc(doc(db, "coupons", id), { isActive: !current, updatedAt: serverTimestamp() }); } catch (e) {
      console.error("Failed to update coupon status:", e);
    }
  };

  const bannerThemeClass = THEME_OPTIONS.find(t => t.value === bannerForm.theme)?.class || "bg-primary";

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Ticket className="h-8 w-8 text-primary" />
          Offers & Campaigns
        </h1>
        <p className="text-muted-foreground mt-1">Manage visual banners and standalone discount coupons.</p>
      </div>

      <Tabs defaultValue="banners" className="space-y-8">
        <TabsList className="bg-card border h-12 p-1 rounded-2xl shadow-sm">
          <TabsTrigger value="banners" className="font-bold px-8 gap-2 rounded-xl">Offers & Campaigns</TabsTrigger>
          <TabsTrigger value="coupons" className="font-bold px-8 gap-2 rounded-xl text-accent">Standalone Coupons</TabsTrigger>
        </TabsList>

        {/* TAB 1: BANNERS */}
        <TabsContent value="banners" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-7 space-y-8">
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg">Banner Campaign Designer</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleBannerSave} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner Headline</Label>
                        <Input value={bannerForm.title} onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Badge Label</Label>
                        <Input value={bannerForm.badgeText} onChange={(e) => setBannerForm({...bannerForm, badgeText: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Tag className="h-3 w-3" /> Coupon Code</Label>
                        <Input value={bannerForm.couponCode} onChange={(e) => setBannerForm({...bannerForm, couponCode: e.target.value})} placeholder="e.g. SAVE20" className="font-mono font-black" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Page</Label>
                        <Select value={bannerForm.targetPage} onValueChange={(v) => setBannerForm({...bannerForm, targetPage: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{PAGE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description Text</Label>
                      <Textarea value={bannerForm.subtitle} onChange={(e) => setBannerForm({...bannerForm, subtitle: e.target.value})} className="min-h-[80px]" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Theme Style</Label>
                        <Select value={bannerForm.theme} onValueChange={(v) => setBannerForm({...bannerForm, theme: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{THEME_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3" /> Expiry Date</Label>
                        <Input type="date" value={bannerForm.expiryDate} onChange={(e) => setBannerForm({...bannerForm, expiryDate: e.target.value})} className="h-11 rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-dashed">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Button Caption</Label>
                        <Input value={bannerForm.buttonText} onChange={(e) => setBannerForm({...bannerForm, buttonText: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Action Link</Label>
                        <Input value={bannerForm.buttonLink} onChange={(e) => setBannerForm({...bannerForm, buttonLink: e.target.value})} />
                      </div>
                    </div>
                    <Button type="submit" disabled={saving} className="w-full h-14 text-base font-black gap-2 shadow-xl shadow-primary/20 rounded-2xl">
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Save Campaign
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg">Active Banners</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50"><TableHead className="pl-6">Offer</TableHead><TableHead>Placement</TableHead><TableHead>Status</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {offers?.map(offer => (
                          <TableRow key={offer.id}>
                            <TableCell className="pl-6 py-4">
                              <div className="space-y-1"><p className="font-bold text-sm">{offer.title}</p><Badge variant="secondary" className="text-[8px] font-black uppercase">{offer.theme}</Badge></div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="uppercase text-[9px] font-bold">{offer.targetPage?.replace('_', ' ')}</Badge></TableCell>
                            <TableCell><Switch checked={offer.isActive} onCheckedChange={() => toggleOfferStatus(offer.id, offer.isActive)} className="scale-75" /></TableCell>
                            <TableCell className="text-right pr-6"><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteOffer(offer.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-5 space-y-6 sticky top-24">
              <Card className="border-none shadow-2xl bg-slate-100 p-8 rounded-[48px] overflow-hidden border-[12px] border-white">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest"><Monitor className="h-4 w-4" /> Live Preview</div>
                </div>
                <div className="bg-white rounded-[32px] p-2 shadow-inner h-[400px] flex flex-col items-center justify-center">
                  <Card className={cn("w-full max-w-[320px] border-none shadow-2xl rounded-[32px] overflow-hidden text-white transition-all duration-500", bannerThemeClass)}>
                    <CardContent className="p-8 space-y-4">
                      <div className="flex items-center gap-3">
                        {bannerForm.badgeText && <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 h-6">{bannerForm.badgeText}</Badge>}
                        {bannerForm.couponCode && (
                          <div className="bg-yellow-400 text-black px-3 py-1 rounded-lg flex items-center gap-2 shadow-md">
                            <Tag className="h-3 w-3" />
                            <span className="text-xs font-mono font-black">{bannerForm.couponCode}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-black leading-tight">{bannerForm.title}</h3>
                      <p className="text-xs font-medium text-white/80 italic">"{bannerForm.subtitle}"</p>
                      <Button variant="secondary" className="w-full font-black rounded-xl bg-white text-slate-900 gap-2">{bannerForm.buttonText} <ArrowRight className="h-4 w-4" /></Button>
                    </CardContent>
                  </Card>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: COUPONS */}
        <TabsContent value="coupons" className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            <div className="xl:col-span-5 space-y-8">
              <Card className="border-none shadow-xl border-t-4 border-accent">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-accent" /> Create New Coupon</CardTitle>
                  <CardDescription>Generate discount codes for credit purchases.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCouponSave} className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Coupon Code</Label>
                      <Input value={couponForm.code} onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="e.g. FESTIVE50" className="font-mono font-black text-lg h-12 border-2" required />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Discount Type</Label>
                          <Select value={couponForm.discountType} onValueChange={(v:any) => setCouponForm({...couponForm, discountType: v})}>
                            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">Percentage (%)</SelectItem>
                              <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Discount Value</Label>
                          <div className="relative">
                            <Input type="number" value={couponForm.discountValue} onChange={(e) => setCouponForm({...couponForm, discountValue: Number(e.target.value)})} className="h-11 font-black pl-8" />
                            {couponForm.discountType === 'percentage' ? <Percent className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" /> : <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>}
                          </div>
                       </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Coins className="h-3 w-3" /> Min. Purchase Credits</Label>
                      <Input type="number" value={couponForm.minPurchase} onChange={(e) => setCouponForm({...couponForm, minPurchase: Number(e.target.value)})} className="h-11 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Description</Label>
                      <Input value={couponForm.description} onChange={(e) => setCouponForm({...couponForm, description: e.target.value})} placeholder="e.g. Valid on Standard Pack" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Expiry Date</Label>
                      <Input type="date" value={couponForm.expiryDate} onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})} className="h-11" />
                    </div>
                    <Button type="submit" disabled={saving} className="w-full h-14 font-black bg-accent hover:bg-accent/90 rounded-2xl shadow-xl shadow-accent/20 gap-2">
                      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5 fill-white" />} Create Coupon
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-7 space-y-6">
              <Card className="border-none shadow-lg overflow-hidden rounded-3xl">
                <CardHeader className="bg-accent/5 border-b py-6">
                  <CardTitle className="text-xl font-black flex items-center gap-3">
                    <BadgePercent className="h-6 w-6 text-accent" /> Standalone Coupon List
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50"><TableHead className="pl-6">Code & Details</TableHead><TableHead>Value</TableHead><TableHead>Min. Order</TableHead><TableHead>Status</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {coupons?.map(cp => (
                          <TableRow key={cp.id}>
                            <TableCell className="pl-6 py-4">
                               <div className="space-y-0.5">
                                  <p className="font-black text-accent font-mono">{cp.code}</p>
                                  <p className="text-[10px] text-muted-foreground line-clamp-1">{cp.description || 'No description'}</p>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge className="bg-accent text-white border-none font-bold">
                                  {cp.discountType === 'percentage' ? `${cp.discountValue}%` : `₹${cp.discountValue}`}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-xs font-bold text-slate-500">{cp.minPurchase} Credits</TableCell>
                            <TableCell><Switch checked={cp.isActive} onCheckedChange={() => toggleCouponStatus(cp.id, cp.isActive)} className="scale-75 data-[state=checked]:bg-accent" /></TableCell>
                            <TableCell className="text-right pr-6"><Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCoupon(cp.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                          </TableRow>
                        ))}
                        {!coupons?.length && !isCouponsLoading && <TableRow><TableCell colSpan={5} className="py-20 text-center opacity-30 italic font-bold">No coupons found.</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 p-6 rounded-[32px] border-2 border-dashed border-blue-200 flex items-center gap-6">
                 <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0"><Info className="h-8 w-8 text-blue-600" /></div>
                 <div className="space-y-1">
                    <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">How to use Coupons?</h4>
                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                      Ye coupons user ko automatic nahi dikhte. Aap inhe manually WhatsApp Campaigns ya 
                      notifications ke zariye users ko bhej sakte hain taaki wo recharge ke waqt extra discount pa sakein.
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
