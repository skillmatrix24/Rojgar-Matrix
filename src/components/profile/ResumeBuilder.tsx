
"use client"

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Printer, 
  Wand2, 
  Loader2, 
  Wallet, 
  AlertCircle,
  Maximize,
  ZoomIn,
  ZoomOut,
  Smartphone,
  Monitor,
  FileDown
} from "lucide-react";
import { updateDoc, serverTimestamp, DocumentReference, increment, addDoc, collection } from "firebase/firestore";
import { aiApplicationOptimization } from "@/ai/flows/ai-application-optimization";
import { useToast } from "@/hooks/use-toast";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { useFirestore } from "@/firebase";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Import Templates
import { ModernSidebarTemplate } from "./templates/ModernSidebar";
import { MinimalistTemplate } from "./templates/Minimalist";
import { CreativeTemplate } from "./templates/CreativeAccent";
import { CorporateTemplate } from "./templates/CorporateFormal";
import { ExecutiveTemplate } from "./templates/ExecutiveClassic";

interface ResumeBuilderProps {
  profile: any;
  userProfileRef: DocumentReference | null;
}

type TemplateId = "modern" | "minimalist" | "creative" | "corporate" | "executive";

const REFINE_COST = 5;

export function ResumeBuilder({ profile, userProfileRef }: ResumeBuilderProps) {
  const db = useFirestore();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>("modern");
  const [aiLoading, setAiLoading] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width < 768 && containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 32; 
        const scale = containerWidth / 794; 
        setZoom(scale);
      } else {
        setZoom(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAiRefine = async () => {
    if (!profile?.resumeSummary || !profile?.preferredJobTitle) {
      toast({ variant: "destructive", title: "Missing Info", description: "Job title aur summary zaroori hai." });
      return;
    }

    if ((profile.credits || 0) < REFINE_COST) {
      setShowRechargePopup(true);
      return;
    }

    setAiLoading(true);
    try {
      const result = await aiApplicationOptimization({
        resumeSummary: profile.resumeSummary,
        jobDescription: `Profile: ${profile.preferredJobTitle}, Experience: ${profile.totalExperienceYears} years, Skills: ${profile.skills?.join(', ')}`,
      });

      if (userProfileRef && db) {
        await updateDoc(userProfileRef, {
          resumeSummary: result.improvedResumeSummary,
          credits: increment(-REFINE_COST),
          updatedAt: serverTimestamp(),
        });

        await addDoc(collection(db, "transactions"), {
          userId: profile.id,
          amount: REFINE_COST,
          type: 'usage',
          description: 'AI Resume Refinement',
          status: 'success',
          createdAt: serverTimestamp()
        });

        toast({ title: "AI Refined!", description: `${REFINE_COST} credits used to optimize your summary.` });
      }
    } catch (error) {
      console.error("AI Resume Refinement error:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Refine nahi ho paya." });
    } finally {
      setAiLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!previewRef.current) return;
    setPdfGenerating(true);

    try {
      // Ensure all assets and fonts are loaded for canvas
      await document.fonts.ready;
      
      const element = previewRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 3, // High scale for crisp text
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        letterRendering: true,
        onclone: (clonedDoc) => {
          const el = clonedDoc.querySelector('.resume-print-target') as HTMLElement;
          if (el) {
            // Strictly reset coordinate system in clone to avoid parent offsets
            el.style.transform = 'none';
            el.style.margin = '0';
            el.style.padding = '0';
            el.style.position = 'absolute';
            el.style.top = '0';
            el.style.left = '0';
            el.style.width = '210mm';
            el.style.height = '297mm';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      
      const fileName = `Resume_${(profile?.firstName || 'User').replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      toast({ title: "PDF Ready", description: "Download successful." });
    } catch (error) {
      console.error("PDF Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Download Failed", 
        description: "Please try again." 
      });
    } finally {
      setPdfGenerating(false);
    }
  };

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(Math.max(0.3, prev + delta), 2));
  };

  const resetZoom = () => {
    if (isMobile && containerRef.current) {
       const containerWidth = containerRef.current.offsetWidth - 32;
       setZoom(containerWidth / 794);
    } else {
       setZoom(1);
    }
  };

  const userPhoto = profile?.photoUrl || `https://picsum.photos/seed/${profile?.id}/200/200`;
  const canAfford = (profile?.credits || 0) >= REFINE_COST;

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-card p-4 md:p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl md:text-2xl font-black tracking-tight">AI Resume Builder</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase">
                 <Wallet className="h-3 w-3" /> Analysis Cost: {REFINE_COST} Credits
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                className={cn(
                  "flex-1 md:flex-none gap-2 h-11 font-bold text-xs rounded-xl transition-all",
                  !canAfford && "border-orange-500 text-orange-600 hover:bg-orange-50"
                )} 
                onClick={handleAiRefine} 
                disabled={aiLoading || pdfGenerating}
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                <span>{canAfford ? "AI Refine" : "Recharge"}</span>
              </Button>
              
              <Button 
                className="flex-1 md:flex-none gap-2 font-black px-6 h-11 text-xs shadow-lg shadow-primary/20 rounded-xl" 
                onClick={handleGeneratePDF}
                disabled={pdfGenerating}
              >
                {pdfGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="h-3.5 w-3.5" />
                    Save PDF
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-dashed">
            <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-xl border">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-2">Style</span>
              <Select value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateId)}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 border-none bg-transparent shadow-none font-bold text-xs">
                  <SelectValue placeholder="Select Style" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="modern">Modern Sidebar</SelectItem>
                  <SelectItem value="minimalist">Minimalist Clean</SelectItem>
                  <SelectItem value="creative">Creative Accent</SelectItem>
                  <SelectItem value="corporate">Corporate Formal</SelectItem>
                  <SelectItem value="executive">Executive Classic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5 bg-muted/30 p-1 rounded-xl border self-center sm:self-auto">
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => adjustZoom(-0.1)} title="Zoom Out"><ZoomOut className="h-4 w-4" /></Button>
               <span className="text-[10px] font-black w-10 text-center uppercase tracking-tighter">{Math.round(zoom * 100)}%</span>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => adjustZoom(0.1)} title="Zoom In"><ZoomIn className="h-4 w-4" /></Button>
               <div className="w-px h-4 bg-border mx-1"></div>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-primary" onClick={resetZoom} title="Reset View"><Maximize className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex flex-col items-center bg-muted/20 p-4 md:p-8 overflow-hidden min-h-[600px] relative rounded-[32px] md:rounded-[48px]"
      >
        <div className="mb-4 flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground opacity-50">
          {isMobile ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
          Live Document Preview
        </div>

        <div className="flex-1 w-full flex justify-center overflow-auto custom-scrollbar pb-12">
          <div 
            ref={previewRef}
            className="resume-print-target origin-top transition-transform duration-300 ease-out"
            style={{ 
              transform: `scale(${zoom})`,
              width: '210mm',
              minWidth: '210mm'
            }}
          >
            <div className="bg-white shadow-2xl w-[210mm] min-h-[297mm] overflow-visible rounded-sm md:rounded-lg">
              {selectedTemplate === "modern" && <ModernSidebarTemplate profile={profile} photo={userPhoto} />}
              {selectedTemplate === "minimalist" && <MinimalistTemplate profile={profile} />}
              {selectedTemplate === "creative" && <CreativeTemplate profile={profile} photo={userPhoto} />}
              {selectedTemplate === "corporate" && <CorporateTemplate profile={profile} />}
              {selectedTemplate === "executive" && <ExecutiveTemplate profile={profile} photo={userPhoto} />}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showRechargePopup} onOpenChange={setShowRechargePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-black">Credits Required</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              Refine AI use karne ke liye {REFINE_COST} credits chahiye. Kripya apna balance check karein.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Link href="/profile?tab=wallet" className="w-full">
              <Button className="w-full font-black h-12 rounded-2xl shadow-lg">Go to Wallet</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
