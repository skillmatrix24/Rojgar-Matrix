
"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-black mb-8">{t('terms_conditions')}</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p>Effective Date: May 2026</p>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using Rojgar Matrix, you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use our services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Eligibility</h2>
            <p>You must be at least 18 years old to use this platform. By using Rojgar Matrix, you represent and warrant that you have the right, authority, and capacity to enter into this agreement.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. User Conduct</h2>
            <p>Users agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Post false, inaccurate, or misleading job listings.</li>
              <li>Use the platform for any illegal purpose or harassment.</li>
              <li>Spam employers or candidates via WhatsApp or Call features.</li>
              <li>Attempt to scrape data or bypass our security measures.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. Employer Responsibilities</h2>
            <p>Employers are solely responsible for the content of their job listings and for conducting their own due diligence before hiring. Rojgar Matrix does not guarantee the accuracy of candidate profiles or the quality of any applicant.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Disclaimer of Liability</h2>
            <p>Rojgar Matrix is a marketplace platform and does not act as an employer or recruitment agency. We are not liable for any employment decisions, disputes, or interactions that occur outside our platform, including on WhatsApp or in person.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Termination</h2>
            <p>We reserve the right to suspend or terminate any account that violates these terms or engages in behavior that harms our community, without prior notice.</p>
          </section>

          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">7. Governing Law</h2>
            <p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Noida, Uttar Pradesh.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
