
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';

/**
 * @fileOverview Broadcasts a job notification with Global Status Check.
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
    const { jobId, accessToken: providedToken, phoneNumberId: providedId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing Job ID.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. GLOBAL MASTER CONTROL CHECK & TEMPLATE LANGUAGE
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const tplQuery = query(collection(firestore, 'wa_templates'), where('name', '==', 'welcome_massage'), limit(1));
    
    const [settingsSnap, tplSnap] = await Promise.all([
      getDoc(settingsRef),
      getDocs(tplQuery)
    ]);

    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: 'WhatsApp credentials not configured.' }, { status: 404 });
    }
    
    const config = settingsSnap.data();
    const templateLang = !tplSnap.empty ? tplSnap.docs[0].data().language : 'hi';

    if (config.isActive === false) {
      return NextResponse.json({ 
        error: 'WhatsApp Broadcast Disabled', 
        details: 'Enable the service in Admin Settings first.' 
      }, { status: 503 });
    }

    const accessToken = providedToken || config.accessToken;
    const phoneNumberId = providedId || config.phoneNumberId;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({ error: 'API credentials missing.' }, { status: 400 });
    }

    // 2. Fetch Job Details
    const jobRef = doc(firestore, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    const job = jobSnap.data();

    // 3. Find Matching Users
    const usersQuery = query(
      collection(firestore, 'users'),
      where('whatsappNotifications', '==', true),
      where('role', '==', 'jobSeeker')
    );

    const usersSnap = await getDocs(usersQuery);
    
    const matchingUsers = usersSnap.docs
      .map(d => d.data())
      .filter(u => {
        const hasCredits = (u.credits || 0) > 0;
        const matchesJob = (
          u.city?.toLowerCase() === job.location?.toLowerCase() || 
          u.preferredJobTitle?.toLowerCase().includes(job.title?.toLowerCase()) ||
          u.skills?.some((s: string) => job.description?.toLowerCase().includes(s.toLowerCase()))
        );
        return hasCredits && matchesJob;
      });

    if (matchingUsers.length === 0) {
      return NextResponse.json({ success: true, notifiedCount: 0, message: 'No matching users with credits found.' });
    }

    // 4. Trigger Meta API
    const metaApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    let notifiedCount = 0;

    const notificationPromises = matchingUsers.map(async (user) => {
      if (!user.phoneNumber) return;

      const cleanPhone = user.phoneNumber.replace(/\D/g, '');
      const formattedNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      try {
        const response = await fetch(metaApiUrl, {
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
              name: 'welcome_massage', 
              language: { code: templateLang }
            },
          }),
        });
        
        if (response.ok) notifiedCount++;
      } catch (err) {
        console.error(`Failed to notify ${formattedNumber}:`, err);
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      notifiedCount,
      message: `Broadcasting complete. ${notifiedCount} eligible users notified using welcome_massage.`
    });

  } catch (error: any) {
    console.error('[BROADCAST API CRITICAL]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
