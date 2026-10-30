
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

/**
 * @fileOverview Administrative script to repair 'promotions' collection data.
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
    const promotionsRef = collection(firestore, "promotions");
    const querySnapshot = await getDocs(promotionsRef);
    
    let processedCount = 0;
    let repairedCount = 0;
    let skippedCount = 0;
    const logs: string[] = [];

    const repairPromises = querySnapshot.docs.map(async (document) => {
      const data = document.data();
      const docId = document.id;
      processedCount++;

      // 1. Skip documents where employerId is missing
      if (!data.employerId) {
        const msg = `Skipping [${docId}]: Missing employerId.`;
        logs.push(msg);
        skippedCount++;
        return;
      }

      // 2. Add createdAt field if missing
      if (!data.createdAt) {
        const now = new Date().toISOString();
        const docRef = doc(firestore, "promotions", docId);
        
        await updateDoc(docRef, {
          createdAt: now,
          _repaired: true
        });

        const msg = `Repaired [${docId}]: Added missing createdAt.`;
        logs.push(msg);
        repairedCount++;
      }
    });

    await Promise.all(repairPromises);

    return NextResponse.json({
      success: true,
      summary: {
        totalFound: querySnapshot.size,
        processed: processedCount,
        repaired: repairedCount,
        skipped: skippedCount
      },
      logs
    });

  } catch (error: any) {
    console.error('[REPAIR_PROMOTIONS_ERROR]:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
