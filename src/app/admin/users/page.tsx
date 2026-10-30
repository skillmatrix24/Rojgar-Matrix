"use client"

import { useState, useEffect } from "react";
import { useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { 
  collection, 
  query, 
  limit, 
  orderBy, 
  doc, 
  deleteDoc, 
  updateDoc, 
  setDoc, 
  serverTimestamp,
  increment,
  addDoc
} from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal, 
  ShieldAlert, 
  Trash2, 
  Mail,
  Phone,
  Loader2,
  Plus,
  Coins,
  Save,
  Search,
  Download,
  CheckCircle2,
  Ban,
  MessageSquare,
  UserCheck,
  Activity,
  MapPin,
  Crown,
  Users,
  Briefcase,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { secureDispatch } from "@/actions/secure-dispatch";

export default function AdminUsersPage() {
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [repairing, setRepairing] = useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "users"), orderBy("updatedAt", "desc"), limit(300));
  }, [db]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const handleRepairDatabase = async () => {
    setRepairing(true);
    try {
      const result = await secureDispatch('/api/admin/repair-users', {});
      if (result.ok) {
        toast({ title: "Repair Complete", description: `Updated ${result.data?.repairedCount || 0} profiles.` });
      }
    } catch (e) {
      console.error("Repair database error:", e);
      toast({ variant: "destructive", title: "Repair Failed" });
    } finally {
      setRepairing(false);
    }
  };

  const calculateProfileStrength = (u: any) => {
    if (u.role === 'employer') return 100;
    let score = 0;
    if (u.firstName && u.firstName !== "New") score += 20;
    if (u.skills && u.skills.length > 0) score += 20;
    if (u.experience && u.experience.length > 20) score += 20;
    if (u.resumeSummary && u.resumeSummary.length > 20) score += 20;
    if (u.education) score += 20;
    return score;
  };

  const toggleVerification = (userId: string, current: boolean) => {
    if (!db) return;
    const docRef = doc(db, "users", userId);
    updateDoc(docRef, { isVerified: !current })
      .catch(async (err) => {
        console.error("Toggle user verification error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isVerified: !current }
        }));
      });
  };

  const deleteUser = (userId: string) => {
    if (!db || !userId) return;
    if (currentUser?.uid === userId) return;
    if (!confirm(t('confirm_delete_user'))) return;
    deleteDoc(doc(db, "users", userId));
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    const formData = new FormData(e.currentTarget);
    const manualId = `manual_${Date.now()}`;
    setSaving(true);
    setDoc(doc(db, "users", manualId), {
      id: manualId,
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phoneNumber: formData.get('phoneNumber'),
      email: formData.get('email'),
      role: formData.get('role'),
      isEmployer: formData.get('role') === 'employer',
      city: formData.get('city'),
      credits: 0,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }).finally(() => { setSaving(false); setIsAddUserOpen(false); });
  };

  const handleUpdateCredits = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !selectedUser) return;
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('creditAmount'));
    setSaving(true);
    updateDoc(doc(db, "users", selectedUser.id), {
      credits: increment(amount),
      updatedAt: serverTimestamp()
    }).finally(() => { setSaving(false); setIsCreditOpen(false); });
  };

  const filteredUsers = users?.filter(u => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) || (u.email || "").toLowerCase().includes(search) || (u.phoneNumber || "").toLowerCase().includes(search);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  const stats = {
    total: users?.length || 0,
    seekers: users?.filter(u => u.role === 'jobSeeker').length || 0,
    employers: users?.filter(u => u.role === 'employer').length || 0,
    premium: users?.filter(u => u.isPremium).length || 0
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3"><UserCheck className="h-8 w-8 text-primary" /> User Accounts</h1>
          <p className="text-muted-foreground">Manage profile strength, verify users, and wallet balances.</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Button variant="outline" className="flex-1 lg:flex-none gap-2 font-bold h-11 border-2" onClick={handleRepairDatabase} disabled={repairing}>
            {repairing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Repair & Sync
          </Button>
          <Button className="flex-1 lg:flex-none gap-2 font-black px-8 h-11 shadow-lg shadow-primary/20" onClick={() => setIsAddUserOpen(true)}><Plus className="h-5 w-5" /> Add Manual</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Total Users', v: stats.total, i: Users, c: 'text-blue-600', b: 'bg-blue-50' },
          { l: 'Job Seekers', v: stats.seekers, i: UserCheck, c: 'text-green-600', b: 'bg-green-50' },
          { l: 'Employers', v: stats.employers, i: Briefcase, c: 'text-purple-600', b: 'bg-purple-50' },
          { l: 'Premium Users', v: stats.premium, i: Crown, c: 'text-orange-600', b: 'bg-orange-50' }
        ].map((s, i) => (
          <Card key={i} className="border-none shadow-sm"><CardContent className="p-4 flex items-center gap-4"><div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.b)}><s.i className={cn("h-5 w-5", s.c)} /></div><div><p className="text-[10px] font-black uppercase text-muted-foreground">{s.l}</p><h4 className="text-xl font-black">{s.v}</h4></div></CardContent></Card>
        ))}
      </div>

      <Card className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="jobSeeker">Job Seekers</SelectItem>
              <SelectItem value="employer">Employers</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead className="pl-8">User Info</TableHead><TableHead>Role</TableHead><TableHead>Strength</TableHead><TableHead>Credits</TableHead><TableHead className="text-right pr-8">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="pl-8 py-5">
                  <div className="space-y-0.5">
                    <p className="font-black text-sm">{u.firstName} {u.lastName}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-2.5 w-2.5" /> {u.phoneNumber || 'No phone'}</p>
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary" className="uppercase text-[8px] font-black">{u.role}</Badge></TableCell>
                <TableCell>
                  <div className="w-24 space-y-1">
                    <div className="flex justify-between text-[8px] font-bold uppercase"><span className="text-muted-foreground">Profile</span><span>{calculateProfileStrength(u)}%</span></div>
                    <Progress value={calculateProfileStrength(u)} className="h-1.5" />
                  </div>
                </TableCell>
                <TableCell><Badge variant="outline" className="font-black">{u.credits || 0}</Badge></TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => { setSelectedUser(u); setIsCreditOpen(true); }} className="gap-2"><Coins className="h-4 w-4" /> Manage Credits</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => toggleVerification(u.id, !!u.isVerified)} className="gap-2"><CheckCircle2 className="h-4 w-4" /> Toggle Verify</DropdownMenuItem>
                       <DropdownMenuSeparator />
                       <DropdownMenuItem onClick={() => deleteUser(u.id)} className="text-destructive gap-2"><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="sm:max-w-md rounded-[32px]">
          <DialogHeader><DialogTitle className="text-2xl font-black">Add Manual User</DialogTitle></DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5"><Label>First Name</Label><Input name="firstName" required /></div>
               <div className="space-y-1.5"><Label>Last Name</Label><Input name="lastName" /></div>
            </div>
            <div className="space-y-1.5"><Label>Phone Number</Label><Input name="phoneNumber" required /></div>
            <div className="space-y-1.5"><Label>Role</Label>
              <Select name="role" defaultValue="jobSeeker">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="jobSeeker">Job Seeker</SelectItem><SelectItem value="employer">Employer</SelectItem></SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4"><Button type="submit" disabled={saving} className="w-full font-black h-12 rounded-xl">{saving ? <Loader2 className="animate-spin" /> : 'Create Account'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreditOpen} onOpenChange={setIsCreditOpen}>
        <DialogContent className="sm:max-w-xs rounded-[32px]">
          <DialogHeader><DialogTitle className="text-xl font-black">Manage Credits</DialogTitle><DialogDescription>Update balance for {selectedUser?.firstName}.</DialogDescription></DialogHeader>
          <form onSubmit={handleUpdateCredits} className="space-y-6 py-4">
             <div className="text-center p-6 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20"><p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Current Wallet</p><h3 className="text-4xl font-black text-primary">{selectedUser?.credits || 0}</h3></div>
             <div className="space-y-2"><Label className="text-xs font-black uppercase">Amount to Add/Subtract</Label><Input type="number" name="creditAmount" placeholder="e.g. 50 or -10" required className="h-12 text-lg font-black text-center" /></div>
             <Button type="submit" disabled={saving} className="w-full h-12 font-black rounded-xl">{saving ? <Loader2 className="animate-spin" /> : 'Update Balance'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
