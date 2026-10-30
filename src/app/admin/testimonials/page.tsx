"use client"

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Star, 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  Save, 
  X, 
  Image as ImageIcon, 
  UserCheck, 
  Settings2,
  Filter,
  CheckCircle2,
  Zap,
  BarChart3,
  RefreshCw,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminTestimonialsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    userName: "",
    userRole: "Job Seeker",
    content: "",
    rating: 5,
    userPhoto: "",
    isActive: true,
    isFeatured: false
  });

  // Global Settings State
  const [minStars, setMinStars] = useState("4");
  const [useManualStats, setUseManualStats] = useState(false);
  const [manualAvgRating, setManualAvgRating] = useState("4.8");
  const [manualTotalReviews, setManualTotalReviews] = useState("1200");

  // Fetch Settings
  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "testimonials");
  }, [db]);
  const { data: globalSettings } = useDoc(settingsRef);

  useEffect(() => {
    if (globalSettings) {
      setMinStars(String(globalSettings.minStarsForHome || "4"));
      setUseManualStats(globalSettings.useManualStats ?? false);
      setManualAvgRating(String(globalSettings.manualAvgRating || "4.8"));
      setManualTotalReviews(String(globalSettings.manualTotalReviews || "1200"));
    }
  }, [globalSettings]);

  // Fetch Testimonials
  const testimonialsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "testimonials"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: testimonials, isLoading } = useCollection(testimonialsQuery);

  const handleSaveSettings = async () => {
    if (!db) return;
    setSettingsSaving(true);
    try {
      await setDoc(doc(db, "settings", "testimonials"), {
        minStarsForHome: Number(minStars),
        useManualStats,
        manualAvgRating: Number(manualAvgRating),
        manualTotalReviews: Number(manualTotalReviews),
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Settings Applied", description: "Display strategy and stats updated." });
    } catch (e) {
      console.error("Testimonial settings save error:", e);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      userName: "",
      userRole: "Job Seeker",
      content: "",
      rating: 5,
      userPhoto: "",
      isActive: true,
      isFeatured: false
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      userName: item.userName,
      userRole: item.userRole || "Job Seeker",
      content: item.content,
      rating: item.rating || 5,
      userPhoto: item.userPhoto || "",
      isActive: item.isActive ?? true,
      isFeatured: item.isFeatured ?? false
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "testimonials", editingId), payload);
        toast({ title: "Testimonial Updated" });
      } else {
        await addDoc(collection(db, "testimonials"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        toast({ title: "Testimonial Added" });
      }
      setIsDialogOpen(false);
    } catch (e) {
      console.error("Testimonial entry save error:", e);
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db || !confirm("Delete this review?")) return;
    try {
      await deleteDoc(doc(db, "testimonials", id));
      toast({ title: "Removed" });
    } catch (e) {
      console.error("Failed to delete testimonial:", e);
    }
  };

  const toggleStatus = async (id: string, field: string, current: boolean) => {
    if (!db) return;
    await updateDoc(doc(db, "testimonials", id), { [field]: !current });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            Live Testimonials
          </h1>
          <p className="text-muted-foreground mt-1">Manage user reviews and platform success stories.</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 font-black h-12 px-8 rounded-2xl shadow-xl shadow-primary/20">
          <Plus className="h-5 w-5" /> Add Review
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-lg rounded-[32px] overflow-hidden bg-card border-2 border-primary/10">
            <CardHeader className="bg-primary/5 border-b p-6">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" /> Display Settings
                </CardTitle>
                <CardDescription className="text-xs font-bold text-slate-500">Control home page content and stats.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
                {/* Star Filter */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min Star Rating for Home</Label>
                  <Select value={minStars} onValueChange={setMinStars}>
                      <SelectTrigger className="h-11 rounded-xl border-2 font-black text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map(s => (
                          <SelectItem key={s} value={String(s)} className="font-bold">
                            {s} Stars {s >= 4 ? ' (High Quality)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                  </Select>
                </div>

                <div className="h-px bg-border border-dashed" />

                {/* Stats Management */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stats Source</Label>
                      <p className="text-[11px] font-bold text-slate-500">{useManualStats ? 'Manual Override' : 'Database Real-time'}</p>
                    </div>
                    <Switch checked={useManualStats} onCheckedChange={setUseManualStats} />
                  </div>

                  {useManualStats && (
                    <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Average Rating</Label>
                        <Input 
                          type="number" 
                          step="0.1" 
                          max="5"
                          value={manualAvgRating} 
                          onChange={(e) => setManualAvgRating(e.target.value)} 
                          className="h-11 rounded-xl border-2 font-black text-lg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manual Total Reviews</Label>
                        <Input 
                          type="number" 
                          value={manualTotalReviews} 
                          onChange={(e) => setManualTotalReviews(e.target.value)} 
                          className="h-11 rounded-xl border-2 font-black text-lg"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveSettings} disabled={settingsSaving} className="w-full h-12 font-black gap-2 rounded-xl shadow-lg">
                  {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Apply Settings
                </Button>
            </CardContent>
          </Card>

          <div className="bg-blue-50 p-6 rounded-[32px] border-2 border-dashed border-blue-200 flex gap-4 items-start">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-1" />
            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase text-blue-900">Why Manual Stats?</h4>
              <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                Initial days mein users kam hote hain, isliye aap high count (e.g. 1200+) dikha kar trust build kar sakte hain. Manual mode stars aur counts dono ko change kar deta hai.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials List */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-lg overflow-hidden rounded-[32px]">
            <CardHeader className="bg-muted/30 border-b p-6">
               <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Filter className="h-5 w-5 text-primary" /> Review Inventory
                  </CardTitle>
                  <Badge variant="outline" className="font-black text-[10px]">{testimonials?.length || 0} Total</Badge>
               </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="pl-8">User</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right pr-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testimonials?.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="pl-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden border-2 bg-muted relative">
                                {item.userPhoto ? (
                                  <Image src={item.userPhoto} alt="User" fill className="object-cover" />
                                ) : <UserCheck className="h-5 w-5 m-2.5 text-muted-foreground" />}
                              </div>
                              <div>
                                <p className="text-sm font-black">{item.userName}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{item.userRole}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-0.5 items-center">
                              <span className="text-sm font-black mr-1">{item.rating || 5}</span>
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-4">
                               <div className="flex flex-col gap-2">
                                 <div className="flex items-center gap-2">
                                   <Switch checked={item.isActive} onCheckedChange={() => toggleStatus(item.id, 'isActive', !!item.isActive)} className="scale-75" />
                                   <span className="text-[9px] font-black uppercase text-slate-400">Live</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <Switch checked={item.isFeatured} onCheckedChange={() => toggleStatus(item.id, 'isFeatured', !!item.isFeatured)} className="scale-75 data-[state=checked]:bg-yellow-500" />
                                   <span className="text-[9px] font-black uppercase text-slate-400">Home</span>
                                 </div>
                               </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8 space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleEdit(item)}><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!testimonials?.length && (
                        <TableRow><TableCell colSpan={4} className="py-24 text-center opacity-30 italic font-black uppercase tracking-widest">No reviews added yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingId ? 'Edit Review' : 'Add New Review'}</DialogTitle>
            <DialogDescription>Share a success story to boost platform trust.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-5 py-4">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest">Name</Label>
                 <Input value={formData.userName} onChange={(e) => setFormData({...formData, userName: e.target.value})} required className="rounded-xl border-2" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest">Role / Designation</Label>
                 <Input value={formData.userRole} onChange={(e) => setFormData({...formData, userRole: e.target.value})} placeholder="e.g. Graphic Designer" className="rounded-xl border-2" />
               </div>
             </div>

             <div className="space-y-2">
               <Label className="text-[10px] font-black uppercase tracking-widest">Profile Photo URL</Label>
               <Input value={formData.userPhoto} onChange={(e) => setFormData({...formData, userPhoto: e.target.value})} placeholder="Paste image URL..." className="rounded-xl border-2 font-mono text-xs" />
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Rating (1-5)</Label>
                <div className="flex gap-4 p-4 bg-muted/30 rounded-2xl border-2 border-dashed items-center justify-center">
                   {[1,2,3,4,5].map(star => (
                     <button key={star} type="button" onClick={() => setFormData({...formData, rating: star})}>
                        <Star className={cn("h-8 w-8 transition-all active:scale-90", star <= formData.rating ? "text-yellow-500 fill-yellow-500" : "text-slate-200")} />
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest">Testimonial Content</Label>
                <Textarea value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} className="min-h-[100px] rounded-2xl border-2 p-4 font-medium italic" required />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50">
                   <span className="text-[10px] font-black uppercase">Visible</span>
                   <Switch checked={formData.isActive} onCheckedChange={(v) => setFormData({...formData, isActive: v})} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50">
                   <span className="text-[10px] font-black uppercase">Home Featured</span>
                   <Switch checked={formData.isFeatured} onCheckedChange={(v) => setFormData({...formData, isFeatured: v})} />
                </div>
             </div>

             <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancel</Button>
                <Button type="submit" disabled={saving} className="font-black px-10 h-12 gap-2 rounded-xl shadow-lg">
                   {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                   {editingId ? 'Update Review' : 'Publish Review'}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
