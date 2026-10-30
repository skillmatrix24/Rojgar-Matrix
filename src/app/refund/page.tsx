
"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function RefundPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-4xl font-black mb-8">{t('refund_policy')}</h1>
        
        <div className="space-y-8">
          <Card className="border-none shadow-sm bg-orange-50 border border-orange-100">
            <CardContent className="p-6 flex gap-4 items-start">
              <AlertCircle className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-orange-900">Digital Services Policy</h2>
                <p className="text-sm text-orange-800 leading-relaxed">
                  Rojgar Matrix provides digital job listing and recruitment tools. Unless explicitly stated otherwise for specific premium features, all transactions are considered final.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="prose prose-slate max-w-none space-y-6 text-muted-foreground leading-relaxed">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">1. Non-Refundable Services</h2>
              <p>Fees paid for job postings, featured listings, or AI-powered optimization tools are generally non-refundable once the service has been rendered or the listing has gone live.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">2. Exceptions</h2>
              <p>Refunds may be considered in the following rare circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Technical errors resulting in double payment.</li>
                <li>Failure to deliver the service due to a system-wide outage lasting more than 48 hours.</li>
                <li>Unauthorized transactions (subject to verification).</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">3. Request Process</h2>
              <p>To request a refund, please email support@skillmatrix.in with your transaction ID and reason for the request. All requests must be made within 7 days of the transaction.</p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">4. Processing Time</h2>
              <p>Approved refunds will be processed via the original payment method within 5-10 business days.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
