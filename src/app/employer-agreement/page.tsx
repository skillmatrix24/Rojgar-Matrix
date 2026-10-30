
"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";
import { ShieldCheck, Gavel, FileCheck, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function EmployerAgreementPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('employer_agreement')}</h1>
          <p className="text-muted-foreground font-medium">Terms of Service for Hiring Organizations on Rojgar Matrix.</p>
        </div>
        
        <div className="space-y-12">
          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
            <CardContent className="p-8 flex gap-6 items-start">
              <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-primary">Fair Hiring Pledge</h2>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  By using this platform, you agree to provide accurate job information and maintain a respectful professional environment for all candidates.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-slate max-w-none space-y-10 text-muted-foreground leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Info className="h-6 w-6 text-primary" /> 1. Accuracy of Listings
              </h2>
              <p>Employers must ensure that every job posted on Rojgar Matrix is legitimate and represents a genuine vacancy. Postings containing false salary ranges, fake company names, or misleading job descriptions will be removed, and the employer account may be suspended.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <FileCheck className="h-6 w-6 text-primary" /> 2. WhatsApp Communication
              </h2>
              <p>When a candidate applies via WhatsApp, the employer agrees to communicate professionally. Sending unsolicited marketing messages, spam, or inappropriate content to candidates discovered through our platform is strictly prohibited and is a violation of this agreement.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Gavel className="h-6 w-6 text-primary" /> 3. No Recruitment Fees
              </h2>
              <p>Employers are strictly forbidden from charging candidates any form of "processing fee," "interview fee," or "security deposit" for a job application or joining. Rojgar Matrix maintains a zero-tolerance policy towards paid job scams.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">4. Credit Policy</h2>
              <p>Advanced features such as "Featured Listings" or "Direct Broadcasts" may require AI credits. These credits are non-transferable and subject to our refund policy. Employers are responsible for the security of their account credentials.</p>
            </section>

            <section className="space-y-4 border-t pt-8">
              <h2 className="text-2xl font-bold text-slate-900">5. Limitation of Liability</h2>
              <p>Rojgar Matrix is a facilitator. We do not perform background checks on candidates beyond basic profile verification. The final hiring decision and due diligence remain the sole responsibility of the employer.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
