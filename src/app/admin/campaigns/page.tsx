
"use client"

import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, orderBy } from "firebase/firestore";
import { 
  Megaphone, 
  AlertCircle,
  Target,
  Smartphone,
  LayoutTemplate,
  GitBranch,
  Users
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Modular Tab Components
import { SmartCampaignsTab } from "@/components/admin/campaigns/SmartCampaignsTab";
import { BulkSenderTab } from "@/components/admin/campaigns/BulkSenderTab";
import { TemplateDesignerTab } from "@/components/admin/campaigns/TemplateDesignerTab";
import { BotFlowDesignerTab } from "@/components/admin/campaigns/BotFlowDesignerTab";
import { ContactManagementTab } from "@/components/admin/campaigns/ContactManagementTab";

export type ContactStatus = 'pending' | 'success' | 'error';

export interface CampaignContact {
  id: string;
  name: string;
  number: string;
  role: string;
  city: string;
  group: string;
  source: 'database' | 'csv' | 'manual';
  status?: ContactStatus; // Status is transient for sending
  errorMessage?: string;
}

export default function AdminCampaignsPage() {
  const db = useFirestore();

  // Shared Data Fetching - Contacts now pulled from persistent Firestore
  const contactsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "marketing_contacts"), orderBy("createdAt", "desc"));
  }, [db]);
  const { data: dbContacts } = useCollection<CampaignContact>(contactsQuery);

  const settingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "whatsapp");
  }, [db]);
  const { data: whatsappSettings } = useDoc(settingsRef);

  const catsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "categories"), where("isActive", "==", true), orderBy("order", "asc"));
  }, [db]);
  const { data: categories } = useCollection(catsQuery);

  const jobsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "jobs"), where("isActive", "==", true), orderBy("postedDate", "desc"));
  }, [db]);
  const { data: jobs } = useCollection(jobsQuery);

  const templatesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "wa_templates"), orderBy("createdAt", "desc"));
  }, [db]);
  const { data: dbTemplates, isLoading: isTemplatesLoading } = useCollection(templatesQuery);

  const flowsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "wa_flows"), orderBy("createdAt", "desc"));
  }, [db]);
  const { data: dbFlows } = useCollection(flowsQuery);

  return (
    <div className="p-4 md:p-8 max-w-7xl space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Marketing & Broadcast
          </h1>
          <p className="text-muted-foreground mt-1">Engage users via Meta Cloud API Smart Messaging.</p>
        </div>
        {!whatsappSettings?.isActive && (
          <Badge variant="destructive" className="h-9 px-4 uppercase font-black gap-2">
            <AlertCircle className="h-4 w-4" /> System Offline
          </Badge>
        )}
      </div>

      <Tabs defaultValue="smart" className="space-y-8">
        <TabsList className="bg-card border h-12 p-1 rounded-2xl shadow-sm overflow-x-auto flex whitespace-nowrap">
          <TabsTrigger value="smart" className="font-bold px-8 gap-2 rounded-xl">
            <Target className="h-4 w-4" /> Smart Campaigns
          </TabsTrigger>
          <TabsTrigger value="contacts" className="font-bold px-8 gap-2 rounded-xl text-blue-600">
            <Users className="h-4 w-4" /> Contact Management
          </TabsTrigger>
          <TabsTrigger value="bulk" className="font-bold px-8 gap-2 rounded-xl text-accent">
            <Smartphone className="h-4 w-4" /> Whatsapp Bulk Sender
          </TabsTrigger>
          <TabsTrigger value="templates" className="font-bold px-8 gap-2 rounded-xl text-primary">
            <LayoutTemplate className="h-4 w-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="flows" className="font-bold px-8 gap-2 rounded-xl text-orange-600">
            <GitBranch className="h-4 w-4" /> Bot Flows
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smart">
          <SmartCampaignsTab 
            whatsappSettings={whatsappSettings} 
            categories={categories} 
            jobs={jobs} 
          />
        </TabsContent>

        <TabsContent value="contacts">
          <ContactManagementTab 
            contacts={dbContacts || []}
          />
        </TabsContent>

        <TabsContent value="bulk">
          <BulkSenderTab 
            whatsappSettings={whatsappSettings} 
            dbTemplates={dbTemplates} 
            contacts={dbContacts || []}
          />
        </TabsContent>

        <TabsContent value="templates">
          <TemplateDesignerTab 
            dbTemplates={dbTemplates} 
            isTemplatesLoading={isTemplatesLoading} 
          />
        </TabsContent>

        <TabsContent value="flows">
          <BotFlowDesignerTab 
            dbFlows={dbFlows} 
            dbTemplates={dbTemplates} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
