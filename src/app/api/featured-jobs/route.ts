import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const jobsSnap = await getAdminDb().collection('jobs')
      .where('isActive', '==', true)
      .orderBy('postedDate', 'desc')
      .limit(6)
      .get();
    
    const jobs = jobsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching featured jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
