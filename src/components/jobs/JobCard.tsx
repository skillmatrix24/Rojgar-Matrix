
"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  IndianRupee, 
  Clock, 
  Building2, 
  ChevronRight, 
  Send, 
  MessageCircle, 
  User, 
  CheckCircle2,
  Zap,
  Share2,
  AlertCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc, getDoc, collection, setDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { secureDispatch } from "@/actions/secure-dispatch";

interface JobCardProps {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  postedAt: string;
  description: string;
  contactPhone: string;
  employerUserProfileId: string;
  salaryType?: "lpa" | "monthly";
  isFeatured?: boolean;
}

export function JobCard({ 
  id, 
  title, 
  company, 
  location, 
  salary, 
  type, 
  postedAt, 
  description, 
  contactPhone,
  employerUserProfileId,
  salaryType = "lpa",
  isFeatured = false
}: JobCardProps) {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApp, setCheckingApp] = useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    if (!db || isUserLoading || !employerUserProfileId) return;

    const fetchEmployer = async () => {
      const docRef = doc(db, "users", employerUserProfileId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) setEmployerProfile(docSnap.data());
      });
    };
    fetchEmployer();
  }, [db, isUserLoading, employerUserProfileId]);

  useEffect(() => {
    if (!db || !user || !id) return;
    const checkDuplicate = async () => {
      setCheckingApp(true);
      const appId = `${id}_${user.uid}`;
      const docRef = doc(db, "applications", appId);
      const snap = await getDoc(docRef);
      setHasApplied(snap.exists());
      setCheckingApp(false);
    };
    checkDuplicate();
  }, [db, user, id]);

  const handleApplyClick = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (profile && profile.agreedToTerms !== true) {
      toast({ title: "Agreement Required", description: "Pehle profile complete karein aur terms accept karein." });
      router.push('/profile');
      return;
    }

    if (hasApplied) {
      // Logic for WhatsApp redirection should still work even if tracked
      const cleanPhone = String(contactPhone || "").replace(/\D/g, '');
      const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
      const finalSalaryText = salaryType === "monthly" ? `₹${salary}k Monthly` : `₹${salary} LPA`;
      const applyMessage = encodeURIComponent(`Namaste! I am interested in this job on RozgarMatrix:\n\n*Job:* ${title}\n*Location:* ${location}\n*Salary:* ${finalSalaryText}\n\nCan we chat?`);
      window.open(`https://wa.me/${waNumber}?text=${applyMessage}`, '_blank');
      return;
    }

    if (db && user) {
      try {
        const appId = `${id}_${user.uid}`;
        const appRef = doc(db, "applications", appId);
        
        // Final guard to prevent overwriting existing status or appliedAt date
        const checkSnap = await getDoc(appRef);
        if (!checkSnap.exists()) {
          setDoc(appRef, {
            jobId: id,
            jobTitle: title,
            employerId: employerUserProfileId,
            seekerId: user.uid,
            seekerName: user.displayName || "Anonymous",
            status: "pending",
            appliedAt: serverTimestamp()
          }, { merge: true });

          setHasApplied(true);

          secureDispatch('/api/employer-alert', {
            employerId: employerUserProfileId,
            jobTitle: title,
            seekerName: user.displayName || 'A Job Seeker'
          }).catch(err => console.error("Employer alert failed", err));
        } else {
          setHasApplied(true);
        }
      } catch (err) {
        console.error("Tracking Error:", err);
      }
    }

    const cleanPhone = String(contactPhone || "").replace(/\D/g, '');
    const waNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const finalSalaryText = salaryType === "monthly" ? `₹${salary}k Monthly` : `₹${salary} LPA`;
    const applyMessage = encodeURIComponent(`Namaste! I am interested in this job on RozgarMatrix:\n\n*Job:* ${title}\n*Location:* ${location}\n*Salary:* ${finalSalaryText}\n\nCan we chat?`);
    window.open(`https://wa.me/${waNumber}?text=${applyMessage}`, '_blank');
  };

  const shareMessage = encodeURIComponent(`📢 *Job Alert from RozgarMatrix* 📢\n\n*Role:* ${title}\n*Company:* ${company}\n*Location:* ${location}\n\n🔥 Apply Link: https://rozgarmatrix.com/jobs/${id}`);
  const shareWaUrl = `https://wa.me/?text=${shareMessage}`;

  return (
    <Card className={cn(
      "group relative hover:shadow-2xl transition-all border-border/50 bg-card rounded-[24px] overflow-hidden h-full flex flex-col",
      isFeatured && "ring-2 ring-primary/40 shadow-xl border-primary/20"
    )}>
      {isFeatured && (
        <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-black uppercase px-4 py-1.5 rounded-bl-xl shadow-lg z-10 flex items-center gap-1.5">
          <Zap className="h-2.5 w-2.5 fill-white" /> Featured
        </div>
      )}
      
      <CardHeader className="flex flex-row items-start gap-4 p-5 md:p-6">
        <div className="relative h-14 w-14 overflow-hidden rounded-2xl border bg-muted flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
          {employerProfile?.photoUrl ? (
            <Image src={employerProfile.photoUrl} alt={company} fill className="object-cover" />
          ) : (
            <User className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 space-y-1.5 min-w-0">
          <h3 className="font-black text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-xs text-muted-foreground font-bold flex items-center gap-1.5 truncate">
            <Building2 className="h-3.5 w-3.5 text-slate-400" /> {company}
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-5 md:px-6 py-0 flex-1">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground mb-4 font-bold">
          <span className="flex items-center gap-1.5 py-1 px-3 bg-muted/40 rounded-full"><MapPin className="h-3.5 w-3.5 text-primary" /> {location}</span>
          <span className="flex items-center gap-1.5 py-1 px-3 bg-primary/5 text-primary rounded-full"><IndianRupee className="h-3.5 w-3.5" /> {salaryType === "monthly" ? `${salary}k` : `${salary} LPA`}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">{description}</p>
      </CardContent>

      <CardFooter className="p-5 md:p-6 pt-3 flex flex-col gap-3">
        <div className="flex w-full gap-2">
          <Button 
            onClick={handleApplyClick} 
            disabled={checkingApp}
            className={cn(
              "flex-1 h-12 font-black rounded-xl gap-2 shadow-xl active:scale-95 transition-all",
              hasApplied ? "bg-muted text-muted-foreground" : "bg-green-600 hover:bg-green-700 text-white shadow-green-600/10"
            )}
          >
            {checkingApp ? <Loader2 className="h-4 w-4 animate-spin" /> : hasApplied ? <><CheckCircle2 className="h-4 w-4" /> Applied</> : <><MessageCircle className="h-4 w-4" /> {t('apply')}</>}
          </Button>
          <Button asChild variant="outline" size="sm" className="h-12 w-12 rounded-xl border-2 active:scale-90 transition-all" title="Share via WhatsApp">
            <a href={shareWaUrl} target="_blank" rel="noopener noreferrer">
              <Share2 className="h-4 w-4 text-slate-600" />
            </a>
          </Button>
        </div>
        <Link href={`/jobs/${id}`} className="w-full">
          <Button variant="ghost" className="w-full h-10 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-primary/5 hover:text-primary rounded-xl">
            View Details <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
