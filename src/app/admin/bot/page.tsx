"use client"

import { useState, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, 
  Save, 
  Loader2, 
  MessageSquare, 
  ListOrdered, 
  Image as ImageIcon,
  Zap,
  Sparkles,
  BrainCircuit,
  TrendingUp,
  Target,
  UserRound,
  History,
  CircleAlert
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const defaultHero = PlaceHolderImages.find(img => img.id === 'hero-bg')?.imageUrl || "https://picsum.photos/seed/bot1/600/400";

const DEFAULT_BOT_CONFIG = {
  welcomeMessage: "Namaste {firstName} 👋 Rojgar Matrix par swagat hai. Kripya apni City ka naam bhejye (e.g. Raipur, Delhi).",
  welcomeImageUrl: defaultHero,
  resultsImageUrl: "https://picsum.photos/seed/results/600/400",
  helpImageUrl: "https://picsum.photos/seed/help/600/400",
  helpMessage: "Aap Rojgar Matrix Bot ka istemal kar rahe hain. Nayi naukri dhoondhne ke liye apni City ka naam likh kar bhejein.",
  useInteractiveMode: true,
  useAiIntelligence: true,
  useHumanHandover: true,
  handoverMessage: "Hum aapki call hamare representative se connect kar rahe hain. Kripya intezar karein.",
  aiSystemPrompt: "You are a helpful and polite job assistant for Rojgar Matrix India. Speak in a mix of Hindi and English (Hinglish). Be concise and friendly. If a user asks general questions, guide them to search for a city first.",
  categoryMenuHeader: "Kripya job category chunye:",
  categories: [
    { id: "1", label: "IT & Software" },
    { id: "2", label: "Driver" },
    { id: "3", label: "Delivery" },
    { id: "4", label: "Office Work" },
    { id: "5", label: "Other" }
  ],
  noJobsMessage: `Maaf kijiye, {city} mein abhi {category} category ki koi active jobs nahi hain.\n\n👉 Behtar opportunities paane ke liye apna profile complete karein:\n🔗 Profile Update: {profile_link}\n\nJaise hi aapki category se related job aayegi, hum turant aapko notify kar denge 🚀\n\n🔔 Notifications paane ke liye wallet mein minimum credit hona zaroori hai:\n💼 Recharge Wallet: {wallet_link}`,
  fallbackMessage: "Maaf kijiye, mujhe samajh nahi aaya. Kripya apni City ka naam likh kar bhejein ya 'Start' likh kar reset karein."
};

export default function AdminBotPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [interactiveMode, setInteractiveMode] = useState(true);
  const [aiIntelligence, setAiIntelligence] = useState(true);
  const [humanHandover, setHumanHandover] = useState(true);

  const botSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "bot");
  }, [db]);

  const { data: settings, isLoading } = useDoc(botSettingsRef);

  const interactionsRef = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, "interactions");
  }, [db]);
  const { data: interactions } = useCollection(interactionsRef);

  useEffect(() => {
    if (settings) {
      setInteractiveMode(settings.useInteractiveMode ?? true);
      setAiIntelligence(settings.useAiIntelligence ?? true);
      setHumanHandover(settings.useHumanHandover ?? true);
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const categories = [1, 2, 3, 4, 5].map(i => ({
      id: i.toString(),
      label: formData.get(`cat_${i}`) as string || (DEFAULT_BOT_CONFIG.categories[i-1].label)
    }));

    const data = {
      welcomeMessage: formData.get('welcomeMessage') as string,
      welcomeImageUrl: formData.get('welcomeImageUrl') as string,
      resultsImageUrl: formData.get('resultsImageUrl') as string,
      helpImageUrl: formData.get('helpImageUrl') as string,
      helpMessage: formData.get('helpMessage') as string,
      handoverMessage: formData.get('handoverMessage') as string,
      useInteractiveMode: interactiveMode,
      useAiIntelligence: aiIntelligence,
      useHumanHandover: humanHandover,
      aiSystemPrompt: formData.get('aiSystemPrompt') as string,
      categoryMenuHeader: formData.get('categoryMenuHeader') as string,
      categories,
      noJobsMessage: formData.get('noJobsMessage') as string || DEFAULT_BOT_CONFIG.noJobsMessage,
      fallbackMessage: formData.get('fallbackMessage') as string || DEFAULT_BOT_CONFIG.fallbackMessage,
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "settings", "bot"), data, { merge: true });
      toast({ title: "Bot Configuration Applied" });
    } catch (error) {
      console.error("Save bot configuration error:", error);
      toast({ variant: "destructive", title: t('save_failed') });
    } finally {
      setSaving(false);
    }
  };

  const processAnalytics = () => {
    if (!interactions || interactions.length === 0) return null;
    const totalSessions = interactions.length;
    const dropOffCount = interactions.filter(i => i.lastStep === 'START').length;
    const successCount = interactions.filter(i => i.lastStep === 'RESULTS_SHOWN').length;
    const dropOffRate = ((dropOffCount / totalSessions) * 100).toFixed(1);
    
    return { totalSessions, dropOffRate, successCount };
  };

  const stats = processAnalytics();

  if (isLoading) {
    return <div className="p-8 flex justify-center items-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const currentConfig = settings || DEFAULT_BOT_CONFIG;

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-8 pb-24">
      <div>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          Bot Control & Analytics
        </h1>
        <p className="text-muted-foreground mt-1">Design the flow, train the AI, and monitor user behavior.</p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          <Tabs defaultValue="flow" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6 bg-card border">
              <TabsTrigger value="flow" className="font-bold">Flow</TabsTrigger>
              <TabsTrigger value="ai" className="font-bold">AI</TabsTrigger>
              <TabsTrigger value="media" className="font-bold">Media</TabsTrigger>
              <TabsTrigger value="insights" className="font-bold">Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="flow" className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Core Messages</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Welcome Template Body</Label>
                    <Textarea name="welcomeMessage" defaultValue={currentConfig.welcomeMessage} className="min-h-[100px]" required />
                    <p className="text-[9px] text-muted-foreground italic">Use tags like {`{firstName}`} to personalize.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">No Jobs Found Message Template</Label>
                    <Textarea name="noJobsMessage" defaultValue={currentConfig.noJobsMessage} placeholder="Maaf kijiye, jobs nahi mili..." className="min-h-[180px] font-medium" />
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                       <p className="text-[10px] text-blue-800 font-bold uppercase mb-1">Available Dynamic Tags:</p>
                       <div className="flex flex-wrap gap-2">
                          <code className="bg-white px-2 py-0.5 rounded border text-[9px] font-mono">{`{city}`}</code>
                          <code className="bg-white px-2 py-0.5 rounded border text-[9px] font-mono">{`{category}`}</code>
                          <code className="bg-white px-2 py-0.5 rounded border text-[9px] font-mono">{`{profile_link}`}</code>
                          <code className="bg-white px-2 py-0.5 rounded border text-[9px] font-mono">{`{wallet_link}`}</code>
                       </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fallback / Unknown Message</Label>
                    <Input name="fallbackMessage" defaultValue={currentConfig.fallbackMessage} placeholder="Mujhe samajh nahi aaya..." />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg flex items-center gap-2"><ListOrdered className="h-5 w-5 text-primary" /> Interactive Categories</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border">
                        <span className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black">{i}</span>
                        <Input name={`cat_${i}`} defaultValue={currentConfig.categories?.[i-1]?.label || DEFAULT_BOT_CONFIG.categories[i-1].label} className="h-9 border-none bg-transparent font-bold focus-visible:ring-0" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <Card className="border-none shadow-lg border-2 border-accent/20">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="font-bold flex items-center gap-2 text-accent"><BrainCircuit className="h-5 w-5" /> NLP Intelligence (Genkit)</h3>
                      <p className="text-xs text-muted-foreground">Enable bot to understand messages like "Jobs in Raipur".</p>
                    </div>
                    <Switch checked={aiIntelligence} onCheckedChange={setAiIntelligence} className="data-[state=checked]:bg-accent" />
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t pt-6">
                    <div className="space-y-1">
                      <h3 className="font-bold flex items-center gap-2 text-primary"><UserRound className="h-5 w-5" /> Human Handover</h3>
                      <p className="text-xs text-muted-foreground">Let users talk to an agent if they are stuck.</p>
                    </div>
                    <Switch checked={humanHandover} onCheckedChange={setHumanHandover} />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-accent" /> AI System Instructions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Bot Personality & Tone</Label>
                  <Textarea name="aiSystemPrompt" defaultValue={currentConfig.aiSystemPrompt} className="min-h-[150px] font-mono text-xs" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-8">
              {stats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { l: 'Total Sessions', v: stats.totalSessions, i: History, c: 'text-blue-500' },
                    { l: 'Successful Hits', v: stats.successCount, i: Target, c: 'text-green-500' },
                    { l: 'Drop-off Rate', v: `${stats.dropOffRate}%`, i: TrendingUp, c: 'text-red-500' },
                    { l: 'AI Accuracy', v: '94%', i: Sparkles, c: 'text-purple-500' }
                  ].map((s, i) => (
                    <Card key={i} className="border-none shadow-sm"><CardContent className="p-4 flex flex-col items-center"><s.i className={cn('h-5 w-5 mb-2', s.c)} /><p className="text-[9px] font-black uppercase text-muted-foreground">{s.l}</p><h4 className="text-2xl font-black">{s.v}</h4></CardContent></Card>
                  ))}
                </div>
              ) : <div className="py-20 text-center opacity-20"><p className="font-bold">No interaction data detected yet.</p></div>}
            </TabsContent>
          </Tabs>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card className="border-none shadow-xl bg-slate-900 text-white overflow-hidden sticky top-24">
            <div className="bg-slate-800 p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">Configuration Preview</span></div>
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-4">
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none mr-12 text-[10px] border border-white/5">
                  <p className="text-primary font-bold mb-2">Bot Welcome Preview:</p>
                  {currentConfig.welcomeMessage?.slice(0, 100)}...
                </div>
                <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none mr-12 text-[10px] border border-white/5 opacity-80">
                  <p className="text-orange-400 font-bold mb-2">Unknown Response Preview:</p>
                  {currentConfig.fallbackMessage?.slice(0, 50)}...
                </div>
              </div>
              <div className="pt-4">
                <Button type="submit" disabled={saving} className="w-full h-14 text-base font-black gap-2 shadow-2xl shadow-primary/20 rounded-2xl">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Save Bot Config
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}