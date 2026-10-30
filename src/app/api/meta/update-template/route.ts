
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Meta Cloud API: Update Message Template Proxy.
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
      metaId,
      headerType, 
      headerText, 
      bodyText, 
      footerText, 
      buttons, 
      mediaUrl 
    } = body;

    if (!metaId) {
      return NextResponse.json({ error: 'Meta Template ID is required for update.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch Credentials
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) return NextResponse.json({ error: 'Config missing' }, { status: 404 });
    const { accessToken } = settingsSnap.data();

    // 2. Helper to find the MAX variable index
    const getMaxVarIndex = (text: string) => {
      const matches = text.match(/\{\{\s*(\d+)\s*\}\}/g);
      if (!matches) return 0;
      return Math.max(...matches.map(m => parseInt(m.match(/\d+/)![0])));
    };

    // 3. Map Components
    const components: any[] = [];

    // Header
    if (headerType !== 'NONE') {
      const headerComp: any = { type: 'HEADER', format: headerType };
      if (headerType === 'TEXT') {
        headerComp.text = headerText;
        const maxHVar = getMaxVarIndex(headerText);
        if (maxHVar > 0) headerComp.example = { header_text: Array.from({ length: maxHVar }, (_, i) => `Sample_${i + 1}`) };
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
        headerComp.example = { header_handle: [mediaUrl || "https://picsum.photos/seed/placeholder/800/400"] };
      }
      components.push(headerComp);
    }

    // Body
    const bodyComp: any = { type: 'BODY', text: bodyText };
    const maxBVar = getMaxVarIndex(bodyText);
    if (maxBVar > 0) bodyComp.example = { body_text: [ Array.from({ length: maxBVar }, (_, i) => `Sample_${i + 1}`) ] };
    components.push(bodyComp);

    // Footer
    if (footerText) components.push({ type: 'FOOTER', text: footerText });

    // Buttons
    if (buttons && buttons.length > 0) {
      const metaButtons = buttons.map((btn: any) => {
        const cleanLabel = btn.label.slice(0, 25);
        if (btn.type === 'URL') {
          let finalUrl = btn.value;
          if (!finalUrl.startsWith('http')) finalUrl = 'https://' + finalUrl;
          return { type: 'URL', text: cleanLabel, url: finalUrl };
        }
        return { type: 'QUICK_REPLY', text: cleanLabel };
      });
      components.push({ type: 'BUTTONS', buttons: metaButtons });
    }

    // 4. Make Meta API Request to Update Content
    const metaUrl = `https://graph.facebook.com/v18.0/${metaId}`;

    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ components }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: result.error?.message || 'Meta API Update Error',
        meta_error: result.error
      }, { status: response.status });
    }

    return NextResponse.json({ success: true, metaId: metaId });

  } catch (error: any) {
    console.error('[META_UPDATE_PROXY_ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
