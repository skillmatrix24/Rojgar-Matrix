
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Meta Cloud API: Delete Message Template Proxy.
 * Secured: Added x-api-key validation.
 */

export async function POST(request: Request) {
  try {
    // SECURITY GUARD
    const authHeader = request.headers.get('x-api-key');
    if (authHeader !== 'chatmatrix_master_789') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Template name is required for deletion.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch Global API Settings
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const settingsSnap = await getDoc(settingsRef);
    
    if (!settingsSnap.exists()) {
      return NextResponse.json({ error: 'WhatsApp configuration missing.' }, { status: 404 });
    }

    const config = settingsSnap.data();
    const { accessToken, whatsappBusinessAccountId: wabaId } = config;

    if (!accessToken || !wabaId) {
      return NextResponse.json({ error: 'API credentials missing.' }, { status: 400 });
    }

    // 2. Make Meta API DELETE Request
    const metaUrl = `https://graph.facebook.com/v18.0/${wabaId}/message_templates?name=${encodeURIComponent(name)}`;

    const response = await fetch(metaUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: result.error?.message || 'Meta API Deletion Error',
        meta_error: result.error
      }, { status: response.status });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[META_DELETE_PROXY_ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
