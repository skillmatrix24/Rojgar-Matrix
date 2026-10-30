"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  MessageSquare, 
  ShieldCheck,
  Tags,
  Settings,
  Bot,
  Palette,
  Megaphone,
  WalletCards,
  LogOut,
  Inbox,
  Image as ImageIcon,
  Ticket,
  Presentation,
  Star
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function AdminSidebar({ isMobile }: { isMobile?: boolean }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Logged Out from Admin" });
    } catch (e) {
      console.error("Admin sidebar logout error:", e);
      toast({ variant: "destructive", title: "Logout failed" });
    }
  };

  const MENU_ITEMS = [
    { label: t('dashboard'), href: "/admin", icon: LayoutDashboard },
    { label: "Platform Overview", href: "/admin/platform-overview", icon: Presentation },
    { label: "Inbox", href: "/admin/inbox", icon: Inbox },
    { label: "Job Postings", href: "/admin/jobs", icon: Briefcase },
    { label: "Promotions", href: "/admin/promotions", icon: ImageIcon },
    { label: "Offers & Coupons", href: "/admin/offers", icon: Ticket },
    { label: "Testimonials", href: "/admin/testimonials", icon: Star },
    { label: t('revenue_mgmt'), href: "/admin/revenue", icon: WalletCards },
    { label: "Marketing & Broadcast", href: "/admin/campaigns", icon: Megaphone },
    { label: "User Accounts", href: "/admin/users", icon: Users },
    { label: "Categories", href: "/admin/categories", icon: Tags },
    { label: "Interactions", href: "/admin/interactions", icon: MessageSquare },
    { label: "Bot Config", href: "/admin/bot", icon: Bot },
    { label: "Branding", href: "/admin/branding", icon: Palette },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <aside className={cn(
      "border-r bg-card flex flex-col h-full sticky top-16 transition-all",
      isMobile ? "w-full border-none" : "w-64"
    )}>
      {!isMobile && (
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-sm">Admin Console</span>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-1">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              pathname === item.href 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-4">
        {!isMobile && (
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">System Status</p>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-bold">Operational</span>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="w-full justify-start gap-3 h-11 text-sm font-bold text-destructive hover:bg-destructive/5 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </Button>
      </div>
    </aside>
  );
}