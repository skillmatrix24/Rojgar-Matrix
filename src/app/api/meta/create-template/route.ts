
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview Meta Cloud API: Create Message Template Proxy.
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
      name, 
      category, 
      language, 
      headerType, 
      headerText, 
      bodyText, 
      footerText, 
      buttons, 
      mediaUrl 
    } = body;

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
      return NextResponse.json({ error: 'WABA ID and Access Token are required.' }, { status: 400 });
    }

    // 2. Validate and Clean Template Name
    if (!name) return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    let cleanName = name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (/^[0-9]/.test(cleanName)) {
      cleanName = 'tpl_' + cleanName;
    }

    // 3. Helper to find the MAX variable index used
    const getMaxVarIndex = (text: string) => {
      const matches = text.match(/\{\{\s*(\d+)\s*\}\}/g);
      if (!matches) return 0;
      const indices = matches.map(m => {
        const num = m.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      });
      return Math.max(...indices);
    };

    // 4. Map Components
    const components: any[] = [];

    // Header
    if (headerType !== 'NONE') {
      const headerComp: any = { type: 'HEADER', format: headerType };
      if (headerType === 'TEXT') {
        if (!headerText) return NextResponse.json({ error: 'Header text is required' }, { status: 400 });
        headerComp.text = headerText;
        const maxHVar = getMaxVarIndex(headerText);
        if (maxHVar > 0) {
          headerComp.example = { 
            header_text: Array.from({ length: maxHVar }, (_, i) => `Sample_${i + 1}`) 
          };
        }
      } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType)) {
        headerComp.example = { 
          header_handle: [mediaUrl || "https://picsum.photos/seed/placeholder/800/400"] 
        };
      }
      components.push(headerComp);
    }

    // Body
    if (!bodyText) return NextResponse.json({ error: 'Body text is required' }, { status: 400 });
    const bodyComp: any = { type: 'BODY', text: bodyText };
    const maxBVar = getMaxVarIndex(bodyText);
    if (maxBVar > 0) {
      bodyComp.example = { 
        body_text: [ Array.from({ length: maxBVar }, (_, i) => `Sample_${i + 1}`) ] 
      };
    }
    components.push(bodyComp);

    // Footer
    if (footerText) {
      components.push({ type: 'FOOTER', text: footerText });
    }

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

    // 5. Make Meta API Request
    const metaUrl = `https://graph.facebook.com/v18.0/${wabaId}/message_templates`;

    const response = await fetch(metaUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: cleanName,
        category: category.toUpperCase(),
        language: language || 'hi',
        components
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: result.error?.message || 'Meta API Error', 
        details: result.error?.error_user_msg || 'Invalid parameter structure.',
        meta_error: result.error
      }, { status: response.status });
    }

    return NextResponse.json({ success: true, metaId: result.id, name: cleanName });

  } catch (error: any) {
    console.error('[META_CREATE_PROXY_ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
