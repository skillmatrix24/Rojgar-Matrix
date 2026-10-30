"use client"

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Inbox, 
  Mail, 
  Trash2, 
  Loader2, 
  Eye, 
  Clock, 
  User, 
  Archive
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminInboxPage() {
  const db = useFirestore();
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [filter, setFilter] = useState("all");

  const inquiriesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: inquiries, isLoading } = useCollection(inquiriesQuery);

  const handleUpdateStatus = (id: string, status: string) => {
    if (!db) return;
    const docRef = doc(db, "inquiries", id);
    updateDoc(docRef, { status, updatedAt: serverTimestamp() }).catch(async (err) => {
      console.error("Update inquiry status error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'update'
      }));
    });
    toast({ title: "Status Updated" });
    if (selectedInquiry?.id === id) setSelectedInquiry({ ...selectedInquiry, status });
  };

  const handleDelete = (id: string) => {
    if (!db || !confirm("Are you sure?")) return;
    const docRef = doc(db, "inquiries", id);
    deleteDoc(docRef).catch(async (err) => {
      console.error("Delete inquiry error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
    toast({ title: "Message Deleted" });
    setSelectedInquiry(null);
  };

  const filteredInquiries = inquiries?.filter(i => filter === 'all' ? true : i.status === filter) || [];

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Inbox className="h-8 w-8 text-primary" />
            {t('admin_inbox')}
          </h1>
          <p className="text-muted-foreground">{t('inbox_desc')}</p>
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'read', 'archived'].map((f) => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="h-9 font-bold text-[10px] uppercase rounded-full px-4">{f}</Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-lg overflow-hidden rounded-[24px]">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-24 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-8">Sender</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInquiries.map((item) => (
                    <TableRow key={item.id} className={cn("hover:bg-muted/20 transition-colors", item.status === 'pending' && "font-bold bg-primary/5")}>
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"><User className="h-4 w-4 text-muted-foreground" /></div>
                          <div className="space-y-0.5"><p className="text-sm">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.email}</p></div>
                        </div>
                      </TableCell>
                      <TableCell><p className="text-sm truncate max-w-[200px]">{item.subject}</p></TableCell>
                      <TableCell><Badge variant={item.status === 'pending' ? 'default' : 'secondary'} className="text-[9px] uppercase">{item.status}</Badge></TableCell>
                      <TableCell className="text-right pr-8 space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedInquiry(item)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedInquiry} onOpenChange={(o) => !o && setSelectedInquiry(null)}>
        <DialogContent className="sm:max-w-2xl rounded-[32px]">
          <DialogHeader>
            <DialogTitle>{selectedInquiry?.subject}</DialogTitle>
            <DialogDescription>From: {selectedInquiry?.name} ({selectedInquiry?.email})</DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-muted/10 rounded-2xl border border-dashed whitespace-pre-wrap text-sm leading-relaxed">
            {selectedInquiry?.message}
          </div>
          <div className="flex justify-between gap-3 pt-4">
            <Button variant="outline" className="font-bold h-11" onClick={() => handleDelete(selectedInquiry?.id)}>Delete</Button>
            <Button asChild className="font-bold h-11 px-8"><a href={`mailto:${selectedInquiry?.email}`}>Reply via Email</a></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}