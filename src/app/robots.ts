import { MetadataRoute } from 'next';

/**
 * Controls search engine crawler behavior.
 * Directs bots to the sitemap and blocks private admin/dashboard/api paths.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin', 
        '/dashboard', 
        '/profile', 
        '/api',
        '/_next',
        '/simulator' // Internal tool, indexing not needed
      ],
    },
    sitemap: 'https://rojgarmatrix.com/sitemap.xml',
  };
}