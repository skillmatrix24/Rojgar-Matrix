import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Notifies an Employer via WhatsApp when a seeker clicks Apply.
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
    const { employerId, jobTitle, seekerName } = body;

    if (!employerId || !jobTitle) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch Employer Profile to check credits & phone
    const employerRef = doc(firestore, 'users', employerId);
    const employerSnap = await getDoc(employerRef);
    
    if (!employerSnap.exists()) {
      return NextResponse.json({ error: 'Employer contact not found.' }, { status: 404 });
    }

    const employer = employerSnap.data();

    // 🔥 CRITICAL: Employer must have credits for WhatsApp Leads
    if ((employer.credits || 0) <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Employer has insufficient credits for WhatsApp notification.' 
      }, { status: 200 }); 
    }

    if (!employer.phoneNumber) {
      return NextResponse.json({ error: 'Employer phone missing.' }, { status: 404 });
    }

    // 2. Fetch Global WhatsApp Settings
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists() || settingsSnap.data().isActive === false) {
      return NextResponse.json({ error: 'WhatsApp service is offline.' }, { status: 503 });
    }
    
    const { accessToken, phoneNumberId } = settingsSnap.data();

    // 3. Send WhatsApp Message via Meta API
    const metaApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    const cleanPhone = employer.phoneNumber.replace(/\D/g, '');
    const formattedNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

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
          name: 'employer_lead_alert', 
          language: { code: 'hi' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: seekerName || 'A candidate' },
                { type: 'text', text: jobTitle }
              ]
            }
          ]
        },
      }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: 'Employer notified via Rojgar Matrix.' });
    } else {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Meta API Error', details: errorData }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[EMPLOYER ALERT API ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}