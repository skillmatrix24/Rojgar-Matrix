
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview API to send a single template-based WhatsApp message for Bulk Sender.
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
      phoneNumber, 
      templateName, 
      accessToken: providedToken, 
      phoneNumberId: providedId,
      components,
      languageCode
    } = body;

    if (!phoneNumber || !templateName) {
      return NextResponse.json({ error: 'Missing phone number or template name.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. CLEAN & FORMAT NUMBER
    const cleanNumber = phoneNumber.toString().replace(/\D/g, '');
    const baseNumber = cleanNumber.slice(-10); 
    
    if (baseNumber.length !== 10) {
      return NextResponse.json({ 
        error: 'Invalid number format', 
        details: 'Kripya 10-digit Indian number provide karein.' 
      }, { status: 400 });
    }

    const formattedNumber = `91${baseNumber}`;

    // 2. Fetch Credentials if not provided
    let accessToken = providedToken;
    let phoneNumberId = providedId;

    if (!accessToken || !phoneNumberId) {
      const settingsRef = doc(firestore, 'settings', 'whatsapp');
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        return NextResponse.json({ error: 'WhatsApp API credentials missing.' }, { status: 404 });
      }

      const config = settingsSnap.data();
      accessToken = config.accessToken;
      phoneNumberId = config.phoneNumberId;

      if (config.isActive === false) {
        return NextResponse.json({ error: 'System is currently OFFLINE.' }, { status: 503 });
      }
    }

    // 3. Send via Meta Cloud API
    const metaApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
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
          name: templateName,
          language: { code: languageCode || 'en_IN' },
          components: components || [] 
        },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: result.error?.message || 'Meta API Error',
        details: result.error,
        code: result.error?.error_subcode || result.error?.code
      }, { status: response.status });
    }

    // 4. Minimal Interaction Record for UI mirror
    const interactionRef = doc(firestore, 'interactions', formattedNumber);
    await setDoc(interactionRef, {
      lastMessage: `[Campaign Template: ${templateName}]`,
      updatedAt: serverTimestamp(),
      phoneNumber: formattedNumber
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[BULK_SEND_API_CRITICAL]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
