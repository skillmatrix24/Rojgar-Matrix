"use client"

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Briefcase, 
  MapPin, 
  Zap, 
  Loader2, 
  Target,
  Search,
  Filter,
  Users,
  ChevronDown,
  Check
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { secureDispatch } from "@/actions/secure-dispatch";

interface SmartCampaignsTabProps {
  whatsappSettings: any;
  categories: any[] | null;
  jobs: any[] | null;
}

export function SmartCampaignsTab({ whatsappSettings, categories, jobs }: SmartCampaignsTabProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedJobId, setSelectedJobId] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [targetCount, setTargetCount] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [isJobPopoverOpen, setIsJobPopoverOpen] = useState(false);

  const filteredJobs = jobs?.filter(j => 
    j.title.toLowerCase().includes(jobSearch.toLowerCase()) || 
    j.companyName.toLowerCase().includes(jobSearch.toLowerCase())
  ) || [];

  const handleToggleCategory = (catName: string) => {
    setSelectedCategories(prev => 
      prev.includes(catName) ? prev.filter(c => c !== catName) : [...prev, catName]
    );
  };

  const calculateReach = async () => {
    if (!db) return;
    setIsCalculating(true);
    try {
      let q = query(
        collection(db, "users"), 
        where("role", "==", "jobSeeker"),
        where("whatsappNotifications", "==", true)
      );

      const snap = await getDocs(q);
      let filtered = snap.docs.map(d => d.data());

      if (filterCity) {
        filtered = filtered.filter(u => u.city?.toLowerCase().includes(filterCity.toLowerCase().trim()));
      }
      if (selectedCategories.length > 0) {
        filtered = filtered.filter(u => selectedCategories.includes(u.category));
      }

      setTargetCount(filtered.length);
    } catch (e) {
      toast({ variant: "destructive", title: "Reach Calculation Failed" });
    } finally {
      setIsCalculating(false);
    }
  };

  const launchSmartCampaign = async () => {
    if (!selectedJobId || !whatsappSettings?.isActive) {
      toast({ variant: "destructive", title: "Campaign Error", description: "Select a job and ensure WhatsApp is online." });
      return;
    }

    setIsSending(true);
    setProgress(0);
    setLogs(["Initializing smart campaign sequence..."]);

    try {
      const result = await secureDispatch('/api/send-campaign', {
        jobId: selectedJobId,
        filterCity,
        filterCategories: selectedCategories.length > 0 ? selectedCategories : null,
        accessToken: whatsappSettings.accessToken,
        phoneNumberId: whatsappSettings.phoneNumberId
      });

      if (result.ok) {
        setProgress(100);
        setLogs(prev => [...prev, `Success: ${result.data?.notifiedCount} messages dispatched.`, "Campaign Finished."]);
        toast({ title: "Campaign Complete", description: `Successfully reached ${result.data?.notifiedCount} users.` });
      } else {
        setLogs(prev => [...prev, `Error: ${result.data?.error || 'Broadcast Error'}`]);
        toast({ variant: "destructive", title: "Campaign Failed", description: result.data?.error });
      }
    } catch (err) {
      setLogs(prev => [...prev, "Critical: Network Communication Error"]);
    } finally {
      setIsSending(false);
    }
  };

  const selectedJob = jobs?.find(j => j.id === selectedJobId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-7 space-y-6">
        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30 border-b"><CardTitle className="text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> 1. Select Job Opportunity</CardTitle></CardHeader>
          <CardContent className="p-6">
            <Popover open={isJobPopoverOpen} onOpenChange={setIsJobPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-12 justify-between font-bold text-left overflow-hidden">
                  <span className="truncate">{selectedJob ? `${selectedJob.title} @ ${selectedJob.companyName}` : "Choose an active job..."}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 shadow-2xl" align="start">
                <div className="p-3 border-b bg-muted/20">
                  <Input placeholder="Search jobs..." value={jobSearch} onChange={(e) => setJobSearch(e.target.value)} className="h-9" />
                </div>
                <ScrollArea className="h-[250px]">
                  {filteredJobs.map(job => (
                    <div key={job.id} className={cn("p-3 rounded-md cursor-pointer hover:bg-primary/10", selectedJobId === job.id && "bg-primary/10 text-primary")} onClick={() => { setSelectedJobId(job.id); setIsJobPopoverOpen(false); }}>
                       <p className="text-sm font-bold truncate">{job.title}</p>
                       <p className="text-[10px] text-muted-foreground truncate">{job.companyName}</p>
                    </div>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30 border-b"><CardTitle className="text-lg flex items-center gap-2"><Filter className="h-5 w-5 text-primary" /> 2. Audience Filters</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input placeholder="Filter by City" value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="h-10" />
              <Button variant="outline" className="w-full h-10 font-bold" onClick={calculateReach} disabled={isCalculating}>
                {isCalculating ? "Calculating..." : "Calculate Reach"}
              </Button>
            </div>
            {targetCount !== null && <p className="text-xl font-black text-primary">Estimated Reach: {targetCount} Users</p>}
          </CardContent>
        </Card>

        <Button onClick={launchSmartCampaign} disabled={isSending || !selectedJobId || !whatsappSettings?.isActive} className="w-full h-14 text-lg font-black gap-3 shadow-xl">
          {isSending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Zap className="h-6 w-6" />} LAUNCH CAMPAIGN
        </Button>
      </div>

      <div className="lg:col-span-5">
        <Card className="border-none shadow-xl bg-slate-900 text-white h-[400px] overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-800 p-4 border-b border-white/5"><CardTitle className="text-xs uppercase tracking-widest">Broadcast Logs</CardTitle></CardHeader>
          <ScrollArea className="flex-1 p-6 font-mono text-[11px] space-y-2">
            {logs.map((log, i) => <div key={i} className="text-blue-300">{`> ${log}`}</div>)}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
