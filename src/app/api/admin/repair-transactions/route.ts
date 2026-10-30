
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Administrative backend route to repair transaction data.
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
    
    // Scan all transactions
    const snap = await getDocs(collection(firestore, "transactions"));
    const missing = snap.docs.filter(d => !d.data().createdAt);

    if (missing.length === 0) {
      return NextResponse.json({ success: true, message: 'No repair needed.' });
    }

    const repairPromises = missing.map(d => 
      updateDoc(doc(firestore, "transactions", d.id), { 
        createdAt: serverTimestamp(),
        _systemFixed: true 
      })
    );

    await Promise.all(repairPromises);

    return NextResponse.json({ 
      success: true, 
      repairedCount: missing.length,
      message: `Fixed ${missing.length} documents with missing timestamps.` 
    });
  } catch (error: any) {
    console.error('[ADMIN_REPAIR_FAIL]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
