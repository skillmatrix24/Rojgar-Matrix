
"use client"

import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JobCard } from "@/components/jobs/JobCard";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { useState, useEffect } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function CityJobsPage() {
  const { city } = useParams();
  const decodedCity = decodeURIComponent(String(city));
  const { isUserLoading } = useUser();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading || !db) return;

    const fetchCityJobs = async () => {
      setLoading(true);
      try {
        // Query jobs by location
        const q = query(
          collection(db, "jobs"), 
          where("isActive", "==", true),
          where("location", "==", decodedCity),
          limit(50)
        );
        const snap = await getDocs(q);
        setJobs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("City jobs fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCityJobs();
  }, [db, isUserLoading, decodedCity]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 bg-muted/20 pb-20">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest border border-primary/20">
              <MapPin className="h-3 w-3" />
              Localized Search
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Latest Jobs in <span className="text-primary">{decodedCity}</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Browse verified blue-collar and white-collar opportunities in {decodedCity}. Connect directly with employers on WhatsApp.
            </p>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Searching in {decodedCity}...</p>
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  id={job.id}
                  title={job.title}
                  company={job.companyName}
                  location={job.location}
                  salary={String(job.salaryRangeMin)}
                  type={job.jobType}
                  postedAt={t('recently')}
                  description={job.description}
                  contactPhone={String(job.contactPhone)}
                  employerUserProfileId={job.employerUserProfileId}
                  salaryType={job.salaryType}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-card rounded-[32px] border-2 border-dashed flex flex-col items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                 <Search className="h-10 w-10 text-muted-foreground/30" />
              </div>
              <div className="space-y-2">
                 <p className="text-xl font-bold">No jobs found in {decodedCity} yet.</p>
                 <p className="text-sm text-muted-foreground max-w-xs mx-auto">Please check back later or search for other nearby cities.</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
