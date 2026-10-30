"use client"

import { useState, useEffect } from "react";
import { useFirestore } from "@/firebase";
import { collection, getDocs } from "firebase/firestore";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Database, 
  ShieldCheck, 
  Smartphone, 
  BrainCircuit, 
  Zap, 
  Users, 
  Briefcase, 
  Cpu, 
  Layers, 
  Code2, 
  Key, 
  Lock, 
  CheckCircle2,
  Presentation,
  Search,
  User as UserIcon,
  MessageCircle,
  Building2,
  Globe,
  Wand2,
  Target,
  FileBadge,
  MessageSquare,
  Gift,
  SmartphoneNfc,
  Ticket,
  CreditCard,
  History,
  Terminal,
  Scale,
  RefreshCw,
  LayoutTemplate,
  Tag,
  MousePointer2,
  Heart,
  Star,
  Coins,
  FileText,
  Megaphone,
  Languages,
  Printer,
  BellRing,
  RotateCcw,
  MousePointerClick,
  FileSearch,
  ShieldAlert,
  Percent,
  PhoneCall,
  Settings,
  GraduationCap,
  MessageSquareCode,
  Trophy,
  Lightbulb,
  Rocket,
  Maximize2,
  MonitorSmartphone,
  Eye,
  Layout,
  IndianRupee,
  Bot,
  WalletCards,
  Palette,
  Tags,
  Share2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// --- DYNAMIC DISCOVERY CONSTANTS: EXTRACTED FROM CODEBASE ---

const JOB_SEEKER_MODULE = [
  { title: "Smart Job Search", desc: "City & Category based real-time filtering with URL params.", icon: Search, status: "COMPLETED" },
  { title: "AI Opportunity Matrix", desc: "Dual-scanning discovery engine for Jobs and Business ideas.", icon: Rocket, status: "COMPLETED" },
  { title: "AI Business Discovery", desc: "Suggests practical entrepreneurship & self-employment ideas based on user skills.", icon: Lightbulb, status: "COMPLETED" },
  { title: "AI Career Counselor", desc: "Personalized advice, selection probability, and gap analysis.", icon: GraduationCap, status: "COMPLETED" },
  { title: "AI Resume Refinement", desc: "Gemini-powered summary optimization for ATS visibility.", icon: Wand2, status: "COMPLETED" },
  { title: "Invite & Earn Hub", desc: "Dedicated referral dashboard with lifetime earnings tracking.", icon: Gift, status: "COMPLETED" },
  { title: "Recursive Referrals", desc: "Unique link generation with session-based referral tracking.", icon: Share2, status: "COMPLETED" },
  { title: "Dynamic CV Builder", desc: "5+ PDF templates: Modern, Minimalist, Creative, Corporate, Executive.", icon: FileBadge, status: "COMPLETED" },
  { title: "Responsive Resume Preview", desc: "Smart A4 scaling for mobile with Zoom In/Out & Fit controls.", icon: Maximize2, status: "COMPLETED" },
  { title: "Print-Perfect PDF Logic", desc: "Isolated single-page A4 print logic that ignores UI elements.", icon: Printer, status: "COMPLETED" },
  { title: "AI Interview Coach", desc: "Live mock interviews with scoring and Hinglish feedback.", icon: MessageSquare, status: "COMPLETED" },
  { title: "Profile Strength", desc: "Percentage-based completion tracking (100% logic).", icon: Activity, status: "COMPLETED" },
  { title: "Direct WhatsApp Apply", desc: "One-click lead generation with pre-filled context messages.", icon: MessageCircle, status: "COMPLETED" }
];

const EMPLOYER_MODULE = [
  { title: "AI Listing Optimizer", desc: "Quality scoring for spam, clarity, and salary realism.", icon: Zap, status: "COMPLETED" },
  { title: "Star Candidate Alerts", desc: "WhatsApp leads sent for AI matches with >85% score.", icon: Star, status: "COMPLETED" },
  { title: "Lead CRM Dashboard", desc: "Incoming seeker management with manual status updates.", icon: Users, status: "COMPLETED" },
  { title: "Marketing Contact CRM", desc: "Persistent Firestore-backed database for broadcast leads.", icon: SmartphoneNfc, status: "COMPLETED" },
  { title: "Ad Campaign Manager", desc: "Employer banner promotion system with credit deductions.", icon: Ticket, status: "COMPLETED" },
  { title: "Featured Listings", desc: "Priority placement for fixed durations (Admin configured).", icon: Zap, status: "COMPLETED" },
  { title: "Auto-Broadcast", desc: "Automated notification to matching seekers on new post.", icon: SmartphoneNfc, status: "COMPLETED" }
];

const WHATSAPP_ENGINE = [
  { title: "Hinglish NLU", desc: "Intent, City, and Category extraction from raw chat text.", icon: BrainCircuit, status: "COMPLETED" },
  { title: "Interactive Bot Flows", desc: "Custom trigger-based button sequences (wa_flows).", icon: MousePointer2, status: "COMPLETED" },
  { title: "Template Sync", desc: "Real-time sync of approval status from Meta Cloud API.", icon: LayoutTemplate, status: "COMPLETED" },
  { title: "Variable Mapping", desc: "Dynamic injection of user data into message templates.", icon: Code2, status: "COMPLETED" },
  { title: "Smart Bulk Sender", desc: "Scheduled mass outreach with delivery tracking logs.", icon: Smartphone, status: "COMPLETED" },
  { title: "Missed Call Trigger", desc: "Automatic bot initiation upon detecting missed call events.", icon: PhoneCall, status: "COMPLETED" }
];

const MONETIZATION_SEO = [
  { title: "Rewards Engine", desc: "Configurable Sign-up, Profile, and Referral bonus logic.", icon: Gift, status: "COMPLETED" },
  { title: "Smart Coupon System", desc: "Discount codes for credit packs with min-purchase logic.", icon: Tag, status: "COMPLETED" },
  { title: "AdSense Smart Display", desc: "Ads shown only when credits = 0; 100% ad-free for paid users.", icon: Layout, status: "COMPLETED" },
  { title: "Admin Ad Control", desc: "Global master toggle and Publisher ID management via UI.", icon: Settings, status: "COMPLETED" },
  { title: "Google Job Schema", desc: "JSON-LD structured data for direct indexing on Google Jobs.", icon: FileSearch, status: "COMPLETED" },
  { title: "Dynamic SEO Metadata", desc: "Unique titles/descriptions for every job, city, and category.", icon: Globe, status: "COMPLETED" },
  { title: "Razorpay (GST 18%)", desc: "Secure orders with signature verification and tax logging.", icon: CreditCard, status: "COMPLETED" }
];

const INFRASTRUCTURE_UX = [
  { title: "Secure Dispatch Proxy", desc: "Server Action pattern to mask API keys from browser network tabs.", icon: ShieldAlert, status: "COMPLETED" },
  { title: "Dynamic Asset Injector", desc: "Live client-side Favicon and Logo updates via Branding Manager.", icon: Palette, status: "COMPLETED" },
  { title: "Centered Login Logic", desc: "Professional max-width card layout for desktop/mobile.", icon: Lock, status: "COMPLETED" },
  { title: "App-like OTP UX", desc: "Spaced character tracking for modern mobile verification.", icon: Smartphone, status: "COMPLETED" },
  { title: "Unified Mobile Menu", desc: "Synced Navbar/AppHeader for deep linking into AI features.", icon: MenuIcon, status: "COMPLETED" },
  { title: "Database Repair Suite", desc: "Admin tools for fixing user roles and broken records.", icon: ShieldAlert, status: "COMPLETED" },
  { title: "Audit Trail", desc: "Granular transaction history for usage and top-ups.", icon: History, status: "COMPLETED" }
];

const ADMIN_UTILITIES = [
  { title: "Lead Discovery & CSV", desc: "Bulk import leads from CSV or sync existing DB users to CRM.", icon: Users, status: "COMPLETED" },
  { title: "Dynamic Bot Control", desc: "Train AI and adjust WhatsApp flows in real-time.", icon: Bot, status: "COMPLETED" },
  { title: "Revenue Analytics", desc: "Visual tracking of credit purchases and GST compliance.", icon: WalletCards, status: "COMPLETED" },
  { title: "Service Credit Pricing", desc: "Granular control over AI and notification costs.", icon: CreditCard, status: "COMPLETED" },
  { title: "Automated Recovery", desc: "Drip campaigns for low-balance users via WhatsApp.", icon: RotateCcw, status: "COMPLETED" },
  { title: "Branding Manager", desc: "Instant logo and favicon updates across the entire site.", icon: Palette, status: "COMPLETED" },
  { title: "Category Management", desc: "Industry group mapping for semantic search optimization.", icon: Tags, status: "COMPLETED" }
];

const FIRESTORE_COLLECTIONS = [
  { id: 'users', role: 'Profiles & Wallet', icon: UserIcon },
  { id: 'jobs', role: 'Marketplace Data', icon: Briefcase },
  { id: 'applications', role: 'Hiring Leads', icon: FileText },
  { id: 'transactions', role: 'Audit Logs', icon: Coins },
  { id: 'testimonials', role: 'User Reviews', icon: Trophy },
  { id: 'marketing_contacts', role: 'CRM Database', icon: Smartphone },
  { id: 'wa_flows', role: 'Bot Logic', icon: MousePointer2 },
  { id: 'wa_templates', role: 'Meta Assets', icon: LayoutTemplate },
  { id: 'offers', role: 'Visual Campaigns', icon: Ticket },
  { id: 'coupons', role: 'Discounts', icon: Tag },
  { id: 'settings', role: 'System Config', icon: Settings },
  { id: 'inquiries', role: 'Support Tickets', icon: MessageSquare }
];

function MenuIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

export default function PlatformOverviewPage() {
  const db = useFirestore();
  const [stats, setStats] = useState({
    users: 0,
    jobs: 0,
    applications: 0,
    leads: 0,
    transactions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlatformStats() {
      if (!db) return;
      try {
        const [uSnap, jSnap, aSnap, cSnap, tSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "jobs")),
          getDocs(collection(db, "applications")),
          getDocs(collection(db, "marketing_contacts")),
          getDocs(collection(db, "transactions"))
        ]);

        setStats({
          users: uSnap.size,
          jobs: jSnap.size,
          applications: aSnap.size,
          leads: cSnap.size,
          transactions: tSnap.size
        });
      } catch (e) {
        console.error("Overview Fetch Fail:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPlatformStats();
  }, [db]);

  const FeatureCard = ({ icon: Icon, title, desc, status, color }: any) => (
    <div className="flex gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:shadow-md transition-all group">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform", color || "bg-muted")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
           <h4 className="font-bold text-sm truncate">{title}</h4>
           {status && <Badge className={cn("text-[7px] h-4 border-none font-black", status === 'COMPLETED' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{status}</Badge>}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{desc}</p>
      </div>
    </div>
  );

  const SectionHeader = ({ icon: Icon, title, desc }: any) => (
    <div className="space-y-1 mb-6">
      <h3 className="text-xl font-black flex items-center gap-3">
        <Icon className="h-6 w-6 text-primary" />
        {title}
      </h3>
      <p className="text-sm text-muted-foreground ml-9">{desc}</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12 pb-32">
      {/* 1. HEADER SUMMARY */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-4">
            <Presentation className="h-10 w-10 text-primary" />
            Platform Architecture & Discovery
          </h1>
          <p className="text-muted-foreground text-lg">Comprehensive audit of modules, logic, and operational systems.</p>
        </div>
        <Card className="border-none shadow-xl bg-primary text-white p-6 rounded-[32px] overflow-hidden relative min-w-[320px]">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Activity className="h-24 w-24" />
          </div>
          <div className="space-y-4 relative z-10">
            <Badge className="bg-white/20 text-white border-none font-black uppercase text-[10px]">PRODUCTION STATUS</Badge>
            <div className="space-y-0.5">
               <p className="text-[10px] font-bold uppercase opacity-60">System Integrity</p>
               <h4 className="text-2xl font-black">100% FUNCTIONAL</h4>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-green-400 w-full" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        <div className="xl:col-span-8 space-y-16">
          
          {/* CORE STACK */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
             {[
               { l: 'Frontend', v: 'Next.js 15.5', i: Code2 },
               { l: 'Database', v: 'Firestore NoSQL', i: Database },
               { l: 'Auth', v: 'Firebase Phone/Google', i: Lock },
               { l: 'AI Engine', v: 'Gemini 2.5 Flash', i: BrainCircuit }
             ].map((s, i) => (
               <Card key={i} className="border-none shadow-sm p-5 text-center flex flex-col items-center gap-2 rounded-[24px]">
                 <s.i className="h-5 w-5 text-primary opacity-40" />
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{s.l}</p>
                 <h4 className="text-xs font-black">{s.v}</h4>
               </Card>
             ))}
          </div>

          {/* JOB SEEKER MODULE */}
          <div className="space-y-10">
            <SectionHeader icon={UserIcon} title="Job Seeker Journey" desc="Deep-dive into candidate-facing features and tools." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {JOB_SEEKER_MODULE.map((f, i) => (
                 <FeatureCard key={i} {...f} color="bg-blue-50 text-blue-600" />
               ))}
            </div>
          </div>

          {/* EMPLOYER MODULE */}
          <div className="space-y-10">
            <SectionHeader icon={Building2} title="Employer Ecosystem" desc="Hiring engine, listing optimization, and recruitment CRM." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {EMPLOYER_MODULE.map((f, i) => (
                 <FeatureCard key={i} {...f} color="bg-orange-50 text-orange-600" />
               ))}
            </div>
          </div>

          {/* MONETIZATION & SEO */}
          <div className="space-y-10">
            <SectionHeader icon={IndianRupee} title="Monetization & SEO Engine" desc="Revenue optimization, Google Jobs auto-indexing, and AdSense." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {MONETIZATION_SEO.map((f, i) => (
                 <FeatureCard key={i} {...f} color="bg-purple-50 text-purple-600" />
               ))}
            </div>
          </div>

          {/* WHATSAPP ENGINE */}
          <div className="space-y-8">
            <SectionHeader icon={Smartphone} title="WhatsApp Communication Engine" desc="NLU-powered bot logic and bulk broadcasting system." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {WHATSAPP_ENGINE.map((f, i) => (
                 <FeatureCard key={i} {...f} color="bg-green-600 text-white" />
               ))}
            </div>
          </div>

          {/* INFRASTRUCTURE & UX */}
          <div className="space-y-8">
            <SectionHeader icon={MonitorSmartphone} title="Infrastructure & Global UX" desc="Systemic polish, centered layouts, and shared component synchronization." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {INFRASTRUCTURE_UX.map((f, i) => (
                 <FeatureCard key={i} {...f} color="bg-slate-100 text-slate-900" />
               ))}
            </div>
          </div>

          {/* ADMIN UTILITIES */}
          <div className="space-y-8">
             <SectionHeader icon={Terminal} title="Internal Administrative Suite" desc="Control center for system maintenance, ads, and marketing." />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {ADMIN_UTILITIES.map((f, i) => (
                 <FeatureCard key={i} {...f} color="bg-slate-900 text-white" />
               ))}
             </div>
          </div>

          {/* DATABASE SCHEMAS */}
          <div className="space-y-8">
             <SectionHeader icon={Database} title="Firestore Schema Mapping" desc="Persistence layer architecture and roles." />
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {FIRESTORE_COLLECTIONS.map(coll => (
                  <div key={coll.id} className="p-4 bg-muted/20 border-2 border-dashed border-muted rounded-2xl flex items-center gap-3">
                     <coll.icon className="h-5 w-5 text-primary opacity-40" />
                     <div>
                        <p className="font-mono text-[10px] font-black text-primary uppercase">{coll.id}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{coll.role}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* BILINGUAL LOGIC */}
          <Card className="border-none shadow-xl bg-muted/30 p-8 rounded-[40px] border-2 border-dashed">
             <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center shadow-sm">
                   <Languages className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                   <h4 className="text-xl font-black">Bilingual & i18n Logic</h4>
                   <p className="text-sm text-muted-foreground font-medium">Rojgar Matrix operates in English and Hindi (Hinglish). LocalStorage persistence ensures the user's preference is saved across sessions.</p>
                </div>
             </div>
          </Card>

        </div>

        <aside className="xl:col-span-4 space-y-10">
          
          {/* LIVE METRICS */}
          <Card className="border-none shadow-xl rounded-[40px] overflow-hidden bg-card border-t-8 border-primary">
             <CardHeader className="bg-primary/5 p-8 border-b">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                   <Activity className="h-5 w-5 text-primary" /> Core Inventory
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                {[
                  { label: 'System Users', value: stats.users, max: 1000, i: Users },
                  { label: 'Market Jobs', value: stats.jobs, max: 200, i: Briefcase },
                  { label: 'Hiring Leads', value: stats.applications, max: 500, i: FileText },
                  { label: 'Marketing CRM', value: stats.leads, max: 500, i: Smartphone },
                  { label: 'Transactions', value: stats.transactions, max: 100, i: CreditCard }
                ].map((stat, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between items-center text-xs font-bold">
                        <span className="flex items-center gap-2 text-muted-foreground"><stat.i className="h-3.5 w-3.5" /> {stat.label}</span>
                        <span className="font-black">{loading ? '...' : stat.value}</span>
                     </div>
                     <Progress value={(stat.value / (stat.max || 1)) * 100} className="h-1.5" />
                  </div>
                ))}
             </CardContent>
          </Card>

          {/* SECURITY & COMPLIANCE */}
          <Card className="border-none shadow-xl rounded-[40px] bg-slate-900 text-white overflow-hidden">
             <CardHeader className="bg-slate-800 p-8 border-b border-white/5">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                   <ShieldCheck className="h-5 w-5 text-green-400" /> Security Layers
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                {[
                  { t: 'RBAC Access Control', d: 'Owner-based Firestore rules and Admin email checks.', i: Lock },
                  { t: 'Server Proxy Pattern', d: 'x-api-keys masked via Server Actions.', i: Key },
                  { t: 'Signature Validation', d: 'Razorpay HMAC verification on payment verify.', i: ShieldCheck },
                  { t: 'SEO Optimization', d: 'Dynamic sitemaps and JSON-LD for Search Engines.', i: Globe }
                ].map((sec, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                     <sec.i className="h-5 w-5 text-green-400 shrink-0 mt-1" />
                     <div className="space-y-1">
                        <h5 className="text-[10px] font-black uppercase tracking-tight">{sec.t}</h5>
                        <p className="text-[10px] text-white/50 leading-relaxed font-medium">{sec.d}</p>
                     </div>
                  </div>
                ))}
             </CardContent>
          </Card>

          {/* SYSTEM ARCHITECTURE */}
          <div className="bg-blue-50 p-8 rounded-[40px] border-2 border-dashed border-blue-200 space-y-6">
             <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                   <Cpu className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-lg font-black text-blue-900">Logic Transport</h4>
             </div>
             <div className="space-y-4">
                {[
                   { t: 'Frontend (React 19)', d: 'Client components with Lucide & Tailwind.', i: CheckCircle2 },
                   { t: 'Transport (Actions)', d: 'Secure dispatch to protected API routes.', i: CheckCircle2 },
                   { t: 'Data Layer (NoSQL)', d: 'Firestore real-time subscription model.', i: CheckCircle2 },
                   { t: 'Messaging (Meta)', d: 'Webhook handshake & WhatsApp Cloud API.', i: CheckCircle2 },
                   { t: 'AI Layer (Gemini)', d: 'NLU, Quality Checks, and Career Advice.', i: CheckCircle2 }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                     <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                        <item.i className="h-3.5 w-3.5 text-blue-600" /> {item.t}
                     </div>
                     <p className="text-[10px] text-blue-700/60 ml-5.5 font-medium pl-5">{item.d}</p>
                  </div>
                ))}
             </div>
          </div>

        </aside>
      </div>
    </div>
  );
}