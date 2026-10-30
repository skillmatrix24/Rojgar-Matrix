
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview API to fetch template statuses from Meta Cloud API.
 * Secured: Added x-api-key validation.
 */

export async function POST(request: Request) {
  try {
    // SECURITY GUARD
    const authHeader = request.headers.get('x-api-key');
    if (authHeader !== 'chatmatrix_master_789') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch Meta Credentials
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: 'WhatsApp configuration missing.' }, { status: 404 });
    }

    const config = settingsSnap.data();
    const { accessToken, whatsappBusinessAccountId: wabaId } = config;

    if (!accessToken || !wabaId) {
      return NextResponse.json({ error: 'Missing WABA ID or Access Token.' }, { status: 400 });
    }

    // 2. Fetch Templates from Meta API
    const metaUrl = `https://graph.facebook.com/v18.0/${wabaId}/message_templates?limit=1000`;
    
    const response = await fetch(metaUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const metaResult = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Meta API Error', 
        details: metaResult.error?.message || 'Failed to fetch templates from Meta.' 
      }, { status: response.status });
    }

    return NextResponse.json({ 
      success: true, 
      metaTemplates: metaResult.data || [] 
    });

  } catch (error: any) {
    console.error('[META_SYNC_TEMPLATES_PROXY_CRITICAL]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
