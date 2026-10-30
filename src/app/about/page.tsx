
"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";
import { Briefcase, Target, ShieldCheck, Heart } from "lucide-react";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">{t('about_us')}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connecting India's workforce with modern technology and WhatsApp-first communication.
          </p>
        </div>

        <section className="prose prose-slate max-w-none space-y-8">
          <div className="bg-card p-8 rounded-3xl border shadow-sm">
            <h2 className="text-2xl font-bold flex items-center gap-3 mb-4">
              <Target className="text-primary h-6 w-6" /> Our Mission
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              At Rojgar Matrix, we believe getting a job should be as easy as sending a message. Our mission is to bridge the gap between job seekers and employers by leveraging AI and familiar tools like WhatsApp, making career growth accessible to everyone in India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> Verified Jobs
              </h3>
              <p className="text-sm text-muted-foreground">Every listing is checked for authenticity to ensure a safe marketplace for all users.</p>
            </div>
            <div className="p-6 bg-accent/5 rounded-2xl border border-accent/10">
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" /> Community First
              </h3>
              <p className="text-sm text-muted-foreground">We focus on the needs of the Indian blue-collar and white-collar workforce alike.</p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Why Rojgar Matrix?</h2>
            <p className="text-muted-foreground">
              Traditional job portals are complex and slow. Rojgar Matrix is designed for speed. By integrating directly with WhatsApp, we ensure that employers and candidates can start a conversation instantly. No more waiting for emails that never come.
            </p>
            <p className="text-muted-foreground">
              Powered by Skill Matrix, we are committed to building a transparent and secure recruitment ecosystem for the next billion internet users.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
