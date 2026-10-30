import { MetadataRoute } from 'next';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';

/**
 * Programmatic Sitemap generation for Search Engines.
 * Ensures Google crawls all static routes and dynamic job posts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://rojgarmatrix.com';
  const { firestore } = initializeFirebase();

  // 1. Core Static Pages
  const staticPages = [
    '',
    '/jobs',
    '/ai-match',
    '/pricing',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
    '/employer-agreement',
    '/candidate-agreement',
    '/refund',
    '/job-adviser',
    '/interview-coach',
    '/simulator'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  let dynamicPages: MetadataRoute.Sitemap = [];

  try {
    // 2. Dynamic Job Pages (Top 200 recent active jobs for deep indexing)
    const jobsSnap = await getDocs(
      query(
        collection(firestore, 'jobs'), 
        where('isActive', '==', true), 
        orderBy('postedDate', 'desc'),
        limit(200)
      )
    );
    
    const uniqueCities = new Set<string>();
    const uniqueCats = new Set<string>();

    const jobPages = jobsSnap.docs.map((doc) => {
      const data = doc.data();
      if (data.location) uniqueCities.add(data.location.toLowerCase());
      if (data.category) uniqueCats.add(data.category.toLowerCase().replace(/\s+/g, '-'));

      return {
        url: `${baseUrl}/jobs/${doc.id}`,
        lastModified: data.postedDate?.toDate?.() || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });

    // 3. Localized SEO City Pages
    const cityPages = Array.from(uniqueCities).map((city) => ({
      url: `${baseUrl}/jobs/location/${encodeURIComponent(city)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    // 4. Category-specific SEO Pages
    const catPages = Array.from(uniqueCats).map((cat) => ({
      url: `${baseUrl}/jobs/category/${encodeURIComponent(cat)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    dynamicPages = [...jobPages, ...cityPages, ...catPages];

  } catch (e) {
    console.error("[SITEMAP_GEN_ERROR]:", e);
  }

  return [...staticPages, ...dynamicPages];
}