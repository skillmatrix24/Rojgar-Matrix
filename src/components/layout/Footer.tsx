"use client"

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n";
import { 
  Briefcase, 
  ShieldCheck, 
  Heart, 
  Globe,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube
} from "lucide-react";
import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Badge } from "@/components/ui/badge";

export function Footer() {
  const { t } = useTranslation();
  const db = useFirestore();
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [cachedBranding, setCachedBranding] = useState<any>(null);
  const [imgError, setImgError] = useState(false);

  const brandingRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "branding");
  }, [db]);
  const { data: liveBranding } = useDoc(brandingRef);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rojgarmatrix_branding');
      if (saved) {
        try { setCachedBranding(JSON.parse(saved)); } catch (e) {}
      }
    }
  }, []);

  const displayBranding = liveBranding || cachedBranding;
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'logo-main');
  const logoUrl = displayBranding?.footerLogoUrl || displayBranding?.headerLogoUrl || defaultLogo?.imageUrl || "";

  const socialLinks = displayBranding?.socialLinks || {};

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  return (
    <footer className="bg-card border-t pt-16 pb-12 px-5 md:px-8 print:hidden">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          {/* Brand Identity */}
          <div className="md:col-span-5 space-y-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              {logoUrl && !imgError ? (
                <div className="relative h-10 md:h-12 w-[160px] md:w-[220px]">
                  <Image 
                    src={logoUrl} 
                    alt="Rojgar Matrix" 
                    fill
                    className="object-contain object-center md:object-left"
                    unoptimized
                    onError={() => setImgError(true)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-xl tracking-tighter">
                    <span className="text-[#F58220]">Rojgar</span><span className="text-[#003366]"> Matrix</span>
                  </span>
                </div>
              )}
            </div>
            <p className="text-base text-muted-foreground max-w-md mx-auto md:mx-0 leading-relaxed font-medium">
              {t('footer_desc')}
            </p>
            
            {/* Social Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
               {socialLinks.facebook && (
                 <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="h-11 w-11 rounded-2xl bg-muted/50 border flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-sm active:scale-90">
                    <Facebook className="h-5 w-5" />
                 </a>
               )}
               {socialLinks.instagram && (
                 <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="h-11 w-11 rounded-2xl bg-muted/50 border flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all cursor-pointer shadow-sm active:scale-90">
                    <Instagram className="h-5 w-5" />
                 </a>
               )}
               {socialLinks.linkedin && (
                 <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="h-11 w-11 rounded-2xl bg-muted/50 border flex items-center justify-center hover:bg-blue-700 hover:text-white transition-all cursor-pointer shadow-sm active:scale-90">
                    <Linkedin className="h-5 w-5" />
                 </a>
               )}
               {socialLinks.twitter && (
                 <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="h-11 w-11 rounded-2xl bg-muted/50 border flex items-center justify-center hover:bg-sky-500 hover:text-white transition-all cursor-pointer shadow-sm active:scale-90">
                    <Twitter className="h-5 w-5" />
                 </a>
               )}
               {socialLinks.youtube && (
                 <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="h-11 w-11 rounded-2xl bg-muted/50 border flex items-center justify-center hover:bg-red-600 hover:text-white transition-all cursor-pointer shadow-sm active:scale-90">
                    <Youtube className="h-5 w-5" />
                 </a>
               )}
               {!Object.values(socialLinks).some(link => !!link) && (
                  <div className="h-11 w-11 rounded-2xl bg-muted/30 border flex items-center justify-center opacity-30">
                    <Globe className="h-5 w-5" />
                  </div>
               )}
            </div>
          </div>
          
          {/* Links Section */}
          <div className="md:col-span-4 grid grid-cols-2 gap-x-8 gap-y-10 md:gap-4">
            <div className="space-y-6">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 border-l-2 border-primary pl-3">{t('platform')}</h4>
              <nav className="flex flex-col gap-4 text-sm font-bold text-slate-600">
                <Link href="/jobs" className="hover:text-primary transition-colors">{t('find_jobs')}</Link>
                <Link href="/post-job" className="hover:text-primary transition-colors">{t('post_job')}</Link>
                <Link href="/job-adviser" className="hover:text-primary transition-colors flex items-center gap-1.5">{t('job_adviser')} <Badge className="bg-primary/10 text-primary border-none text-[7px] h-3.5 px-1.5 font-black uppercase">AI</Badge></Link>
                <Link href="/interview-coach" className="hover:text-primary transition-colors flex items-center gap-1.5">{t('interview_coach')} <Badge className="bg-orange-100 text-orange-600 border-none text-[7px] h-3.5 px-1.5 font-black uppercase">Coach</Badge></Link>
                <Link href="/ai-match" className="hover:text-primary transition-colors">AI Match</Link>
                <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </nav>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 border-l-2 border-slate-200 pl-3">{t('support')}</h4>
              <nav className="flex flex-col gap-4 text-sm font-bold text-slate-600">
                <Link href="/about" className="hover:text-primary transition-colors">{t('about_us')}</Link>
                <Link href="/contact" className="hover:text-primary transition-colors">{t('contact_us')}</Link>
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
                <Link href="/refund" className="hover:text-primary transition-colors">Refund</Link>
              </nav>
            </div>
          </div>

          {/* Legal / Trust Section */}
          <div className="md:col-span-3 space-y-6">
             <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 border-l-2 border-green-500 pl-3">Trust & Safety</h4>
             <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                   <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" /> Secure Platform
                   </div>
                   <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                      All hiring interactions are verified and protected via Meta Cloud API security standards.
                   </p>
                </div>
                <div className="p-4 rounded-2xl bg-green-50/50 border border-green-100 space-y-2">
                   <div className="flex items-center gap-2 text-green-700 font-black text-[10px] uppercase tracking-wider">
                      <Heart className="h-4 w-4" /> Made in India
                   </div>
                   <p className="text-[10px] text-green-600/70 font-medium leading-relaxed">
                      Empowering the Indian workforce with next-gen AI tools and WhatsApp accessibility.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-muted-foreground font-black uppercase tracking-widest text-center">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
            <span className="opacity-60">© {currentYear} Rojgar Matrix</span>
            <span className="hidden md:block opacity-20">|</span>
            <a href="https://skillmatrix.in" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline transition-all">
            Powered by ❤️ Skill Matrix
            </a>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
             <div className="flex items-center gap-1.5 text-green-600">
                <ShieldCheck className="h-4 w-4" /> 
                <span>100% Verified Jobs</span>
             </div>
             <div className="flex items-center gap-1.5 text-blue-600">
                <Globe className="h-4 w-4" />
                <span>Pan-India Coverage</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}