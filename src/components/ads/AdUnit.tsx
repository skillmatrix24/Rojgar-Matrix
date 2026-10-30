
"use client"

import { useEffect, useState, useRef } from "react";
import { useUser, useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle";
  className?: string;
  style?: React.CSSProperties;
}

export function AdUnit({ slot, format = "auto", className, style }: AdUnitProps) {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [hasMounted, setHasMounted] = useState(false);
  const adInitialized = useRef(false);

  const adSettingsRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "ads");
  }, [db]);
  const { data: adSettings, isLoading: isSettingsLoading } = useDoc(adSettingsRef);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [db, user?.uid]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || isUserLoading || isProfileLoading || isSettingsLoading) return;
    if (!adSettings?.isActive) return;

    const hasActiveBalance = (profile?.credits || 0) > 0;
    const isPremium = profile?.isPremium === true;
    if (hasActiveBalance || isPremium) return;

    try {
      if (typeof window !== "undefined" && !adInitialized.current) {
        const ads = (window as any).adsbygoogle;
        if (ads && Array.isArray(ads)) {
          ads.push({});
          adInitialized.current = true;
        }
      }
    } catch (e) {
      console.warn("AdSense push delayed:", e);
    }
  }, [hasMounted, isUserLoading, isProfileLoading, isSettingsLoading, profile, adSettings]);

  const showAds = hasMounted && adSettings?.isActive && (!profile || (profile.credits <= 0 && !profile.isPremium));
  if (!showAds) return null;

  return (
    <div className={cn("overflow-hidden flex justify-center py-4 min-h-[90px]", className)} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center", width: '100%', ...style }}
        data-ad-client={adSettings.publisherId || "ca-pub-3756451089935740"}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
