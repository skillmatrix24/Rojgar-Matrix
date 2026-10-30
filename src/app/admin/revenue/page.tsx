
"use client"

import { useState, useEffect } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, where, doc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, 
  WalletCards, 
  Users, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Loader2,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  BarChart3,
  Search,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  CartesianGrid 
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const ADMIN_EMAIL = "skillmatrix24@gmail.com";

export default function AdminRevenuePage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch current user profile to determine role
  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // Critical: Derive Admin status with email bypass to avoid race condition
  const isAdmin = (() => {
    if (!user) return false;
    if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;
    if (isProfileLoading) return false;
    return profile?.role === 'admin';
  })();

  // Fetch Transactions - Conditional filtering based on Admin status
  const txQuery = useMemoFirebase(() => {
    // Wait for auth and status verification
    if (!db || isAuthLoading || !user?.uid) return null;
    
    // If not super-admin via email, wait for profile role
    if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase() && isProfileLoading) {
      return null;
    }

    if (isAdmin) {
      // Unfiltered system-wide query for Admins
      return query(
        collection(db, "transactions"),
        orderBy("createdAt", "desc"),
        limit(200)
      );
    } else {
      // Strictly filtered query for non-admins (aligned with rules)
      return query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );
    }
  }, [db, isAuthLoading, user?.uid, isAdmin, isProfileLoading]);

  const { data: transactions, isLoading: isTxLoading } = useCollection(txQuery);

  const getStats = () => {
    if (!transactions) return { total: 0, today: 0, activeSubs: 0, avg: 0, chartData: [] };

    let total = 0;
    let today = 0;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const dailyMap: Record<string, { date: number, revenue: number }> = {};

    transactions.forEach(tx => {
      if (tx.status === 'success' && tx.type === 'topup') {
        const price = tx.amountInInr ?? 0;
        total += price;
        const txDate = tx.createdAt?.toDate?.() || new Date(tx.createdAt);
        if (txDate?.getTime() >= startOfToday) today += price;

        const dateKey = txDate?.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) || "N/A";
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = { date: txDate?.getTime() || Date.now(), revenue: 0 };
        }
        dailyMap[dateKey].revenue += price;
      }
    });

    const chartData = Object.entries(dailyMap)
      .map(([name, data]) => ({ name, revenue: data.revenue, date: data.date }))
      .sort((a, b) => a.date - b.date)
      .slice(-7);

    const successfulTopups = transactions.filter(t => t.type === 'topup' && t.status === 'success');
    return { 
      total, 
      today, 
      activeSubs: successfulTopups.filter(t => t.amount >= 1000).length, 
      avg: successfulTopups.length > 0 ? Math.round(total / successfulTopups.length) : 0,
      chartData
    };
  };

  const stats = getStats();
  const filteredTx = transactions?.filter(tx => {
    const search = searchTerm.toLowerCase();
    return (tx.userId?.toLowerCase().includes(search) || tx.providerOrderId?.toLowerCase().includes(search));
  }) || [];

  return (
    <div className="p-4 md:p-8 space-y-8 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <WalletCards className="h-8 w-8 text-primary" />
            {t('revenue_mgmt')}
          </h1>
          <p className="text-muted-foreground mt-1">Platform billing oversight.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('total_revenue'), value: `₹${stats.total}`, icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50" },
          { label: t('today_revenue'), value: `₹${stats.today}`, icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Premium Subs", value: stats.activeSubs, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Avg. Ticket", value: `₹${stats.avg}`, icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black">{isTxLoading ? <Loader2 className="h-6 w-6 animate-spin opacity-20" /> : stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <Card className="xl:col-span-12 border-none shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Recent System Transactions
            </CardTitle>
            <div className="relative w-full max-w-sm mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search user or Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="pl-8">User ID</TableHead>
                     <TableHead>Credits</TableHead>
                     <TableHead>Amount</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead className="text-right pr-8">Date</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredTx.map((tx) => (
                     <TableRow key={tx.id}>
                       <TableCell className="pl-8 font-mono text-xs">{tx.userId?.slice(0, 12)}...</TableCell>
                       <TableCell><Badge variant="secondary" className="font-bold">+{tx.amount}</Badge></TableCell>
                       <TableCell className="font-black">₹{tx.amountInInr || 0}</TableCell>
                       <TableCell><Badge variant={tx.status === 'success' ? 'default' : 'destructive'} className="uppercase text-[9px]">{tx.status}</Badge></TableCell>
                       <TableCell className="text-right pr-8 text-[10px] text-muted-foreground">{tx.createdAt?.toDate?.().toLocaleString() || '---'}</TableCell>
                     </TableRow>
                   ))}
                   {!filteredTx.length && !isTxLoading && (
                     <TableRow><TableCell colSpan={5} className="py-20 text-center opacity-30 italic">No transactions found.</TableCell></TableRow>
                   )}
                 </TableBody>
               </Table>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
