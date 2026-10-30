
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { aiJobRecommendation } from '@/ai/flows/ai-job-recommendation';

/**
 * @fileOverview AI-powered Star Candidate alert.
 * Secured: Added x-api-key validation.
 */

export async function POST(request: Request) {
  try {
    // SECURITY GUARD
    const authHeader = request.headers.get('x-api-key');
    if (authHeader !== 'chatmatrix_master_789') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { seekerId } = body;

    if (!seekerId) {
      return NextResponse.json({ error: 'Missing Seeker ID.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch Seeker Profile
    const seekerRef = doc(firestore, 'users', seekerId);
    const seekerSnap = await getDoc(seekerRef);
    if (!seekerSnap.exists()) {
      return NextResponse.json({ error: 'Seeker not found.' }, { status: 404 });
    }
    const seeker = seekerSnap.data();

    if (!seeker.skills || !seeker.resumeSummary) {
      return NextResponse.json({ success: true, message: 'Incomplete profile for AI matching.' });
    }

    // 2. Fetch Global WhatsApp Settings
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists() || settingsSnap.data().isActive === false) {
      return NextResponse.json({ error: 'WhatsApp service offline.' }, { status: 503 });
    }
    const { accessToken, phoneNumberId } = settingsSnap.data();

    // 3. Find Candidate Active Jobs (City + Category Match)
    const jobsQuery = query(
      collection(firestore, 'jobs'),
      where('isActive', '==', true),
      where('location', '==', seeker.city || 'India'),
      where('category', '==', seeker.category || ''),
      limit(5)
    );

    const jobsSnap = await getDocs(jobsQuery);
    if (jobsSnap.empty) {
      return NextResponse.json({ success: true, message: 'No active jobs matching seeker criteria.' });
    }

    const liveJobs = jobsSnap.docs.map(d => ({
      id: d.id,
      title: d.data().title,
      company: d.data().companyName,
      location: d.data().location,
      description: d.data().description,
      employerId: d.data().employerUserProfileId
    }));

    // 4. Use AI to Evaluate Matches
    const aiInput = {
      jobSeekerProfile: {
        skills: seeker.skills || [],
        experience: seeker.experience || "",
        previousApplications: [],
        preferredJobTitles: [seeker.preferredJobTitle || ""],
        preferredLocations: [seeker.city || "India"],
        resumeSummary: seeker.resumeSummary || "",
      },
      availableJobs: liveJobs.map(j => ({
        id: j.id,
        title: j.title,
        company: j.company,
        location: j.location,
        description: j.description
      }))
    };

    const { recommendedJobs } = await aiJobRecommendation(aiInput);

    // 5. Notify Employers for High Relevance Matches (> 85%)
    const highMatchThreshold = 85;
    const starMatches = recommendedJobs.filter(rj => rj.relevanceScore >= highMatchThreshold);

    if (starMatches.length === 0) {
      return NextResponse.json({ success: true, message: 'No high-relevance star matches found.' });
    }

    const metaApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    let notifiedCount = 0;

    for (const match of starMatches) {
      const jobMatch = liveJobs.find(lj => lj.id === match.id);
      if (!jobMatch || !jobMatch.employerId) continue;

      // Get Employer Phone
      const empRef = doc(firestore, 'users', jobMatch.employerId);
      const empSnap = await getDoc(empRef);
      const employer = empSnap.data();

      if (!employer?.phoneNumber) continue;

      const cleanPhone = employer.phoneNumber.replace(/\D/g, '');
      const formattedNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      try {
        await fetch(metaApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedNumber,
            type: 'template',
            template: {
              name: 'star_candidate_alert', 
              language: { code: 'hi' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: seeker.firstName + ' ' + (seeker.lastName || '') },
                    { type: 'text', text: match.relevanceScore.toString() },
                    { type: 'text', text: jobMatch.title }
                  ]
                }
              ]
            },
          }),
        });
        notifiedCount++;
      } catch (err) {
        console.error(`Star Candidate Alert failed for employer ${formattedNumber}`);
      }
    }

    return NextResponse.json({
      success: true,
      notifiedCount,
      message: `AI Star Candidate alert sent to ${notifiedCount} employers.`
    });

  } catch (error: any) {
    console.error('[STAR CANDIDATE ALERT ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
