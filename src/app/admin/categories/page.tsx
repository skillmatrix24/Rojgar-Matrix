"use client"

import { useState } from "react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  CheckCircle, 
  XCircle,
  Save,
  Layers,
  Database,
  ChevronDown,
  Type
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminCategoriesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  
  const catsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "categories"), orderBy("order", "asc"));
  }, [db]);
  const { data: categories, isLoading } = useCollection(catsQuery);

  const [isNewGroup, setIsNewGroup] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>("");

  const uniqueGroups = Array.from(new Set(categories?.map((c: any) => c.group).filter(Boolean) || [])) as string[];

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setSelectedGroup("");
    setIsNewGroup(uniqueGroups.length === 0);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (cat: any) => {
    setEditingCategory(cat);
    setSelectedGroup(cat.group || "");
    setIsNewGroup(false);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db) return;
    
    const formData = new FormData(e.currentTarget);
    const finalGroup = isNewGroup ? (formData.get('custom_group') as string) : selectedGroup;

    if (!finalGroup) {
      toast({ variant: "destructive", title: "Group Required" });
      return;
    }

    setSaving(true);
    const categoryData = {
      name: formData.get('name') as string,
      group: finalGroup,
      order: Number(formData.get('order')),
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    if (editingCategory) {
      const docRef = doc(db, "categories", editingCategory.id);
      updateDoc(docRef, categoryData)
        .catch(async (err) => {
          console.error("Update category error:", err);
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: categoryData
          }));
        })
        .finally(() => setSaving(false));
      toast({ title: t('cat_updated') });
    } else {
      const colRef = collection(db, "categories");
      addDoc(colRef, {
        ...categoryData,
        createdAt: serverTimestamp(),
      })
      .catch(async (err) => {
        console.error("Add category error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: categoryData
        }));
      })
      .finally(() => setSaving(false));
      toast({ title: t('cat_created') });
    }
    
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const toggleStatus = (id: string, current: boolean) => {
    if (!db) return;
    const docRef = doc(db, "categories", id);
    updateDoc(docRef, { isActive: !current })
      .catch(async (err) => {
        console.error("Toggle category status error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isActive: !current }
        }));
      });
  };

  const deleteCategory = (id: string) => {
    if (!db || !confirm(t('confirm_delete_cat'))) return;
    const docRef = doc(db, "categories", id);
    deleteDoc(docRef)
      .catch(async (err) => {
        console.error("Delete category error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }));
      });
    toast({ title: t('cat_removed') });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t('category_mgmt_title')}</h1>
          <p className="text-sm text-muted-foreground">Manage job sectors and groups.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button className="flex-1 md:flex-none gap-2 font-bold px-6 h-11 group" onClick={handleOpenAdd}>
            <Plus className="h-5 w-5" /> {t('add_new')}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">{t('loading_categories')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 whitespace-nowrap">
                  <TableHead className="pl-6 w-20 text-center">Order</TableHead>
                  <TableHead className="min-w-[180px]">Name</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat) => (
                  <TableRow key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 font-mono font-bold text-primary text-center">{cat.order}</TableCell>
                    <TableCell className="font-bold text-sm md:text-base">{cat.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50 border-primary/20 text-primary text-[10px]">
                        {cat.group || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cat.isActive ? "default" : "secondary"} className={cn("text-[10px]", cat.isActive ? "bg-green-500 text-white" : "")}>
                        {cat.isActive ? t('visible') : t('hidden')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 space-x-1 whitespace-nowrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(cat.id, !!cat.isActive)}>
                        {cat.isActive ? <XCircle className="h-4 w-4 text-orange-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenEdit(cat)}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!categories?.length && (
                  <TableRow><TableCell colSpan={5} className="py-24 text-center opacity-30 italic">No categories found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase">Name</Label>
              <Input name="name" defaultValue={editingCategory?.name} required />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold uppercase">Group</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-[10px] font-bold" onClick={() => setIsNewGroup(!isNewGroup)}>
                  {isNewGroup ? "Select Existing" : "Create New"}
                </Button>
              </div>
              {isNewGroup ? (
                <Input name="custom_group" placeholder="Type group name..." required />
              ) : (
                <Select value={selectedGroup} onValueChange={setSelectedGroup} required>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    {uniqueGroups.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold uppercase">Order</Label>
              <Input name="order" type="number" defaultValue={editingCategory?.order || (categories?.length || 0) + 1} required />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancel</Button>
              <Button type="submit" disabled={saving} className="font-bold px-8">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {editingCategory ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}