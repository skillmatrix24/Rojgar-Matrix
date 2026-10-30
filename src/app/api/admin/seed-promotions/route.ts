import { NextResponse } from 'next/server';

/**
 * @fileOverview Administrative API - Disabled for Production.
 */

export async function POST() {
  return NextResponse.json({ 
    success: false, 
    message: "Administrative seeding is disabled in production environments." 
  }, { status: 403 });
}
