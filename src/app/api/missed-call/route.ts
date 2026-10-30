
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Webhook handler for missed call detection.
 * Telephony providers (like Twilio or specific missed call services) will call this endpoint.
 */

export async function POST(request: Request) {
  try {
    const { firestore } = initializeFirebase();
    const body = await request.json();
    
    // Telephony providers usually send the caller's phone number in the body or query params
    const phoneNumber = body.from || body.phoneNumber;

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number missing' }, { status: 400 });
    }

    // Capture the phone number and initialize/update the interaction state
    const interactionRef = doc(firestore, 'interactions', phoneNumber);
    
    await setDoc(interactionRef, {
      phoneNumber,
      lastStep: 'CATEGORY_PENDING',
      lastMessage: 'INITIAL_GREETING',
      updatedAt: serverTimestamp()
    }, { merge: true });

    // In a real implementation, you would trigger your WhatsApp API here
    // Example: sendWhatsAppMessage(phoneNumber, greetingMessage);

    return NextResponse.json({ 
      success: true, 
      message: 'Missed call captured. Initial WhatsApp message triggered.' 
    });
  } catch (error: any) {
    console.error('Missed call handler error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
