
import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Administrative backend route to repair user profile data.
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
    
    // Scan all users
    const snap = await getDocs(collection(firestore, "users"));
    let repairedCount = 0;

    const repairPromises = snap.docs.map(async (d) => {
      const data = d.data();
      const updates: any = {};
      
      if (!data.role) {
        updates.role = data.isEmployer ? 'employer' : 'jobSeeker';
      }

      if (data.role === 'employer' && !data.isEmployer) {
        updates.isEmployer = true;
      }

      if (!data.updatedAt) {
        updates.updatedAt = serverTimestamp();
      }

      if (Object.keys(updates).length > 0) {
        repairedCount++;
        return updateDoc(doc(firestore, "users", d.id), { 
          ...updates,
          _systemRepaired: true 
        });
      }
    });

    await Promise.all(repairPromises);

    return NextResponse.json({ 
      success: true, 
      repairedCount,
      message: `Systemic repair complete. ${repairedCount} users updated with correct flags.` 
    });
  } catch (error: any) {
    console.error('[ADMIN_USER_REPAIR_FAIL]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
