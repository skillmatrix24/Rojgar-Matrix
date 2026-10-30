"use client"

import { useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, limit, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
  CheckCircle, 
  XCircle, 
  Trash2, 
  Zap, 
  Eye,
  Loader2,
  BellRing,
  AlertCircle
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
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { secureDispatch } from "@/actions/secure-dispatch";

export default function AdminJobsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [broadcastingId, setBroadcastingId] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "whatsapp");
  }, [db]);
  const { data: whatsappSettings } = useDoc(settingsRef);

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "jobs"), orderBy("postedDate", "desc"), limit(100));
  }, [db]);
  const { data: jobs, isLoading } = useCollection(jobsQuery);

  const handleBroadcast = async (job: any) => {
    if (whatsappSettings?.isActive === false) {
      toast({ variant: "destructive", title: "Broadcast Disabled" });
      return;
    }
    setBroadcastingId(job.id);
    try {
      const result = await secureDispatch('/api/broadcast-job', { jobId: job.id });
      if (result.ok) {
        toast({ title: "Broadcast Complete", description: `${result.data?.notifiedCount || 0} users notified.` });
      } else {
        toast({ variant: "destructive", title: "Broadcast Failed" });
      }
    } catch (err) {
      console.error("Broadcast job network error:", err);
      toast({ variant: "destructive", title: "Network Error" });
    } finally {
      setBroadcastingId(null);
    }
  };

  const toggleActive = (jobId: string, current: boolean) => {
    if (!db) return;
    const docRef = doc(db, "jobs", jobId);
    updateDoc(docRef, { isActive: !current })
      .catch(async (err) => {
        console.error("Toggle job active status error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: { isActive: !current }
        }));
      });
    toast({ title: "Status Updated" });
  };

  const deleteJob = (jobId: string) => {
    if (!db || !confirm(t('confirm_delete_job'))) return;
    const docRef = doc(db, "jobs", jobId);
    deleteDoc(docRef)
      .catch(async (err) => {
        console.error("Delete job error:", err);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete'
        }));
      });
    toast({ title: t('job_removed') });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">{t('job_moderation')}</h1>
          <p className="text-sm text-muted-foreground">{t('job_moderation_desc')}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 whitespace-nowrap">
                  <TableHead className="pl-6 min-w-[250px]">Job & Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="pl-6 py-4">
                      <div className="space-y-0.5">
                        <p className="font-bold text-sm">{job.title}</p>
                        <p className="text-[11px] text-muted-foreground">{job.companyName}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{job.location}</TableCell>
                    <TableCell>
                      <Badge variant={job.isActive ? "default" : "secondary"}>
                        {job.isActive ? "Active" : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" size="sm" className="h-8 gap-2 font-bold text-[10px]"
                        onClick={() => handleBroadcast(job)}
                        disabled={broadcastingId === job.id || !job.isActive}
                      >
                        {broadcastingId === job.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <BellRing className="h-3 w-3" />}
                        Broadcast
                      </Button>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/jobs/${job.id}`} className="gap-2"><Eye className="h-4 w-4" /> View</Link></DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); toggleActive(job.id, !!job.isActive); }} className="gap-2">
                            {job.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            {job.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); deleteJob(job.id); }} className="text-destructive gap-2">
                            <Trash2 className="h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
