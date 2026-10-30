"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  MapPin, 
  IndianRupee, 
  Building2, 
  Share2, 
  Bookmark, 
  ChevronLeft,
  Briefcase,
  Phone,
  MessageCircle,
  Loader2,
  Globe,
  Info,
  ArrowLeft
} from "lucide-react";
import Image from "next/image";
import { useDoc, useMemoFirebase, useFirestore, useUser } from "@/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { secureDispatch } from "@/actions/secure-dispatch";
import { AdUnit } from "@/components/ads/AdUnit";

interface JobDetailViewProps {
  jobId: string;
}

export function JobDetailView({ jobId }: JobDetailViewProps) {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const jobRef = useMemoFirebase(() => {
    if (!db || !jobId) return null;
    return doc(db, "jobs", jobId);
  }, [db, jobId]);

  const { data: job, isLoading: isJobLoading } = useDoc(jobRef);

  const employerRef = useMemoFirebase(() => {
    if (!db || !job?.employerUserProfileId) return null;
    return doc(db, "users", job.employerUserProfileId);
  }, [db, job?.employerUserProfileId]);

  const { data: employerProfile } = useDoc(employerRef);

  if (isJobLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-xs font-black uppercase tracking-widest opacity-40">Loading Position</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-muted/20">
        <div className="h-20 w-20 rounded-full bg-card flex items-center justify-center mb-6 shadow-sm border">
          <Briefcase className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-black mb-2">Job Not Found</h1>
        <p className="text-muted-foreground mb-8 text-sm">The listing you're looking for might have been removed.</p>
        <Link href="/jobs">
          <Button className="rounded-2xl font-black px-10 h-12 shadow-lg">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  const cleanPhone = String(job.contactPhone || "").replace(/\D/g, '');
  const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  const isMonthly = job.salaryType === "monthly";
  const salaryVal = job.salaryRangeMin || 0;
  const salaryText = isMonthly ? `₹${salaryVal}k Monthly` : `₹${salaryVal} LPA`;

  const handleApply = async () => {
    if (db && user) {
      const appId = `${jobId}_${user.uid}`;
      const appRef = doc(db, "applications", appId);
      
      // Safety guard to prevent clobbering existing application data
      const checkSnap = await getDoc(appRef);
      if (!checkSnap.exists()) {
        setDoc(appRef, {
          jobId,
          jobTitle: job.title,
          employerId: job.employerUserProfileId,
          seekerId: user.uid,
          seekerName: user.displayName || "Anonymous",
          seekerPhone: user.phoneNumber || "Not set",
          status: "pending",
          appliedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.error("Tracking Error:", err));

        try {
          secureDispatch('/api/employer-alert', {
            employerId: job.employerUserProfileId,
            jobTitle: job.title,
            seekerName: user.displayName || 'A Job Seeker'
          });
        } catch (e) {
          console.error("Employer Notification Failed:", e);
        }
      }
    }

    const applyMessage = encodeURIComponent(
      `Namaste! I am interested in this job listing on RozgarMatrix:\n\n` +
      `*Job:* ${job.title || "Job Listing"}\n` +
      `*Location:* ${job.location || "India"}\n` +
      `*Salary:* ${salaryText}\n\n` +
      `Please share more details. Thank you!`
    );
    window.open(`https://wa.me/${waNumber}?text=${applyMessage}`, '_blank');
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareMessage = encodeURIComponent(`📢 *Job Alert from RozgarMatrix* 📢\n\n*Role:* ${job.title || "Role"}\n*Company:* ${job.companyName || "Employer"}\n*Location:* ${job.location || "Location"}\n*Salary:* ${salaryText}\n\n*Apply Link:* ${currentUrl}\n\nShared via RozgarMatrix.`);
  const shareWaUrl = `https://wa.me/?text=${shareMessage}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="hidden md:flex flex-col flex-1">
        <main className="flex-1 bg-muted/20">
          <div className="container mx-auto max-w-7xl px-4 py-8">
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary mb-8 group">
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Jobs
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <Card className="border-none shadow-sm overflow-hidden rounded-[32px]">
                  <CardContent className="p-0">
                    <div className="h-40 bg-gradient-to-r from-[#003366] to-[#004d80]"></div>
                    <div className="px-8 pb-8">
                      <div className="relative -mt-12 mb-6 flex items-end justify-between">
                        <div className="h-32 w-32 rounded-3xl bg-card border-4 border-card shadow-xl overflow-hidden flex items-center justify-center bg-white">
                          {employerProfile?.photoUrl ? (
                            <Image src={employerProfile.photoUrl} alt={job.companyName || "Employer"} width={128} height={128} className="object-cover h-full w-full" />
                          ) : (
                            <Building2 className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="pb-2">
                           <Badge className="bg-green-600 text-white border-none font-black uppercase text-[10px] tracking-widest h-7 px-4">Verified Hiring Partner</Badge>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-3">
                          <h1 className="text-4xl font-extrabold tracking-tight">{job.title}</h1>
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground font-bold">
                            <span className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{job.companyName}</span>
                            <span className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />{job.location}</span>
                            {employerProfile?.industry && <span className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />{employerProfile.industry}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" className="rounded-xl h-12 w-12" onClick={() => { navigator.clipboard.writeText(currentUrl); toast({ title: "Link Copied" }); }}><Bookmark className="h-5 w-5" /></Button>
                          <Button asChild variant="outline" size="icon" className="rounded-xl h-12 w-12">
                            <a href={shareWaUrl} target="_blank" rel="noopener noreferrer">
                              <Share2 className="h-5 w-5" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      <Card className="border-none shadow-sm rounded-[24px]">
                          <CardHeader className="bg-muted/10 border-b p-6">
                              <CardTitle className="text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> Role Description</CardTitle>
                          </CardHeader>
                          <CardContent className="p-8">
                              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">{job.description}</p>
                          </CardContent>
                      </Card>
                      
                      {/* In-article Ad for detail page */}
                      <AdUnit slot="6172739411" format="rectangle" />
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-sm rounded-[24px]">
                            <CardHeader className="bg-muted/10 border-b p-6">
                                <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> About Employer</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-4">
                                <p className="text-muted-foreground text-sm leading-relaxed">{employerProfile?.companyDescription || "A verified employer on RozgarMatrix."}</p>
                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Founded</p>
                                        <p className="text-sm font-bold">{employerProfile?.foundingYear || '---'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Team Size</p>
                                        <p className="text-sm font-bold">{employerProfile?.companySizeRange || '---'}</p>
                                    </div>
                                </div>
                                {employerProfile?.companyWebsiteUrl && (
                                    <a href={employerProfile.companyWebsiteUrl} target="_blank" className="text-primary text-xs font-bold flex items-center gap-2 pt-2"><Globe className="h-4 w-4" /> Visit Website</a>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="border-none shadow-xl rounded-[32px] overflow-hidden sticky top-24">
                  <CardHeader className="bg-primary text-white p-8">
                    <CardTitle className="text-xl">Apply Now</CardTitle>
                    <CardDescription className="text-blue-100">Connect with the employer directly.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-border/50">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <IndianRupee className="h-5 w-5" />
                          <span className="text-sm font-bold">Salary</span>
                        </div>
                        <span className="text-lg font-black text-primary">{salaryText}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-border/50">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Briefcase className="h-5 w-5" />
                          <span className="text-sm font-bold">Type</span>
                        </div>
                        <Badge className="bg-muted text-foreground border-none font-bold">{job.jobType}</Badge>
                      </div>
                    </div>

                    <div className="pt-4 space-y-4">
                      <Button onClick={handleApply} className="w-full font-black h-14 text-lg bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20 rounded-2xl gap-3">
                        <MessageCircle className="h-6 w-6" /> APPLY ON WHATSAPP
                      </Button>
                      <div className="grid grid-cols-2 gap-3">
                        <Button asChild variant="outline" className="h-12 rounded-xl font-bold gap-2">
                          <a href={`tel:${job.contactPhone}`}>
                            <Phone className="h-4 w-4" /> Call
                          </a>
                        </Button>
                        <Button asChild variant="outline" className="h-12 rounded-xl font-bold gap-2">
                          <a href={shareWaUrl} target="_blank" rel="noopener noreferrer">
                            <Share2 className="h-4 w-4" /> Share
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Sidebar Ad Unit */}
                <AdUnit slot="7152731422" format="rectangle" />
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="md:hidden flex flex-col flex-1 pb-32">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between">
           <Link href="/jobs" className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center active:scale-90 transition-all">
              <ArrowLeft className="h-5 w-5 text-foreground" />
           </Link>
           <div className="text-center flex-1 mx-4 min-w-0">
              <h1 className="text-sm font-black truncate">{job.title}</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{job.companyName}</p>
           </div>
           <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => toast({ title: "Link Copied" })}>
              <Share2 className="h-5 w-5" />
           </Button>
        </header>

        <main className="flex-1 space-y-6">
           <div className="px-5 grid grid-cols-2 gap-3 mt-6">
              <div className="bg-card p-4 rounded-3xl shadow-sm border border-border/50 space-y-1">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Salary</p>
                 <p className="text-lg font-black text-primary">{salaryText}</p>
              </div>
              <div className="bg-card p-4 rounded-3xl shadow-sm border border-border/50 space-y-1">
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Location</p>
                 <p className="text-lg font-black text-foreground truncate">{job.location}</p>
              </div>
           </div>

           {/* Mobile detail Ad */}
           <div className="px-5">
              <AdUnit slot="6172739411" format="rectangle" />
           </div>

           <div className="px-5 space-y-8 pb-20">
              <section className="space-y-3">
                 <h3 className="text-sm font-black uppercase tracking-widest border-l-4 border-primary pl-3">Job Description</h3>
                 <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {job.description}
                 </p>
              </section>
           </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t p-4 flex gap-3 shadow-[0_-10px_30px_-5px_rgba(0,0,0,0.1)]">
           <Button asChild variant="outline" className="h-14 w-14 rounded-2xl shrink-0 border-2 active:scale-90 transition-all">
              <a href={`tel:${job.contactPhone}`}>
                 <Phone className="h-6 w-6 text-foreground" />
              </a>
           </Button>
           <Button onClick={handleApply} className="flex-1 h-14 rounded-2xl font-black text-lg gap-3 bg-green-600 hover:bg-green-700 shadow-xl shadow-green-600/20 active:scale-[0.98] transition-all">
              <MessageCircle className="h-6 w-6" /> APPLY ON WA
           </Button>
        </div>
      </div>
    </div>
  );
}
