import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { whatsappBotAi } from '@/ai/flows/whatsapp-bot-ai';

/**
 * @fileOverview Final Webhook Logic for Rojgar Matrix WhatsApp Bot.
 * Enhanced: Provides a registration prompt for un-registered users to improve discovery.
 */

async function sendWhatsApp(to: string, payload: any, config: any) {
  try {
    const { accessToken, phoneNumberId, isActive } = config;
    if (!accessToken || !phoneNumberId || isActive === false) return { success: false };

    const cleanTo = to.replace(/\D/g, '');
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        ...payload
      })
    });
    return { success: res.ok };
  } catch (err) {
    console.error("sendDirectMessage error:", err);
    return { success: false };
  }
}

/**
 * Helper to replace variables in bot response text
 */
function replaceVariables(text: string, user: any) {
  if (!text) return "";
  let final = text;
  
  // {{1}}: Contact Name
  const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : "User";
  final = final.replace(/\{\{1\}\}/g, name || "User");
  
  // {{2}}: Phone Number
  final = final.replace(/\{\{2\}\}/g, user?.phoneNumber || "");
  
  // {{3}}: Role
  final = final.replace(/\{\{3\}\}/g, user?.role || "");
  
  // {{4}}: City
  final = final.replace(/\{\{4\}\}/g, user?.city || "");
  
  return final;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && challenge) {
    const { firestore } = initializeFirebase();
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const settingsSnap = await getDoc(settingsRef);
    const dbToken = settingsSnap.exists() ? settingsSnap.data().verifyToken : 'chatmatrix_verify_123';
    if (token === dbToken) return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const { firestore } = initializeFirebase();
    const body = await request.json();
    const isSimulated = body.source === 'simulator';
    
    let from = "", userText = "";

    if (isSimulated) {
      from = body.phoneNumber;
      userText = body.text;
    } else {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      if (!message) return NextResponse.json({ status: 'ok' }); 
      from = message.from; 
      userText = (message.text?.body || message.interactive?.list_reply?.title || message.interactive?.button_reply?.title || "").trim();
    }

    if (!from || !userText) return NextResponse.json({ status: 'ignored' });

    const rawNum = from.toString().replace(/\D/g, '');
    const cleanFrom = `91${rawNum.slice(-10)}`;
    const e164From = `+91${rawNum.slice(-10)}`;
    
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const botSettingsRef = doc(firestore, 'settings', 'bot');
    const interactionRef = doc(firestore, 'interactions', cleanFrom);

    const [settingsSnap, botSnap, usersSnap] = await Promise.all([
      getDoc(settingsRef),
      getDoc(botSettingsRef),
      getDocs(query(collection(firestore, 'users'), where('phoneNumber', 'in', [cleanFrom, e164From]), limit(1)))
    ]);

    let whatsappConfig = settingsSnap.exists() ? settingsSnap.data() : { isActive: true };
    let botConfig = botSnap.exists() ? botSnap.data() : { useAiIntelligence: true };

    // --- REGISTRATION PROMPT FOR DISCOVERY ---
    if (usersSnap.empty) {
      const registrationMsg = "Namaste! Rojgar Matrix par aapka swagat hai. 🙏\n\nWhatsApp par jobs paane ke liye aapko pehle hamari website par register karna hoga. Isse hum aapke skills ke mutabiq sahi jobs match kar payenge.\n\n🔗 *Register Here:* https://rojgarmatrix.com/login\n\nRegister karne ke baad 'Hi' bhej kar shuru karein!";
      
      await sendWhatsApp(from, { type: 'text', text: { body: registrationMsg } }, whatsappConfig);
      return NextResponse.json({ status: 'sent_registration_link' });
    }

    const userData = usersSnap.docs[0].data();
    const interactionSnap = await getDoc(interactionRef);
    let state = interactionSnap.exists() ? interactionSnap.data() : { lastStep: 'START', history: [] };

    // --- STEP 1: CHECK CUSTOM BOT FLOWS ---
    const flowsSnap = await getDocs(collection(firestore, 'wa_flows'));
    const flows = flowsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    
    const matchedFlow = flows.find(f => {
      const keywords = (f.triggerKeywords || "").split(',').map((k:string) => k.trim().toLowerCase());
      return keywords.some((k:string) => userText.toLowerCase().includes(k));
    });

    if (matchedFlow) {
      const responseText = replaceVariables(matchedFlow.responseText, userData);
      const payload: any = { type: 'text', text: { body: responseText } };
      
      if (matchedFlow.buttons && matchedFlow.buttons.length > 0) {
        payload.type = 'interactive';
        payload.interactive = {
          type: 'button',
          body: { text: responseText },
          action: {
            buttons: matchedFlow.buttons.map((b: any, idx: number) => ({
              reply: { id: `flow_btn_${idx}`, title: b.label.slice(0, 20) }
            }))
          }
        };
      }

      await sendWhatsApp(from, payload, whatsappConfig);
      const updatedHistory = [...(state.history || []), { role: 'user', text: userText }, { role: 'bot', text: responseText }].slice(-10);
      await setDoc(interactionRef, {
        phoneNumber: cleanFrom,
        updatedAt: serverTimestamp(),
        lastMessage: responseText,
        history: updatedHistory
      }, { merge: true });

      return NextResponse.json({ status: 'custom_flow_executed' });
    }

    // --- STEP 2: PROCEED WITH NLU SEARCH LOGIC ---
    const catsSnap = await getDocs(collection(firestore, 'categories'));
    const availableCategories = catsSnap.docs.map(d => d.data().name);

    const lowerText = userText.toLowerCase();
    const isHardRestart = ['hi', 'hello', 'start', 'restart'].includes(lowerText);

    let aiIntent = 'unknown';
    let extractedCity = null;
    let extractedCategory = null;
    let detectedLang: 'en' | 'hi' = 'hi';

    if (botConfig.useAiIntelligence !== false && !isHardRestart) {
      try {
        const aiResult = await whatsappBotAi({
          message: userText,
          availableCategories,
          currentContext: state.selectedCity ? `USER_IN_CITY_${state.selectedCity}` : "USER_INITIATING_SEARCH"
        });
        aiIntent = aiResult.intent;
        detectedLang = aiResult.detectedLanguage || 'hi';
        extractedCity = aiResult.extractedCity;
        extractedCategory = aiResult.extractedCategory;
      } catch (e) {
        console.error("WhatsApp bot AI classification error:", e);
      }
    }

    let finalCity = extractedCity || state.selectedCity;
    let finalCategory = extractedCity ? extractedCategory : (extractedCategory || state.selectedCategory);
    
    let replyText = "";
    const s = detectedLang === 'en' ? {
      welcome: "Hello {{1}}! Welcome to Rojgar Matrix. Send your City name to find jobs.",
      fallback: "Sorry, I didn't get that. Please send your City name.",
      results: "Jobs in {city}:",
      noJobs: "No jobs found in {city}."
    } : {
      welcome: "Namaste {{1}}! Rojgar Matrix par aapka swagat hai. Jobs ke liye apni City bhejye.",
      fallback: "Maaf kijiye, samajh nahi aaya. Apni City ka naam likhein.",
      results: "✅ *Jobs in {city}*:",
      noJobs: "Maaf kijiye, {city} mein abhi koi jobs nahi hain."
    };

    if (isHardRestart || aiIntent === 'greeting') {
      replyText = replaceVariables(s.welcome, userData);
      finalCity = null;
      finalCategory = null;
    } else if (finalCity) {
      let jobsQ = query(collection(firestore, 'jobs'), where('isActive', '==', true), where('location', '==', finalCity), limit(5));
      const jobSnap = await getDocs(jobsQ);
      const jobs = jobSnap.docs.map(d => d.data());

      if (jobs.length === 0) {
        replyText = s.noJobs.replace('{city}', finalCity);
      } else {
        replyText = s.results.replace('{city}', finalCity) + "\n\n";
        jobs.forEach((j, i) => {
          replyText += `${i+1}. *${j.title}*\n🔗 https://rojgarmatrix.com/jobs/${jobSnap.docs[i].id}\n\n`;
        });
      }
    } else {
      replyText = s.fallback;
    }

    await sendWhatsApp(from, { type: 'text', text: { body: replyText } }, whatsappConfig);
    const updatedHistory = [...(state.history || []), { role: 'user', text: userText }, { role: 'bot', text: replyText }].slice(-10);
    await setDoc(interactionRef, {
      phoneNumber: cleanFrom,
      selectedCity: finalCity,
      selectedCategory: finalCategory,
      updatedAt: serverTimestamp(),
      lastMessage: replyText,
      history: updatedHistory
    }, { merge: true });

    return NextResponse.json({ status: 'ok' });

  } catch (error: any) {
    console.error("WhatsApp webhook main route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}