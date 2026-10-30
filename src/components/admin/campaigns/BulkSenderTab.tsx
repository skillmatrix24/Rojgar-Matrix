"use client"

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  Smartphone, 
  FileSpreadsheet, 
  Tag, 
  Play, 
  Square,
  Loader2,
  Trash2,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Users,
  MessageSquare,
  Clock,
  Filter,
  Target,
  Calendar,
  UserPlus,
  AlertCircle,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CampaignContact } from "@/app/admin/campaigns/page";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { secureDispatch } from "@/actions/secure-dispatch";

interface BulkSenderTabProps {
  whatsappSettings: any;
  dbTemplates: any[] | null;
  contacts: CampaignContact[];
}

export function BulkSenderTab({ whatsappSettings, dbTemplates, contacts }: BulkSenderTabProps) {
  const { toast } = useToast();
  const db = useFirestore();
  
  // UI Entry States
  const [qName, setQName] = useState("");
  const [qNumber, setQNumber] = useState("");
  const [qRole, setQRole] = useState("jobSeeker");
  const [qCity, setQCity] = useState("");
  const [qGroup, setQGroup] = useState("Manual Entry");

  // Broadcast States
  const [templateName, setTemplateName] = useState("welcome_massage");
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [varMapping, setVarMapping] = useState<Record<string, string>>({});
  const [targetGroup, setTargetGroup] = useState("all");
  
  // Queue & Preview States
  const [queueStatuses, setQueueStatuses] = useState<Record<string, { status: string, error?: string }>>({});
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);
  const [previewContact, setPreviewContact] = useState<CampaignContact | null>(null);

  const activeQueue = useMemo(() => {
    return contacts.filter(c => targetGroup === "all" || c.group === targetGroup);
  }, [contacts, targetGroup]);

  const stats = useMemo(() => {
    const total = activeQueue.length;
    let success = 0, error = 0, pending = 0;
    
    activeQueue.forEach(c => {
      const q = queueStatuses[c.id];
      if (q?.status === 'success') success++;
      else if (q?.status === 'error') error++;
      else pending++;
    });

    return { total, success, error, pending };
  }, [activeQueue, queueStatuses]);

  const uniqueGroups = useMemo(() => {
    return Array.from(new Set(contacts.map(c => c.group))).filter(Boolean);
  }, [contacts]);

  const activeTpl = useMemo(() => dbTemplates?.find(t => t.name === templateName), [dbTemplates, templateName]);
  
  const detectedBodyVars = useMemo(() => {
    const matches = activeTpl?.bodyText?.match(/\{\{(\d+)\}\}/g) || [];
    return Array.from(new Set(matches)).sort();
  }, [activeTpl]);

  const detectedHeaderVars = useMemo(() => {
    const matches = activeTpl?.headerText?.match(/\{\{(\d+)\}\}/g) || [];
    return Array.from(new Set(matches)).sort();
  }, [activeTpl]);

  const handleQuickAdd = async () => {
    if (!qName || !qNumber || !db) return;
    const cleanNum = qNumber.replace(/\D/g, '');
    const colRef = collection(db, "marketing_contacts");
    await addDoc(colRef, {
      name: qName,
      number: cleanNum,
      role: qRole,
      city: qCity || "Unknown",
      group: qGroup,
      source: 'manual',
      createdAt: serverTimestamp()
    });
    setQName(""); setQNumber(""); setQCity("");
    toast({ title: "Lead Added" });
  };

  const removeContact = async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, "marketing_contacts", id));
    toast({ title: "Lead Removed" });
  };

  const getMappedValue = (varKey: string, contact: CampaignContact | null) => {
    if (!contact) return "";
    const field = varMapping[varKey] || 'Name';
    switch (field) {
      case 'Number': return contact.number;
      case 'Role': return contact.role;
      case 'City': return contact.city;
      default: return contact.name;
    }
  };

  const sendToContact = async (contact: CampaignContact) => {
    if (!whatsappSettings?.isActive) {
      toast({ variant: "destructive", title: "System Offline" });
      return;
    }

    const components = [];
    if (detectedHeaderVars.length > 0) {
      components.push({ 
        type: 'header', 
        parameters: detectedHeaderVars.map((_, i) => ({ 
          type: 'text', 
          text: getMappedValue(`h_var_${i + 1}`, contact) || 'User' 
        })) 
      });
    }
    if (detectedBodyVars.length > 0) {
      components.push({ 
        type: 'body', 
        parameters: detectedBodyVars.map((_, i) => ({ 
          type: 'text', 
          text: getMappedValue(`b_var_${i + 1}`, contact) || 'User' 
        })) 
      });
    }

    try {
      const result = await secureDispatch('/api/bulk-send', {
        phoneNumber: contact.number,
        templateName: templateName,
        accessToken: whatsappSettings.accessToken,
        phoneNumberId: whatsappSettings.phoneNumberId,
        components: components,
        languageCode: activeTpl?.language || 'en_IN'
      });

      if (result.ok) {
        setQueueStatuses(prev => ({ ...prev, [contact.id]: { status: 'success' } }));
        return true;
      } else {
        setQueueStatuses(prev => ({ ...prev, [contact.id]: { status: 'error', error: result.data?.error || 'Dispatch Error' } }));
        return false;
      }
    } catch (err) {
      console.error("Bulk sender dispatch error:", err);
      setQueueStatuses(prev => ({ ...prev, [contact.id]: { status: 'error', error: 'Network Error' } }));
      return false;
    }
  };

  const launchBulkSender = async () => {
    const pending = activeQueue.filter(c => !queueStatuses[c.id] || queueStatuses[c.id].status !== 'success');
    if (pending.length === 0) return;

    setIsBulkSending(true);
    setStopRequested(false);

    for (const contact of pending) {
      if (stopRequested) break;
      await sendToContact(contact);
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsBulkSending(false);
    toast({ title: "Broadcast Cycle Finished" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-4 space-y-6">
          <Card className="border-none shadow-xl rounded-[32px] bg-[#003366] text-white overflow-hidden">
             <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Broadcast Status</p>
                   {isBulkSending && <Badge className="bg-green-500 animate-pulse border-none h-5 text-[8px] font-black uppercase">Active Cycle</Badge>}
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                      <h3 className="text-4xl font-black">{stats.total}</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Targets</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <h3 className="text-4xl font-black text-green-400">{stats.success}</h3>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Delivered</p>
                   </div>
                </div>
                <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-green-50 transition-all duration-500" style={{ width: `${(stats.success / stats.total) * 100 || 0}%` }} />
                </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[32px] overflow-hidden">
            <CardHeader className="bg-primary/5 border-b"><CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> 1. Audience</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
               <Select value={targetGroup} onValueChange={setTargetGroup}>
                  <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue placeholder="Select group..." /></SelectTrigger>
                  <SelectContent>
                     <SelectItem value="all">Entire Database</SelectItem>
                     {uniqueGroups.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
               </Select>
               <div className="pt-4 border-t border-dashed space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input value={qName} onChange={(e) => setQName(e.target.value)} placeholder="Name" className="h-10 text-xs rounded-xl" />
                    <Input value={qNumber} onChange={(e) => setQNumber(e.target.value)} placeholder="Phone" className="h-10 text-xs rounded-xl" />
                  </div>
                  <Button onClick={handleQuickAdd} variant="outline" className="w-full h-11 font-black text-[10px] gap-2 rounded-xl border-2"><UserPlus className="h-3.5 w-3.5" /> ADD LEAD</Button>
               </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-[32px] overflow-hidden">
            <CardHeader className="bg-muted/30 border-b"><CardTitle className="text-lg flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> 2. Content & Variables</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
                 <Select value={templateName} onValueChange={setTemplateName}>
                    <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                       <SelectItem value="welcome_massage">welcome_massage</SelectItem>
                       {dbTemplates?.filter(t => t.name !== 'welcome_massage').map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
                 
                 {detectedBodyVars.length > 0 && (
                   <div className="space-y-4 pt-2">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b pb-2">Map Template Variables</p>
                      {detectedBodyVars.map((v, i) => (
                         <div key={i} className="flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-500">Body {v}</span>
                            <Select value={varMapping[`b_var_${i+1}`] || 'Name'} onValueChange={(val) => setVarMapping({...varMapping, [`b_var_${i+1}`]: val})}>
                               <SelectTrigger className="h-9 w-32 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                               <SelectContent><SelectItem value="Name">Name</SelectItem><SelectItem value="Number">Number</SelectItem><SelectItem value="City">City</SelectItem><SelectItem value="Role">User Role</SelectItem></SelectContent>
                            </Select>
                         </div>
                      ))}
                   </div>
                 )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-6">
               <div className="w-full space-y-4">
                  <div className="flex items-center justify-between bg-card p-3 rounded-xl border-2">
                     <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] font-bold uppercase tracking-widest">Schedule Later</span></div>
                     <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
                  </div>
                  {isScheduled && <Input type="datetime-local" className="h-11 rounded-xl" />}
                  <Button onClick={launchBulkSender} disabled={isBulkSending || !whatsappSettings?.isActive} className="w-full h-14 font-black text-base shadow-xl gap-3 rounded-2xl transition-all active:scale-95">
                    {isBulkSending ? <><Loader2 className="h-5 w-5 animate-spin" /> SENDING CYCLE...</> : <><Zap className="h-5 w-5" /> START BROADCAST</>}
                  </Button>
               </div>
            </CardFooter>
          </Card>
        </div>

        <div className="xl:col-span-8 space-y-6">
           <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
             <div className="p-6 border-b bg-card flex justify-between items-center">
                <h3 className="font-black text-lg flex items-center gap-3"><Clock className="h-5 w-5 text-primary" /> Queue & Delivery Tracking</h3>
                <Badge variant="outline" className="h-7 px-4 font-black uppercase text-[9px] tracking-widest">{activeQueue.length} Targets Selected</Badge>
             </div>
             <div className="overflow-x-auto">
               <Table>
                  <TableHeader><TableRow className="bg-muted/50"><TableHead className="pl-8">Contact Identity</TableHead><TableHead>City / Role</TableHead><TableHead>Delivery Status</TableHead><TableHead className="text-right pr-8">Action</TableHead></TableRow></TableHeader>
                  <TableBody>
                     {activeQueue.map(c => (
                       <TableRow key={c.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="pl-8 py-4"><p className="font-bold text-sm text-slate-800">{c.name}</p><p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1"><Smartphone className="h-2.5 w-2.5" /> +91 {c.number}</p></TableCell>
                          <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase h-5">{c.city}</Badge></TableCell>
                          <TableCell>
                             {queueStatuses[c.id]?.status === 'success' ? <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase"><CheckCircle2 className="h-3.5 w-3.5" /> Delivered</div> : queueStatuses[c.id]?.status === 'error' ? <div className="flex items-center gap-1.5 text-red-500 font-black text-[10px] uppercase" title={queueStatuses[c.id].error}><XCircle className="h-3.5 w-3.5" /> Failed</div> : <div className="flex items-center gap-1.5 text-slate-400 font-black text-[10px] uppercase"><Clock className="h-3.5 w-3.5" /> Queued</div>}
                          </TableCell>
                          <TableCell className="text-right pr-8 space-x-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => setPreviewContact(c)}><Eye className="h-4 w-4" /></Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeContact(c.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                       </TableRow>
                     ))}
                     {activeQueue.length === 0 && <tr><td colSpan={4} className="py-20 text-center opacity-30 italic font-bold">No leads matched current group filter.</td></tr>}
                  </TableBody>
               </Table>
             </div>
           </Card>
        </div>
      </div>

      <Dialog open={!!previewContact} onOpenChange={(o) => !o && setPreviewContact(null)}>
        <DialogContent className="sm:max-w-md rounded-[32px] overflow-hidden p-0 border-none bg-slate-100">
           <DialogHeader className="bg-white p-8 border-b">
              <DialogTitle className="text-2xl font-black">Message Simulation</DialogTitle>
              <DialogDescription className="font-bold text-primary">Previewing variables for {previewContact?.name}</DialogDescription>
           </DialogHeader>
           <div className="p-8 space-y-6">
              <div className="bg-[#dcf8c6] p-6 rounded-2xl rounded-tr-none shadow-md ml-auto max-w-[90%] space-y-3 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-2 opacity-5"><MessageSquare className="h-12 w-12" /></div>
                 <p className="text-xs font-bold text-[#075e54] leading-relaxed">
                    {activeTpl?.bodyText?.split(/(\{\{\d+\}\})/).map((part: string) => {
                      const match = part.match(/\{\{(\d+)\}\}/);
                      if (match) {
                        return <span key={part} className="bg-white/40 px-1 rounded text-primary">{getMappedValue(`b_var_${match[1]}`, previewContact)}</span>
                      }
                      return part;
                    })}
                 </p>
              </div>
              <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                 Recipient: +91 {previewContact?.number}
              </div>
           </div>
           <DialogFooter className="bg-white p-6 border-t">
              <Button onClick={() => setPreviewContact(null)} className="w-full font-black h-12 rounded-xl">CLOSE PREVIEW</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
