
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * @fileOverview API to create a Razorpay Order for credit recharge.
 * Handles quantities, coupons, and includes GST calculation.
 */

const DEFAULT_PLANS: Record<string, { price: number }> = {
  'plan_basic': { price: 49 },
  'plan_pro': { price: 99 },
  'plan_unlimited': { price: 299 }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { planId, quantity = 1, couponCode } = body;

    const { firestore } = initializeFirebase();

    // 1. Fetch Dynamic Pricing & GST Settings
    const pricingRef = doc(firestore, 'settings', 'pricing');
    const pricingSnap = await getDoc(pricingRef);
    const pricingData = pricingSnap.exists() ? pricingSnap.data() : { plans: [], serviceLimits: {} };
    
    const livePlans = pricingData.plans || [];
    const gstRate = pricingData.serviceLimits?.gstPercentage || 18;
    
    const livePlan = livePlans.find((p: any) => p.id === planId);
    const plan = livePlan || DEFAULT_PLANS[planId];

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    let subtotal = plan.price * quantity;
    let discountAmount = 0;

    // 2. Validate Coupon if provided
    if (couponCode) {
      const q = query(
        collection(firestore, "coupons"), 
        where("code", "==", couponCode.toUpperCase().trim()),
        where("isActive", "==", true),
        limit(1)
      );
      const couponSnap = await getDocs(q);
      
      if (!couponSnap.empty) {
        const coupon = couponSnap.docs[0].data();
        
        // Expiry & Min Purchase logic repeated on server for security
        const isExpired = coupon.expiryDate && (Date.now() > new Date(coupon.expiryDate).getTime());
        const totalCredits = (plan.credits || 0) * quantity;
        const minPurchaseMet = !coupon.minPurchase || (totalCredits >= coupon.minPurchase);

        if (!isExpired && minPurchaseMet) {
          if (coupon.discountType === 'percentage') {
            discountAmount = Math.round(subtotal * (coupon.discountValue / 100));
          } else {
            discountAmount = coupon.discountValue;
          }
        }
      }
    }

    // 3. Calculate Final Amount including GST
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gstAmount = Math.round(taxableAmount * (gstRate / 100));
    const totalAmount = taxableAmount + gstAmount;

    // 4. Fetch Razorpay Credentials
    const settingsRef = doc(firestore, 'settings', 'razorpay');
    const settingsSnap = await getDoc(settingsRef);
    const dbConfig = settingsSnap.exists() ? settingsSnap.data() : {};

    const key_id = dbConfig.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = dbConfig.keySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return NextResponse.json({ error: 'Razorpay keys missing.' }, { status: 500 });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const options = {
      amount: totalAmount * 100, // Razorpay expects paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId,
        quantity: quantity.toString(),
        couponCode: couponCode || 'NONE',
        discountAmount: discountAmount.toString(),
        subtotal: subtotal.toString(),
        taxAmount: gstAmount.toString()
      }
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);

  } catch (error: any) {
    console.error('[RAZORPAY_ORDER_ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
