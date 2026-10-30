
"use client"

import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc, getDoc, increment, addDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminPromotionsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const promosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "promotions"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: promotions, isLoading } = useCollection(promosQuery);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!db) return;
    
    try {
      const docRef = doc(db, "promotions", id);
      const promoSnap = await getDoc(docRef);
      if (!promoSnap.exists()) return;
      
      const promoData = promoSnap.data();
      const data: any = { 
        status, 
        updatedAt: serverTimestamp(),
        startDate: status === 'approved' ? serverTimestamp() : null
      };

      // REFUND LOGIC: If rejected, return deducted credits to the employer
      if (status === 'rejected' && promoData.deductedCredits > 0) {
        const userRef = doc(db, "users", promoData.employerId);
        
        // 1. Update User Credits
        await updateDoc(userRef, {
          credits: increment(promoData.deductedCredits),
          updatedAt: serverTimestamp()
        });

        // 2. Log Refund Transaction
        await addDoc(collection(db, "transactions"), {
          userId: promoData.employerId,
          amount: promoData.deductedCredits,
          type: 'topup',
          description: `Refund: Banner Promotion Rejected`,
          status: 'success',
          createdAt: serverTimestamp()
        });

        toast({ title: "Credits Refunded", description: `${promoData.deductedCredits} credits returned to employer.` });
      }

      await updateDoc(docRef, data);
      toast({ title: `Promotion ${status}` });
    } catch (error: any) {
      console.error("Update promotion status error:", error);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `promotions/${id}`,
        operation: 'update'
      }));
    }
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    if (!confirm("Are you sure you want to delete this promotion image?")) return;
    
    const docRef = doc(db, "promotions", id);
    deleteDoc(docRef).catch(async (err) => {
      console.error("Delete promotion error:", err);
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete'
      }));
    });
    toast({ title: "Promotion Deleted" });
  };

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Promotion Moderation
          </h1>
          <p className="text-muted-foreground">Review and approve employer banner advertisements.</p>
        </div>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="pl-6">Banner Preview</TableHead>
                    <TableHead>Employer Info</TableHead>
                    <TableHead>Target Link</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions?.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="pl-6 py-4">
                        <div className="relative h-20 w-40 rounded-lg overflow-hidden border bg-muted">
                           <Image src={promo.imageUrl} alt="Banner" fill className="object-cover" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-mono">{promo.employerId?.slice(0, 8)}...</p>
                        <p className="text-[10px] text-muted-foreground">{promo.createdAt?.toDate?.().toLocaleDateString() || 'Recently'}</p>
                      </TableCell>
                      <TableCell>
                        <a href={promo.targetUrl} target="_blank" rel="noopener noreferrer" className="text-primary flex items-center gap-1 text-xs font-bold hover:underline">
                          Visit Link <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={promo.status === 'approved' ? 'default' : promo.status === 'rejected' ? 'destructive' : 'outline'}>
                          {promo.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 space-x-2">
                        {promo.status === 'pending' && (
                          <>
                            <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 font-bold text-[10px]" onClick={() => handleUpdateStatus(promo.id, 'approved')}>Approve</Button>
                            <Button size="sm" variant="outline" className="h-8 font-bold text-[10px]" onClick={() => handleUpdateStatus(promo.id, 'rejected')}>Reject</Button>
                          </>
                        )}
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(promo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!promotions?.length && (
                    <TableRow><TableCell colSpan={5} className="py-20 text-center opacity-30 italic">No promotions found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
