"use client"

import { useState, useRef } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Palette, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  Globe,
  Info,
  CheckCircle2,
  Upload,
  X,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  Link as LinkIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

export default function AdminBrandingPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  // File Input Refs
  const headerInputRef = useRef<HTMLInputElement>(null);
  const footerInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const brandingRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "branding");
  }, [db]);

  const { data: branding, isLoading } = useDoc(brandingRef);

  // Local state for instant preview of uploaded files
  const [tempHeader, setTempHeader] = useState<string | null>(null);
  const [tempFooter, setTempFooter] = useState<string | null>(null);
  const [tempFavicon, setTempFavicon] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'header' | 'footer' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      toast({ 
        variant: "destructive", 
        title: "File too large", 
        description: "Please upload a smaller image (max 800KB) for branding assets." 
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'header') setTempHeader(base64);
      if (type === 'footer') setTempFooter(base64);
      if (type === 'favicon') setTempFavicon(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    
    const data = {
      headerLogoUrl: tempHeader || formData.get('headerLogoUrl') as string,
      footerLogoUrl: tempFooter || formData.get('footerLogoUrl') as string,
      faviconUrl: tempFavicon || formData.get('faviconUrl') as string,
      socialLinks: {
        facebook: formData.get('fb_link') as string,
        instagram: formData.get('ig_link') as string,
        linkedin: formData.get('li_link') as string,
        twitter: formData.get('tw_link') as string,
        youtube: formData.get('yt_link') as string,
      },
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "settings", "branding"), data, { merge: true });
      
      // Force update local storage cache immediately to bust stale UI
      if (typeof window !== 'undefined') {
        localStorage.setItem('rojgarmatrix_branding', JSON.stringify(data));
      }

      toast({ title: "Branding Saved", description: "Your assets have been updated successfully and cache has been cleared." });
      setTempHeader(null);
      setTempFooter(null);
      setTempFavicon(null);
    } catch (error) {
      console.error("Save branding error:", error);
      toast({ variant: "destructive", title: "Save Failed", description: "Check permissions or network." });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentHeader = tempHeader || branding?.headerLogoUrl;
  const currentFooter = tempFooter || branding?.footerLogoUrl;
  const currentFavicon = tempFavicon || branding?.faviconUrl;

  return (
    <div className="p-4 md:p-8 max-w-5xl space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Palette className="h-8 w-8 text-primary" />
          Branding Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage logos and site assets across the platform. Changes reflect instantly.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-lg">
            <CardHeader className="border-b bg-card">
              <CardTitle className="text-lg">Logo Configuration</CardTitle>
              <CardDescription>Upload files directly or provide URLs for your brand images.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-12">
              
              {/* Header Logo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="headerLogoUrl" className="font-bold text-xs uppercase tracking-wider">Header Logo</Label>
                  {branding?.headerLogoUrl && !tempHeader && (
                    <span className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input 
                        id="headerLogoUrl" 
                        name="headerLogoUrl" 
                        placeholder="Paste image URL here..." 
                        defaultValue={branding?.headerLogoUrl}
                        disabled={!!tempHeader}
                        className="h-10"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="gap-2 font-bold h-10 px-4"
                      onClick={() => headerInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                    {tempHeader && (
                      <Button variant="ghost" size="icon" onClick={() => setTempHeader(null)} className="h-10 w-10">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input type="file" hidden ref={headerInputRef} accept="image/*" onChange={(e) => handleFileChange(e, 'header')} />
                  
                  {currentHeader && (
                    <div className="h-24 w-full relative bg-muted rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center">
                      <Image src={currentHeader} alt="Header Preview" fill className="object-contain p-2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Logo */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="footerLogoUrl" className="font-bold text-xs uppercase tracking-wider">Footer Logo</Label>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input 
                        id="footerLogoUrl" 
                        name="footerLogoUrl" 
                        placeholder="Paste image URL here..." 
                        defaultValue={branding?.footerLogoUrl}
                        disabled={!!tempFooter}
                        className="h-10"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="gap-2 font-bold h-10 px-4"
                      onClick={() => footerInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                    {tempFooter && (
                      <Button variant="ghost" size="icon" onClick={() => setTempFooter(null)} className="h-10 w-10">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input type="file" hidden ref={footerInputRef} accept="image/*" onChange={(e) => handleFileChange(e, 'footer')} />
                  
                  {currentFooter && (
                    <div className="h-24 w-full relative bg-muted rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center">
                      <Image src={currentFooter} alt="Footer Preview" fill className="object-contain p-2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon */}
              <div className="space-y-4">
                <Label htmlFor="faviconUrl" className="font-bold text-xs uppercase tracking-wider">Browser Favicon (.ico / .png)</Label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input 
                        id="faviconUrl" 
                        name="faviconUrl" 
                        placeholder="Paste icon URL here..." 
                        defaultValue={branding?.faviconUrl}
                        disabled={!!tempFavicon}
                        className="h-10"
                      />
                    </div>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="gap-2 font-bold h-10 px-4"
                      onClick={() => faviconInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4" /> Upload
                    </Button>
                    {tempFavicon && (
                      <Button variant="ghost" size="icon" onClick={() => setTempFavicon(null)} className="h-10 w-10">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input type="file" hidden ref={faviconInputRef} accept="image/*" onChange={(e) => handleFileChange(e, 'favicon')} />
                  
                  {currentFavicon && (
                    <div className="h-16 w-16 relative bg-muted rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center">
                      <Image src={currentFavicon} alt="Favicon Preview" fill className="object-contain p-2" />
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-6 pt-6 border-t">
                <div className="space-y-1">
                  <Label className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" /> Social Media Links
                  </Label>
                  <p className="text-[10px] text-muted-foreground">These links appear in the website footer.</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fb_link" className="text-[10px] font-bold uppercase flex items-center gap-2"><Facebook className="h-3 w-3 text-blue-600" /> Facebook</Label>
                    <Input id="fb_link" name="fb_link" defaultValue={branding?.socialLinks?.facebook} placeholder="https://facebook.com/..." className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ig_link" className="text-[10px] font-bold uppercase flex items-center gap-2"><Instagram className="h-3 w-3 text-pink-600" /> Instagram</Label>
                    <Input id="ig_link" name="ig_link" defaultValue={branding?.socialLinks?.instagram} placeholder="https://instagram.com/..." className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="li_link" className="text-[10px] font-bold uppercase flex items-center gap-2"><Linkedin className="h-3 w-3 text-blue-700" /> LinkedIn</Label>
                    <Input id="li_link" name="li_link" defaultValue={branding?.socialLinks?.linkedin} placeholder="https://linkedin.com/in/..." className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tw_link" className="text-[10px] font-bold uppercase flex items-center gap-2"><Twitter className="h-3 w-3 text-sky-500" /> Twitter / X</Label>
                    <Input id="tw_link" name="tw_link" defaultValue={branding?.socialLinks?.twitter} placeholder="https://twitter.com/..." className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yt_link" className="text-[10px] font-bold uppercase flex items-center gap-2"><Youtube className="h-3 w-3 text-red-600" /> YouTube</Label>
                    <Input id="yt_link" name="yt_link" defaultValue={branding?.socialLinks?.youtube} placeholder="https://youtube.com/..." className="h-10" />
                  </div>
                </div>
              </div>

            </CardContent>
            <CardFooter className="border-t bg-muted/20 p-6 flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2 font-bold px-10 h-12 shadow-lg shadow-primary/20">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save & Clear Cache
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-lg bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4 w-4" /> Branding Info
              </CardTitle>
            </CardHeader>
            <CardContent className="text-[11px] space-y-4 text-muted-foreground leading-relaxed">
              <div className="space-y-1">
                <p className="font-bold text-foreground">Instant Sync:</p>
                <p>Saving here will instantly update the site's logos and social links across the platform.</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-foreground">Social Links:</p>
                <p>Leaving a field blank will hide that social icon from the website footer.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}