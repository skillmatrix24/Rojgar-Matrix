"use client"

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function ContactPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    setLoading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await addDoc(collection(db, "inquiries"), {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        subject: formData.get('subject') as string,
        message: formData.get('message') as string,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      toast({ 
        title: "Message Sent", 
        description: "We have received your message and will get back to you shortly." 
      });
      form.reset();
    } catch (error) {
      console.error("Contact inquiry submission error:", error);
      toast({ 
        variant: "destructive", 
        title: "Submission Failed", 
        description: "Please try again or contact us directly via phone." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-6xl px-4 py-16">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">{t('contact_us')}</h1>
          <p className="text-xl text-muted-foreground">Have questions? We're here to help.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-lg">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Email</h3>
                    <p className="font-bold">support@skillmatrix.in</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Phone</h3>
                    <p className="font-bold">+91 98765 43210</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Address</h3>
                    <p className="font-bold text-sm leading-relaxed">Rojgar Matrix (Skill Matrix), <br/>Sector 62, Noida, <br/>Uttar Pradesh, 201301</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-card border-b p-8">
                <CardTitle className="text-2xl">Send us a Message</CardTitle>
                <CardDescription>Fill out the form and our team will contact you within 24 hours.</CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" name="name" placeholder="John Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" name="subject" placeholder="How can we help?" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" name="message" placeholder="Type your message here..." className="min-h-[150px]" required />
                  </div>
                  <Button type="submit" className="w-full h-14 text-lg font-black gap-2 shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-5 w-5" /> Send Message</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}