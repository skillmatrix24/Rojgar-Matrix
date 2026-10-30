
"use client"

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Building2, 
  MapPin, 
  Edit2, 
  Loader2, 
  Save, 
  Camera, 
  Smartphone, 
  ShieldCheck,
  ExternalLink,
  Globe,
  Info,
  Calendar,
  Users,
  Target,
  Heart,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Gift
} from "lucide-react";
import Image from "next/image";
import { updateDoc, serverTimestamp, DocumentReference } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

interface EmployerProfileProps {
  profile: any;
  userProfileRef: DocumentReference | null;
}

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

export function EmployerProfile({ profile, userProfileRef }: EmployerProfileProps) {
  const db = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [localAgreed, setLocalAgreed] = useState(false);
  const [companySize, setCompanySize] = useState(profile?.companySizeRange || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber || "");
      setLocalAgreed(profile.agreedToTerms === true);
      setCompanySize(profile.companySizeRange || "");
    }
  }, [profile]);

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
      email: formData.get('email') as string,
      companyDescription: formData.get('companyDescription') as string,
      industry: formData.get('industry') as string,
      companyWebsiteUrl: formData.get('companyWebsiteUrl') as string,
      foundingYear: formData.get('foundingYear') as string,
      companySizeRange: companySize,
      companyCultureDescription: formData.get('companyCultureDescription') as string,
      benefitsDescription: formData.get('benefitsDescription') as string,
      socialLinks: {
        facebook: formData.get('fb_link') as string,
        twitter: formData.get('tw_link') as string,
        linkedin: formData.get('li_link') as string,
        instagram: formData.get('ig_link') as string,
      },
      headquartersLocation: formData.get('city') as string,
      photoUrl: previewImage || profile?.photoUrl || "",
      updatedAt: serverTimestamp(),
      isEmployer: true,
      role: 'employer'
    };

    if (profile?.agreedToTerms !== true && localAgreed) {
      updatedData.agreedToTerms = true;
      updatedData.agreedAt = serverTimestamp();
    }

    try {
      await updateDoc(userProfileRef, updatedData);
      toast({ title: "Hiring Profile Saved" });
      setIsEditing(false);
      setPreviewImage(null);
    } catch (error) { 
      toast({ variant: "destructive", title: "Update Failed" }); 
    } finally { 
      setSaving(false); 
    }
  };

  const userPhoto = previewImage || profile?.photoUrl || `https://picsum.photos/seed/${profile?.id}/200/200`;

  if (!isEditing) {
    return (
      <div className="space-y-6">
        <Card className="border-none shadow-xl overflow-hidden bg-card rounded-[32px]">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b px-8 py-8 bg-primary/5 gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black">Company & Hiring Profile</CardTitle>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Employer Dashboard Settings</p>
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
                     <div className="flex items-center gap-3">
                        <h2 className="text-4xl font-black tracking-tight">{profile?.firstName} {profile?.lastName}</h2>
                        <Badge className="bg-green-600 text-white border-none font-black text-[10px] uppercase h-6 px-3">Verified</Badge>
                     </div>
                     <p className="text-lg font-bold text-primary flex items-center gap-2">
                        <Target className="h-5 w-5" /> {profile?.industry || "General Hiring"}
                     </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                     <div className="bg-muted/30 p-4 rounded-2xl border border-dashed flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <div className="space-y-0.5">
                           <p className="text-[8px] font-black uppercase text-muted-foreground">Whatsapp</p>
                           <p className="text-sm font-bold">{profile?.phoneNumber || "N/A"}</p>
                        </div>
                     </div>
                     <div className="bg-muted/30 p-4 rounded-2xl border border-dashed flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div className="space-y-0.5">
                           <p className="text-[8px] font-black uppercase text-muted-foreground">Hiring In</p>
                           <p className="text-sm font-bold">{profile?.city || "India"}</p>
                        </div>
                     </div>
                     <div className="bg-muted/30 p-4 rounded-2xl border border-dashed flex items-center gap-3">
                        <Users className="h-5 w-5 text-primary" />
                        <div className="space-y-0.5">
                           <p className="text-[8px] font-black uppercase text-muted-foreground">Company Size</p>
                           <p className="text-sm font-bold">{profile?.companySizeRange || "Not set"}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pt-4">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Info className="h-4 w-4" /> About Company
                     </h3>
                     <p className="text-base text-slate-700 leading-relaxed font-medium italic">
                        {profile?.companyDescription || "No company description provided."}
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Heart className="h-4 w-4 text-pink-500" /> Culture & Values</h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{profile?.companyCultureDescription || "Not specified."}</p>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Gift className="h-4 w-4 text-blue-500" /> Employee Benefits</h3>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{profile?.benefitsDescription || "Not specified."}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-6 border-t">
                     {profile?.companyWebsiteUrl && (
                       <a href={profile.companyWebsiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-primary/5 text-primary px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/10 transition-colors">
                          <Globe className="h-4 w-4" /> {profile.companyWebsiteUrl.replace(/^https?:\/\//, '')}
                       </a>
                     )}
                     {profile?.foundingYear && (
                       <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground">
                          <Calendar className="h-4 w-4" /> Founded: {profile.foundingYear}
                       </div>
                     )}
                  </div>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-2xl bg-card overflow-hidden rounded-[32px]">
      <form onSubmit={handleUpdate}>
        <CardHeader className="border-b p-8 flex flex-row items-center justify-between bg-muted/10">
          <CardTitle className="text-2xl font-black">Update Hiring Profile</CardTitle>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" className="font-black h-12 rounded-2xl px-8" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" className="font-black px-12 h-14 rounded-2xl shadow-xl" disabled={saving || (profile?.agreedToTerms !== true && !localAgreed)}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Save Details
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
                    <Label className="text-xs font-black uppercase tracking-widest">Company Name</Label>
                    <Input name="firstName" defaultValue={profile?.firstName} required className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest">Industry / Sector</Label>
                    <Input name="industry" defaultValue={profile?.industry} placeholder="e.g. IT Services, Logistics" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                </div>
             </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Info className="h-4 w-4" /> About Company</Label>
            <Textarea name="companyDescription" defaultValue={profile?.companyDescription} placeholder="Tell job seekers about your company, mission, and what you do..." className="min-h-[120px] rounded-2xl p-6 border-2 font-medium" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Users className="h-3 w-3" /> Company Size</Label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map(size => (
                    <SelectItem key={size} value={size}>{size} Employees</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Calendar className="h-3 w-3" /> Founding Year</Label>
              <Input name="foundingYear" type="number" defaultValue={profile?.foundingYear} placeholder="e.g. 2015" className="h-12 rounded-xl border-2 font-bold" />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Smartphone className="h-3 w-3" /> Whatsapp Number</Label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="h-12 rounded-xl border-2 font-black" placeholder="9876543210" />
            </div>
          </div>

          <div className="space-y-3 pt-6 border-t">
            <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Globe className="h-3 w-3" /> Company Website URL</Label>
            <Input name="companyWebsiteUrl" defaultValue={profile?.companyWebsiteUrl} placeholder="https://www.company.com" className="h-14 rounded-xl border-2 font-bold" />
          </div>

          {profile?.agreedToTerms !== true && (
            <div className="mt-8 p-6 md:p-10 bg-blue-50/80 rounded-[32px] border-2 border-primary/30 space-y-4 shadow-xl">
               <div className="flex items-start space-x-5">
                  <div className="pt-1">
                    <Checkbox 
                      id="employer-agreement" 
                      checked={localAgreed} 
                      onCheckedChange={(checked) => setLocalAgreed(checked === true)}
                      className="h-8 w-8 rounded-xl border-2 border-primary data-[state=checked]:bg-primary shadow-sm"
                    />
                  </div>
                  <div className="grid gap-3 leading-none">
                     <Label 
                      htmlFor="employer-agreement" 
                      className="text-lg md:text-xl font-black leading-tight cursor-pointer text-slate-900"
                     >
                        I accept the Employer Agreement & Terms
                     </Label>
                     <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-2xl">
                        By checking this, you agree to provide genuine job listings and maintain professional 
                        conduct when communicating with candidates.
                     </p>
                  </div>
               </div>
            </div>
          )}

          <div className="pt-10 flex flex-col sm:flex-row justify-end gap-3 border-t">
            <Button type="button" variant="ghost" className="font-black h-14 rounded-2xl order-2 sm:order-1 px-8" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button type="submit" className="font-black px-12 h-14 rounded-2xl shadow-2xl shadow-primary/20 order-1 sm:order-2 text-lg" disabled={saving || (profile?.agreedToTerms !== true && !localAgreed)}>
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />} Save Details
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
