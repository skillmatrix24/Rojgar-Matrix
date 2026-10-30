
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';

/**
 * @fileOverview Meta Cloud API batch campaign logic.
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
    const { 
      jobId, 
      filterCity, 
      filterCategories, 
      accessToken: providedToken, 
      phoneNumberId: providedId 
    } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Job selection is required.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch Global Settings & Template Language
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const tplQuery = query(collection(firestore, 'wa_templates'), where('name', '==', 'welcome_massage'), limit(1));
    
    const [settingsSnap, tplSnap] = await Promise.all([
      getDoc(settingsRef),
      getDocs(tplQuery)
    ]);

    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: 'WhatsApp API not configured.' }, { status: 404 });
    }
    
    const config = settingsSnap.data();
    const templateLang = !tplSnap.empty ? tplSnap.docs[0].data().language : 'hi';

    if (config.isActive === false) {
      return NextResponse.json({ error: 'WhatsApp Service is currently OFFLINE.' }, { status: 503 });
    }

    const accessToken = providedToken || config.accessToken;
    const phoneNumberId = providedId || config.phoneNumberId;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({ error: 'Missing API credentials.' }, { status: 400 });
    }

    // 2. Find Target Audience
    let usersQuery = query(
      collection(firestore, 'users'),
      where('role', '==', 'jobSeeker'),
      where('whatsappNotifications', '==', true)
    );

    const usersSnap = await getDocs(usersQuery);
    let targetUsers = usersSnap.docs.map(d => d.data());

    // CRITICAL: Filter for users with sufficient credits
    targetUsers = targetUsers.filter(u => (u.credits || 0) > 0);

    if (filterCity) {
      const cleanCity = filterCity.toLowerCase().trim();
      targetUsers = targetUsers.filter(u => u.city?.toLowerCase().includes(cleanCity));
    }
    if (filterCategories && Array.isArray(filterCategories) && filterCategories.length > 0) {
      targetUsers = targetUsers.filter(u => filterCategories.includes(u.category));
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ success: true, notifiedCount: 0, message: 'No eligible users with credits matched the criteria.' });
    }

    // 3. Send via Meta API
    const metaApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    let notifiedCount = 0;

    const notificationPromises = targetUsers.map(async (user) => {
      if (!user.phoneNumber) return;

      const cleanPhone = user.phoneNumber.replace(/\D/g, '');
      const baseNumber = cleanPhone.slice(-10);
      const formattedNumber = `91${baseNumber}`;

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
        console.error(`Failed to reach ${formattedNumber}:`, err);
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      notifiedCount,
      totalTargeted: targetUsers.length,
      message: `Campaign successful. Reached ${notifiedCount} eligible users using welcome_massage.`
    });

  } catch (error: any) {
    console.error('[CAMPAIGN API CRITICAL]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
