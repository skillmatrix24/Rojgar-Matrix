"use client"

import { useState, useEffect, useRef, Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from "firebase/auth";
import { useAuth, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, increment, collection, addDoc } from "firebase/firestore";
import { Loader2, Briefcase, User as UserIcon, LogIn, Smartphone, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

type UserRole = "jobSeeker" | "employer";
type LoginStep = "phone" | "otp";

function LoginContent() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("jobSeeker");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<LoginStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  const initRecaptcha = () => {
    if (!auth) return;
    if (recaptchaVerifierRef.current) return;
    
    const container = recaptchaContainerRef.current;
    if (!container) {
      console.error("Recaptcha container ref not found");
      return;
    }
    
    try {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, container, {
        'size': 'invisible',
        'callback': () => {
          console.log("reCAPTCHA verified");
        },
        'expired-callback': () => {
          toast({ variant: "destructive", title: "reCAPTCHA expired. Please try again." });
        }
      });
    } catch (e) {
      console.error("Recaptcha Init Error:", e);
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Capture Referral ID from URL and store in localStorage for persistence
    const refId = searchParams.get('ref');
    if (refId) {
      localStorage.setItem('rm_referral_id', refId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (mounted) {
      initRecaptcha();
    }

    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [mounted, auth]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ variant: "destructive", title: "Please enter a valid phone number." });
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const baseNumber = cleanPhone.slice(-10);
      const formattedNumber = `+91${baseNumber}`;
      
      const verifier = recaptchaVerifierRef.current;
      if (!verifier) throw new Error("reCAPTCHA not initialized");

      const result = await signInWithPhoneNumber(auth, formattedNumber, verifier);
      setConfirmationResult(result);
      setStep("otp");
      toast({ title: "OTP Sent Successfully" });
    } catch (error: any) {
      console.error("OTP Send Error:", error);
      let errorMsg = "Failed to send OTP. Please try again.";
      
      if (error.code === 'auth/too-many-requests') {
        errorMsg = "Too many requests. Please check if your domain is authorized in Firebase console.";
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMsg = "reCAPTCHA validation failed. Ensure your domain is authorized in Firebase.";
      }
      
      toast({ variant: "destructive", title: "OTP Error", description: errorMsg });
      
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
        initRecaptcha();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;

    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handlePostAuth(result.user);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please check the code and try again." });
    } finally {
      setLoading(false);
    }
  };

  const handlePostAuth = async (user: any) => {
    if (!db) return;

    const userDocRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userDocRef);
    const isNewUser = !userSnap.exists();
    
    const adminEmail = "skillmatrix24@gmail.com".toLowerCase();
    const isAdminEmail = user.email?.toLowerCase() === adminEmail;

    const nameParts = user.displayName?.split(" ") || ["New", "User"];
    const existingData = userSnap.data();
    
    const finalRole = isAdminEmail ? "admin" : (existingData?.role || selectedRole);

    const userData: any = {
      id: user.uid,
      email: user.email?.toLowerCase() || existingData?.email || null,
      role: finalRole,
      isEmployer: finalRole === 'employer',
      updatedAt: serverTimestamp(),
      firstName: existingData?.firstName || nameParts[0],
      lastName: existingData?.lastName || (nameParts.slice(1).join(" ") || ""),
      photoUrl: user.photoURL || existingData?.photoUrl || "",
      phoneNumber: user.phoneNumber || existingData?.phoneNumber || null,
      credits: existingData?.credits || 0,
      createdAt: isNewUser ? serverTimestamp() : (existingData?.createdAt || serverTimestamp()),
    };

    if (isNewUser) {
      // 1. Fetch Growth Engine Config
      const offersSnap = await getDoc(doc(db, "settings", "offers"));
      const signupBonus = offersSnap.exists() ? offersSnap.data().signupBonus || 0 : 0;
      const referralBonus = offersSnap.exists() ? offersSnap.data().referralBonus || 0 : 0;
      
      userData.credits = signupBonus;
      userData.referralCount = 0;
      userData.totalReferralEarnings = 0;

      // 2. Handle Referral Logic (now using localStorage for persistence)
      const refId = localStorage.getItem('rm_referral_id');
      if (refId && refId !== user.uid) {
        const referrerRef = doc(db, "users", refId);
        const referrerSnap = await getDoc(referrerRef);

        if (referrerSnap.exists()) {
          // Award Referrer
          await updateDoc(referrerRef, {
            credits: increment(referralBonus),
            referralCount: increment(1),
            totalReferralEarnings: increment(referralBonus),
            updatedAt: serverTimestamp()
          });

          // Log Transaction for Referrer
          await addDoc(collection(db, "transactions"), {
            userId: refId,
            amount: referralBonus,
            type: 'topup',
            description: `Referral Reward for inviting ${userData.firstName}`,
            status: 'success',
            createdAt: serverTimestamp()
          });

          userData.referredBy = refId;
          localStorage.removeItem('rm_referral_id');
        }
      }

      // Log Transaction for New User Signup Bonus
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        amount: signupBonus,
        type: 'topup',
        description: 'New User Sign-up Bonus',
        status: 'success',
        createdAt: serverTimestamp()
      });
    }

    await setDoc(userDocRef, userData, { merge: true });
    toast({ title: t('login_success') });
    
    if (finalRole === 'admin') router.push("/admin");
    else if (finalRole === 'employer') router.push("/dashboard");
    else router.push("/profile");
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handlePostAuth(result.user);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: t('login_fail'), description: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" suppressHydrationWarning>
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
        <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden rounded-[40px] bg-card">
          <div className="h-2 bg-primary"></div>
          <CardHeader className="text-center space-y-4 pb-8 pt-12 px-10">
            <div className="mx-auto bg-primary/10 w-20 h-20 rounded-[28px] flex items-center justify-center mb-2 shadow-inner">
              {step === 'otp' ? <CheckCircle2 className="h-10 w-10 text-primary animate-pulse" /> : <LogIn className="h-10 w-10 text-primary" />}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight">
                {step === 'otp' ? "Verify OTP" : t('welcome_back')}
              </CardTitle>
              <CardDescription className="font-medium px-4">
                {step === 'otp' ? "Enter the 6-digit code sent to your phone" : t('login_subtitle')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-12 px-10">
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{t('what_is_role')}</Label>
                  <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as UserRole)}>
                    <SelectTrigger className="w-full h-14 border-2 rounded-2xl font-bold px-5 bg-slate-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="jobSeeker">
                        <div className="flex items-center gap-2 py-1"><UserIcon className="h-4 w-4 text-primary" /> {t('job_seeker_option')}</div>
                      </SelectItem>
                      <SelectItem value="employer">
                        <div className="flex items-center gap-2 py-1"><Briefcase className="h-4 w-4 text-primary" /> {t('employer_option')}</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Whatsapp Number</Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">+91</div>
                    <Input 
                      type="tel" 
                      placeholder="9876543210" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="pl-14 h-14 border-2 rounded-2xl font-black text-xl bg-slate-50/50 focus-visible:ring-primary/20 transition-all" 
                      required
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium ml-1">We will send a code to verify your phone.</p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-16 gap-3 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Smartphone className="h-5 w-5" /> Send OTP</>}
                </Button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><Separator /></div>
                  <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card px-4 text-muted-foreground font-black tracking-widest">Or login with</span></div>
                </div>

                <Button 
                  type="button"
                  variant="outline"
                  className="w-full h-14 gap-3 font-black rounded-2xl border-2 hover:bg-slate-50 active:scale-95 transition-all text-sm" 
                  onClick={handleGoogleLogin} 
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg> 
                  Google Account
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center block">Enter Security Code</Label>
                  <Input 
                    type="text" 
                    placeholder="000000" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-20 text-center tracking-[0.8em] text-4xl font-black border-2 rounded-[24px] bg-slate-50/50 shadow-inner focus-visible:ring-primary/20"
                    maxLength={6}
                    required
                    autoFocus
                  />
                  <p className="text-center text-[11px] font-bold text-slate-500">Wait for up to 60 seconds for the SMS.</p>
                </div>
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "Verify & Login"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full font-black text-xs uppercase tracking-widest text-primary h-11" 
                    onClick={() => setStep("phone")}
                    disabled={loading}
                  >
                    Change Phone Number
                  </Button>
                </div>
              </form>
            )}

            <div className="pt-8 text-center">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                By continuing, you agree to Rojgar Matrix's <br />
                <Link href="/terms" className="text-primary hover:underline">Terms</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}