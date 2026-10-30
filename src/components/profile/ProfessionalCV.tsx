
"use client"

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User as UserIcon, 
  Briefcase, 
  MapPin, 
  Edit2, 
  Loader2, 
  Sparkles, 
  Save, 
  Camera, 
  Search, 
  Check, 
  ChevronDown,
  ShieldCheck,
  Smartphone,
  Trophy,
  BookOpen,
  Mail,
  Calendar,
  CheckCircle2,
  Gift,
  PartyPopper,
  IndianRupee,
  Languages,
  Building2,
  History
} from "lucide-react";
import Image from "next/image";
import { updateDoc, serverTimestamp, DocumentReference, collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, increment } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

interface ProfessionalCVProps {
  profile: any;
  userProfileRef: DocumentReference | null;
}

export function ProfessionalCV({ profile, userProfileRef }: ProfessionalCVProps) {
  const db = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [localAgreed, setLocalAgreed] = useState(false);
  
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || "");

  // Dropdown States
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setSelectedCategory(profile.category || "");
      setPhoneNumber(profile.phoneNumber || "");
      setLocalAgreed(profile.agreedToTerms === true);
    }
  }, [profile]);

  useEffect(() => {
    if (!db || !isEditing) return;
    const fetchCats = async () => {
      setCategoriesLoading(true);
      try {
        const q = query(collection(db, "categories"), where("isActive", "==", true), orderBy("order", "asc"));
        const snap = await getDocs(q);
        setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); } finally { setCategoriesLoading(false); }
    };
    fetchCats();
  }, [db, isEditing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast({ variant: "destructive", title: "File too large (Max 800KB)" });
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => { setPreviewImage(reader.result as string); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const calculateStrengthForData = (data: any) => {
    let score = 0;
    if (data.firstName && data.firstName !== "New") score += 20;
    if (data.skills && data.skills.length > 0) score += 20;
    if (data.experience && data.experience.length > 20) score += 20;
    if (data.resumeSummary && data.resumeSummary.length > 20) score += 20;
    if (data.education) score += 20;
    return score;
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userProfileRef || !db) return;

    if (profile?.agreedToTerms !== true && !localAgreed) {
      toast({ variant: "destructive", title: t('agreement_required') });
      return;
    }

    setSaving(true);
    const formData = new FormData(e.currentTarget);
    const updatedData: any = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      city: formData.get('city') as string,
      phoneNumber: phoneNumber,
      category: selectedCategory,
      email: formData.get('email') as string,
      fatherSpouseName: formData.get('fatherSpouseName') as string,
      dob: formData.get('dob') as string,
      fullAddress: formData.get('fullAddress') as string,
      expectedSalary: formData.get('expectedSalary') as string,
      preferredJobTitle: formData.get('preferredJobTitle') as string,
      currentDesignation: formData.get('currentDesignation') as string,
      currentCompany: formData.get('currentCompany') as string,
      totalExperienceYears: formData.get('totalExperienceYears') as string,
      experience: formData.get('experience') as string,
      resumeSummary: formData.get('resumeSummary') as string,
      education: formData.get('education') as string,
      languages: (formData.get('languages') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
      skills: (formData.get('skills') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
      photoUrl: previewImage || profile?.photoUrl || "",
      updatedAt: serverTimestamp(),
      role: 'jobSeeker',
      isEmployer: false
    };

    if (profile?.agreedToTerms !== true && localAgreed) {
      updatedData.agreedToTerms = true;
      updatedData.agreedAt = serverTimestamp();
    }

    try {
      const newScore = calculateStrengthForData(updatedData);
      const isReachingFull = newScore === 100 && !profile?.profileBonusClaimed;

      if (isReachingFull) {
        const offersSnap = await getDoc(doc(db, "settings", "offers"));
        const bonusAmount = offersSnap.exists() ? offersSnap.data().profileBonus || 0 : 0;
        
        if (bonusAmount > 0) {
          updatedData.credits = increment(bonusAmount);
          updatedData.profileBonusClaimed = true;
          
          await addDoc(collection(db, "transactions"), {
            userId: profile.id,
            amount: bonusAmount,
            type: 'topup',
            description: 'Profile Completion Bonus (100%)',
            status: 'success',
            createdAt: serverTimestamp()
          });
          
          toast({ title: "Bonus Awarded! 🎉", description: `Aapne profile 100% complete kiya hai. ${bonusAmount} credits added.` });
        }
      }

      await updateDoc(userProfileRef, updatedData);
      toast({ title: "Profile Saved" });
      setIsEditing(false);
      setPreviewImage(null);
    } catch (error) { 
      toast({ variant: "destructive", title: "Update Failed" }); 
    } finally { 
      setSaving(false); 
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(catSearchQuery.toLowerCase()) ||
    (cat.group && cat.group.toLowerCase().includes(catSearchQuery.toLowerCase()))
  );

  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    const group = cat.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  const userPhoto = previewImage || profile?.photoUrl || `https://picsum.photos/seed/${profile?.id}/200/200`;
  const currentStrength = calculateStrengthForData(profile || {});

  if (!isEditing) {
    return (
      <div className="space-y-6">
        {currentStrength === 100 && !profile?.profileBonusClaimed && (
          <Card className="border-none shadow-xl bg-accent text-white overflow-hidden rounded-[32px] animate-bounce">
            <CardContent className="p-8 flex items-center justify-between gap-6">
               <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-white/20 rounded-[24px] flex items-center justify-center">
                    <PartyPopper className="h-10 w-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black">Bonus Available!</h3>
                    <p className="text-sm font-bold opacity-80">Aapka profile 100% complete hai. Bonus claim karne ke liye Save karein.</p>
                  </div>
               </div>
               <Button onClick={() => setIsEditing(true)} variant="secondary" className="font-black h-12 px-8 rounded-xl bg-white text-accent hover:bg-slate-50">Claim Now</Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl overflow-hidden bg-card rounded-[32px]">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b px-8 py-8 gap-4">
            <div>
              <CardTitle className="text-3xl font-black">Professional Profile</CardTitle>
              <div className="flex items-center gap-4 mt-2">
                 <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20">
                   {currentStrength}% Complete
                 </Badge>
                 <div className="flex items-center gap-1.5 text-xs font-bold text-green-600">
                    <ShieldCheck className="h-4 w-4" /> Verified
                 </div>
              </div>
            </div>
            <Button onClick={() => setIsEditing(true)} size="lg" className="font-black gap-2 rounded-2xl shadow-lg shadow-primary/20 h-12 px-8 active:scale-95 transition-all">
              <Edit2 className="h-4 w-4" /> Edit Profile
            </Button>
          </CardHeader>
          <CardContent className="p-8 md:p-12 space-y-12">
            <div className="flex flex-col md:flex-row gap-10 items-start">
               <div className="h-32 w-32 md:h-40 md:w-40 rounded-[40px] overflow-hidden border-4 border-muted shadow-2xl shrink-0 bg-white">
                  <Image src={userPhoto} alt="User" width={160} height={160} className="object-cover h-full w-full" />
               </div>
               <div className="space-y-6 flex-1 pt-2">
                  <div className="space-y-2">
                     <h2 className="text-4xl font-black tracking-tight">{profile?.firstName} {profile?.lastName}</h2>
                     <div className="flex items-center gap-3">
                        <p className="text-xl font-bold text-primary flex items-center gap-2">
                          <Briefcase className="h-5 w-5" /> {profile?.preferredJobTitle || "Job Seeker"}
                        </p>
                        {profile?.category && <Badge variant="outline" className="h-7 px-3 border-primary/20 text-primary font-black uppercase text-[10px]">{profile.category}</Badge>}
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-black text-muted-foreground uppercase tracking-widest">
                     <span className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl"><MapPin className="h-4 w-4 text-primary" /> {profile?.city || "India"}</span>
                     <span className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl"><Smartphone className="h-4 w-4 text-primary" /> {profile?.phoneNumber || "N/A"}</span>
                     {profile?.email && <span className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl"><Mail className="h-4 w-4 text-primary" /> {profile.email}</span>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {profile?.dob && (
                      <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
                        <p className="text-[8px] font-black uppercase text-slate-400 mb-1">DOB / Age</p>
                        <p className="text-xs font-bold text-slate-700">{profile.dob}</p>
                      </div>
                    )}
                    {profile?.expectedSalary && (
                      <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                        <p className="text-[8px] font-black uppercase text-primary mb-1">Expected Salary</p>
                        <p className="text-xs font-bold text-primary flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" /> {profile.expectedSalary}
                        </p>
                      </div>
                    )}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <section className="space-y-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Current Employment</h3>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Designation</p>
                        <p className="text-sm font-bold text-slate-800">{profile?.currentDesignation || "Not specified"}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Company</p>
                        <p className="text-sm font-bold text-slate-800">{profile?.currentCompany || "Not specified"}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Experience</p>
                        <p className="text-sm font-bold text-slate-800">{profile?.totalExperienceYears || "0"} Years</p>
                     </div>
                  </div>
               </section>

               <section className="space-y-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><UserIcon className="h-5 w-5 text-primary" /> Personal Details</h3>
                  <div className="space-y-4">
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Father's / Spouse Name</p>
                        <p className="text-sm font-bold text-slate-800">{profile?.fatherSpouseName || "Not specified"}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Address</p>
                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{profile?.fullAddress || "Not specified"}</p>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Languages Known</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                           {profile?.languages?.map((lang: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[9px] font-bold border-slate-200">{lang}</Badge>
                           ))}
                           {!profile?.languages?.length && <span className="text-sm font-bold text-slate-800">Not specified</span>}
                        </div>
                     </div>
                  </div>
               </section>
            </div>

            <section className="space-y-5 pt-10 border-t">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Profile Summary</h3>
               <p className="text-lg text-slate-700 leading-relaxed font-medium italic">{profile?.resumeSummary || "No summary provided."}</p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <section className="space-y-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Core Skills</h3>
                  <div className="flex flex-wrap gap-2">
                     {profile?.skills?.map((skill: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[10px] px-3 py-1">{skill}</Badge>
                     ))}
                  </div>
               </section>

               <section className="space-y-5">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Education</h3>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line">{profile?.education || "No education details."}</p>
               </section>
            </div>

            <section className="space-y-5 pt-10 border-t">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Detailed Experience</h3>
               <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-line">{profile?.experience || "No detailed experience provided."}</p>
            </section>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-2xl bg-card overflow-hidden rounded-[32px]">
      <form onSubmit={handleUpdate}>
        <CardHeader className="border-b p-8 flex flex-row items-center justify-between bg-muted/10">
          <CardTitle className="text-2xl font-black">Edit CV Details</CardTitle>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="font-black h-12 rounded-2xl px-8" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" className="font-black px-10 h-12 rounded-2xl shadow-xl" disabled={saving || (profile?.agreedToTerms !== true && !localAgreed)}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 md:p-12 space-y-10">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start pb-8 border-b">
             <div className="relative group">
                <div className="h-32 w-32 rounded-[32px] overflow-hidden border-4 border-muted shadow-lg bg-white">
                   <Image src={userPhoto} alt="Preview" width={128} height={128} className="object-cover h-full w-full" />
                </div>
                <Button type="button" size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl shadow-lg" onClick={() => fileInputRef.current?.click()}><Camera className="h-5 w-5" /></Button>
                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleFileChange} />
             </div>
             <div className="flex-1 space-y-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest">First Name</Label>
                    <Input name="firstName" defaultValue={profile?.firstName} required className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest">Last Name</Label>
                    <Input name="lastName" defaultValue={profile?.lastName} className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Father's / Spouse Name</Label>
              <Input name="fatherSpouseName" defaultValue={profile?.fatherSpouseName} placeholder="Full Name" className="h-12 rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Date of Birth / Age</Label>
              <Input name="dob" defaultValue={profile?.dob} placeholder="e.g. 15-05-1998 or 25" className="h-12 rounded-xl border-2 font-bold" />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest">Full Residential Address</Label>
            <Input name="fullAddress" defaultValue={profile?.fullAddress} placeholder="Street, City, Pin Code" className="h-12 rounded-xl border-2 font-bold" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Base City</Label>
              <Input name="city" defaultValue={profile?.city} className="h-12 rounded-xl border-2 font-bold" placeholder="e.g. Raipur" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Job Category</Label>
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-between h-12 rounded-xl border-2 font-bold px-4 hover:border-primary/40 transition-colors"><span>{selectedCategory || "Select Category"}</span><ChevronDown className="h-4 w-4 opacity-50 shrink-0" /></Button></PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl shadow-2xl" align="start">
                  <div className="flex items-center border-b px-3 h-12 bg-muted/20"><Search className="mr-2 h-4 w-4 shrink-0 opacity-50" /><input className="flex h-10 w-full rounded-md bg-transparent text-sm outline-none" placeholder="Search..." value={catSearchQuery} onChange={(e) => setCatSearchQuery(e.target.value)} /></div>
                  <ScrollArea className="h-80">
                    {categoriesLoading ? <div className="p-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div> : Object.entries(groupedCategories).map(([group, cats]) => (
                      <div key={group}><div className="px-4 py-2 text-[9px] font-black uppercase text-primary/70 bg-primary/5">{group}</div><div className="p-1">{cats.map(cat => (<div key={cat.id} onClick={() => { setSelectedCategory(cat.name); setPopoverOpen(false); }} className={cn("flex cursor-pointer rounded-xl px-4 py-3 text-sm hover:bg-primary/5 font-bold", selectedCategory === cat.name && "bg-primary text-white hover:bg-primary")}>{cat.name}</div>))}</div></div>
                    ))}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Preferred Job Title</Label>
              <Input name="preferredJobTitle" defaultValue={profile?.preferredJobTitle} placeholder="e.g. Senior Accountant" className="h-12 rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Expected Salary</Label>
              <Input name="expectedSalary" defaultValue={profile?.expectedSalary} placeholder="e.g. 25k/month" className="h-12 rounded-xl border-2 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Current Company</Label>
              <Input name="currentCompany" defaultValue={profile?.currentCompany} placeholder="Previous or Current Employer" className="h-12 rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Current Designation</Label>
              <Input name="currentDesignation" defaultValue={profile?.currentDesignation} placeholder="Role Name" className="h-12 rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest">Total Exp (Years)</Label>
              <Input name="totalExperienceYears" type="number" defaultValue={profile?.totalExperienceYears} placeholder="e.g. 3" className="h-12 rounded-xl border-2 font-bold" />
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Professional Summary</Label>
            <Textarea name="resumeSummary" defaultValue={profile?.resumeSummary} placeholder="A short bio highlighting your top achievements..." className="min-h-[120px] rounded-2xl p-6 border-2 font-medium" />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Detailed Experience</Label>
            <Textarea name="experience" defaultValue={profile?.experience} placeholder="Detailed roles and responsibilities in your previous jobs..." className="min-h-[150px] rounded-2xl p-6 border-2 font-medium" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Trophy className="h-4 w-4 text-primary" /> Skills (Comma separated)</Label>
              <Input name="skills" defaultValue={profile?.skills?.join(', ')} placeholder="Tally, Sales, driving..." className="h-12 rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Languages className="h-4 w-4 text-primary" /> Languages (Comma separated)</Label>
              <Input name="languages" defaultValue={profile?.languages?.join(', ')} placeholder="Hindi, English, Chhattisgarhi..." className="h-12 rounded-xl border-2 font-bold" />
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Education Details</Label>
            <Textarea name="education" defaultValue={profile?.education} placeholder="e.g. B.Com from Raipur University (2018)" className="min-h-[100px] rounded-2xl p-6 border-2 font-medium" />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest">Phone Number (Whatsapp)</Label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="9876543210" className="h-14 rounded-xl border-2 font-black text-lg" />
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest">Email Address</Label>
            <Input name="email" type="email" defaultValue={profile?.email} placeholder="john@example.com" className="h-12 rounded-xl border-2 font-bold" />
          </div>

          {profile?.agreedToTerms !== true && (
            <div className="mt-8 p-6 md:p-10 bg-blue-50/80 rounded-[32px] border-2 border-primary/30 space-y-4 shadow-xl">
               <div className="flex items-start space-x-5">
                  <div className="pt-1">
                    <Checkbox 
                      id="agreement-checkbox" 
                      checked={localAgreed} 
                      onCheckedChange={(checked) => setLocalAgreed(checked === true)}
                      className="h-8 w-8 rounded-xl border-2 border-primary data-[state=checked]:bg-primary shadow-sm"
                    />
                  </div>
                  <div className="grid gap-3 leading-none">
                     <Label htmlFor="agreement-checkbox" className="text-lg md:text-xl font-black leading-tight cursor-pointer text-slate-900">I accept the Platform Agreement & Privacy Policy</Label>
                     <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">By checking this, you confirm your profile data is accurate and you agree to our terms of service.</p>
                  </div>
               </div>
            </div>
          )}

          <div className="pt-10 flex flex-col sm:flex-row justify-end gap-3 border-t">
            <Button type="button" variant="ghost" className="font-black h-14 rounded-2xl order-2 sm:order-1 px-8" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" className="font-black px-12 h-14 rounded-2xl shadow-2xl shadow-primary/20 order-1 sm:order-2 text-lg" disabled={saving || (profile?.agreedToTerms !== true && !localAgreed)}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Save CV Details
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
