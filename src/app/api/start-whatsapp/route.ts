
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview Meta Cloud API handshake logic for Simulator.
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
    const { phoneNumber, accessToken: providedToken, phoneNumberId: providedId } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

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
    const e164Number = `+91${baseNumber}`;

    // 2. REGISTRATION CHECK
    const userQuery = await adminDb.collection('users')
      .where('phoneNumber', 'in', [formattedNumber, e164Number])
      .limit(1)
      .get();

    if (userQuery.empty) {
      return NextResponse.json({ 
        error: 'User Not Registered', 
        details: 'WhatsApp Connect sirf registered users ke liye hai.' 
      }, { status: 403 });
    }

    // 3. FETCH SETTINGS & TEMPLATE LANGUAGE
    const settingsDoc = await adminDb.doc('settings/whatsapp').get();
    const tplQuery = await adminDb.collection('wa_templates')
      .where('name', '==', 'welcome_massage')
      .limit(1)
      .get();
    
    const config = settingsDoc.exists ? settingsDoc.data() : { isActive: false };
    const templateLang = !tplQuery.empty ? tplQuery.docs[0].data().language : 'hi';

    if (config?.isActive === false) {
      return NextResponse.json({ 
        error: 'WhatsApp Service Offline', 
        details: 'System is currently disabled by Admin.' 
      }, { status: 503 });
    }

    let accessToken = providedToken || config?.accessToken;
    let phoneNumberId = providedId || config?.phoneNumberId;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({ 
        error: 'Configuration Error', 
        details: 'Meta API credentials are not configured.' 
      }, { status: 500 });
    }

    const interactionRef = adminDb.doc(`interactions/${formattedNumber}`);
    const interactionSnap = await interactionRef.get();
    const existingHistory = interactionSnap.exists ? interactionSnap.data()?.history || [] : [];

    // 4. REAL META API CALL
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
          name: 'welcome_massage', 
          language: { code: templateLang }
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        error: 'Meta API Error', 
        details: `(#${errorData.error?.code || 'Error'}) ${errorData.error?.message || 'Handshake failed.'}`
      }, { status: response.status });
    }

    const newHistory = [...existingHistory, { role: 'bot', text: '[Onboarding Template Sent]', timestamp: new Date().toISOString() }].slice(-10);
    await interactionRef.set({
      phoneNumber: formattedNumber,
      status: 'active',
      lastStep: 'START',
      updatedAt: FieldValue.serverTimestamp(),
      history: newHistory
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[API_START_WHATSAPP_CRITICAL]:', error);
    return NextResponse.json({ 
      error: 'System Error', 
      details: error.message || 'Internal logic error.' 
    }, { status: 500 });
  }
}

