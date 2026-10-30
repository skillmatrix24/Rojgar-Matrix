"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/JobCard";
import { OfferBanner } from "@/components/layout/OfferBanner";
import { Search, MapPin, SlidersHorizontal, Loader2, MessageCircle, Zap, Filter, ChevronRight, ChevronLeft, Briefcase, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, limit, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdUnit } from "@/components/ads/AdUnit";

const JOBS_PER_PAGE = 10;

export default function JobsPage() {
  const { isUserLoading } = useUser();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState<string>("");
  const [searchTitle, setSearchTitle] = useState<string>("");
  const [includeExpired, setIncludeExpired] = useState(true); // Default to true to show content
  
  const [cityInput, setCityInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  
  const [jobs, setJobs] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [isCatsLoading, setIsCatsLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (isUserLoading || !db) return;

    const fetchCategories = async () => {
      setIsCatsLoading(true);
      try {
        const q = query(
          collection(db, "categories"), 
          where("isActive", "==", true), 
          orderBy("order", "asc")
        );
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbCategories(docs);
      } catch (error) {
        console.error("Categories Fetch Error:", error);
      } finally {
        setIsCatsLoading(false);
      }
    };

    fetchCategories();
  }, [db, isUserLoading]);

  useEffect(() => {
    if (isUserLoading || !db) return;

    const fetchJobs = async () => {
      setIsJobsLoading(true);
      try {
        // Fetch latest 100 active jobs. 
        // We handle refined filtering and sorting on client for better UX with small datasets.
        let q = query(
          collection(db, "jobs"), 
          where("isActive", "==", true),
          orderBy("postedDate", "desc"),
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setJobs(docs);
      } catch (error) {
        console.error("Jobs Error:", error);
      } finally {
        setIsJobsLoading(false);
      }
    };

    fetchJobs();
  }, [db, isUserLoading]);

  // Combined Filtering & Sorting
  const processedJobs = useMemo(() => {
    let result = jobs.filter(job => {
      const jobTitle = String(job?.title || "").toLowerCase();
      const jobLocation = String(job?.location || "").toLowerCase();
      const jobCategory = String(job?.category || "");
      
      const matchesTitle = !searchTitle || jobTitle.includes(searchTitle.toLowerCase());
      const matchesCity = !searchCity || jobLocation.includes(searchCity.toLowerCase());
      const matchesCat = !selectedCategory || jobCategory === selectedCategory;
      
      // Strict date filter only if user chooses not to include older ones
      if (!includeExpired) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const postedDate = job.postedDate?.toDate?.() || new Date(job.postedDate);
        if (postedDate < thirtyDaysAgo) return false;
      }

      return matchesTitle && matchesCity && matchesCat;
    });

    // Sort: Featured first, then newest
    return result.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      const dateA = a.postedDate?.toDate?.()?.getTime() || 0;
      const dateB = b.postedDate?.toDate?.()?.getTime() || 0;
      return dateB - dateA;
    });
  }, [jobs, searchTitle, searchCity, selectedCategory, includeExpired]);

  // Pagination Logic
  const totalPages = Math.ceil(processedJobs.length / JOBS_PER_PAGE);
  const currentJobs = processedJobs.slice((currentPage - 1) * JOBS_PER_PAGE, currentPage * JOBS_PER_PAGE);

  const handleSearch = () => {
    setSearchCity(cityInput);
    setSearchTitle(titleInput);
    setCurrentPage(1); // Reset to first page on new search
  };

  const resetFilters = () => {
    setTitleInput("");
    setCityInput("");
    setSearchTitle("");
    setSearchCity("");
    setSelectedCategory(null);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const groupedCategories = dbCategories.reduce((acc, cat) => {
    const group = cat.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  const isLoading = isUserLoading || isJobsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="hidden md:flex flex-col flex-1">
        <Navbar />
        <OfferBanner />
        <main className="flex-1 bg-muted/20 pb-20">
          <div className="container mx-auto max-w-7xl px-4 py-10">
            <div className="flex flex-col gap-10">
              <div className="bg-card p-6 rounded-2xl shadow-sm border space-y-4">
                <div className="flex flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      suppressHydrationWarning
                      className="pl-10 h-14 text-base border-muted focus-visible:ring-primary/20 bg-muted/10" 
                      placeholder={t('search_placeholder')}
                      value={titleInput}
                      onChange={(e) => setTitleInput(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                      suppressHydrationWarning
                      className="pl-10 h-14 text-base border-muted focus-visible:ring-primary/20 bg-muted/10" 
                      placeholder={t('city_placeholder')}
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                    />
                  </div>
                  <button className="h-14 px-10 font-black text-base shadow-lg shadow-primary/20 bg-primary text-white rounded-xl active:scale-95 transition-all" onClick={handleSearch}>
                    {t('search_jobs')}
                  </button>
                </div>
              </div>

              {/* Ad Unit after Search */}
              <AdUnit slot="5162738419" className="mb-6" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <aside className="lg:col-span-3 space-y-6">
                  <Card className="border-none shadow-xl bg-green-600 text-white overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                          <MessageCircle className="h-6 w-6 text-white" />
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-base leading-tight">WhatsApp Search</h3>
                          <p className="text-[10px] text-green-50 uppercase font-black tracking-widest">Instant Matches</p>
                        </div>
                      </div>
                      <Link href="/simulator" className="block">
                        <Button variant="secondary" className="w-full font-black gap-2 text-green-700 h-11 hover:bg-white shadow-lg transition-transform active:scale-95">
                          <Zap className="h-4 w-4" /> START ON WA
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <div className="flex items-center justify-between px-1">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      {t('filters')}
                    </h2>
                    {(selectedCategory || searchCity || searchTitle) && (
                      <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-[10px] font-black uppercase text-destructive">Clear All</Button>
                    )}
                  </div>

                  <Accordion type="single" collapsible defaultValue="category" className="space-y-4">
                    <AccordionItem value="category" className="bg-card border rounded-2xl px-4 overflow-hidden shadow-sm">
                      <AccordionTrigger className="hover:no-underline font-bold py-4 text-sm">{t('category')}</AccordionTrigger>
                      <AccordionContent className="space-y-6 pt-2 pb-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {isCatsLoading ? (
                          <div className="py-4 text-xs italic text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> {t('loading_categories')}
                          </div>
                        ) : (
                          Object.entries(groupedCategories).map(([groupName, cats]) => (
                            <div key={groupName} className="space-y-3">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary/70 px-1 border-l-2 border-primary/40 pl-2">
                                {groupName}
                              </h4>
                              <div className="space-y-3">
                                {cats.map((cat) => (
                                  <div key={cat.id} className="flex items-center gap-3 group cursor-pointer">
                                    <Checkbox 
                                      id={`cat-${cat.id}`} 
                                      checked={selectedCategory === cat.name}
                                      onCheckedChange={(checked) => {
                                        setSelectedCategory(checked ? cat.name : null);
                                        setCurrentPage(1);
                                      }}
                                      className="rounded-md h-5 w-5"
                                    />
                                    <Label 
                                      htmlFor={`cat-${cat.id}`} 
                                      className="text-sm font-bold leading-none cursor-pointer group-hover:text-primary transition-colors py-1"
                                    >
                                      {cat.name}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="expiry" className="bg-card border rounded-2xl px-4 overflow-hidden shadow-sm">
                      <AccordionTrigger className="hover:no-underline font-bold py-4 text-sm">Job Validity</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-2 pb-6">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            id="include-expired" 
                            checked={includeExpired} 
                            onCheckedChange={(c) => {
                              setIncludeExpired(!!c);
                              setCurrentPage(1);
                            }} 
                          />
                          <Label htmlFor="include-expired" className="text-xs font-bold text-slate-600">Show older than 30 days</Label>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </aside>

                <div className="lg:col-span-9 space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="font-black text-2xl tracking-tight">
                        {isLoading ? 'Searching...' : `${processedJobs.length} Opportunities Found`}
                     </h3>
                  </div>

                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Searching Database...</p>
                    </div>
                  ) : currentJobs.length > 0 ? (
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {currentJobs.map((job: any) => (
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
                            isFeatured={job.isFeatured}
                          />
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 pt-6">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="rounded-xl border-2 h-10 w-10"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </Button>
                          
                          <div className="flex items-center gap-1.5 px-4">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "ghost"}
                                className={cn(
                                  "h-10 w-10 rounded-xl font-black text-xs transition-all",
                                  currentPage === page ? "shadow-lg shadow-primary/20 scale-110" : ""
                                )}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </div>

                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="rounded-xl border-2 h-10 w-10"
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                          >
                            <ChevronRight className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-card rounded-[32px] border-2 border-dashed flex flex-col items-center gap-6">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                         <Search className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-2">
                         <p className="text-xl font-bold">{t('no_jobs_found')}</p>
                         <p className="text-sm text-muted-foreground max-w-xs mx-auto">Try changing filters or search for another city.</p>
                      </div>
                      <Button onClick={resetFilters} className="rounded-xl font-black px-8">Reset All Filters</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* MOBILE APP VIEW */}
      <div className="md:hidden flex flex-col flex-1 pb-20">
        <AppHeader />
        <OfferBanner />
        <main className="flex-1 px-4 py-4 space-y-6">
          <div className="space-y-3">
             <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  suppressHydrationWarning
                  placeholder="Job title or keywords..." 
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onKeyUp={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12 rounded-2xl border-none bg-card shadow-md focus-visible:ring-primary/20"
                />
             </div>
             <div className="flex gap-2">
                <div className="relative flex-1 group">
                   <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                   <Input 
                     suppressHydrationWarning
                     placeholder="City..." 
                     value={cityInput}
                     onChange={(e) => setCityInput(e.target.value)}
                     className="pl-9 h-10 rounded-xl border-none bg-card shadow-sm text-sm"
                   />
                </div>
                <Sheet>
                   <SheetTrigger asChild>
                      <button className="h-10 rounded-xl px-4 gap-2 bg-card border-none shadow-sm font-bold text-xs uppercase tracking-tighter flex items-center justify-center">
                         <Filter className="h-3.5 w-3.5" /> {selectedCategory ? 'Applied' : 'Filter'}
                      </button>
                   </SheetTrigger>
                   <SheetContent side="bottom" className="rounded-t-[32px] h-[70vh] p-0 overflow-hidden">
                      <SheetHeader className="p-6 border-b shrink-0">
                         <SheetTitle className="text-xl font-black flex items-center justify-between">
                            Filter by Category
                            {selectedCategory && <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setCurrentPage(1); }} className="text-[10px] font-black uppercase text-destructive h-8 px-3">Clear</Button>}
                         </SheetTitle>
                      </SheetHeader>
                      <ScrollArea className="flex-1 p-6 pb-20">
                         <div className="space-y-8">
                            {Object.entries(groupedCategories).map(([groupName, cats]) => (
                               <div key={groupName} className="space-y-4">
                                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{groupName}</h4>
                                  <div className="grid grid-cols-1 gap-2">
                                     {cats.map(cat => (
                                        <div 
                                          key={cat.id} 
                                          onClick={() => { setSelectedCategory(cat.name); setCurrentPage(1); }}
                                          className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                                            selectedCategory === cat.name ? "bg-primary/5 border-primary" : "bg-muted/30 border-transparent"
                                          )}
                                        >
                                           <span className={cn("text-sm font-bold", selectedCategory === cat.name ? "text-primary" : "")}>{cat.name}</span>
                                           {selectedCategory === cat.name && <Zap className="h-4 w-4 text-primary fill-primary" />}
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </ScrollArea>
                   </SheetContent>
                </Sheet>
             </div>
          </div>

          {/* AdSense for Mobile */}
          <AdUnit slot="5162738419" className="my-2" />

          <div className="space-y-4">
             <div className="flex items-center justify-between px-1">
                <h3 className="font-black text-lg tracking-tight">
                   {isLoading ? 'Searching...' : `${processedJobs.length} Positions`}
                </h3>
                <div className="flex gap-2">
                   {selectedCategory && <Badge className="bg-primary/10 text-primary border-none font-black text-[10px]">{selectedCategory}</Badge>}
                   {!includeExpired && <Badge variant="outline" className="text-[8px] font-bold uppercase"><Calendar className="h-2 w-2 mr-1" /> Recent</Badge>}
                </div>
             </div>

             {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                   <p className="text-[10px] font-black uppercase tracking-widest">Scanning Marketplace</p>
                </div>
             ) : currentJobs.length > 0 ? (
                <div className="space-y-6">
                   <div className="grid grid-cols-1 gap-4">
                      {currentJobs.map((job: any) => (
                         <Link key={job.id} href={`/jobs/${job.id}`}>
                            <Card className={cn(
                              "border-none shadow-sm hover:shadow-md transition-all p-4 rounded-3xl bg-card border-2 border-transparent active:border-primary/20 relative overflow-hidden",
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
                                        <Badge variant="secondary" className="text-[8px] h-4 font-black">
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

                   {/* Mobile Pagination */}
                   {totalPages > 1 && (
                     <div className="flex justify-center items-center gap-3 pt-4">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl"
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        >
                           <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl"
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        >
                           <ChevronRight className="h-5 w-5" />
                        </Button>
                     </div>
                   )}
                </div>
             ) : (
                <div className="py-20 text-center space-y-4 bg-card rounded-[40px] border-2 border-dashed">
                   <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Search className="h-8 w-8 text-muted-foreground/30" />
                   </div>
                   <div className="space-y-1 px-8">
                      <p className="font-bold">No jobs matched</p>
                      <p className="text-xs text-muted-foreground">Try changing your filters or searching a different city.</p>
                   </div>
                   <Button onClick={resetFilters} variant="outline" className="rounded-xl font-bold h-9">Reset Search</Button>
                </div>
             )}
          </div>
        </main>
      </div>
    </div>
  );
}
