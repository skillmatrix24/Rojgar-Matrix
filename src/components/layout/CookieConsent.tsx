"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Cookie, X } from "lucide-react"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const consent = localStorage.getItem("rojgarmatrix_cookie_consent")
        if (!consent) {
          const timer = setTimeout(() => setIsVisible(true), 1500)
          return () => clearTimeout(timer)
        }
      }
    } catch (e) {
      // In Incognito/Restricted modes, just show it once
      setIsVisible(true)
    }
  }, [])

  const handleInteraction = (persist: boolean = true) => {
    if (persist) {
      try {
        localStorage.setItem("rojgarmatrix_cookie_consent", "true")
      } catch (e) {}
    }
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[100] animate-in slide-in-from-bottom-10 duration-700">
      <Card className="p-6 border-none shadow-2xl bg-slate-900 text-white rounded-[32px] overflow-hidden relative border-t-4 border-primary">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Cookie className="h-16 w-16" />
        </div>
        
        <button 
          onClick={() => handleInteraction(true)} 
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors z-20"
        >
          <X className="h-4 w-4 text-white/40" />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
            <Cookie className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-5">
            <div className="space-y-1">
              <h4 className="font-black text-lg tracking-tight">Cookie Notice</h4>
              <p className="text-xs text-blue-100/60 leading-relaxed font-medium">
                We use cookies to improve your job search on Rojgar Matrix and analyze platform traffic. By clicking accept, you agree to our privacy policy.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={() => handleInteraction(true)} 
                className="bg-primary hover:bg-primary/90 text-white font-black text-xs h-11 px-8 rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                Accept All
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => handleInteraction(false)} 
                className="text-white/60 hover:text-white hover:bg-white/5 font-bold text-xs h-11 px-4 rounded-xl"
              >
                Not Now
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}