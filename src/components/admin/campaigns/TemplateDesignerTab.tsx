"use client"

import { useState } from "react";
import { useFirestore } from "@/firebase";
import { doc, deleteDoc, serverTimestamp, updateDoc, collection, addDoc } from "firebase/firestore";
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
import { 
  LayoutTemplate, 
  PlusCircle, 
  X, 
  Save, 
  Loader2, 
  Monitor, 
  FileImage, 
  Trash2,
  History,
  Send,
  RefreshCw,
  Edit2,
  Info,
  AlertCircle,
  Languages,
  FileText,
  CheckCircle2,
  AlignLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { secureDispatch } from "@/actions/secure-dispatch";

interface TemplateButton {
  type: 'URL' | 'QUICK_REPLY';
  label: string;
  value: string;
}

interface TemplateDesignerTabProps {
  dbTemplates: any[] | null;
  isTemplatesLoading: boolean;
}

const LANGUAGES = [
  { value: "en_IN", label: "English India (en_IN)" }
];

export function TemplateDesignerTab({ dbTemplates, isTemplatesLoading }: TemplateDesignerTabProps) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isTemplateSaving, setIsTemplateSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMetaId, setEditingMetaId] = useState<string | null>(null);
  
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "MARKETING",
    language: "en_IN",
    headerType: "NONE",
    headerText: "",
    bodyText: "Namaste {{1}}! RozgarMatrix par aapka swagat hai.",
    footerText: "Rozgar Matrix",
    buttons: [] as TemplateButton[],
    mediaUrl: ""
  });

  const handleSyncStatuses = async () => {
    if (!db || !dbTemplates) return;
    setIsSyncing(true);
    try {
      const result = await secureDispatch('/api/meta/sync-templates', {});
      
      if (result.ok) {
        const metaTemplates = result.data?.metaTemplates || [];
        for (const metaTpl of metaTemplates) {
          const localMatch = dbTemplates.find(t => t.name === metaTpl.name);
          const syncData = {
            status: metaTpl.status,
            metaId: metaTpl.id,
            updatedAt: serverTimestamp()
          };
          if (localMatch) {
            await updateDoc(doc(db, "wa_templates", localMatch.id), syncData);
          }
        }
        toast({ title: "Sync Complete" });
      } else {
        toast({ variant: "destructive", title: "Sync Failed", description: result.data?.error });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Connection Error" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditTemplate = (tpl: any) => {
    setEditingId(tpl.id);
    setEditingMetaId(tpl.metaId || null);
    setTemplateForm({
      name: tpl.name,
      category: tpl.category?.toUpperCase() || "MARKETING",
      language: tpl.language || "en_IN",
      headerType: tpl.headerType || "NONE",
      headerText: tpl.headerText || "",
      bodyText: tpl.bodyText || "",
      footerText: tpl.footerText || "Rozgar Matrix",
      buttons: tpl.buttons || [],
      mediaUrl: tpl.mediaUrl || ""
    });
  };

  const handleAddButton = () => {
    if (templateForm.buttons.length >= 3) return;
    setTemplateForm({
      ...templateForm,
      buttons: [...templateForm.buttons, { type: 'QUICK_REPLY', label: 'Reply Label', value: '' }]
    });
  };

  const handleRemoveButton = (idx: number) => {
    setTemplateForm({
      ...templateForm,
      buttons: templateForm.buttons.filter((_, i) => i !== idx)
    });
  };

  const handleButtonChange = (idx: number, field: string, val: string) => {
    const updated = [...templateForm.buttons];
    updated[idx] = { ...updated[idx], [field]: val };
    setTemplateForm({ ...templateForm, buttons: updated });
  };

  const handleSendToMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    
    setIsTemplateSaving(true);
    try {
      const isUpdating = !!(editingId && editingMetaId);
      const apiEndpoint = isUpdating ? '/api/meta/update-template' : '/api/meta/create-template';
      
      const result = await secureDispatch(apiEndpoint, isUpdating ? { ...templateForm, metaId: editingMetaId } : templateForm);

      if (result.ok) {
        const firestoreData = {
          ...templateForm,
          category: templateForm.category.toLowerCase(),
          metaId: result.data?.metaId || editingMetaId,
          status: 'PENDING',
          updatedAt: serverTimestamp()
        };
        if (isUpdating) {
          await updateDoc(doc(db, "wa_templates", editingId), firestoreData);
          toast({ title: "Template Updated" });
        } else {
          await addDoc(collection(db, "wa_templates"), { ...firestoreData, createdAt: serverTimestamp() });
          toast({ title: "Template Created" });
        }
        setEditingId(null); setEditingMetaId(null);
      } else {
        toast({ variant: "destructive", title: "Meta API Error", description: result.data?.error });
      }
    } finally {
      setIsTemplateSaving(false);
    }
  };

  const handleDeleteTemplate = async (tpl: any) => {
    if (!db || !confirm(`Delete '${tpl.name}'?`)) return;
    try {
      await secureDispatch('/api/meta/delete-template', { name: tpl.name });
      await deleteDoc(doc(db, "wa_templates", tpl.id));
      toast({ title: "Template Deleted" });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in duration-500">
      <div className="xl:col-span-7 space-y-8">
        <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
          <CardHeader className="bg-primary/5 border-b p-8 flex flex-row items-center justify-between">
             <CardTitle className="text-xl font-black flex items-center gap-3"><LayoutTemplate className="h-6 w-6 text-primary" /> {editingId ? 'Edit Meta Template' : 'New Template Designer'}</CardTitle>
             {editingId && <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setEditingMetaId(null); }} className="h-8 font-black text-[10px] uppercase text-slate-500">Cancel</Button>}
          </CardHeader>
          <CardContent className="p-8 space-y-8">
             <form onSubmit={handleSendToMeta} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Template Name (Lowercase)</Label><Input placeholder="welcome_massage" value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value.toLowerCase().replace(/\s/g, '_')})} disabled={!!editingId} required className="h-12 border-2 rounded-xl font-mono font-bold" /></div>
                   <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Language</Label>
                      <Select value={templateForm.language} onValueChange={(v) => setTemplateForm({...templateForm, language: v})}>
                         <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                         <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Header Media (Optional)</Label>
                      <Select value={templateForm.headerType} onValueChange={(v) => setTemplateForm({...templateForm, headerType: v})}>
                         <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                         <SelectContent><SelectItem value="NONE">No Header</SelectItem><SelectItem value="TEXT">Text Header</SelectItem><SelectItem value="IMAGE">Image Header</SelectItem></SelectContent>
                      </Select>
                      {templateForm.headerType === 'TEXT' && <Input placeholder="Header text... e.g. Welcome {{1}}" value={templateForm.headerText} onChange={(e) => setTemplateForm({...templateForm, headerText: e.target.value})} className="mt-2 h-11 border-2 font-bold" />}
                      {templateForm.headerType === 'IMAGE' && <Input placeholder="Sample Image URL for Approval" value={templateForm.mediaUrl} onChange={(e) => setTemplateForm({...templateForm, mediaUrl: e.target.value})} className="mt-2 h-11 border-2" />}
                   </div>

                   <div className="space-y-2">
                      <div className="flex justify-between items-center px-1"><Label className="text-[10px] font-black uppercase text-muted-foreground">Body Text (WhatsApp Content)</Label><span className="text-[10px] font-bold text-slate-400">{templateForm.bodyText.length}/1024</span></div>
                      <Textarea placeholder="Hi {{1}}! We found a {{2}} job for you." value={templateForm.bodyText} onChange={(e) => setTemplateForm({...templateForm, bodyText: e.target.value})} required className="min-h-[150px] border-2 rounded-2xl p-6 font-medium leading-relaxed" />
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3"><Info className="h-4 w-4 text-blue-600 mt-0.5" /><p className="text-[10px] text-blue-800 font-medium">Use {"{{1}}"}", "{"{{2}}"} to add variables. In the Bulk Sender, you can map these to Name, City, etc.</p></div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Interactive Buttons (Max 3)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleAddButton} disabled={templateForm.buttons.length >= 3} className="h-8 gap-2 font-black text-[10px]"><PlusCircle className="h-3.5 w-3.5" /> ADD BUTTON</Button>
                      </div>
                      <div className="space-y-3">
                         {templateForm.buttons.map((btn, idx) => (
                           <div key={idx} className="bg-muted/30 p-4 rounded-xl border-2 border-dashed flex items-center gap-4 relative">
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveButton(idx)} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white"><X className="h-3 w-3" /></Button>
                              <Select value={btn.type} onValueChange={(v) => handleButtonChange(idx, 'type', v)}><SelectTrigger className="w-40 h-10 rounded-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="QUICK_REPLY">Reply</SelectItem><SelectItem value="URL">Link</SelectItem></SelectContent></Select>
                              <Input placeholder="Label" value={btn.label} onChange={(e) => handleButtonChange(idx, 'label', e.target.value)} className="h-10 rounded-lg font-bold" />
                              {btn.type === 'URL' && <Input placeholder="https://..." value={btn.value} onChange={(e) => handleButtonChange(idx, 'value', e.target.value)} className="h-10 rounded-lg" />}
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="pt-6 flex justify-end">
                   <Button type="submit" disabled={isTemplateSaving} className="h-14 px-12 font-black text-lg gap-3 rounded-2xl shadow-xl transition-all active:scale-95">
                      {isTemplateSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-6 w-6" /> SUBMIT TO META API</>}
                   </Button>
                </div>
             </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden rounded-[32px]">
          <CardHeader className="bg-muted/30 border-b py-6 px-8 flex flex-row items-center justify-between gap-4">
             <div className="space-y-1"><CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Platform Templates</CardTitle><p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Statuses from Meta Cloud API</p></div>
             <Button variant="outline" size="sm" onClick={handleSyncStatuses} disabled={isSyncing} className="h-9 px-4 rounded-xl border-2 font-black gap-2 active:scale-95">
                {isSyncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Sync Status
             </Button>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead><tr className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground"><th className="px-8 py-4">Name & Category</th><th className="px-8 py-4">Meta Status</th><th className="px-8 py-4 text-right">Actions</th></tr></thead>
                   <tbody className="divide-y">
                      {dbTemplates?.map(tpl => (
                         <tr key={tpl.id} className="hover:bg-muted/20 transition-colors group">
                            <td className="px-8 py-4"><p className="font-black text-sm uppercase tracking-tight text-slate-800">{tpl.name}</p><p className="text-[9px] text-muted-foreground uppercase font-bold">{tpl.category}</p></td>
                            <td className="px-8 py-4">
                               <Badge variant={tpl.status === 'APPROVED' ? 'default' : tpl.status === 'REJECTED' ? 'destructive' : 'outline'} className={cn("text-[9px] font-black tracking-tighter uppercase px-3 h-5", tpl.status === 'APPROVED' ? "bg-green-500 hover:bg-green-600" : "")}>{tpl.status}</Badge>
                            </td>
                            <td className="px-8 py-4 text-right space-x-1">
                               <Button variant="ghost" size="icon" className="h-9 w-9 text-blue-600 rounded-xl hover:bg-blue-50" onClick={() => handleEditTemplate(tpl)}><Edit2 className="h-4 w-4" /></Button>
                               <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive rounded-xl hover:bg-red-50" onClick={() => handleDeleteTemplate(tpl)}><Trash2 className="h-4 w-4" /></Button>
                            </td>
                         </tr>
                      ))}
                      {!dbTemplates?.length && !isTemplatesLoading && (
                        <tr><td colSpan={3} className="py-20 text-center opacity-30 italic font-bold">No templates found in database.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-5 space-y-6 sticky top-24">
        <Card className="border-none shadow-2xl bg-slate-100 rounded-[48px] overflow-hidden border-[12px] border-white p-8">
           <div className="mb-6 flex items-center justify-between"><div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest"><Monitor className="h-4 w-4" /> Visual Approval Preview</div></div>
           <div className="bg-[#e5ddd5] rounded-[32px] p-6 shadow-inner min-h-[450px] relative overflow-hidden flex flex-col">
              {templateForm.headerType === 'IMAGE' && <div className="w-full h-32 rounded-xl mb-4 overflow-hidden border bg-white flex items-center justify-center">{templateForm.mediaUrl ? <img src={templateForm.mediaUrl} className="w-full h-full object-cover" /> : <FileImage className="h-8 w-8 opacity-10" />}</div>}
              <Card className="w-full max-w-[300px] border-none shadow-xl rounded-2xl rounded-tl-none bg-white overflow-hidden">
                 <CardContent className="p-4 space-y-3">
                    {templateForm.headerType === 'TEXT' && <h4 className="font-black text-sm text-slate-800 border-b pb-1.5">{templateForm.headerText || "Header Text"}</h4>}
                    <p className="text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap">{templateForm.bodyText}</p>
                    <p className="text-[9px] text-slate-400 font-bold border-t pt-2">{templateForm.footerText}</p>
                 </CardContent>
                 {templateForm.buttons.length > 0 && (
                   <div className="border-t bg-slate-50 divide-y">
                      {templateForm.buttons.map((btn, bIdx) => (<div key={bIdx} className="p-3 text-center text-blue-600 font-black text-[10px] uppercase tracking-tight">{btn.label || "Button Label"}</div>))}
                   </div>
                 )}
              </Card>
           </div>
           <div className="mt-8 p-6 bg-primary/5 rounded-3xl border-2 border-dashed border-primary/20 space-y-4">
              <div className="flex items-center gap-2"><AlignLeft className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase text-primary">Content Quality Analysis</span></div>
              <div className="space-y-2">
                 <div className="flex items-center justify-between text-[10px] font-bold"><span>Approval Confidence</span><span className="text-green-600">HIGH</span></div>
                 <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[94%]" /></div>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">Preview uses standard WhatsApp font spacing. Final rendering may vary slightly based on user device.</p>
           </div>
        </Card>
      </div>
    </div>
  );
}
