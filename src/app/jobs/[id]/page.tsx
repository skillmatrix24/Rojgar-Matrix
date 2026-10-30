import { Metadata } from 'next';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { JobDetailView } from "@/components/jobs/JobDetailView";
import { AppHeader } from "@/components/mobile-app/AppHeader";
import { initializeFirebase } from "@/firebase/init";
import { doc, getDoc } from "firebase/firestore";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Server-side metadata generation for Job Posts.
 * Ensures Google sees unique titles and descriptions for every job.
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { firestore } = initializeFirebase();
  const jobSnap = await getDoc(doc(firestore, "jobs", id));
  
  if (!jobSnap.exists()) return { title: 'Job Not Found | Rojgar Matrix' };

  const job = jobSnap.data();
  const title = `${job.title} Job in ${job.location} | Rojgar Matrix`;
  const description = `Apply for ${job.title} at ${job.companyName} in ${job.location}. Salary: ${job.salaryType === 'monthly' ? '₹' + job.salaryRangeMin + 'k/mo' : '₹' + job.salaryRangeMin + ' LPA'}. Get hired via WhatsApp!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://rojgarmatrix.com/jobs/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

export default async function JobPage({ params }: PageProps) {
  const { id } = await params;
  const { firestore } = initializeFirebase();
  
  // Fetch job data on server to generate structured data
  const jobSnap = await getDoc(doc(firestore, "jobs", id));
  
  if (!jobSnap.exists()) {
    notFound();
  }

  const job = jobSnap.data();

  // JSON-LD for Google Job Search
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.title,
    "description": job.description,
    "datePosted": job.postedDate?.toDate?.()?.toISOString() || new Date().toISOString(),
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.companyName,
      "logo": "https://rojgarmatrix.com/logo-main.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.location,
        "addressCountry": "IN"
      }
    },
    "baseSalary": {
      "@type": "MonetaryAmount",
      "currency": "INR",
      "value": {
        "@type": "QuantitativeValue",
        "value": job.salaryRangeMin,
        "unitText": job.salaryType === 'monthly' ? "MONTH" : "YEAR"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Inject Structured Data for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="hidden md:block">
        <Navbar />
      </div>
      <div className="md:hidden">
        <AppHeader />
      </div>
      <main className="flex-1">
        <JobDetailView jobId={id} />
      </main>
      <Footer />
    </div>
  );
}