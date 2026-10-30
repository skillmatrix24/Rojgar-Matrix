
"use client"

import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useEffect } from "react";

/**
 * Injects dynamic branding assets (like favicon) into the HTML head via DOM manipulation.
 * This is more reliable in Next.js App Router for dynamic client-side updates.
 */
export function DynamicBranding() {
  const db = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!db) return null;
    return doc(db, "settings", "branding");
  }, [db]);

  const { data: branding } = useDoc(brandingRef);

  useEffect(() => {
    if (!branding?.faviconUrl) return;

    // Generate a cache-busted URL
    const version = Date.now().toString();
    const cacheBustedFavicon = branding.faviconUrl.includes('data:') 
      ? branding.faviconUrl 
      : `${branding.faviconUrl}${branding.faviconUrl.includes('?') ? '&' : '?'}v=${version}`;

    // Function to update or create a link tag
    const updateLinkTag = (rel: string, href: string) => {
      let link: HTMLLinkElement | null = document.querySelector(`link[rel*='${rel}']`);
      
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      
      link.href = href;
    };

    // Update standard icons
    updateLinkTag('icon', cacheBustedFavicon);
    updateLinkTag('shortcut icon', cacheBustedFavicon);
    updateLinkTag('apple-touch-icon', cacheBustedFavicon);

    // Optional: Update title if branding name exists (future-proofing)
    // if (branding.siteName) document.title = branding.siteName;

  }, [branding]);

  // This component doesn't render anything in the body stream
  return null;
}
