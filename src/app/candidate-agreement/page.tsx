
"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";
import { UserCheck, ShieldAlert, Sparkles, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CandidateAgreementPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">{t('candidate_agreement')}</h1>
          <p className="text-muted-foreground font-medium">Terms of Use for Job Seekers on Rojgar Matrix.</p>
        </div>
        
        <div className="space-y-12">
          <Card className="border-none shadow-sm bg-accent/5 border border-accent/10">
            <CardContent className="p-8 flex gap-6 items-start">
              <UserCheck className="h-10 w-10 text-accent shrink-0" />
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-accent">Career Growth Promise</h2>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  We are committed to helping you find the best opportunities. In return, we ask for honesty in your profile and professionalism in your communication with employers.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-slate max-w-none space-y-10 text-muted-foreground leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <ShieldAlert className="h-6 w-6 text-accent" /> 1. Profile Authenticity
              </h2>
              <p>Candidates must provide truthful information regarding their education, experience, and skills. Creating multiple accounts or using fake identities to apply for jobs is a violation of this agreement and will lead to a permanent ban.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-accent" /> 2. WhatsApp Interactions
              </h2>
              <p>When contacting an employer via WhatsApp through our platform, you must maintain professional decorum. Abuse, harassment, or repeatedly spamming an employer after they have indicated they are not interested is strictly prohibited.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-accent" /> 3. Use of AI Tools
              </h2>
              <p>Our AI-powered tools (Resume Builder, Interview Coach, AI Match) are designed to assist you. While we strive for 100% accuracy, AI-generated content should be reviewed by you before final submission. Rojgar Matrix is not responsible for errors in AI-generated resumes or feedback.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900">4. Direct Hiring Disclaimer</h2>
              <p>Rojgar Matrix is a marketplace. We do not guarantee job placement. The hiring process, interviews, and final employment contracts are strictly between you and the employer. We are not responsible for any disputes arising from your employment.</p>
            </section>

            <section className="space-y-4 border-t pt-8">
              <h2 className="text-2xl font-bold text-slate-900">5. Data Privacy</h2>
              <p>By using the "Apply on WhatsApp" feature, you acknowledge that your phone number and basic profile details will be visible to the employer to facilitate the recruitment process.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
