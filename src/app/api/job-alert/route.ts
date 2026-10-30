
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
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
    const { jobId } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'Missing Job ID.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    // 1. Fetch Global Settings
    const settingsRef = doc(firestore, 'settings', 'whatsapp');
    const autoRef = doc(firestore, 'settings', 'automation');
    
    const [settingsSnap, autoSnap] = await Promise.all([
      getDoc(settingsRef),
      getDoc(autoRef)
    ]);

    if (!settingsSnap.exists() || settingsSnap.data().isActive === false) {
      return NextResponse.json({ error: 'WhatsApp service is offline.' }, { status: 503 });
    }
    
    const { accessToken, phoneNumberId } = settingsSnap.data();
    const automation = autoSnap.exists() ? autoSnap.data() : null;

    // 2. Fetch the New Job Details
    const jobRef = doc(firestore, 'jobs', jobId);
    const jobSnap = await getDoc(jobRef);
    if (!jobSnap.exists()) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }
    const job = jobSnap.data();

    // 3. Find Matching Seekers (Using Admin SDK to bypass security rules)
    const { db } = require('@/lib/firebase-admin');
    const usersSnap = await db.collection('users')
      .where('role', '==', 'jobSeeker')
      .where('whatsappNotifications', '==', true)
      .where('city', '==', job.location)
      .where('category', '==', job.category)
      .get();
    
    const metaApiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    let notifiedCount = 0;

    const notificationPromises = usersSnap.docs.map(async (userDoc) => {
      const user = userDoc.data();
      if (!user.phoneNumber) return;

      const credits = user.credits || 0;
      const alertStep = user.lowBalanceAlertStep || 0;
      const cleanPhone = user.phoneNumber.replace(/\D/g, '');
      const formattedNumber = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

      let messagePayload: any = null;
      let shouldDeduct = false;
      let nextStep = alertStep;

      if (credits > 3) {
        messagePayload = {
          type: 'template',
          template: {
            name: 'job_alert_template', 
            language: { code: 'hi' },
            components: [{ type: 'body', parameters: [{ type: 'text', text: job.title }, { type: 'text', text: job.companyName }, { type: 'text', text: job.location }] }]
          }
        };
        shouldDeduct = true;
        nextStep = 0;
      } 
      else if (credits > 0 && automation) {
        const stepIndex = 3 - credits;
        if (alertStep <= stepIndex) {
          messagePayload = { type: 'text', text: { body: automation.lowBalanceAlerts[stepIndex] } };
          shouldDeduct = true;
          nextStep = stepIndex + 1;
        }
      } 
      else if (credits === 0 && automation && automation.isRecoveryEnabled !== false && alertStep < 5) {
        const recoveryIndex = alertStep - 3;
        if (recoveryIndex >= 0 && recoveryIndex < 2) {
          messagePayload = { type: 'text', text: { body: automation.recoveryMessages[recoveryIndex] } };
          shouldDeduct = false;
          nextStep = alertStep + 1;
        }
      }

      if (!messagePayload) return;

      try {
        const response = await fetch(metaApiUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: formattedNumber, ...messagePayload }),
        });
        
        if (response.ok) {
          notifiedCount++;
          const updates: any = { lowBalanceAlertStep: nextStep, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
          if (shouldDeduct) updates.credits = admin.firestore.FieldValue.increment(-1);
          await db.collection('users').doc(userDoc.id).update(updates);
        }
      } catch (err) {
        console.error(`Failed to notify ${formattedNumber}:`, err);
      }
    });

    await Promise.all(notificationPromises);
    return NextResponse.json({ success: true, notifiedCount });
  } catch (error: any) {
    console.error("Job alert API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
