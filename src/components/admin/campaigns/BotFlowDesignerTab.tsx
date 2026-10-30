
"use client"

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, addDoc, doc, deleteDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  GitBranch, 
  PlusCircle, 
  X, 
  Save, 
  Loader2, 
  History, 
  Trash2, 
  Monitor, 
  MousePointer2, 
  MessageSquareCode, 
  ArrowRight,
  Info,
  Edit2,
  AlertCircle,
  AlignLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BotFlowDesignerTabProps {
  dbFlows: any[] | null;
  dbTemplates: any[] | null;
}

export function BotFlowDesignerTab({ dbFlows, dbTemplates }: BotFlowDesignerTabProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isFlowSaving, setIsFlowSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [flowForm, setFlowForm] = useState({
    name: "New Flow",
    triggerKeywords: "",
    responseText: "",
    buttons: [] as any[]
  });

  const handleEditFlow = (flow: any) => {
    setEditingId(flow.id);
    setFlowForm({
      name: flow.name || "",
      triggerKeywords: flow.triggerKeywords || "",
      responseText: flow.responseText || "",
      buttons: flow.buttons || []
    });
    // Scroll to top of tab
    const tabContent = document.querySelector('[role="tabpanel"]');
    if (tabContent) tabContent.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setIsFlowSaving(true);

    const data = {
      ...flowForm,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "wa_flows", editingId), data);
        toast({ title: "Bot Flow Updated" });
      } else {
        await addDoc(collection(db, "wa_flows"), {
          ...data,
          createdAt: serverTimestamp()
        });
        toast({ title: "Bot Flow Created" });
      }
      
      // Reset form
      setEditingId(null);
      setFlowForm({
        name: "New Flow",
        triggerKeywords: "",
        responseText: "",
        buttons: []
      });
    } catch (e) {
      console.error("Save bot flow error:", e);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsFlowSaving(false);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!db || !confirm("Delete this flow step permanently?")) return;
    try { 
      await deleteDoc(doc(db, "wa_flows", id)); 
      toast({ title: "Flow Removed" }); 
      if (editingId === id) setEditingId(null);
    } catch (e) {
      console.error("Delete bot flow error:", e);
    }
  };

  const handleAddFlowButton = () => {
    if (flowForm.buttons.length >= 3) return;
    setFlowForm({
      ...flowForm,
      buttons: [...flowForm.buttons, { label: "New Button", action: "NONE" }]
    });
  };

  const handleRemoveFlowButton = (idx: number) => {
    setFlowForm({
      ...flowForm,
      buttons: flowForm.buttons.filter((_, i) => i !== idx)
    });
  };

  const handleFlowButtonChange = (idx: number, field: string, val: string) => {
    const updated = [...flowForm.buttons];
    updated[idx] = { ...updated[idx], [field]: val };
    setFlowForm({ ...flowForm, buttons: updated });
  };

  const responseLength = flowForm.responseText.length;
  const lineCount = flowForm.responseText.split('\n').length;
  const isTooLong = responseLength > 1024;
  const isTooTall = lineCount > 10;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
      <div className="xl:col-span-7 space-y-8">
        <Card className={cn(
          "border-none shadow-xl overflow-hidden rounded-[32px] border-t-4 transition-colors",
          editingId ? "border-orange-500 bg-orange-50/10" : "border-primary"
        )}>
          <CardHeader className={cn("border-b p-8", editingId ? "bg-orange-50" : "bg-primary/5")}>
             <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-black flex items-center gap-3">
                   <GitBranch className={cn("h-6 w-6", editingId ? "text-orange-600" : "text-primary")} /> 
                   {editingId ? 'Edit Bot Flow Step' : 'New Bot Flow Designer'}
                </CardTitle>
                {editingId && (
                  <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setFlowForm({ name: "New Flow", triggerKeywords: "", responseText: "", buttons: [] }); }} className="h-7 text-[10px] font-black uppercase text-orange-700 hover:bg-orange-100">
                    Cancel Edit
                  </Button>
                )}
             </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
             <form onSubmit={handleSaveFlow} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Flow Step Name</Label>
                      <Input 
                        placeholder="e.g. initial_apply_trigger" 
                        className="h-12 border-2 rounded-xl font-bold"
                        value={flowForm.name}
                        onChange={(e) => setFlowForm({...flowForm, name: e.target.value})}
                        required
                      />
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Trigger Keywords</Label>
                      <Input 
                        placeholder="apply, job, kaam" 
                        className="h-12 border-2 rounded-xl font-bold"
                        value={flowForm.triggerKeywords}
                        onChange={(e) => setFlowForm({...flowForm, triggerKeywords: e.target.value})}
                        required
                      />
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Bot Targeted Response Text</Label>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase flex items-center gap-1",
                          isTooTall ? "text-orange-500" : "text-muted-foreground"
                        )}>
                          <AlignLeft className="h-3 w-3" /> {lineCount} Lines
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          isTooLong ? "text-red-500" : "text-muted-foreground"
                        )}>
                          {responseLength} / 1024
                        </span>
                      </div>
                   </div>
                   <Textarea 
                     placeholder="What should the bot say when trigger is hit?" 
                     className={cn(
                       "min-h-[120px] border-2 rounded-2xl p-6 font-medium text-sm leading-relaxed",
                       isTooLong || isTooTall ? "border-orange-200" : ""
                     )}
                     value={flowForm.responseText}
                     onChange={(e) => setFlowForm({...flowForm, responseText: e.target.value})}
                     required
                   />
                   {(isTooLong || isTooTall) && (
                      <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-1">
                        {isTooLong && (
                          <p className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Warning: Message exceeds 1024 characters.
                          </p>
                        )}
                        {isTooTall && (
                          <p className="text-[10px] text-orange-700 font-bold flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> UI Alert: Message has {lineCount} lines. WhatsApp might add a "Read More" button on smaller screens.
                          </p>
                        )}
                        <p className="text-[9px] text-orange-600 italic ml-4">Tip: Join bullet points together to reduce the total number of lines.</p>
                      </div>
                   )}
                   {/* Variable Mapping Guide */}
                   <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mt-2">
                      <p className="text-[10px] text-blue-800 font-bold uppercase mb-2 flex items-center gap-1.5">
                         <Info className="h-3.5 w-3.5" /> Variable Mapping Guide (Excel Order):
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                         <div className="bg-white px-2 py-1.5 rounded border text-[10px] font-mono shadow-sm flex flex-col items-center py-2">
                            <span className="text-blue-600 font-black">{"{{1}}"}</span>
                            <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Contact Name</span>
                         </div>
                         <div className="bg-white px-2 py-1.5 rounded border text-[10px] font-mono shadow-sm flex flex-col items-center py-2">
                            <span className="text-blue-600 font-black">{"{{2}}"}</span>
                            <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Phone Number</span>
                         </div>
                         <div className="bg-white px-2 py-1.5 rounded border text-[10px] font-mono shadow-sm flex flex-col items-center py-2">
                            <span className="text-blue-600 font-black">{"{{3}}"}</span>
                            <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Role</span>
                         </div>
                         <div className="bg-white px-2 py-1.5 rounded border text-[10px] font-mono shadow-sm flex flex-col items-center py-2">
                            <span className="text-blue-600 font-black">{"{{4}}"}</span>
                            <span className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">City</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-dashed">
                   <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Interactive Flow Buttons (Max 3)</Label>
                      <Button 
                         type="button" 
                         variant="outline" 
                         size="sm" 
                         onClick={handleAddFlowButton}
                         disabled={flowForm.buttons.length >= 3}
                         className="h-8 gap-2 font-black text-[10px]"
                      >
                         <PlusCircle className="h-3.5 w-3.5" /> ADD BUTTON
                      </Button>
                   </div>

                   <div className="space-y-3">
                      {flowForm.buttons.map((btn, idx) => (
                         <div key={idx} className="bg-muted/30 p-4 rounded-2xl border-2 border-dashed flex flex-col gap-4 relative animate-in slide-in-from-top-2">
                            <Button 
                               type="button" 
                               variant="ghost" 
                               size="icon" 
                               onClick={() => handleRemoveFlowButton(idx)}
                               className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white shadow-sm"
                            >
                               <X className="h-3 w-3" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-1.5">
                                  <Label className="text-[9px] font-black uppercase text-slate-500">Button Label</Label>
                                  <Input value={btn.label} onChange={(e) => handleFlowButtonChange(idx, 'label', e.target.value)} className="h-10 rounded-lg font-bold" />
                               </div>
                               <div className="space-y-1.5">
                                  <Label className="text-[9px] font-black uppercase text-slate-500">Destination Action</Label>
                                  <Select value={btn.action} onValueChange={(v) => handleFlowButtonChange(idx, 'action', v)}>
                                     <SelectTrigger className="h-10 rounded-lg font-bold"><SelectValue /></SelectTrigger>
                                     <SelectContent>
                                        <SelectItem value="NONE">Static Text Only</SelectItem>
                                        <SelectItem value="SEND_TEMPLATE">Send Message Template</SelectItem>
                                        <SelectItem value="SEARCH_JOBS">Internal: Search Jobs</SelectItem>
                                        <SelectItem value="HUMAN_HANDOVER">Internal: Call Human Agent</SelectItem>
                                        <SelectItem value="RESTART">Internal: Restart Bot</SelectItem>
                                     </SelectContent>
                                  </Select>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="pt-6 flex justify-end">
                   <Button type="submit" disabled={isFlowSaving} className={cn(
                     "h-14 px-12 font-black text-base gap-3 rounded-2xl shadow-xl transition-all",
                     editingId ? "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20" : "bg-primary shadow-primary/20"
                   )}>
                      {isFlowSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> {editingId ? 'Update Bot Flow Step' : 'Save New Flow Step'}</>}
                   </Button>
                </div>
             </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden rounded-[32px]">
          <CardHeader className="bg-muted/30 border-b py-6 px-8">
             <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5 text-primary" /> Configured Flow Steps
             </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                         <th className="px-8 py-4">Trigger & Intent</th>
                         <th className="px-8 py-4">Response Action</th>
                         <th className="px-8 py-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y">
                      {dbFlows?.map(f => (
                         <tr key={f.id} className="hover:bg-muted/20 transition-colors group">
                            <td className="px-8 py-4">
                               <p className="font-black text-sm uppercase tracking-tight text-slate-800">{f.name}</p>
                               <div className="flex flex-wrap gap-1 mt-1">
                                  {f.triggerKeywords?.split(',').map((k:string, i:number) => (
                                     <Badge key={i} variant="secondary" className="text-[7px] h-3.5 font-bold border-none">{k.trim()}</Badge>
                                  ))}
                               </div>
                            </td>
                            <td className="px-8 py-4">
                               <div className="flex gap-1">
                                  {f.buttons?.map((b:any, i:number) => (
                                     <Badge key={i} variant="outline" className="text-[8px] font-black uppercase">
                                        {b.label}
                                     </Badge>
                                  ))}
                               </div>
                            </td>
                            <td className="px-8 py-4 text-right space-x-1">
                               <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 rounded-xl hover:bg-blue-50" onClick={() => handleEditFlow(f)}>
                                  <Edit2 className="h-4 w-4" />
                               </Button>
                               <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive rounded-xl hover:bg-red-50" onClick={() => handleDeleteFlow(f.id)}>
                                  <Trash2 className="h-4 w-4" />
                               </Button>
                            </td>
                         </tr>
                      ))}
                      {!dbFlows?.length && (
                        <tr><td colSpan={3} className="py-20 text-center opacity-30 italic font-bold">No flow steps defined yet.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-5 space-y-6 sticky top-24">
        <Card className="border-none shadow-2xl bg-slate-100 rounded-[48px] overflow-hidden border-[12px] border-white p-8">
           <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest"><Monitor className="h-4 w-4" /> Visual Flow Simulator</div>
           </div>

           <div className="bg-[#e5ddd5] rounded-[32px] p-6 shadow-inner min-h-[450px] relative overflow-hidden flex flex-col items-start justify-end">
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://picsum.photos/seed/flow/400/800')]"></div>

              <div className="w-full space-y-4 relative z-10">
                 <div className="ml-auto max-w-[80%] bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none text-xs font-medium shadow-sm">
                    "{flowForm.triggerKeywords.split(',')[0] || 'apply'}"
                 </div>

                 <Card className="w-full max-w-[300px] border-none shadow-xl rounded-2xl rounded-tl-none bg-white overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                       <p className="text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                          {flowForm.responseText || "Start typing your response..."}
                       </p>
                    </CardContent>
                    {flowForm.buttons.length > 0 && (
                       <div className="border-t bg-slate-50 divide-y">
                          {flowForm.buttons.map((btn, bIdx) => (
                             <div key={bIdx} className="p-3 text-center flex items-center justify-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-tight">
                                <MousePointer2 className="h-3 w-3" />
                                {btn.label || "Option Label"}
                             </div>
                          ))}
                       </div>
                    )}
                 </Card>
              </div>
           </div>

           <div className="mt-8 p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-3">
              <div className="flex items-center gap-2"><MessageSquareCode className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase text-primary">Dynamic Logic Engine</span></div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic font-medium">
                 Use tokens like {"{{1}}"} to personalize these replies with user names.
              </p>
           </div>
        </Card>
      </div>
    </div>
  );
}
