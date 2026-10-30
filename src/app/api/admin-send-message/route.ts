
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview API for Admins to send manual messages to users via Meta Cloud API.
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
    const { phoneNumber, messageText } = body;

    if (!phoneNumber || !messageText) {
      return NextResponse.json({ error: 'Phone number and message text are required.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch WhatsApp Credentials & Global Status
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: 'WhatsApp settings not found.' }, { status: 404 });
    }

    const config = settingsSnap.data();

    // Verify system is active
    if (config.isActive === false) {
      return NextResponse.json({ 
        error: 'System Offline', 
        details: 'WhatsApp service is currently disabled.' 
      }, { status: 503 });
    }

    const { accessToken, phoneNumberId } = config;

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json({ error: 'API credentials missing.' }, { status: 400 });
    }

    // 2. Send Message via Meta Cloud API
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
        to: phoneNumber,
        type: 'text',
        text: { body: messageText }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        error: 'Meta API Error', 
        details: errorData.error?.message || 'Failed to send message.'
      }, { status: response.status });
    }

    // 3. Update Firestore History (Truncated to last 10)
    const interactionRef = doc(firestore, 'interactions', phoneNumber);
    const interactionSnap = await getDoc(interactionRef);
    const existingHistory = interactionSnap.exists() ? interactionSnap.data().history || [] : [];
    
    const updatedHistory = [
      ...existingHistory,
      { role: 'bot', text: messageText, timestamp: new Date().toISOString() }
    ].slice(-10);

    await setDoc(interactionRef, {
      lastInteractionAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: messageText,
      history: updatedHistory
    }, { merge: true });

    return NextResponse.json({
      success: true
    });

  } catch (error: any) {
    console.error('[ADMIN REPLY API CRITICAL]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
