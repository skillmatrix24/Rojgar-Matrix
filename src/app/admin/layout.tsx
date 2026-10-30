"use client"

import { Navbar } from "@/components/layout/Navbar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { Loader2, ShieldAlert, Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Primary Authorization Check (Email-based)
  const adminEmail = "skillmatrix24@gmail.com".toLowerCase();
  const currentUserEmail = user?.email?.toLowerCase()?.trim();
  const isAdminByEmail = currentUserEmail === adminEmail;

  useEffect(() => {
    if (user && isAdminByEmail) {
      user.getIdToken(true).catch((err) => {
        console.error("Failed to refresh admin ID token:", err);
      });
    }
  }, [user, isAdminByEmail]);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user || isAdminByEmail) return null; 
    return doc(db, "users", user.uid);
  }, [db, user, isAdminByEmail]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isAuthorizedAdmin = isAdminByEmail || profile?.role === 'admin';
  const showUnauthorized = !isUserLoading && !isAdminByEmail && !isProfileLoading && !isAuthorizedAdmin;

  if (!user || showUnauthorized) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/20">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <ShieldAlert className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-black mb-2">Unauthorized Access</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            This area is restricted to Rojgar Matrix Administrators only.
          </p>
          <Link href="/">
            <Button size="lg" className="px-10 font-bold">Go Back Home</Button>
          </Link>
        </main>
      </div>
    );
  }

  if (isProfileLoading && !isAdminByEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="lg:hidden border-b bg-card px-4 py-3 flex items-center justify-between sticky top-16 z-40">
        <div className="font-bold text-sm tracking-tight flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500"></div>
          Admin Console
        </div>
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SheetHeader className="p-6 border-b text-left">
              <SheetTitle>Admin Navigation</SheetTitle>
            </SheetHeader>
            <div onClick={() => setIsMobileNavOpen(false)}>
              <AdminSidebar isMobile />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-1">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        <main className="flex-1 bg-muted/20 overflow-y-auto w-full flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}