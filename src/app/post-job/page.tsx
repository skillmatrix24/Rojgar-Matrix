"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Building2, 
  MapPin, 
  IndianRupee, 
  Info, 
  ArrowRight, 
  Loader2, 
  Phone, 
  Search, 
  Check, 
  ChevronDown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  BellRing,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, where, orderBy, getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { aiJobQualityCheck } from "@/ai/flows/ai-job-quality-check";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { secureDispatch } from "@/actions/secure-dispatch";

const QUALITY_CHECK_COST = 5;

export default function PostJobPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Selection states
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [salaryType, setSalaryType] = useState<"lpa" | "monthly">("lpa");

  // AI Quality Check states
  const [isQualityChecking, setIsQualityChecking] = useState(false);
  const [qualityResult, setQualityResult] = useState<any>(null);
  const [showRechargePopup, setShowRechargePopup] = useState(false);

  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (isUserLoading || !db) return;
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      const q = query(collection(db, "categories"), where("isActive", "==", true), orderBy("order", "asc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(docs);
      setCategoriesLoading(false);
    };
    fetchCategories();
  }, [db, isUserLoading]);

  const handleRunAiCheck = async (e: any) => {
    e.preventDefault();
    if (!profile || !userProfileRef) return;

    if ((profile.credits || 0) < QUALITY_CHECK_COST) {
      setShowRechargePopup(true);
      return;
    }

    const form = e.currentTarget.closest('form');
    const formData = new FormData(form);
    
    setIsQualityChecking(true);
    try {
      const result = await aiJobQualityCheck({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        salaryAmount: Number(formData.get('salaryAmount')),
        salaryType,
        location: formData.get('location') as string,
        companyName: formData.get('company') as string
      });

      await updateDoc(userProfileRef, {
        credits: increment(-QUALITY_CHECK_COST),
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, "transactions"), {
        userId: user!.uid,
        amount: QUALITY_CHECK_COST,
        type: 'usage',
        description: 'AI Job Quality Check',
        status: 'success',
        createdAt: serverTimestamp()
      });

      setQualityResult(result);
      toast({ title: "Analysis Complete", description: `Deducted ${QUALITY_CHECK_COST} credits.` });
    } catch (error) {
      console.error("AI job quality check error:", error);
      toast({ variant: "destructive", title: "Analysis Failed" });
    } finally {
      setIsQualityChecking(false);
    }
  };

  const handleSubmitFinal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !db) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const docRef = await addDoc(collection(db, "jobs"), {
        title: formData.get('title') as string,
        category: selectedCategory,
        location: formData.get('location') as string,
        salaryRangeMin: Number(formData.get('salaryAmount')),
        salaryType,
        contactPhone: formData.get('phone') as string,
        description: formData.get('description') as string,
        companyName: formData.get('company') as string,
        employerUserProfileId: user.uid,
        isActive: true,
        qualityScore: qualityResult?.qualityScore || 0,
        postedDate: serverTimestamp()
      });

      // Secure internal job-alert trigger via proxy
      secureDispatch('/api/job-alert', { jobId: docRef.id })
        .catch(err => console.error("Notification trigger fail", err));

      toast({ title: t('job_posted_success'), description: t('job_posted_desc') });
      router.push('/jobs');
    } catch (error) {
      console.error("Failed to post job error:", error);
      toast({ variant: "destructive", title: "Failed to post job." });
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.group && cat.group.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    const group = cat.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  const canAffordAi = (profile?.credits || 0) >= QUALITY_CHECK_COST;

  if (isProfileLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 bg-muted/20 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-10 space-y-2 text-center">
            <h1 className="text-4xl font-black tracking-tight">{t('post_job_title')}</h1>
            <p className="text-muted-foreground font-medium">{t('post_job_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
                <CardHeader className="bg-card border-b p-8">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    {t('job_details')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <form id="job-form" onSubmit={handleSubmitFinal} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest">{t('job_title')}</Label>
                        <Input id="title" name="title" placeholder="e.g. Tally Accountant, Delivery Driver" required className="h-12 border-2 rounded-xl font-bold" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest">{t('job_category')}</Label>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-between h-12 border-2 rounded-xl font-bold px-4 hover:border-primary/40 transition-colors">
                                <span>{selectedCategory || t('select_category')}</span>
                                <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl shadow-2xl" align="start">
                              <div className="flex items-center border-b px-3 h-12 bg-muted/20">
                                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                <input className="flex h-10 w-full rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground" placeholder="Search industries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                              </div>
                              <ScrollArea className="h-80">
                                {categoriesLoading ? (
                                  <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                ) : Object.entries(groupedCategories).map(([groupName, cats]) => (
                                  <div key={groupName}>
                                    <div className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-primary/70 bg-primary/5">{groupName}</div>
                                    <div className="p-1">
                                      {cats.map((cat) => (
                                        <div key={cat.id} onClick={() => { setSelectedCategory(cat.name); setOpen(false); }} className={cn("flex items-center justify-between cursor-pointer rounded-xl px-4 py-3 text-sm hover:bg-primary/5 transition-colors font-bold", selectedCategory === cat.name ? "bg-primary text-white hover:bg-primary" : "text-slate-700")}>
                                          {cat.name}
                                          {selectedCategory === cat.name && <Check className="h-4 w-4" />}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </ScrollArea>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="location" className="text-xs font-black uppercase tracking-widest">{t('city_location')}</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="location" name="location" placeholder="e.g. Raipur" required className="h-12 pl-10 border-2 rounded-xl font-bold" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest">Salary Range & Type</Label>
                          <div className="flex flex-col gap-4">
                             <div className="relative">
                                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input type="number" name="salaryAmount" placeholder="Amount" required className="h-12 pl-10 border-2 rounded-xl font-black text-lg" />
                             </div>
                             <RadioGroup value={salaryType} onValueChange={(v: any) => setSalaryType(v)} className="flex items-center gap-4 bg-muted/30 p-2 rounded-xl border">
                                <div className="flex items-center space-x-2 px-3 py-1">
                                   <RadioGroupItem value="lpa" id="lpa" />
                                   <Label htmlFor="lpa" className="font-bold cursor-pointer">LPA</Label>
                                </div>
                                <div className="flex items-center space-x-2 px-3 py-1">
                                   <RadioGroupItem value="monthly" id="monthly" />
                                   <Label htmlFor="monthly" className="font-bold cursor-pointer">Monthly</Label>
                                </div>
                             </RadioGroup>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest">{t('contact_phone')} (WhatsApp)</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="phone" name="phone" placeholder="98765 43210" required className="h-12 pl-10 border-2 rounded-xl font-black text-lg" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-xs font-black uppercase tracking-widest">{t('company_name')}</Label>
                        <Input id="company" name="company" placeholder="e.g. Skill Matrix Solutions" required className="h-12 border-2 rounded-xl font-bold" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest">{t('job_description')}</Label>
                        <Textarea id="description" name="description" placeholder="Describe the role, responsibilities, and requirements..." required className="min-h-[180px] border-2 rounded-2xl p-6 font-medium leading-relaxed" />
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="bg-muted/10 border-t p-8 flex justify-between items-center gap-4">
                   <Button variant="ghost" onClick={() => router.back()} className="font-bold rounded-xl h-12 px-8">{t('cancel')}</Button>
                   <Button type="submit" form="job-form" disabled={loading} className="h-14 px-12 font-black text-lg gap-2 shadow-2xl shadow-primary/20 rounded-2xl active:scale-95 transition-all">
                     {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Zap className="h-6 w-6 fill-white" />}
                     {t('post_job_btn')}
                   </Button>
                </CardFooter>
              </Card>
            </div>

            <aside className="lg:col-span-5 space-y-6 sticky top-24">
              <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[40px] overflow-hidden group">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-black flex items-center gap-2">
                       <Sparkles className="h-6 w-6 text-accent" />
                       {t('ai_quality_check')}
                    </CardTitle>
                    <Badge variant="outline" className="text-white border-white/20 text-[9px] font-black uppercase tracking-widest px-3 h-6">Powered by Gemini</Badge>
                  </div>
                  <CardDescription className="text-blue-100/60 font-medium">Get listed faster with an AI-optimized job description.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-8">
                  {qualityResult ? (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-[28px] border border-white/10 shadow-inner">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-blue-200 tracking-widest">{t('quality_score')}</p>
                            <h3 className={cn("text-5xl font-black tracking-tighter", qualityResult.qualityScore >= 80 ? "text-green-400" : "text-orange-400")}>{qualityResult.qualityScore}%</h3>
                         </div>
                         {qualityResult.isApproved ? (
                           <div className="h-14 w-14 rounded-2xl bg-green-500/20 flex items-center justify-center border border-green-500/30"><CheckCircle2 className="h-8 w-8 text-green-400" /></div>
                         ) : (
                           <div className="h-14 w-14 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30"><AlertTriangle className="h-8 w-8 text-red-400" /></div>
                         )}
                      </div>
                      
                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-300">{t('quality_suggestions')}</h4>
                         <ul className="space-y-2.5">
                            {qualityResult.suggestions?.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-sm font-medium leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                                 <ArrowRight className="h-4 w-4 text-accent shrink-0 mt-1" />
                                 {s}
                              </li>
                            ))}
                         </ul>
                      </div>

                      <div className="p-4 bg-accent/10 border border-accent/20 rounded-2xl">
                         <p className="text-[10px] font-black uppercase text-accent tracking-widest mb-1">Salary Analysis</p>
                         <p className="text-xs font-bold leading-relaxed">{qualityResult.salaryAnalysis}</p>
                      </div>

                      <Button onClick={handleRunAiCheck} variant="outline" className="w-full h-11 border-2 font-black gap-2 hover:bg-white/5 text-white active:scale-95 transition-all">
                        <RefreshCcw className="h-4 w-4" /> {t('fix_and_recheck')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6 py-4">
                       <div className="flex items-center gap-6">
                          <div className="h-16 w-16 rounded-[22px] bg-white/10 flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                             <Sparkles className="h-8 w-8 text-accent animate-pulse" />
                          </div>
                          <p className="text-sm font-bold text-blue-50 leading-relaxed italic">
                             AI will analyze your Title, Description, and Salary to ensure maximum candidate attraction.
                          </p>
                       </div>
                       <Button 
                         onClick={handleRunAiCheck} 
                         disabled={isQualityChecking || !canAffordAi} 
                         className={cn(
                           "w-full h-14 rounded-2xl font-black text-base shadow-xl transition-all active:scale-95 group",
                           canAffordAi ? "bg-accent hover:bg-accent/90" : "bg-orange-600 hover:bg-orange-700"
                         )}
                       >
                         {isQualityChecking ? (
                           <><Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('checking_quality')}</>
                         ) : (
                           <>{canAffordAi ? "Run Quality Analysis" : "Recharge to Check"}</>
                         )}
                       </Button>
                       <div className="flex items-center justify-center gap-3 text-[10px] font-black text-blue-300 uppercase tracking-widest">
                          <Wallet className="h-3 w-3" /> Cost: {QUALITY_CHECK_COST} Credits
                       </div>
                    </div>
                  )}
                </CardContent>
                <div className="p-8 border-t border-white/5 bg-white/5">
                   <div className="flex items-center gap-3 text-blue-200/50">
                      <BellRing className="h-4 w-4" />
                      <p className="text-[10px] font-bold leading-relaxed">
                         Verified jobs with high quality scores are 8x more likely to be broadcasted to top candidates.
                      </p>
                   </div>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Dialog open={showRechargePopup} onOpenChange={setShowRechargePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-black">Credits Required</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              AI Quality Check ke liye {QUALITY_CHECK_COST} credits chahiye. Kripya wallet recharge karein ya bina AI ke post karein.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2 pt-4">
            <Link href="/profile?tab=wallet" className="w-full sm:flex-1">
              <Button className="w-full font-black h-12 rounded-2xl">Recharge Now</Button>
            </Link>
            <Button variant="ghost" className="w-full sm:flex-1 font-bold h-12 rounded-2xl" onClick={() => setShowRechargePopup(false)}>Maybe Later</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
