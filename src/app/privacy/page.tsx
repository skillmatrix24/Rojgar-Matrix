
"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-black mb-8">{t('privacy_policy')}</h1>
        
        <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground leading-relaxed">
          <p>Last Updated: May 2026</p>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">1. Introduction</h2>
            <p>Welcome to Rojgar Matrix ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our WhatsApp messaging services.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">2. Data We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Contact Information:</strong> Phone number, email address, and name.</li>
              <li><strong>Profile Data:</strong> Job titles, skills, experience, and educational background.</li>
              <li><strong>Interaction Data:</strong> Logs of your messages with our WhatsApp bot and interactions on our platform.</li>
              <li><strong>Technical Data:</strong> IP address, browser type, and device information.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">3. How We Use Your Data</h2>
            <p>We use your data to provide job matching services, send automated alerts via WhatsApp, and improve our AI-powered recommendation engine. Specifically:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create and maintain your professional profile.</li>
              <li>To facilitate direct communication between employers and job seekers.</li>
              <li>To send job notifications and platform updates via WhatsApp.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">4. WhatsApp Communication</h2>
            <p>By providing your phone number and opting into WhatsApp notifications, you consent to receive automated messages from Rojgar Matrix. You can opt-out at any time through your profile settings or by following the instructions in the WhatsApp chat.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">5. Data Sharing</h2>
            <p>We do not sell your personal data. We share your profile information with registered employers only when you apply for a job or when our AI identifies a high-relevance match for a role you have shown interest in.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">6. Security</h2>
            <p>We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure. However, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section className="space-y-4 border-t pt-8">
            <h2 className="text-2xl font-bold text-foreground">7. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at privacy@skillmatrix.in.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
