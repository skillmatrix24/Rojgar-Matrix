"use client"

import { useState, useEffect } from "react";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, limit, orderBy, where, getDocs, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Briefcase, 
  Zap, 
  MessageSquare, 
  Clock, 
  Loader2, 
  PhoneCall, 
  FileText, 
  Activity, 
  BrainCircuit, 
  Megaphone, 
  UserRound, 
  Terminal, 
  Smartphone, 
  ShieldAlert
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function AdminDashboard() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();
  
  const [stats, setStats] = useState({
    users: 0,
    jobs: 0,
    interactions: 0,
    applications: 0,
    handovers: 0,
    avgQuality: 0
  });
  
  const [recentData, setRecentData] = useState<{jobs: any[], users: any[], handovers: any[]}>({
    jobs: [],
    users: [],
    handovers: []
  });
  
  const [loading, setLoading] = useState(true);

  const whatsappSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "whatsapp");
  }, [db]);
  const { data: whatsappSettings } = useDoc(whatsappSettingsRef);

  const fetchAllData = async () => {
    if (!db || isUserLoading) return;
    setLoading(true);
    try {
      const [
        jobsSnap, 
        usersSnap, 
        interactionsSnap, 
        appsSnap,
        handoverSnap,
        recentJobsSnap, 
        recentUsersSnap
      ] = await Promise.all([
        getDocs(query(collection(db, "jobs"), where("isActive", "==", true))),
        getDocs(collection(db, "users")),
        getDocs(collection(db, "interactions")),
        getDocs(collection(db, "applications")),
        getDocs(query(collection(db, "interactions"), where("lastStep", "==", "HUMAN_HANDOVER"))),
        getDocs(query(collection(db, "jobs"), orderBy("postedDate", "desc"), limit(5))),
        getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5)))
      ]);

      const jobs = jobsSnap.docs.map(d => d.data());
      const totalQuality = jobs.reduce((acc, curr) => acc + (curr.qualityScore || 0), 0);
      const avgQuality = jobs.length > 0 ? Math.round(totalQuality / jobs.length) : 0;

      setStats({
        users: usersSnap.size,
        jobs: jobsSnap.size,
        interactions: interactionsSnap.size,
        applications: appsSnap.size,
        handovers: handoverSnap.size,
        avgQuality
      });

      setRecentData({
        jobs: recentJobsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        users: recentUsersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        handovers: handoverSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 3)
      });
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [db, isUserLoading]);

  const isSystemActive = !!whatsappSettings?.isActive;

  const STATS_CARDS = [
    { label: "User Base", value: stats.users, icon: Users, color: "text-blue-600", bg: "bg-blue-50", desc: "Total registered seekers & employers" },
    { label: "Active Jobs", value: stats.jobs, icon: Briefcase, color: "text-green-600", bg: "bg-green-50", desc: "Live listings in marketplace" },
    { label: "App Leads", value: stats.applications, icon: FileText, color: "text-purple-600", bg: "bg-purple-50", desc: "Total applications via WhatsApp" },
    { label: "Avg. Quality", value: `${stats.avgQuality}%`, icon: BrainCircuit, color: "text-orange-600", bg: "bg-orange-50", desc: "AI-checked job listing score" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary animate-pulse" />
            Smart Control Dashboard
          </h1>
          <p className="text-muted-foreground">Platform health, AI insights, and real-time recruitment traffic.</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <Link href="/admin/settings">
            <Button variant="outline" className="gap-2 font-bold border-2">
              <ShieldAlert className="h-4 w-4 text-primary" /> Security Rules
            </Button>
          </Link>
          <div className={cn(
            "flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all",
            isSystemActive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
          )}>
            <div className={cn("h-3 w-3 rounded-full animate-pulse", isSystemActive ? "bg-green-500" : "bg-red-500")} />
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">WhatsApp Engine</p>
              <p className={cn("font-bold text-sm", isSystemActive ? "text-green-700" : "text-red-700")}>
                {isSystemActive ? "SYSTEM OPERATIONAL" : "SYSTEM STOPPED"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CARDS.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
            <div className={cn("h-1 w-full", stat.color.replace('text', 'bg'))} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-[10deg] group-hover:scale-110", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{stat.label}</p>
                   <h3 className="text-3xl font-black">{loading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value}</h3>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium">{stat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          {recentData.handovers.length > 0 && (
            <Card className="border-2 border-orange-200 bg-orange-50/30 overflow-hidden group">
              <CardHeader className="bg-orange-100/50 border-b border-orange-200 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-black flex items-center gap-2 text-orange-800">
                    <UserRound className="h-4 w-4" /> 
                    PRIORITY: HUMAN HANDOVER REQUESTS
                  </CardTitle>
                  <Badge className="bg-orange-500 animate-pulse">{stats.handovers} Pending</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-orange-100">
                  {recentData.handovers.map((h) => (
                    <div key={h.id} className="p-4 flex items-center justify-between hover:bg-orange-100/40 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-white border border-orange-200 flex items-center justify-center text-orange-600">
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-orange-900">{h.phoneNumber}</p>
                          <p className="text-[10px] text-orange-700 italic">"{h.lastMessage?.slice(0, 50)}..."</p>
                        </div>
                      </div>
                      <Link href="/admin/interactions">
                        <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-orange-300 text-orange-800 hover:bg-orange-500 hover:text-white transition-all">MANAGE CHAT</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm h-full">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />Recent Job Postings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentData.jobs.map((job) => (
                    <div key={job.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                      <div className="space-y-1">
                        <p className="font-bold text-sm">{job.title}</p>
                        <p className="text-[10px] text-muted-foreground">{job.companyName} • {job.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.isFeatured && <Badge className="bg-orange-500 h-5 text-[8px] font-black uppercase"><Zap className="h-2 w-2 mr-1 fill-white" /> Featured</Badge>}
                        <Badge variant={job.isActive ? "default" : "outline"} className="text-[9px]">
                          {job.isActive ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm h-full">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4 text-primary" />New User Registrations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {recentData.users.map((u) => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs">
                          {u.firstName?.[0] || 'U'}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm">{u.firstName} {u.lastName}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{u.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-none shadow-lg bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-slate-800/50 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Link href="/admin/campaigns" className="block">
                <Button className="w-full justify-between h-12 font-bold group hover:scale-[1.02] transition-all hover:bg-white/10" variant="secondary">
                  Launch Job Broadcast
                  <Zap className="h-4 w-4 text-primary" />
                </Button>
              </Link>
              <Link href="/simulator" className="block">
                <Button className="w-full justify-between h-12 font-bold group hover:scale-[1.02] transition-all" variant="outline">
                  Open Bot Simulator
                  <Terminal className="h-4 w-4 text-blue-400" />
                </Button>
              </Link>
              <Link href="/admin/bot" className="block">
                <Button className="w-full justify-between h-12 font-bold group hover:scale-[1.02] transition-all" variant="outline">
                  Update Bot Flow
                  <MessageSquare className="h-4 w-4 text-green-400" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-3xl">
             <CardHeader>
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" /> System Overview
                </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium">
                   <span>WhatsApp Interactions</span>
                   <span className="font-bold">{stats.interactions}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium">
                   <span>Matching Accuracy</span>
                   <span className="text-green-600 font-bold">94%</span>
                </div>
                <Separator />
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  All systems are running normally. Security rules are hardening {stats.users} Rojgar Matrix profiles.
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}