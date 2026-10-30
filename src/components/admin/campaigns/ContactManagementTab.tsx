
"use client"

import { useState, useRef, useMemo } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Download, 
  Upload, 
  Search, 
  Trash2, 
  Database, 
  Filter, 
  FileSpreadsheet,
  CheckCircle2,
  Loader2,
  Tag,
  UserPlus,
  Target,
  Info,
  RefreshCw,
  Save
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CampaignContact } from "@/app/admin/campaigns/page";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

interface ContactManagementTabProps {
  contacts: CampaignContact[];
}

export function ContactManagementTab({ contacts }: ContactManagementTabProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeGroupFilter, setActiveGroupFilter] = useState("all");
  
  const [isImportDbOpen, setIsImportDbOpen] = useState(false);
  const [isAddManualOpen, setIsAddManualOpen] = useState(false);
  const [importRole, setImportRole] = useState("jobSeeker");
  const [isImporting, setIsImporting] = useState(false);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const uniqueGroups = useMemo(() => {
    const groups = Array.from(new Set(contacts.map(c => c.group)));
    return groups.filter(g => g && g !== "Manual Entry" && g !== "Imported from DB" && g !== "CSV Upload");
  }, [contacts]);

  const handleImportFromDb = async () => {
    if (!db) return;
    setIsImporting(true);
    try {
      const q = query(
        collection(db, "users"), 
        where("role", "==", importRole)
      );
      const snap = await getDocs(q);
      
      const existingNumbers = new Set(contacts.map(c => c.number));
      const colRef = collection(db, "marketing_contacts");

      let addedCount = 0;
      for (const d of snap.docs) {
        const data = d.data();
        const cleanNum = (data.phoneNumber || "").replace(/\D/g, '');
        
        if (cleanNum.length >= 10 && !existingNumbers.has(cleanNum)) {
          const contactData = {
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim() || "User",
            number: cleanNum,
            role: data.role || "unknown",
            city: data.city || "Unknown",
            group: "Imported from DB",
            source: 'database',
            createdAt: serverTimestamp()
          };
          
          await addDoc(colRef, contactData).catch(async (err) => {
            console.error("Database sync addDoc error:", err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: colRef.path,
              operation: 'create',
              requestResourceData: contactData
            }));
          });
          addedCount++;
        }
      }

      toast({ title: "Database Sync Complete", description: `Saved ${addedCount} new contacts to Firestore.` });
      setIsImportDbOpen(false);
    } catch (e) {
      console.error("Contact import error:", e);
      toast({ variant: "destructive", title: "Import Failed" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split('\n').filter(r => r.trim());
      const colRef = collection(db, "marketing_contacts");
      const existingNumbers = new Set(contacts.map(c => c.number));
      
      let addedCount = 0;
      const parsedRows = rows.slice(1);
      
      for (const row of parsedRows) {
        const cols = row.split(',');
        const cleanNum = (cols[1] || "").replace(/\D/g, '').trim();
        
        if (cleanNum.length >= 10 && !existingNumbers.has(cleanNum)) {
          const contactData = {
            name: cols[0]?.trim() || "User",
            number: cleanNum,
            role: cols[2]?.trim() || "jobSeeker",
            city: cols[3]?.trim() || "Unknown",
            group: cols[4]?.trim() || "CSV Upload",
            source: 'csv',
            createdAt: serverTimestamp()
          };
          
          await addDoc(colRef, contactData).catch(async (err) => {
            console.error("CSV sync addDoc error:", err);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: colRef.path,
              operation: 'create',
              requestResourceData: contactData
            }));
          });
          addedCount++;
        }
      }

      toast({ title: "CSV Sync Complete", description: `Saved ${addedCount} new contacts from CSV.` });
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddManual = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.currentTarget);
    const num = (formData.get('number') as string).replace(/\D/g, '');
    
    if (num.length < 10) {
      toast({ variant: "destructive", title: "Invalid Number", description: "Phone number must be at least 10 digits." });
      return;
    }

    const existing = contacts.find(p => p.number === num);
    if (existing) {
      toast({ variant: "destructive", title: "Duplicate Number", description: "This number is already in your database." });
      return;
    }

    const colRef = collection(db, "marketing_contacts");
    const contactData = {
      name: formData.get('name') as string,
      number: num,
      role: formData.get('role') as string,
      city: formData.get('city') as string,
      group: "Manual Entry",
      source: 'manual',
      createdAt: serverTimestamp()
    };

    setIsImporting(true);
    addDoc(colRef, contactData)
      .then(() => {
        toast({ title: "Contact Saved Permanently" });
        setIsAddManualOpen(false);
      })
      .catch(async (err) => {
        console.error("Add manual contact error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: contactData
        }));
      })
      .finally(() => setIsImporting(false));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0 || !db) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} contacts permanently?`)) return;

    setIsImporting(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        const docRef = doc(db, "marketing_contacts", id);
        batch.delete(docRef);
      });
      
      await batch.commit();
      
      toast({ title: "Contacts Deleted", description: `Successfully removed ${selectedIds.length} leads.` });
      setSelectedIds([]);
    } catch (e: any) {
      console.error("Bulk Delete Error:", e);
      toast({ variant: "destructive", title: "Delete Failed", description: e.message || "An unexpected error occurred." });
      
      if (e.code === 'permission-denied') {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'marketing_contacts',
            operation: 'delete'
          }));
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!db) return;
    const docRef = doc(db, "marketing_contacts", id);
    deleteDoc(docRef).catch(async (err) => {
      console.error("Delete contact error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
    toast({ title: "Contact Removed" });
  };

  const handleAssignGroup = async () => {
    if (!newGroupName || !db || selectedIds.length === 0) return;
    
    setIsSavingGroup(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        const docRef = doc(db, "marketing_contacts", id);
        batch.update(docRef, { group: newGroupName, updatedAt: serverTimestamp() });
      });
      await batch.commit();
      
      toast({ title: "Group Assigned", description: `Applied '${newGroupName}' to selected contacts.` });
      setIsGroupDialogOpen(false);
      setNewGroupName("");
      setSelectedIds([]);
    } catch (e) {
      console.error("Group assignment error:", e);
      toast({ variant: "destructive", title: "Group Assignment Failed" });
    } finally {
      setIsSavingGroup(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredContacts.length && filteredContacts.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map(c => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredContacts = contacts.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.number.includes(searchTerm) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.group.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGroup = activeGroupFilter === "all" || c.group === activeGroupFilter;

    return matchesSearch && matchesGroup;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="space-y-1">
           <h2 className="text-2xl font-black flex items-center gap-3">
             <Users className="h-7 w-7 text-blue-600" />
             CRM & Contact Management
           </h2>
           <p className="text-muted-foreground font-medium">Manage broadcast targets, groups, and database imports permanently.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
           <Button variant="outline" className="font-bold gap-2 h-11 border-2" onClick={() => setIsImportDbOpen(true)}>
              <Database className="h-4 w-4 text-blue-600" /> Import from DB
           </Button>
           <Button variant="outline" className="font-bold gap-2 h-11 border-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Import CSV
           </Button>
           <input type="file" ref={fileInputRef} hidden accept=".csv" onChange={handleCsvImport} />
           <Button variant="outline" className="font-bold gap-2 h-11 border-2" onClick={() => window.open('/rozgarmatrix_contacts_sample.csv')}>
              <FileSpreadsheet className="h-4 w-4" /> Download Sample
           </Button>
           <Button className="font-black gap-2 h-11 shadow-lg shadow-primary/20" onClick={() => setIsAddManualOpen(true)}>
              <UserPlus className="h-4 w-4" /> Add Manual
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { l: 'Total Persistent Leads', v: contacts.length, i: Users, c: 'text-blue-600' },
           { l: 'Selected for Action', v: selectedIds.length, i: CheckCircle2, c: 'text-green-600' },
           { l: 'Campaign Groups', v: new Set(contacts.map(c => c.group)).size, i: Tag, c: 'text-orange-600' },
           { l: 'Sync Status', v: 'Online', i: RefreshCw, c: 'text-purple-600' }
         ].map((s, i) => (
           <Card key={i} className="border-none shadow-sm">
             <CardContent className="p-4 flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                 <s.i className={cn("h-5 w-5", s.c)} />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase text-muted-foreground">{s.l}</p>
                 <h4 className="text-lg font-black">{s.v}</h4>
               </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <Card className="border-none shadow-xl rounded-[32px] overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
           <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full max-w-2xl">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                 <Input 
                   placeholder="Search contacts..." 
                   className="pl-10 h-11 rounded-xl"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="w-full sm:w-64">
                 <Select value={activeGroupFilter} onValueChange={setActiveGroupFilter}>
                    <SelectTrigger className="h-11 rounded-xl font-bold bg-white">
                       <div className="flex items-center gap-2">
                          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                          <SelectValue placeholder="Filter by Group" />
                       </div>
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="all">Show All Groups</SelectItem>
                       {Array.from(new Set(contacts.map(c => c.group))).map(g => (
                         <SelectItem key={g} value={g}>{g}</SelectItem>
                       ))}
                    </SelectContent>
                 </Select>
              </div>
           </div>
           
           <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                   <Button variant="outline" size="sm" className="h-9 font-bold text-[10px] uppercase gap-2 border-orange-200 text-orange-700" onClick={() => setIsGroupDialogOpen(true)}>
                      <Tag className="h-3.5 w-3.5" /> Assign Group
                   </Button>
                   <Button 
                    variant="destructive" 
                    size="sm" 
                    className="h-9 font-bold text-[10px] uppercase gap-2" 
                    onClick={handleBulkDelete}
                    disabled={isImporting}
                  >
                      {isImporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      Remove Selected
                   </Button>
                </div>
              )}
              <Badge variant="secondary" className="h-6 px-3 font-black text-[10px] uppercase tracking-tighter ml-2">
                {filteredContacts.length} Leads
              </Badge>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 pl-6">
                      <Checkbox 
                        checked={selectedIds.length === filteredContacts.length && filteredContacts.length > 0} 
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest min-w-[180px]">Contact Name</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Phone Number</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">City</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest min-w-[150px]">Broadcast Group</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((c) => (
                    <TableRow key={c.id} className={cn(
                      "hover:bg-muted/20 transition-colors group",
                      selectedIds.includes(c.id) && "bg-blue-50/50"
                    )}>
                      <TableCell className="pl-6">
                        <Checkbox 
                          checked={selectedIds.includes(c.id)} 
                          onCheckedChange={() => toggleSelectOne(c.id)}
                        />
                      </TableCell>
                      <TableCell className="py-4">
                         <div className="space-y-0.5">
                            <p className="font-bold text-sm text-slate-800">{c.name}</p>
                            <p className="text-[9px] text-muted-foreground font-mono">ID: {c.id.slice(0,8)}</p>
                         </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-bold text-blue-600">+91 {c.number}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter h-5">{c.role}</Badge></TableCell>
                      <TableCell className="text-xs font-medium text-slate-600">{c.city}</TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-orange-100 flex items-center justify-center">
                               <Tag className="h-3 w-3 text-orange-600" />
                            </div>
                            <span className="text-[11px] font-black uppercase text-slate-700 truncate max-w-[150px]">{c.group}</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <div className="flex items-center justify-end gap-2">
                           <Badge className={cn(
                             "text-[8px] font-black uppercase h-5",
                             c.source === 'database' ? "bg-blue-100 text-blue-700" : c.source === 'csv' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"
                           )}>
                             {c.source}
                           </Badge>
                           <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteOne(c.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                           </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredContacts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-32 text-center">
                         <div className="flex flex-col items-center gap-4 opacity-20">
                            <FileSpreadsheet className="h-16 w-16" />
                            <p className="font-black uppercase tracking-[0.2em]">No contacts match your filters</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
           </div>
        </CardContent>
      </Card>

      {/* Database Import Dialog */}
      <Dialog open={isImportDbOpen} onOpenChange={setIsImportDbOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
           <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                 <Database className="h-5 w-5 text-blue-600" /> DB Smart Synchronizer
              </DialogTitle>
              <DialogDescription>Select specific user segments to import into your MARKETING database.</DialogDescription>
           </DialogHeader>
           <div className="py-6 space-y-6">
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Role</Label>
                 <Select value={importRole} onValueChange={setImportRole}>
                    <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="jobSeeker">All Job Seekers</SelectItem>
                       <SelectItem value="employer">All Registered Employers</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 space-y-3">
                 <p className="text-[10px] font-black uppercase text-blue-700 tracking-widest flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" /> Lead Management Info
                 </p>
                 <p className="text-[11px] text-blue-600 leading-relaxed font-medium">
                    This will copy registered users into your marketing list. 
                    Changes to user profiles later will not reflect here unless you re-sync.
                 </p>
              </div>
           </div>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsImportDbOpen(false)} className="font-bold">Cancel</Button>
              <Button onClick={handleImportFromDb} disabled={isImporting} className="font-black px-8 h-11 gap-2 rounded-xl shadow-lg shadow-blue-500/20">
                 {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4" /> Start DB Import</>}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={isAddManualOpen} onOpenChange={setIsAddManualOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
           <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                 <UserPlus className="h-5 w-5 text-primary" /> Add Individual Contact
              </DialogTitle>
              <DialogDescription>Manually save a single recipient to your marketing database.</DialogDescription>
           </DialogHeader>
           <form onSubmit={handleAddManual} className="py-4 space-y-6">
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Name</Label>
                 <Input name="name" placeholder="Rahul Kumar" required className="h-12 border-2 rounded-xl font-bold" />
              </div>
              <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Whatsapp Number</Label>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">+91</span>
                    <Input name="number" placeholder="9876543210" required className="h-12 pl-12 border-2 rounded-xl font-black text-lg" />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Role</Label>
                    <Select name="role" defaultValue="jobSeeker">
                       <SelectTrigger className="h-12 border-2 rounded-xl font-bold">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="jobSeeker">Job Seeker</SelectItem>
                          <SelectItem value="employer">Employer</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">City</Label>
                    <Input name="city" placeholder="Raipur" required className="h-12 border-2 rounded-xl font-bold" />
                 </div>
              </div>
              <DialogFooter className="pt-4">
                 <Button type="button" variant="ghost" onClick={() => setIsAddManualOpen(false)} className="font-bold">Cancel</Button>
                 <Button type="submit" disabled={isImporting} className="font-black px-8 h-11 gap-2 rounded-xl shadow-lg shadow-primary/20">
                    {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Lead Permanently</>}
                 </Button>
              </DialogFooter>
           </form>
        </DialogContent>
      </Dialog>

      {/* Group Assignment Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent className="sm:max-w-sm rounded-[32px]">
           <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                 <Tag className="h-5 w-5 text-orange-600" /> Assign Broadcast Group
              </DialogTitle>
              <DialogDescription>Apply a common tag to {selectedIds.length} selected contacts.</DialogDescription>
           </DialogHeader>
           <div className="py-4 space-y-4">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Group / Campaign Name</Label>
                 <Input 
                   placeholder="e.g. Summer_Sales_Campaign" 
                   className="h-12 rounded-xl font-bold"
                   value={newGroupName}
                   onChange={(e) => setNewGroupName(e.target.value)}
                 />
              </div>
           </div>
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsGroupDialogOpen(false)} className="font-bold">Cancel</Button>
              <Button onClick={handleAssignGroup} disabled={!newGroupName || isSavingGroup} className="font-black px-8 h-11 bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-500/20 rounded-xl">
                 {isSavingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Database"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
