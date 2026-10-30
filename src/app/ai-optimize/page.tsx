"use client"

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Sparkles, FileText, CheckCircle2, Loader2, Copy, ArrowDown, Wallet, AlertCircle } from "lucide-react";
import { aiApplicationOptimization } from "@/ai/flows/ai-application-optimization";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, addDoc, serverTimestamp, collection } from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const OPTIMIZE_COST = 10;

export default function AiOptimizePage() {
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showRechargePopup, setShowRechargePopup] = useState(false);
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: profile } = useDoc(userProfileRef);

  const handleOptimize = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !profile || !userProfileRef || !db) return;

    if ((profile.credits || 0) < OPTIMIZE_COST) {
      setShowRechargePopup(true);
      return;
    }

    setLoading(true);
    const formData = new FormData(form);
    
    try {
      const output = await aiApplicationOptimization({
        resumeSummary: formData.get('summary') as string,
        jobDescription: formData.get('description') as string,
        coverLetterDraft: formData.get('coverLetter') as string || undefined
      });

      // Deduction - Non-blocking
      updateDoc(userProfileRef, {
        credits: increment(-OPTIMIZE_COST),
        updatedAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("AI Optimize credit deduction error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userProfileRef.path,
          operation: 'update',
          requestResourceData: { credits: -OPTIMIZE_COST }
        }));
      });

      // Transaction - Non-blocking
      addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: OPTIMIZE_COST,
        type: 'usage',
        description: 'Application Optimization',
        status: 'success',
        createdAt: serverTimestamp()
      }).catch(async (err) => {
        console.error("AI Optimize transaction log error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'transactions',
          operation: 'create'
        }));
      });

      setResult(output);
      toast({ title: "Success", description: `${OPTIMIZE_COST} credits deducted.` });
    } catch (error: any) {
      console.error("AI Optimization Fail:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "AI failed to optimize your application. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Text has been copied to your clipboard."
    });
  };

  const canAfford = (profile?.credits || 0) >= OPTIMIZE_COST;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-muted/20 pb-20">
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-semibold text-xs uppercase tracking-wider">
              <Wand2 className="h-3 w-3" />
              Application Wizard
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">AI Resume & Cover Letter Optimizer</h1>
            <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm">
               <Wallet className="h-4 w-4" /> Cost: {OPTIMIZE_COST} Credits
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
            
            <div className="xl:col-span-5 space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Input Details
                  </CardTitle>
                  <CardDescription>Provide the job description and your current content</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleOptimize} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="description">Job Description</Label>
                      <Textarea 
                        id="description" 
                        name="description" 
                        placeholder="Paste the target job description here..." 
                        className="min-h-[150px] bg-muted/30" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="summary">Your Resume Summary</Label>
                      <Textarea 
                        id="summary" 
                        name="summary" 
                        placeholder="Your current professional summary..." 
                        className="min-h-[100px]" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coverLetter">Current Cover Letter Draft (Optional)</Label>
                      <Textarea 
                        id="coverLetter" 
                        name="coverLetter" 
                        placeholder="Paste your existing draft if you have one..." 
                        className="min-h-[120px]" 
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className={cn(
                        "w-full h-12 gap-2 text-lg font-bold rounded-xl",
                        canAfford ? "bg-accent hover:bg-accent/90" : "bg-orange-600 hover:bg-orange-700"
                      )} 
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : canAfford ? <><Sparkles className="h-5 w-5" /> Optimize Application</> : "Recharge to Continue"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="xl:col-span-7">
              {result ? (
                <div className="space-y-6">
                  <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl flex items-start gap-4 mb-8">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-accent">Optimization Complete!</h3>
                      <p className="text-sm text-muted-foreground">Your content has been tailored to match the key requirements of the job description.</p>
                    </div>
                  </div>

                  <Tabs defaultValue="resume" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 bg-card border">
                      <TabsTrigger value="resume" className="font-bold h-10">Improved Summary</TabsTrigger>
                      <TabsTrigger value="cover" className="font-bold h-10">Targeted Cover Letter</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="resume" className="mt-6">
                      <Card className="border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-lg">Suggested Resume Summary</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.improvedResumeSummary)} className="gap-2 text-primary font-semibold">
                            <Copy className="h-4 w-4" /> Copy
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted/30 p-6 rounded-xl border border-dashed text-foreground leading-relaxed">
                            {result.improvedResumeSummary}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="cover" className="mt-6">
                      <Card className="border-none shadow-xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="text-lg">Drafted Cover Letter</CardTitle>
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(result.targetedCoverLetter)} className="gap-2 text-primary font-semibold">
                            <Copy className="h-4 w-4" /> Copy
                          </Button>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted/30 p-8 rounded-xl border border-dashed text-foreground leading-relaxed whitespace-pre-wrap font-body">
                            {result.targetedCoverLetter}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-3xl bg-muted/50 min-h-[500px]">
                  <div className="h-24 w-24 rounded-full bg-card flex items-center justify-center mb-6 shadow-sm border relative">
                    <Wand2 className="h-12 w-12 text-muted-foreground" />
                    <Sparkles className="absolute -top-1 -right-1 h-8 w-8 text-accent/40" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Ready to Enhance?</h3>
                  <p className="text-muted-foreground max-sm mx-auto mb-8">
                    Enter the job details on the left to generate professional, tailored content that gets you noticed by recruiters.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      <Dialog open={showRechargePopup} onOpenChange={setShowRechargePopup}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader className="text-center">
            <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-2xl font-black">Credits Required</DialogTitle>
            <DialogDescription className="text-sm font-medium pt-2">
              Optimization ke liye {OPTIMIZE_COST} credits chahiye. Kripya apna wallet recharge karein.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2 pt-4">
            <Link href="/profile?tab=wallet" className="w-full">
              <Button className="w-full font-black h-12 rounded-2xl">Recharge Now</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}