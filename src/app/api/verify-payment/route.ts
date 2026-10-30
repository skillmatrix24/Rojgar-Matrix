import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * @fileOverview API to verify Razorpay payment signature and update user credits.
 * Awards bonus credits ONLY if quantity > 1. Logs total price including GST and discounts.
 */

const DEFAULT_PLANS: Record<string, { credits: number, price: number, name: string, bonusPercentage: number }> = {
  'plan_basic': { credits: 50, price: 49, name: 'Standard Pack', bonusPercentage: 5 },
  'plan_pro': { credits: 150, price: 99, name: 'Professional Pack', bonusPercentage: 10 },
  'plan_unlimited': { credits: 1000, price: 299, name: 'Premium Member Pack', bonusPercentage: 15 }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planId, 
      userId,
      quantity = 1,
      couponCode
    } = body;

    const { firestore } = initializeFirebase();

    // 1. Fetch Dynamic Pricing
    const pricingRef = doc(firestore, 'settings', 'pricing');
    const pricingSnap = await getDoc(pricingRef);
    const pricingData = pricingSnap.exists() ? pricingSnap.data() : { plans: [], serviceLimits: {} };
    
    const livePlans = pricingData.plans || [];
    const gstRate = pricingData.serviceLimits?.gstPercentage || 18;
    
    const livePlan = livePlans.find((p: any) => p.id === planId);
    const plan = livePlan || DEFAULT_PLANS[planId];

    if (!plan || !userId || !razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 2. Fetch Credentials for Verification
    const settingsRef = doc(firestore, 'settings', 'razorpay');
    const settingsSnap = await getDoc(settingsRef);
    const dbConfig = settingsSnap.exists() ? settingsSnap.data() : {};
    const key_secret = dbConfig.keySecret || process.env.RAZORPAY_KEY_SECRET;

    if (!key_secret) {
      return NextResponse.json({ error: 'Secret key missing' }, { status: 500 });
    }

    // 3. Signature Verification
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 400 });
    }

    // 4. Calculate Discount (Re-verify on server)
    let subtotal = plan.price * quantity;
    let discountAmount = 0;

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
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.round(subtotal * (coupon.discountValue / 100));
        } else {
          discountAmount = coupon.discountValue;
        }
      }
    }

    // 5. Calculate Final Credits & Tax
    const baseCredits = plan.credits * quantity;
    const bonusCredits = quantity > 1 ? Math.round(baseCredits * ((plan.bonusPercentage || 0) / 100)) : 0;
    const totalCreditsToAward = baseCredits + bonusCredits;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const gstAmount = Math.round(taxableAmount * (gstRate / 100));
    const totalPricePaid = taxableAmount + gstAmount;

    // 6. Update User Credits
    const userRef = doc(firestore, 'users', userId);
    const updateData: any = {
      credits: increment(totalCreditsToAward),
      lowBalanceAlertStep: 0,
      updatedAt: serverTimestamp()
    };
    if (planId === 'plan_unlimited') updateData.isPremium = true;

    await updateDoc(userRef, updateData);

    // 7. Record Transaction
    await addDoc(collection(firestore, 'transactions'), {
      userId,
      amount: totalCreditsToAward,
      amountInInr: totalPricePaid,
      taxAmount: gstAmount,
      discountAmount: discountAmount,
      couponCode: couponCode || null,
      subtotal: subtotal,
      type: 'topup',
      description: `Rojgar Matrix Recharge: ${quantity}x ${plan.name} ${couponCode ? `(Code: ${couponCode})` : ''}`,
      provider: 'razorpay',
      providerOrderId: razorpay_order_id,
      status: 'success',
      createdAt: serverTimestamp()
    });

    return NextResponse.json({ success: true, message: 'Payment verified' });

  } catch (error: any) {
    console.error('[VERIFY_PAYMENT_ERROR]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}