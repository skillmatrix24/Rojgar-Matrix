'use server';

import { headers } from 'next/headers';

/**
 * @fileOverview Secure Server Action Proxy for internal API dispatching.
 * This prevents the x-api-key from being exposed in the browser bundle or network tab.
 */

const INTERNAL_API_KEY = 'chatmatrix_master_789';

export async function secureDispatch(path: string, body: any) {
  try {
    const hostHeader = (await headers()).get('host') || 'localhost:9002';
    const protocol = hostHeader.includes('localhost') ? 'http' : 'https';
    const url = `${protocol}://${hostHeader}${path}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': INTERNAL_API_KEY
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    // Most internal routes return JSON
    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error("[SECURE_DISPATCH_JSON_PARSE_ERROR]:", e);
      data = { message: 'Success (Non-JSON Response)' };
    }

    return { 
      ok: res.ok, 
      status: res.status, 
      data 
    };
  } catch (error: any) {
    console.error(`[SECURE_DISPATCH_ERROR] ${path}:`, error);
    return { 
      ok: false, 
      status: 500, 
      error: error.message || 'Internal Proxy Communication Error' 
    };
  }
}
