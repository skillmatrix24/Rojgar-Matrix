"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  Zap, 
  ArrowRight, 
  ShieldCheck, 
  MessageCircle, 
  Sparkles, 
  ChevronRight, 
  Star, 
  Building2, 
  TrendingUp,
  UserCheck,
  CheckCircle2,
  FileBadge,
  MessageSquare,
  Gift,
  Users,
  Wand2,
  BrainCircuit,
  Wallet,
  Target,
  Trophy,
  Quote,
  HelpCircle,
  Lightbulb,
  Award,
  CircleArrowRight,
  ArrowLeft,
  Loader2,
  Save,
  Edit2,
  Users2,
  Clock,
  Rocket,
  ArrowUpRight,
  Coins,
  Smartphone,
  History,
  AlignLeft,
  IndianRupee,
  Footprints,
  PlusCircle
} from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { OfferBanner } from "@/components/layout/OfferBanner";
import Link from "next/link";
import { useState, useEffect, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import * as firestore from 'firebase/firestore';
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AdUnit } from "@/components/ads/AdUnit";

const MemoizedJobCard = memo(JobCard);

export default function Home() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [hasMounted, setHasMounted] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);

  // Review Dialog States
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    userName: "",
    userRole: "",
    userPhoto: "",
    rating: 5,
    content: ""
  });

  // Hydration safety
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // User Profile for Review
  const profileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return firestore.doc(db, "users", user.uid);
  }, [db, user?.uid]);
  const { data: profile } = useDoc(profileRef);

  // Testimonial Settings
  const testimonialSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return firestore.doc(db, "settings", "testimonials");
  }, [db]);
  const { data: tSettings } = useDoc(testimonialSettingsRef);

  // Offers/Rewards Settings
  const offersRef = useMemoFirebase(() => {
    if (!db) return null;
    return firestore.doc(db, "settings", "offers");
  }, [db]);
  const { data: offersConfig } = useDoc(offersRef);

  // Promotions Query
  const promoQuery = useMemoFirebase(() => {
    if (!db) return null;
    return firestore.query(firestore.collection(db, "promotions"), firestore.where("status", "==", "approved"), firestore.limit(5));
  }, [db]);
  const { data: promotions } = useCollection(promoQuery);

  // Testimonials Query
  const testimonialsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return firestore.query(
      firestore.collection(db, "testimonials"), 
      firestore.where("isActive", "==", true),
      firestore.orderBy("createdAt", "desc"),
      firestore.limit(20)
    );
  }, [db]);
  const { data: allTestimonials } = useCollection(testimonialsQuery);

  useEffect(() => {
    if (profile) {
      setReviewForm(prev => ({
        ...prev,
        userName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || "New User",
        userRole: profile.role === 'employer' ? 'Employer' : (profile.preferredJobTitle || 'Job Seeker'),
        userPhoto: profile.photoUrl || ""
      }));
    }
  }, [profile]);

  const ratingStats = useMemo(() => {
    if (!hasMounted) return { avg: "4.8", total: 0 };
    if (tSettings?.useManualStats) {
      return {
        avg: String(tSettings.manualAvgRating || "4.8"),
        total: Number(tSettings.manualTotalReviews || 1200)
      };
    }
    if (!allTestimonials || allTestimonials.length === 0) return { avg: "4.8", total: 0 };
    const sum = allTestimonials.reduce((acc, curr) => acc + (curr.rating || 0), 0);
    return {
      avg: (sum / allTestimonials.length).toFixed(1),
      total: allTestimonials.length
    };
  }, [allTestimonials, tSettings, hasMounted]);

  const minStars = tSettings?.minStarsForHome || 4; 

  const displayTestimonials = useMemo(() => {
    if (!allTestimonials) return [];
    const filtered = allTestimonials.filter(t => (t.rating || 0) >= minStars);
    const featured = filtered.filter(t => t.isFeatured);
    return featured.length > 0 ? featured : filtered;
  }, [allTestimonials, minStars]);

  useEffect(() => {
    const fetchData = async () => {
      setIsJobsLoading(true);
      try {
        const response = await fetch('/api/featured-jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        const data = await response.json();
        setFeaturedJobs(data.jobs);
      } catch (err: any) {
        console.error("Home Page Fetch Error:", err);
      } finally {
        setIsJobsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('q', searchInput);
    if (cityInput) params.set('city', cityInput);
    router.push(`/jobs?${params.toString()}`);
  };

  const handleSubmittingReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    if (!reviewForm.content.trim() || !reviewForm.userName.trim()) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Name aur Feedback zaroori hain." });
      return;
    }
    setIsSubmittingReview(true);
    try {
      await firestore.addDoc(firestore.collection(db, "testimonials"), {
        ...reviewForm,
        isActive: false, 
        isFeatured: false,
        createdAt: firestore.serverTimestamp(),
        userId: user.uid
      });
      toast({ title: "Review Submitted", description: "Review moderation ke baad live ho jayega." });
      setIsReviewOpen(false);
      setReviewForm(prev => ({ ...prev, content: "", rating: 5 }));
    } catch (err) {
      console.error("Submit testimonial review error:", err);
      toast({ variant: "destructive", title: "Error", description: "Review save nahi ho paya." });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-mukta">
      {/* DESKTOP VIEW */}
      <div className="hidden md:flex flex-col flex-1">
        <Navbar />
        <main className="flex-1">
          {/* Ad Slider */}
          {hasMounted && promotions && promotions.length > 0 && (
            <section className="container mx-auto max-w-7xl pt-8 px-4">
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent>
                  {promotions.map((promo) => (
                    <CarouselItem key={promo.id}>
                      <a href={promo.targetUrl} target="_blank" rel="noopener noreferrer">
                        <div className="relative h-[300px] w-full rounded-[40px] overflow-hidden shadow-2xl group border-4 border-white ring-1 ring-border">
                          <Image src={promo.imageUrl} alt="Promotion" fill className="object-cover group-hover:scale-105 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                             <Badge className="bg-white/20 backdrop-blur-md text-white border-white/20 font-black uppercase tracking-widest">Sponsored</Badge>
                          </div>
                        </div>
                      </a>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </section>
          )}

          <OfferBanner />

          {/* Hero & WhatsApp Mockup */}
          <section className="relative pt-12 pb-24 overflow-hidden px-4">
            <div className="container relative z-10 mx-auto max-w-7xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-7 text-center lg:text-left space-y-8">
                  <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 text-primary font-black text-sm uppercase tracking-widest border border-primary/20">
                    <ShieldCheck className="h-5 w-5" />
                    {t('secure_platform')}
                  </div>
                  <h1 className="text-7xl font-extrabold tracking-tight leading-[1.1]">
                    {t('hero_title_start')}<span className="text-primary">{t('hero_title_highlight')}</span>{t('hero_title_end')}
                  </h1>
                  <p className="text-2xl text-muted-foreground max-w-3xl mx-auto lg:mx-0 font-medium leading-relaxed">
                    {t('hero_subtitle')}
                  </p>

                  <form onSubmit={handleSearch} className="max-w-4xl bg-card p-3 rounded-[32px] shadow-2xl border border-border/50 flex flex-row gap-2 transition-all hover:shadow-primary/10">
                    <div className="flex-1 relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" />
                      <Input className="pl-16 h-16 border-none bg-transparent focus-visible:ring-0 shadow-none text-xl font-bold" placeholder={t('search_placeholder')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                    </div>
                    <div className="w-px bg-border my-4"></div>
                    <div className="flex-1 relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground" />
                      <Input className="pl-16 h-16 border-none bg-transparent focus-visible:ring-0 shadow-none text-xl font-bold" placeholder={t('city_placeholder')} value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
                    </div>
                    <Button type="submit" className="h-16 px-12 text-xl font-black bg-primary text-primary-foreground rounded-2xl shadow-xl shadow-primary/20">{t('search_jobs')}</Button>
                  </form>
                </div>

                <div className="lg:col-span-5 relative">
                   <div className="absolute inset-0 bg-primary/10 blur-[100px] rounded-full -z-10" />
                   {/* WhatsApp Bot UI Mockup */}
                   <Card className="border-[10px] border-slate-900 rounded-[48px] shadow-2xl overflow-hidden bg-slate-100 h-[550px] flex flex-col relative rotate-3 hover:rotate-0 transition-transform duration-700">
                      <div className="bg-[#075e54] p-4 text-white flex items-center gap-3 shrink-0">
                         <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Smartphone className="h-6 w-6" /></div>
                         <div>
                            <p className="font-bold text-sm">Rojgar Matrix Bot</p>
                            <p className="text-[10px] opacity-70">Online • Hinglish Assistant</p>
                         </div>
                      </div>
                      <div className="flex-1 p-6 space-y-4 overflow-hidden bg-[#e5ddd5]">
                         <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] text-sm font-medium">
                            Namaste! Aapko kaha aur kaunsi naukri chahiye?
                         </div>
                         <div className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none shadow-sm ml-auto max-w-[80%] text-sm font-bold">
                            Raipur me driver ka kaam
                         </div>
                         <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] space-y-2">
                            <p className="text-xs font-bold text-green-700">✅ 5 Matching Jobs Found:</p>
                            <div className="space-y-1">
                               <p className="text-[11px] font-black">1. Heavy Vehicle Driver @ Raipur Logistics</p>
                               <p className="text-[11px] font-black">2. Private Car Driver @ Civil Lines</p>
                            </div>
                            <Button size="sm" className="w-full h-8 text-[9px] font-black uppercase rounded-lg">View All Matches</Button>
                         </div>
                      </div>
                      <div className="p-3 bg-white border-t flex gap-2">
                         <div className="flex-1 bg-slate-50 h-10 rounded-full border px-4 flex items-center text-xs text-slate-300 font-bold">Type a message...</div>
                         <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white"><ArrowUpRight className="h-5 w-5" /></div>
                      </div>
                   </Card>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl">
                {[
                  { label: t('active_jobs'), value: "5,000+", icon: Briefcase, color: "text-blue-600" },
                  { label: t('employers'), value: "800+", icon: Building2, color: "text-orange-600" },
                  { label: t('job_seekers'), value: "25k+", icon: Users2, color: "text-green-600" },
                  { label: t('hired_monthly'), value: "1,200+", icon: Target, color: "text-primary" }
                ].map((stat, i) => (
                  <div key={i} className="flex flex-col items-center lg:items-start space-y-1 group">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center bg-card shadow-lg border border-border/50 group-hover:scale-110 transition-transform mb-2", stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-900">{stat.value}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* AdSense Unit */}
          <AdUnit slot="8182736412" className="container mx-auto max-w-7xl py-12 px-4" />

          {/* Business & Entrepreneurship Alternative */}
          <section className="py-24 bg-[#003366] text-white px-4 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-24 opacity-5 rotate-12"><Lightbulb className="h-96 w-96" /></div>
             <div className="container mx-auto max-w-7xl relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                   <div className="space-y-8">
                      <Badge className="bg-yellow-400 text-slate-900 border-none font-black text-xs uppercase tracking-widest px-6 h-8">New Career Discovery</Badge>
                      <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
                        Job nahi mil rahi? <br />
                        <span className="text-yellow-400">Apna kaam shuru karein!</span>
                      </h2>
                      <p className="text-xl text-blue-100 font-medium leading-relaxed">
                        Rojgar Matrix AI sirf jobs hi nahi, aapke skills ke mutabiq best practical Business aur Entrepreneurship ideas bhi suggest karta hai.
                      </p>
                      <div className="flex flex-wrap gap-4">
                         <Link href="/ai-match">
                            <Button size="lg" className="h-16 px-12 bg-white text-slate-900 font-black text-xl rounded-2xl gap-3 shadow-2xl hover:bg-slate-50 transition-all active:scale-95">
                               Scan Business Ideas <Rocket className="h-6 w-6" />
                            </Button>
                         </Link>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { t: "Zero Investment", d: "Aise business ideas jinhe bina paise ke shuru kiya ja sake.", i: Zap },
                        { t: "Skill Based", d: "Aapke hunar (skills) par aadharit self-employment plan.", i: Target },
                        { t: "Monthly Income", d: "Expected earnings aur market demand analysis.", i: IndianRupee },
                        { t: "Action Steps", d: "Pehle 3 din me business shuru karne ki strategy.", i: Footprints }
                      ].map((biz, i) => (
                        <Card key={i} className="bg-white/10 border-white/20 text-white rounded-3xl p-6 backdrop-blur-sm group hover:bg-white/20 transition-all">
                           <biz.i className="h-8 w-8 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
                           <h4 className="text-lg font-black mb-1 text-white">{biz.t}</h4>
                           <p className="text-xs text-blue-100/70 font-medium leading-relaxed">{biz.d}</p>
                        </Card>
                      ))}
                   </div>
                </div>
             </div>
          </section>

          {/* AI Tools Promo with Live Showcase */}
          <section className="py-24 px-4 overflow-hidden bg-muted/20">
             <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                   <div className="lg:col-span-6 space-y-12">
                      <div className="space-y-4">
                        <Badge className="bg-primary text-white border-none font-black uppercase text-xs tracking-[0.2em] px-5 py-1.5 h-8">Smart Career Tools</Badge>
                        <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-slate-900">
                           AI-Ready Resume <br /><span className="text-primary">In Just 2 Minutes</span>
                        </h2>
                        <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                           Recruiters aur ATS (Applicant Tracking Systems) ko impress karne ke liye apna summary Gemini AI se optimize karein.
                        </p>
                      </div>

                      {/* Live Showcase (Before/After) */}
                      <div className="space-y-6">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-3 relative overflow-hidden group">
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Normal Summary</p>
                               <p className="text-xs text-slate-400 line-through leading-relaxed">"Mujhe 5 saal ka accounting experience hai aur main job dhoondh raha hoon."</p>
                               <Badge variant="secondary" className="absolute top-2 right-2 text-[8px] font-black uppercase">Standard</Badge>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-3xl shadow-2xl space-y-3 border-2 border-primary relative group">
                               <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2"><Sparkles className="h-3 w-3" /> AI Optimized</p>
                               <p className="text-xs text-white leading-relaxed">"Financial expert with 5+ years expertise in Tally & GST, delivering 15% improvement in audit efficiency."</p>
                               <Badge className="absolute top-2 right-2 bg-primary text-white border-none text-[8px] font-black uppercase">Recommended</Badge>
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white shadow-xl z-10 border-4 border-white hidden md:flex">
                               <ArrowRight className="h-5 w-5" />
                            </div>
                         </div>
                      </div>

                      <div className="flex gap-4">
                         <Link href="/profile?tab=resume">
                            <Button className="h-16 px-12 text-xl font-black rounded-[24px] gap-3 shadow-2xl shadow-primary/20 active:scale-95 transition-all">
                               Build My AI Resume <FileBadge className="h-6 w-6" />
                            </Button>
                         </Link>
                         <Link href="/interview-coach">
                            <Button variant="outline" className="h-16 px-12 text-xl font-black border-2 rounded-[24px] gap-3 active:scale-95 transition-all">
                               Try Mock Interview <MessageSquare className="h-6 w-6" />
                            </Button>
                         </Link>
                      </div>
                   </div>

                   <div className="lg:col-span-6 relative">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-none shadow-2xl rounded-[40px] p-8 space-y-6 md:mt-12 bg-white group hover:shadow-primary/10 transition-all">
                           <Target className="h-12 w-12 text-blue-600" />
                           <h3 className="text-2xl font-black leading-tight">Semantic Matching</h3>
                           <p className="text-sm text-muted-foreground leading-relaxed font-medium">Hamara AI sirf keyword nahi, aapke poore profile ka 'context' samajhkar sahi jobs match karta hai.</p>
                        </Card>
                        <Card className="border-none shadow-2xl rounded-[40px] p-8 space-y-6 bg-primary text-white transform md:-translate-y-8">
                           <Smartphone className="h-12 w-12 text-white/50" />
                           <h3 className="text-2xl font-black leading-tight">Instant WhatsApp Alerts</h3>
                           <p className="text-sm text-blue-50/80 leading-relaxed font-medium">Matching jobs ki notification seedha aapke WhatsApp par, taki aap pehle candidate banein apply karne wale.</p>
                           <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mt-4">
                              <div className="h-full bg-yellow-400 w-[94%]" />
                           </div>
                           <p className="text-[10px] font-black uppercase opacity-60">94% Notification Delivery Rate</p>
                        </Card>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Latest Jobs */}
          <section className="py-24 bg-background px-4">
            <div className="container mx-auto max-w-7xl">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div className="space-y-2">
                  <h2 className="text-5xl font-black tracking-tight">{t('latest_opps')}</h2>
                  <p className="text-xl text-muted-foreground font-medium">{t('latest_opps_subtitle')}</p>
                </div>
                <Link href="/jobs">
                  <Button variant="outline" className="h-14 px-10 font-black rounded-2xl gap-2 border-2 text-lg active:scale-95 transition-all">
                    {t('view_all_jobs')} <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredJobs.map(job => (
                  <MemoizedJobCard key={job.id} id={job.id} title={job.title} company={job.companyName} location={job.location} salary={String(job.salaryRangeMin)} type={job.jobType} postedAt="Recently" description={job.description} contactPhone={String(job.contactPhone)} employerUserProfileId={job.employerUserProfileId} salaryType={job.salaryType} isFeatured={job.isFeatured} />
                ))}
              </div>
            </div>
          </section>

          {/* Free Credits & Rewards Section */}
          <section className="py-24 bg-slate-950 text-white px-4 relative overflow-hidden">
             <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-20 space-y-4">
                   <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/10 text-white font-black text-xs uppercase tracking-widest">
                      <Gift className="h-4 w-4 text-yellow-400" /> {t('how_to_earn')}
                   </div>
                   <h2 className="text-5xl md:text-7xl font-black tracking-tight">Free Credits <span className="text-primary">Kaise Payein?</span></h2>
                   <p className="text-xl text-slate-400 font-medium">Rojgar Matrix join karein aur premium AI features muft me use karein.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {[
                     { 
                       t: t('signup_bonus'), 
                       d: t('get_signup_bonus').replace('{count}', (offersConfig?.signupBonus || 20).toString()), 
                       c: `${offersConfig?.signupBonus || 20} Credits`, 
                       i: Sparkles,
                       color: "border-blue-500"
                     },
                     { 
                       t: t('profile_bonus'), 
                       d: t('get_profile_bonus').replace('{count}', (offersConfig?.profileBonus || 10).toString()), 
                       c: `${offersConfig?.profileBonus || 10} Credits`, 
                       i: UserCheck,
                       color: "border-green-500"
                     },
                     { 
                       t: t('referral_bonus'), 
                       d: t('get_referral_bonus').replace('{count}', (offersConfig?.referralBonus || 10).toString()), 
                       c: `${offersConfig?.referralBonus || 10} Credits`, 
                       i: Users,
                       color: "border-purple-500"
                     }
                   ].map((val, i) => (
                     <Card key={i} className={cn("bg-white/5 border-white/10 p-10 rounded-[40px] text-center space-y-6 hover:bg-white/10 transition-all border-t-4", val.color)}>
                        <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary">
                           <val.i className="h-8 w-8" />
                        </div>
                        <div>
                           <h4 className="text-2xl font-black mb-2 text-white">{val.t}</h4>
                           <p className="text-sm text-slate-400 font-medium leading-relaxed">{val.d}</p>
                        </div>
                        <Badge className="bg-primary text-white font-black px-6 py-1 h-8 rounded-full">{val.c}</Badge>
                     </Card>
                   ))}
                </div>
                <div className="mt-16 text-center">
                   <Link href="/pricing"><Button variant="link" className="text-primary font-black text-lg gap-2">Recharge Options <ArrowRight className="h-5 w-5" /></Button></Link>
                </div>
             </div>
          </section>

          {/* Employer B2B Section */}
          <section className="py-24 bg-white px-4">
             <div className="container mx-auto max-w-7xl">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                   <div className="lg:col-span-7 space-y-12">
                      <div className="space-y-4">
                         <Badge className="bg-green-100 text-green-700 border-none font-black text-xs uppercase px-5 py-1.5 h-8">Hire Staff Faster</Badge>
                         <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none text-slate-900">Get Verified Leads <br /><span className="text-green-600">On WhatsApp</span></h2>
                         <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                            Logistics, Sales, Driving ya Office Work. Best candidates ko hire karein bina wait kiye.
                         </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0 text-green-600"><Star className="h-6 w-6" /></div>
                            <div className="space-y-1">
                               <h4 className="font-black text-lg">Star Candidate Alerts</h4>
                               <p className="text-sm text-muted-foreground font-medium leading-relaxed">AI matches with &gt;85% score are sent to you directly.</p>
                            </div>
                         </div>
                         <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0 text-green-600"><Zap className="h-6 w-6" /></div>
                            <div className="space-y-1">
                               <h4 className="font-black text-lg">AI Listing Optimizer</h4>
                               <p className="text-sm text-muted-foreground font-medium leading-relaxed">Improve job quality scores to attract 3x more applications.</p>
                            </div>
                         </div>
                      </div>
                      <Link href="/post-job"><Button className="h-16 px-12 text-xl font-black bg-green-600 hover:bg-green-700 rounded-3xl shadow-2xl shadow-green-600/20">Post a Job Now <PlusCircle className="ml-2 h-6 w-6" /></Button></Link>
                   </div>
                   <div className="lg:col-span-5">
                      <Card className="border-none shadow-2xl bg-slate-50 rounded-[48px] p-8 md:p-12 text-center space-y-8 relative overflow-hidden">
                         <div className="absolute -top-10 -right-10 h-32 w-32 bg-green-500/10 rounded-full blur-2xl" />
                         <div className="h-24 w-24 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto ring-8 ring-green-100/50">
                            <Users className="h-12 w-12 text-green-600" />
                         </div>
                         <div className="space-y-2">
                            <h3 className="text-2xl font-black">Hire in 60 Minutes</h3>
                            <p className="text-sm text-muted-foreground font-medium">Pehele 1 ghante mein candidates se WhatsApp par baat shuru karein.</p>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-2xl font-black text-green-600">800+</p><p className="text-[10px] font-black text-slate-400 uppercase">Employers</p></div>
                            <div className="bg-white p-4 rounded-2xl border shadow-sm"><p className="text-2xl font-black text-green-600">100%</p><p className="text-[10px] font-black text-slate-400 uppercase">Verified</p></div>
                         </div>
                      </Card>
                   </div>
                </div>
             </div>
          </section>

          {/* Testimonials */}
          {hasMounted && displayTestimonials.length > 0 && (
            <section className="py-24 bg-background px-4 border-t" suppressHydrationWarning>
               <div className="container mx-auto max-w-7xl">
                  <div className="text-center space-y-4 mb-20">
                     <div className="flex flex-col items-center gap-6">
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 px-6 py-2.5 gap-2 h-10 rounded-full font-black uppercase text-xs shadow-sm">
                           <Trophy className="h-4 w-4" /> Trusted by Thousands
                        </Badge>
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {ratingStats.total > 0 && (
                            <div className="flex items-center gap-4 bg-card px-8 py-4 rounded-[28px] shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-700">
                              <div className="flex gap-1">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={cn("h-5 w-5", s <= Math.round(Number(ratingStats.avg)) ? "text-yellow-500 fill-yellow-500" : "text-slate-200")} />
                                  ))}
                              </div>
                              <div className="h-6 w-px bg-slate-200 mx-2"></div>
                              <span className="text-2xl font-black text-slate-900">{ratingStats.avg}/5.0</span>
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pt-1">Across {ratingStats.total} Reviews</span>
                            </div>
                          )}
                          <Button 
                            onClick={() => setIsReviewOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-black h-16 px-12 text-lg rounded-[24px] shadow-2xl shadow-primary/30 gap-3 active:scale-95 transition-all ring-8 ring-primary/5"
                          >
                             <Edit2 className="h-6 w-6" /> Write a Review
                          </Button>
                        </div>
                     </div>
                     <h2 className="text-5xl md:text-7xl font-black tracking-tighter mt-12">Users <span className="text-primary">Love</span> Rojgar Matrix</h2>
                  </div>

                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                      {displayTestimonials.map((item) => (
                        <CarouselItem key={item.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                          <Card className="border-none shadow-xl rounded-[48px] bg-white overflow-hidden h-full flex flex-col group hover:shadow-2xl transition-all duration-500 border-2 border-transparent hover:border-primary/10">
                            <CardContent className="p-10 md:p-12 flex flex-col h-full space-y-10 relative">
                               <div className="absolute top-10 right-10 text-primary/10 group-hover:rotate-12 transition-transform">
                                  <Quote className="h-20 w-20" />
                               </div>
                               <div className="space-y-5">
                                  <div className="flex items-center gap-3">
                                     <div className="flex gap-0.5">
                                        {[1,2,3,4,5].map(s => (
                                          <Star key={s} className={cn("h-4 w-4", s <= (item.rating || 5) ? "text-yellow-500 fill-yellow-500" : "text-slate-200")} />
                                        ))}
                                     </div>
                                     <span className="text-xs font-black text-slate-400">{(item.rating || 5).toFixed(1)}/5</span>
                                  </div>
                                  <p className="text-xl font-medium text-slate-700 leading-relaxed italic flex-1">"{item.content}"</p>
                               </div>
                               <div className="flex items-center gap-5 pt-8 border-t border-slate-50 mt-auto">
                                  <div className="h-16 w-16 rounded-[24px] overflow-hidden border-2 border-white shadow-md relative bg-muted shrink-0">
                                     {item.userPhoto ? <Image src={item.userPhoto} alt={item.userName} fill className="object-cover" /> : <UserCheck className="h-8 w-8 m-4 text-slate-300" />}
                                  </div>
                                  <div className="min-w-0">
                                     <h4 className="font-black text-slate-900 text-lg truncate">{item.userName}</h4>
                                     <p className="text-[10px] font-black uppercase text-primary tracking-widest truncate">{item.userRole}</p>
                                  </div>
                               </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
               </div>
            </section>
          )}

          {/* CTA Section */}
          <section className="py-24 px-4 bg-muted/20">
             <div className="container mx-auto max-w-7xl">
                <Card className="border-none shadow-2xl bg-primary text-white rounded-[60px] overflow-hidden relative group">
                   <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/bgcta/1200/800')] opacity-5 mix-blend-overlay group-hover:scale-105 transition-transform duration-1000"></div>
                   <CardContent className="p-12 md:p-24 text-center space-y-8 relative z-10">
                      <div className="space-y-4">
                         <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">{t('cta_title')}</h2>
                         <p className="text-xl text-blue-100 max-w-2xl mx-auto font-medium">{t('cta_subtitle')}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                         <Link href="/login" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto h-16 px-12 text-xl font-black bg-white text-primary hover:bg-blue-50 rounded-[24px] gap-3 shadow-2xl">
                               Start Now <ArrowRight className="h-6 w-6" />
                            </Button>
                         </Link>
                         <Link href="/post-job" className="w-full sm:w-auto">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto h-16 px-12 text-xl font-black border-black/30 text-black hover:bg-white/10 rounded-[24px] gap-3 border-4">
                               I am an Employer <Building2 className="h-6 w-6" />
                            </Button>
                         </Link>
                      </div>
                   </CardContent>
                </Card>
             </div>
          </section>

          {/* FAQ Section */}
          <section className="py-24 px-4 bg-background">
             <div className="container mx-auto max-w-4xl">
                <div className="text-center space-y-4 mb-20">
                   <h2 className="text-5xl md:text-7xl font-black tracking-tight flex items-center justify-center gap-6">
                     <HelpCircle className="h-14 w-14 text-primary" /> {t('faq_title')}
                   </h2>
                   <p className="text-xl text-muted-foreground font-medium">{t('faq_subtitle')}</p>
                </div>
                <Accordion type="single" collapsible className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4,5,6,7,8].map((i) => (
                    <AccordionItem key={i} value={`item-${i}`} className="bg-card border rounded-[32px] px-10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                       <AccordionTrigger className="font-bold text-2xl py-8 hover:no-underline text-left">{t(`faq_q${i}`)}</AccordionTrigger>
                       <AccordionContent className="text-muted-foreground text-xl leading-relaxed pb-10 font-medium">{t(`faq_a${i}`)}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
             </div>
          </section>
        </main>
        <Footer />
      </div>

      {/* MOBILE VIEW */}
      <div className="md:hidden flex flex-col flex-1 pb-20 overflow-x-hidden">
        <AppHeader />
        <main className="flex-1">
          {/* Mobile Hero */}
          <div className="bg-primary rounded-b-[60px] pb-14 shadow-2xl relative overflow-hidden">
            <OfferBanner />

            {/* Ad Slider Mobile */}
            {hasMounted && promotions && promotions.length > 0 && (
              <section className="px-5 pt-2">
                 <Carousel className="w-full" opts={{ loop: true }}>
                    <CarouselContent>
                      {promotions.map((promo) => (
                        <CarouselItem key={promo.id}>
                          <a href={promo.targetUrl} target="_blank" rel="noopener noreferrer">
                             <div className="relative h-48 w-full rounded-[32px] overflow-hidden shadow-xl border-4 border-white ring-1 ring-border">
                                <Image src={promo.imageUrl} alt="Ad" fill className="object-cover" />
                             </div>
                          </a>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                 </Carousel>
              </section>
            )}

            {/* Hero Mobile */}
            <section className="px-5 pt-8 text-white text-center">
               <div className="space-y-8 relative z-10">
                 <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] border border-white/20 shadow-inner">
                    <ShieldCheck className="h-4 w-4 text-blue-300" /> {t('secure_platform')}
                 </div>
                 <h2 className="text-5xl font-black tracking-tight leading-[1.05]">
                    {t('hero_title_start')}<span className="text-yellow-400">{t('hero_title_highlight')}</span>
                 </h2>
                 <p className="text-blue-50 text-base font-medium leading-relaxed px-2 opacity-90">{t('hero_subtitle')}</p>
                 
                 <form onSubmit={handleSearch} className="space-y-4">
                    <div className="bg-white rounded-[28px] p-3 flex items-center gap-3 shadow-2xl border-none">
                       <Search className="h-6 w-6 text-slate-400 ml-4" />
                       <Input placeholder={t('search_placeholder')} className="border-none text-slate-900 h-12 text-base font-bold bg-transparent shadow-none focus-visible:ring-0" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1 bg-white/10 rounded-[28px] p-3 flex items-center gap-3 border-2 border-white/20">
                          <MapPin className="h-5 w-5 text-white/60 ml-3" />
                          <Input placeholder={t('city_placeholder')} className="border-none text-white h-12 text-sm font-bold bg-transparent shadow-none focus-visible:ring-0" value={cityInput} onChange={(e) => setCityInput(e.target.value)} />
                      </div>
                      <Button size="icon" type="submit" className="h-16 w-16 rounded-[30px] bg-yellow-400 shadow-2xl shadow-yellow-400/40 active:scale-90 transition-all">
                         <ArrowRight className="h-8 w-8 text-[#003366]" />
                      </Button>
                    </div>
                 </form>
              </div>
            </section>
          </div>

          <div className="py-6 space-y-14">
            {/* AdSense Unit Mobile */}
            <div className="px-5">
               <AdUnit slot="8182736412" />
            </div>

            {/* Mobile WhatsApp Bot Mockup */}
            <section className="px-5">
               <div className="text-center space-y-1 mb-6">
                  <h3 className="text-2xl font-black text-slate-900">WhatsApp Assistant</h3>
                  <p className="text-xs text-muted-foreground font-bold">Search jobs in your local language.</p>
               </div>
               <Link href="/simulator">
                 <Card className="border-[6px] border-slate-900 rounded-[32px] shadow-xl overflow-hidden bg-slate-100 flex flex-col active:scale-[0.98] transition-all">
                    <div className="bg-[#075e54] p-3 text-white flex items-center gap-3">
                       <Smartphone className="h-5 w-5 opacity-70" />
                       <p className="font-bold text-xs">Rojgar Matrix Bot • Hinglish Assistant</p>
                    </div>
                    <div className="p-4 space-y-3 bg-[#e5ddd5] h-60 overflow-hidden">
                       <div className="bg-white p-2.5 rounded-xl rounded-tl-none shadow-sm max-w-[80%] text-xs font-medium">Namaste! Kaha aur kaunsi naukri chahiye?</div>
                       <div className="bg-[#dcf8c6] p-2.5 rounded-xl rounded-tr-none shadow-sm ml-auto max-w-[80%] text-xs font-bold">Bhilai me Office Work</div>
                       <div className="bg-white p-2.5 rounded-xl rounded-tl-none shadow-sm max-w-[85%] border-l-4 border-green-500">
                          <p className="text-[10px] font-black text-green-700 mb-1">FOUND 3 MATCHES:</p>
                          <p className="text-[10px] font-bold">Admin Executive @ Bhilai Steel</p>
                          <div className="w-full h-8 flex items-center justify-center bg-primary text-white text-[10px] font-black mt-2 rounded-xl">TEST BOT NOW</div>
                       </div>
                    </div>
                 </Card>
               </Link>
            </section>

            {/* Business Hub Mobile */}
            <section className="px-5">
               <Card className="bg-[#003366] rounded-[40px] p-8 text-white space-y-6 shadow-xl relative overflow-hidden text-center border-t-8 border-yellow-400">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Lightbulb className="h-32 w-32" /></div>
                  <div className="space-y-2 relative z-10">
                     <Badge className="bg-yellow-400 text-slate-900 border-none font-black text-[9px] uppercase px-4 h-6">Discovery Hub</Badge>
                     <h3 className="text-xl font-black">Apna Kaam Shuru Karein</h3>
                     <p className="text-sm text-blue-100 font-medium">Naukri ke sath-sath Business aur Freelancing ideas paayein.</p>
                  </div>
                  <Link href="/ai-match" className="block relative z-10">
                     <Button className="w-full h-14 bg-white text-slate-900 font-black rounded-2xl gap-2 shadow-xl active:scale-95">
                        SCAN BUSINESS IDEAS <Rocket className="h-5 w-5" />
                     </Button>
                  </Link>
               </Card>
            </section>

            {/* AI Tools Live Showcase Mobile */}
            <section className="px-5 bg-blue-50/50 py-12 rounded-[50px]">
               <div className="text-center space-y-1 mb-8">
                  <h3 className="text-2xl font-black text-slate-900">AI Summary Builder</h3>
                  <p className="text-xs text-muted-foreground font-bold">Refine your resume summary with Gemini AI.</p>
               </div>
               <Link href="/profile?tab=resume" className="space-y-6 block">
                  <div className="space-y-4">
                    <div className="bg-white p-5 rounded-3xl border shadow-sm space-y-2">
                       <p className="text-[9px] font-black uppercase text-slate-400">Standard Summary</p>
                       <p className="text-xs text-slate-400 line-through">"I need a job in Raipur as accountant."</p>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-3xl shadow-xl space-y-2 border-2 border-primary relative">
                       <div className="absolute -top-3 left-4 bg-primary text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">AI Refined</div>
                       <p className="text-[11px] text-white leading-relaxed font-medium italic">"Proactive Accounting Professional with specialized expertise in Tally Prime, ensuring 100% tax compliance for businesses in Raipur."</p>
                    </div>
                  </div>
                  <Button className="w-full h-14 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20">BUILD AI RESUME <FileBadge className="h-5 w-5" /></Button>
               </Link>
            </section>

            {/* Latest Jobs Mobile */}
            <section className="px-5">
               <div className="flex items-center justify-between px-1 mb-6">
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">Letest Job</h3>
                  <Link href="/jobs" className="text-xs font-black text-primary uppercase flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
               </div>
               <div className="space-y-4">
                  {featuredJobs.slice(0, 5).map(job => (
                    <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                        <Card className={cn(
                          "border-none shadow-md hover:shadow-lg transition-all p-4 rounded-3xl bg-white border-2 border-transparent active:border-primary/20 relative overflow-hidden",
                          job.isFeatured && "ring-2 ring-primary/20 border-primary/10"
                        )}>
                           {job.isFeatured && <div className="absolute top-0 right-0 bg-primary text-white text-[7px] font-black uppercase px-3 py-1 rounded-bl-lg">Featured</div>}
                           <div className="flex gap-4">
                              <div className="h-14 w-14 rounded-2xl bg-muted shrink-0 flex items-center justify-center shadow-inner">
                                 <Briefcase className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 space-y-1">
                                 <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-sm leading-tight line-clamp-1">{job.title}</h4>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                 </div>
                                 <p className="text-[10px] text-muted-foreground font-bold">{job.companyName} • {job.location}</p>
                                 <div className="flex gap-2 pt-1">
                                    <Badge variant="secondary" className="text-[8px] h-4 font-black bg-primary/5 text-primary border-none">
                                      {job.salaryType === 'monthly' ? `₹${job.salaryRangeMin}k` : `₹${job.salaryRangeMin} LPA`}
                                    </Badge>
                                    <Badge variant="outline" className="text-[8px] h-4 font-black text-green-600 border-green-200 uppercase">Latest</Badge>
                                 </div>
                              </div>
                           </div>
                        </Card>
                    </Link>
                  ))}
               </div>
            </section>

            {/* Rewards Engine Section Mobile */}
            <section className="py-12 space-y-8 bg-white rounded-[50px] shadow-inner border border-slate-100">
               <div className="text-center space-y-2 px-5">
                  <h3 className="text-3xl font-black text-slate-900">{t('how_to_earn')}</h3>
                  <p className="text-xs text-muted-foreground font-bold">Earn free AI credits today!</p>
               </div>
               <div className="space-y-4 px-5">
                  {[
                    { 
                      t: t('signup_bonus'), 
                      d: t('get_signup_bonus').replace('{count}', (offersConfig?.signupBonus || 20).toString()), 
                      i: Gift, c: "text-blue-600", b: "bg-blue-50" 
                    },
                    { 
                      t: t('profile_bonus'), 
                      d: t('get_profile_bonus').replace('{count}', (offersConfig?.profileBonus || 10).toString()), 
                      i: UserCheck, c: "text-green-600", b: "bg-green-50" 
                    },
                    { 
                      t: t('referral_bonus'), 
                      d: t('get_referral_bonus').replace('{count}', (offersConfig?.referralBonus || 10).toString()), 
                      i: Users, c: "text-purple-600", b: "bg-purple-50" 
                    }
                  ].map((bonus, i) => (
                    <Link key={i} href="/profile?tab=referrals" className="block">
                      <Card className="border-none shadow-md rounded-[32px] p-6 flex items-center gap-5 bg-card active:scale-[0.98] transition-all">
                        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", bonus.b, bonus.c)}>
                            <bonus.i className="h-7 w-7" />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="font-black text-sm text-slate-900">{bonus.t}</h4>
                            <p className="text-xs text-muted-foreground font-medium">{bonus.d}</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
               </div>
            </section>

            {/* Employer B2B Section Mobile */}
            <section className="px-5 space-y-8">
               <div className="space-y-4 text-center">
                  <Badge className="bg-green-100 text-green-700 border-none font-black text-[10px] uppercase px-4 h-7">Hire Staff Faster</Badge>
                  <h2 className="text-3xl font-black tracking-tight leading-tight text-slate-900">Get Verified Leads <br /><span className="text-green-600">On WhatsApp</span></h2>
                  <p className="text-sm text-muted-foreground font-medium px-4">Logistics, Sales, Driving ya Office Work. Best candidates ko hire karein bina wait kiye.</p>
               </div>
               
               <div className="space-y-4">
                  <div className="flex gap-4 p-5 bg-white rounded-3xl border shadow-sm">
                     <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-green-600"><Star className="h-5 w-5" /></div>
                     <div className="space-y-1">
                        <h4 className="font-black text-sm">Star Candidate Alerts</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">AI matches with &gt;85% score are sent to you directly.</p>
                     </div>
                  </div>
                  <div className="flex gap-4 p-5 bg-white rounded-3xl border shadow-sm">
                     <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0 text-green-600"><Zap className="h-5 w-5" /></div>
                     <div className="space-y-1">
                        <h4 className="font-black text-sm">AI Listing Optimizer</h4>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">Improve job quality scores to attract 3x more applications.</p>
                     </div>
                  </div>
               </div>

               <Card className="border-none shadow-xl bg-slate-50 rounded-[40px] p-8 text-center space-y-6 relative overflow-hidden">
                  <div className="h-20 w-20 bg-white rounded-[24px] shadow-lg flex items-center justify-center mx-auto ring-8 ring-green-100/50">
                     <Users className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="space-y-1">
                     <h3 className="text-xl font-black text-slate-900">Hire in 60 Minutes</h3>
                     <p className="text-[11px] text-muted-foreground font-medium">Pehele 1 ghante mein candidates se WhatsApp par baat shuru karein.</p>
                  </div>
                  <Link href="/post-job" className="block">
                     <Button className="w-full h-14 bg-green-600 text-white hover:bg-green-700 font-black rounded-2xl shadow-lg shadow-green-600/20">POST A JOB NOW</Button>
                  </Link>
               </Card>
            </section>

            {/* Testimonials Mobile */}
            {hasMounted && displayTestimonials.length > 0 && (
              <section className="space-y-8 px-5 pb-12" suppressHydrationWarning>
                 <div className="text-center space-y-4">
                    <div className="flex flex-col items-center gap-4">
                       <Badge className="bg-yellow-100 text-yellow-700 border-none font-black text-[9px] uppercase px-5 py-1.5 h-7 rounded-full shadow-sm">Trusted Platform</Badge>
                       {ratingStats.total > 0 && (
                         <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-[24px] shadow-xl border border-slate-100">
                            <div className="flex gap-0.5">
                               {[1,2,3,4,5].map(s => (
                                 <Star key={s} className={cn("h-4 w-4", s <= Math.round(Number(ratingStats.avg)) ? "text-yellow-500 fill-yellow-500" : "text-slate-200")} />
                               ))}
                            </div>
                            <span className="text-lg font-black text-slate-900">{ratingStats.avg}/5</span>
                         </div>
                       )}
                       <Button 
                         onClick={() => setIsReviewOpen(true)}
                         className="bg-primary hover:bg-primary/90 text-white font-black h-14 px-12 text-lg rounded-[28px] shadow-2xl shadow-primary/30 gap-3 mt-6 active:scale-95 transition-all ring-8 ring-primary/5"
                       >
                          <Edit2 className="h-5 w-5" /> Rate Us
                       </Button>
                    </div>
                 </div>
                 <Carousel opts={{ loop: true }} className="w-full">
                   <CarouselContent className="pb-12">
                      {displayTestimonials.map((item) => (
                        <CarouselItem key={item.id}>
                           <Card className="border-none shadow-2xl rounded-[40px] bg-white p-8 space-y-8 h-full relative overflow-hidden mx-1">
                              <Quote className="absolute top-6 right-6 h-16 w-16 text-slate-50" />
                              <div className="space-y-6">
                                 <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5">
                                       {[1,2,3,4,5].map(s => (
                                         <Star key={s} className={cn("h-4 w-4", s <= (item.rating || 5) ? "text-yellow-500 fill-yellow-500" : "text-slate-200")} />
                                       ))}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400">{(item.rating || 5).toFixed(1)}</span>
                                 </div>
                                 <p className="text-base font-medium text-slate-700 leading-relaxed italic relative z-10">"{item.content}"</p>
                              </div>
                              <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                                 <div className="h-14 w-14 rounded-[22px] overflow-hidden border-2 border-white shadow-md relative bg-muted shrink-0">
                                    {item.userPhoto ? <Image src={item.userPhoto} alt={item.userName} fill className="object-cover" /> : <UserCheck className="h-6 w-6 m-4 text-slate-300" />}
                                 </div>
                                 <div className="min-w-0">
                                    <h4 className="font-black text-sm text-slate-900 truncate">{item.userName}</h4>
                                    <p className="text-[8px] font-black uppercase text-primary tracking-widest truncate">{item.userRole}</p>
                                 </div>
                              </div>
                           </Card>
                        </CarouselItem>
                      ))}
                   </CarouselContent>
                 </Carousel>
              </section>
            )}

            {/* Mobile CTA Section */}
            <section className="px-5">
               <Card className="border-none shadow-2xl bg-primary text-white rounded-[40px] overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/bgcta/800/600')] opacity-5 mix-blend-overlay"></div>
                  <CardContent className="p-10 text-center space-y-6 relative z-10">
                     <div className="space-y-3">
                        <h2 className="text-4xl font-black tracking-tighter leading-none">{t('cta_title')}</h2>
                        <p className="text-sm text-blue-100 font-medium">{t('cta_subtitle')}</p>
                     </div>
                     <div className="flex flex-col gap-4 pt-2">
                        <Link href="/login" className="w-full">
                           <Button className="w-full h-14 text-lg font-black bg-white text-primary hover:bg-blue-50 rounded-2xl gap-3 shadow-xl">
                              Start Now <ArrowRight className="h-5 w-5" />
                           </Button>
                        </Link>
                        <Link href="/post-job" className="w-full">
                           <Button variant="outline" className="w-full h-14 text-lg font-black border-white/30 text-white rounded-2xl gap-3 border-2">
                              Post a Job <Building2 className="h-5 w-5" />
                           </Button>
                        </Link>
                     </div>
                  </CardContent>
               </Card>
            </section>

            {/* FAQ Mobile */}
            <section className="space-y-8 pb-10 px-5">
               <div className="text-center space-y-2">
                  <h3 className="text-3xl font-black text-slate-900">{t('faq_title')}</h3>
                  <p className="text-xs text-muted-foreground font-bold">{t('faq_subtitle')}</p>
               </div>
               <Accordion type="single" collapsible className="w-full space-y-3">
                 {[1,2,3,4,5].map((i) => (
                   <AccordionItem key={i} value={`faq-${i}`} className="bg-card border rounded-2xl px-5 overflow-hidden shadow-sm">
                      <AccordionTrigger className="text-sm font-bold text-left py-5">{t(`faq_q${i}`)}</AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground leading-relaxed pb-5 font-medium">{t(`faq_a${i}`)}</AccordionContent>
                   </AccordionItem>
                 ))}
               </Accordion>
            </section>
          </div>
        </main>
        <Footer />
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-[40px] overflow-hidden p-0 border-none bg-white max-h-[90vh] flex flex-col shadow-3xl">
           <DialogHeader className="p-8 bg-muted/20 border-b shrink-0 text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                 <Trophy className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-black">Success Story</DialogTitle>
              <DialogDescription className="font-medium text-slate-500 text-sm pt-1">
                Aapka experience doosron ki career building mein help kareba.
              </DialogDescription>
           </DialogHeader>
           
           <div className="flex-1 overflow-y-auto">
             <form onSubmit={handleSubmittingReview} className="p-8 space-y-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Name</Label>
                      <Input 
                        placeholder="e.g. Rahul Kumar" 
                        className="h-12 rounded-2xl border-2 font-bold"
                        value={reviewForm.userName}
                        onChange={(e) => setReviewForm({...reviewForm, userName: e.target.value})}
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Role</Label>
                      <Input 
                        placeholder="e.g. Sales Manager" 
                        className="h-12 rounded-2xl border-2 font-bold"
                        value={reviewForm.userRole}
                        onChange={(e) => setReviewForm({...reviewForm, userRole: e.target.value})}
                        required
                      />
                   </div>
                </div>

                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Profile Photo URL (Optional)</Label>
                   <Input 
                      placeholder="Paste image URL..." 
                      className="h-12 rounded-2xl border-2 font-mono text-[10px]"
                      value={reviewForm.userPhoto}
                      onChange={(e) => setReviewForm({...reviewForm, userPhoto: e.target.value})}
                   />
                </div>

                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center block">Rate Your Experience</Label>
                   <div className="flex gap-4 p-6 bg-slate-50 rounded-[32px] border-2 border-dashed items-center justify-center">
                     {[1,2,3,4,5].map(star => (
                       <button key={star} type="button" onClick={() => setReviewForm({...reviewForm, rating: star})}>
                          <Star className={cn("h-10 w-10 transition-all active:scale-90", star <= reviewForm.rating ? "text-yellow-500 fill-yellow-500 scale-110" : "text-slate-200")} />
                       </button>
                     ))}
                  </div>
                </div>

                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Your Feedback</Label>
                   <Textarea 
                      placeholder="E.g. I found a job in 2 days via WhatsApp!" 
                      className="min-h-[140px] rounded-[28px] border-2 p-6 font-medium italic"
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                      required
                   />
                </div>

                <div className="pt-4">
                   <Button 
                      type="submit" 
                      disabled={isSubmittingReview}
                      className="w-full h-16 font-black text-xl gap-3 rounded-[24px] shadow-2xl active:scale-95 transition-all"
                   >
                      {isSubmittingReview ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-6 w-6" /> Submit Success Review</>}
                   </Button>
                </div>
             </form>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}