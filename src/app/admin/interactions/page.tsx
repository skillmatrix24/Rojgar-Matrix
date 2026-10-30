"use client"

import { useState, useEffect, useRef } from "react";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, limit, orderBy, onSnapshot, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Phone,
  Clock,
  Loader2,
  UserRound,
  MessageSquare,
  Eye,
  X,
  Send,
  User,
  Smartphone,
  CheckCircle2,
  Filter,
  Search,
  Zap,
  TrendingUp,
  MapPin,
  Layers,
  Activity,
  BarChart3,
  PieChart,
  Download,
  Info,
  Sparkles
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { secureDispatch } from "@/actions/secure-dispatch";

const QUICK_REPLIES = [
  "Namaste! Humne aapki query receive kar li hai.",
  "Kripya 2 minute intezar karein, humari team aapse jud rahi hai.",
  "Kya aap Raipur mein hi job dhoondh rahe hain?",
  "Aapka profile short-list ho gaya hai. Hum aapko call karenge.",
  "Maaf kijiye, abhi is category mein jobs available nahi hain."
];

export default function AdminInteractionsPage() {
  const db = useFirestore();
  const { isUserLoading } = useUser();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [interactions, setInteractions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [resolving, setResolving] = useState(false);
  
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db || isUserLoading) return;

    setIsLoading(true);
    const q = query(collection(db, "interactions"), orderBy("updatedAt", "desc"), limit(100));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setInteractions(docs);
      setIsLoading(false);

      if (selectedChat) {
        const updatedSelected = docs.find(d => d.id === selectedChat.id);
        if (updatedSelected) setSelectedChat(updatedSelected);
      }

      const phoneNumbers = docs.map(d => d.phoneNumber).filter(n => n && !userProfiles[n]);
      if (phoneNumbers.length > 0) {
        const usersQ = query(collection(db, "users"), where("phoneNumber", "in", phoneNumbers.slice(0, 10)));
        const usersSnap = await getDocs(usersQ);
        const newProfiles: Record<string, any> = { ...userProfiles };
        usersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.phoneNumber) newProfiles[data.phoneNumber] = data;
        });
        setUserProfiles(newProfiles);
      }
    }, (error) => {
      console.error("Interactions Subscription Error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [db, isUserLoading]);

  useEffect(() => {
    if (chatScrollRef.current) {
      const viewport = chatScrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [selectedChat?.history]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !selectedChat || sendingReply) return;

    setSendingReply(true);
    try {
      const result = await secureDispatch('/api/admin-send-message', {
        phoneNumber: selectedChat.phoneNumber,
        messageText: text.trim()
      });

      if (result.ok) {
        setReplyText("");
        if (text !== replyText) toast({ title: "Quick Reply Sent" });
      } else {
        toast({ 
          variant: "destructive", 
          title: "Send Failed", 
          description: result.data?.details || result.data?.error || "Unknown Error"
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
      toast({ variant: "destructive", title: "Network Error" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleResolveSession = async () => {
    if (!db || !selectedChat) return;
    setResolving(true);
    try {
      const docRef = doc(db, "interactions", selectedChat.phoneNumber);
      await updateDoc(docRef, {
        lastStep: 'START',
        status: 'active',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Session Resolved", description: "Handover status has been cleared." });
    } catch (e) {
      console.error("Resolve session error:", e);
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setResolving(false);
    }
  };

  const handleExportCSV = () => {
    if (interactions.length === 0) return;
    
    const headers = ["Phone Number", "Last Step", "Selected City", "Selected Category", "Last Message", "Updated At"];
    const rows = filteredInteractions.map(i => [
      i.phoneNumber,
      i.lastStep || "N/A",
      i.selectedCity || "Unknown",
      i.selectedCategory || "General",
      `"${(i.lastMessage || "").replace(/"/g, '""')}"`,
      i.updatedAt?.toDate?.().toLocaleString() || "N/A"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rojgarmatrix_interactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Complete", description: "Interaction data downloaded as CSV." });
  };

  const getAnalytics = () => {
    const cityCounts: Record<string, number> = {};
    const catCounts: Record<string, number> = {};
    let pendingHandovers = 0;

    interactions.forEach(i => {
      if (i.selectedCity) cityCounts[i.selectedCity] = (cityCounts[i.selectedCity] || 0) + 1;
      if (i.selectedCategory) catCounts[i.selectedCategory] = (catCounts[i.selectedCategory] || 0) + 1;
      if (i.lastStep === 'HUMAN_HANDOVER') pendingHandovers++;
    });

    const topCityData = Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topCatData = Object.entries(catCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { 
      topCityData, 
      topCatData, 
      pendingHandovers,
      topCity: topCityData[0]?.name || "---",
      topCat: topCatData[0]?.name || "---"
    };
  };

  const stats = getAnalytics();

  const filteredInteractions = interactions.filter(item => {
    const profile = userProfiles[item.phoneNumber];
    const name = profile ? `${profile.firstName} ${profile.lastName || ''}`.toLowerCase() : "guest user";
    const phone = item.phoneNumber.toLowerCase();
    
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === 'handover') return item.lastStep === 'HUMAN_HANDOVER';
    if (activeFilter === 'active') return item.lastStep !== 'HUMAN_HANDOVER';
    return true;
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" />
            {t('system_interactions')}
          </h1>
          <p className="text-muted-foreground">{t('system_interactions_desc')}</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
          {[
            { l: "Live Sessions", v: interactions.length, i: Activity, c: "text-blue-500", b: "bg-blue-50" },
            { l: "Handover Req", v: stats.pendingHandovers, i: UserRound, c: "text-orange-500", b: "bg-orange-50" },
            { l: "Top City", v: stats.topCity, i: MapPin, c: "text-green-500", b: "bg-green-50" },
            { l: "Top Category", v: stats.topCat, i: Layers, c: "text-purple-500", b: "bg-purple-50" }
          ].map((stat, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
              <CardContent className="p-4 flex flex-col items-center text-center space-y-1">
                <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", stat.b)}>
                  <stat.i className={cn("h-4 w-4", stat.c)} />
                </div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">{stat.l}</p>
                <h4 className="text-sm font-black truncate max-w-full">{stat.v}</h4>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <TabsList className="bg-card border h-11 p-1">
            <TabsTrigger value="sessions" className="font-bold px-6 gap-2">
              <MessageSquare className="h-4 w-4" /> Live Chats
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search name or number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 rounded-xl focus-visible:ring-primary/20"
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" onClick={handleExportCSV} title="Export current list to CSV">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="sessions" className="space-y-4">
          <div className="flex gap-2 mb-2">
            {[
              { id: 'all', label: 'All Sessions' },
              { id: 'handover', label: 'Handover Requests', color: 'text-orange-600' },
              { id: 'active', label: 'Bot Flows' }
            ].map((f) => (
              <Button 
                key={f.id}
                variant={activeFilter === f.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveFilter(f.id)}
                className={cn("h-8 rounded-full font-bold text-[10px] uppercase px-4", activeFilter === f.id ? "bg-primary/10 text-primary" : "")}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            {isLoading || isUserLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="pl-6">User / Contact</TableHead>
                      <TableHead>{t('status')}</TableHead>
                      <TableHead>{t('selection')}</TableHead>
                      <TableHead>{t('last_message')}</TableHead>
                      <TableHead className="text-right pr-6">{t('actions_header')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInteractions.map((item) => {
                      const profile = userProfiles[item.phoneNumber];
                      return (
                        <TableRow key={item.id} className={cn(
                          "hover:bg-muted/30 transition-colors group",
                          item.lastStep === 'HUMAN_HANDOVER' ? "bg-orange-50/50" : ""
                        )}>
                          <TableCell className="pl-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border-2 border-transparent group-hover:border-primary/20 transition-all">
                                {profile?.photoUrl ? (
                                  <Image src={profile.photoUrl} alt="User" width={40} height={40} className="object-cover" />
                                ) : (
                                  <User className="h-5 w-5 text-primary" />
                                )}
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{profile ? `${profile.firstName} ${profile.lastName || ''}` : "Guest User"}</p>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1.5"><Phone className="h-2.5 w-2.5" /> {item.phoneNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={item.lastStep === 'HUMAN_HANDOVER' ? "destructive" : "outline"} 
                              className={cn("font-mono text-[10px] uppercase tracking-tighter", item.lastStep === 'HUMAN_HANDOVER' ? "bg-orange-500 hover:bg-orange-600 border-none animate-pulse" : "")}
                            >
                              {item.lastStep === 'HUMAN_HANDOVER' ? (
                                <div className="flex items-center gap-1"><UserRound className="h-2.5 w-2.5" /> {t('agent_req')}</div>
                              ) : item.lastStep?.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="space-y-0.5">
                              <p className="font-bold text-xs">{item.selectedCategory || "---"}</p>
                              <p className="text-[10px] text-muted-foreground">{item.selectedCity || "Unknown City"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs italic text-muted-foreground max-w-[180px] truncate">
                            "{item.lastMessage}"
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-9 gap-2 font-bold hover:bg-primary/5 hover:text-primary transition-all active:scale-95"
                              onClick={() => setSelectedChat(item)}
                            >
                              <MessageSquare className="h-4 w-4" />
                              View Chat
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedChat} onOpenChange={(open) => !open && setSelectedChat(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-slate-50 border-l-2 shadow-2xl">
          <SheetHeader className="p-6 bg-white border-b shrink-0 shadow-sm z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-black">{selectedChat?.phoneNumber}</SheetTitle>
                  <SheetDescription asChild>
                    <span className="text-[10px] font-bold uppercase text-green-600 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      WhatsApp Active Session
                    </span>
                  </SheetDescription>
                </div>
              </div>
              {selectedChat?.lastStep === 'HUMAN_HANDOVER' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResolveSession} 
                  disabled={resolving}
                  className="font-bold text-[10px] h-8 gap-2 border-green-200 text-green-700 hover:bg-green-50"
                >
                  {resolving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Mark Resolved
                </Button>
              )}
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6" ref={chatScrollRef}>
            <div className="space-y-6">
              {selectedChat?.history?.map((msg: any, i: number) => (
                <div key={i} className={cn(
                  "flex flex-col gap-1.5 max-w-[85%]",
                  msg.role === 'user' ? "mr-auto items-start" : "ml-auto items-end"
                )}>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm",
                    msg.role === 'user' 
                      ? "bg-white border rounded-tl-none text-slate-800"
                      : "bg-primary text-white rounded-tr-none" 
                  )}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-50 px-1">
                    {msg.role === 'bot' ? 'Bot' : 'User'} • {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-6 bg-white border-t space-y-4 shrink-0 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex flex-wrap gap-1.5 mb-2 overflow-x-auto pb-2 scrollbar-hide">
               {QUICK_REPLIES.map((q, i) => (
                 <Button 
                   key={i} 
                   variant="outline" 
                   size="sm" 
                   className="h-7 text-[9px] font-bold bg-slate-50 border-slate-200 hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-full shrink-0"
                   onClick={() => handleSendMessage(q)}
                   disabled={sendingReply}
                 >
                   {q.slice(0, 20)}...
                 </Button>
               ))}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(replyText); }} className="flex gap-2">
               <Input 
                 placeholder="Type manual reply..." 
                 value={replyText}
                 onChange={(e) => setReplyText(e.target.value)}
                 disabled={sendingReply}
                 className="h-12 bg-muted/30 border-2 focus-visible:ring-primary/20 rounded-xl" 
               />
               <Button 
                type="submit" 
                size="icon" 
                disabled={sendingReply || !replyText.trim()} 
                className="h-12 w-12 shrink-0 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-90"
               >
                 {sendingReply ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
               </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}