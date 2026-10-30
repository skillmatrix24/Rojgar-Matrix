
import { NextResponse } from 'next/server';

/**
 * @fileOverview Validates WhatsApp Meta Cloud API credentials.
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
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ 
        success: false, 
        status: 'invalid_token',
        error: 'Access Token is missing.'
      }, { status: 400 });
    }

    const verifyTokenUrl = `https://graph.facebook.com/v18.0/me?access_token=${encodeURIComponent(accessToken)}`;
    
    try {
      const tokenResponse = await fetch(verifyTokenUrl, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        return NextResponse.json({
          success: false,
          status: 'invalid_token',
          error: 'Meta API: ' + (tokenData.error?.message || 'Unauthorized')
        }, { status: 401 });
      }

      return NextResponse.json({
        success: true,
        status: 'connected',
        data: {
          id: tokenData.id,
          verified_name: tokenData.name || 'WhatsApp Business Account',
          quality_rating: 'GREEN'
        }
      });

    } catch (err: any) {
      console.error("Meta API token verification network error:", err);
      return NextResponse.json({
        success: false,
        status: 'error',
        error: 'Network Error: Failed to communicate with Meta API.'
      }, { status: 502 });
    }

  } catch (error: any) {
    console.error("WhatsApp status check system error:", error);
    return NextResponse.json(
      { 
        success: false, 
        status: 'error', 
        error: 'System Error: Failed to parse request.'
      },
      { status: 500 }
    );
  }
}
