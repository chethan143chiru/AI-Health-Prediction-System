import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Mail, Phone, MapPin, Lock, ChevronRight, 
  Eye, EyeOff, ShieldCheck, MailQuestion, Chrome,
  Smartphone, AlertCircle
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth, db } from '@/src/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { logUserActivity } from '@/src/lib/activity';

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
  const [otpCreatedAt, setOtpCreatedAt] = useState<number | null>(null); // Expiry check timestamp
  const [otpPurpose, setOtpPurpose] = useState<'register' | 'forgot' | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [notification, setNotification] = useState<{
    type: 'sms' | 'email';
    sender: string;
    senderInfo: string;
    message: string;
    code: string;
    show: boolean;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    age: '',
    dob: '',
    mobile: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Set persistent auth state
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.error("Failed to set persistence:", err);
    });
    // Unsubscribe from auth changes to avoid flashes during login flow
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && step === 1) {
        // user is already logged in? 
      }
    });
    return () => unsub();
  }, [step]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/[^0-9]/g, ''); // Ensure only numbers
    if (!cleanValue) {
      // Clear value if backspaced
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = cleanValue.substring(cleanValue.length - 1); // Get last typed digit
    setOtp(newOtp);
    
    if (index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        document.getElementById(`otp-${index - 1}`)?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const sendBackendOtp = async (
    type: 'sms' | 'email',
    target: string,
    code: string,
    purpose: 'register' | 'forgot'
  ) => {
    const response = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, target, code, purpose })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to dispatch real OTP");
    }
    return data;
  };

  const startRegisterFlow = async () => {
    if (!formData.name) throw new Error("Full name is required");
    if (!formData.email) throw new Error("Email is required");
    if (!formData.mobile) throw new Error("Mobile number is required");
    if (!formData.address) throw new Error("Residential address is required");
    if (formData.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
    if (formData.password.trim() !== formData.confirmPassword.trim()) {
      throw new Error("Passwords do not match");
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/send-register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate registration verification.");
      }

      setOtp(['', '', '', '', '', '']);
      setOtpCreatedAt(Date.now());
      setOtpPurpose('register');

      if (data.simulation) {
        setSuccessMessage("Email dispatch simulated successfully! To send real Gmail messages, please configure EMAIL_USER and EMAIL_PASS keys under Settings -> Secrets.");
      } else {
        setSuccessMessage("Real 6-digit Email OTP sent successfully to your registered email address!");
      }
      setStep(2); // Go to OTP verification step
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to send 6-digit OTP. Please verify your email address and SMTP secrets.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (resetNewPassword !== resetConfirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (resetNewPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-forgot-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetPasswordEmail.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset code.");
      }

      setOtp(['', '', '', '', '', '']);
      setOtpCreatedAt(Date.now());
      setOtpPurpose('forgot');

      if (data.simulation) {
        setSuccessMessage("Email dispatch simulated successfully! To send real Gmail messages, configure EMAIL_USER and EMAIL_PASS environment variables under Settings -> Secrets.");
      } else {
        setSuccessMessage("Real 6-digit OTP sent to your registered email address!");
      }
      setStep(2); // Go to OTP verification step
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while dispatching the email OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Direct Login Bypasses for specific test credentials
        const identifier = formData.email?.toLowerCase().trim();
        const isBypassAdmin = identifier === 'admin' || identifier === 'admin@health.ai';
        const isBypassUser = identifier === 'user' || identifier === 'user@health.ai';
        
        if ((isBypassAdmin && formData.password === 'admin123') || 
            (isBypassUser && formData.password === 'user123')) {
          
          const role = isBypassAdmin ? 'admin' : 'user';
          const name = role === 'admin' ? 'System Administrator' : 'Default Tester';
          const uid = role === 'admin' ? 'admin-bypass-id' : 'user-bypass-id';

          await setDoc(doc(db, 'users', uid), {
            id: uid,
            name,
            email: role === 'admin' ? 'admin@health.ai' : 'user@health.ai',
            role,
            photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            updatedAt: serverTimestamp()
          }, { merge: true });

          await logUserActivity(uid, name, 'login', 'Logged in via Admin/Tester bypass credentials');
          localStorage.setItem('authBypassUser', JSON.stringify({ uid, role, name }));
          window.location.href = '/dashboard';
          return;
        }

        // Custom Backend Authenticator Fallback (to support reset passwords)
        if (formData.email) {
          try {
            const bypassRes = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email.trim(), password: formData.password })
            });
            const bypassData = await bypassRes.json();
            if (bypassRes.ok && bypassData.success) {
              await logUserActivity(bypassData.user.uid, bypassData.user.name, 'login', 'Logged in with email & password (Custom DB validation)');
              localStorage.setItem('authBypassUser', JSON.stringify({
                uid: bypassData.user.uid,
                role: bypassData.user.role,
                name: bypassData.user.name
              }));
              window.location.href = '/dashboard';
              return;
            }
          } catch (dbAuthErr) {
            console.warn("Custom db login fallback failed:", dbAuthErr);
          }
        }

        // Standard Login
        if (!formData.email) {
          throw new Error("Please enter your email to sign in");
        }
        const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        let userDocSnap = await getDoc(doc(db, 'users', cred.user.uid));
        
        if (!userDocSnap.exists()) {
          // Self-healing migration wrapper: check for custom_uid_ user matching the email
          const qCheck = query(collection(db, 'users'), where('email', '==', formData.email.trim().toLowerCase()));
          const sCheck = await getDocs(qCheck);
          if (!sCheck.empty) {
            const oldDoc = sCheck.docs[0];
            const oldData = oldDoc.data();
            
            // Recreate the document using the real signed-in Firebase Auth UID
            await setDoc(doc(db, 'users', cred.user.uid), {
              ...oldData,
              id: cred.user.uid,
              updatedAt: serverTimestamp()
            });
            
            // Securely purge the obsolete custom UID record
            await deleteDoc(doc(db, 'users', oldDoc.id));
            
            // Reload the document snapshot
            userDocSnap = await getDoc(doc(db, 'users', cred.user.uid));
          } else {
            await auth.signOut();
            throw new Error("Your profile could not be found or has been deleted. Please register again to log back in.");
          }
        }
        
        const finalName = userDocSnap.data()?.name || 'User';
        await logUserActivity(cred.user.uid, finalName, 'login', 'Logged in with email & password (Standard Authentication)');
        window.location.href = '/dashboard';
      } else {
        // Registration Logic -> Triggers OTP step
        await startRegisterFlow();
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login instead.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError(null);

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError("Please key in the full 6-digit verification code.");
      setLoading(false);
      return;
    }

    try {
      if (otpPurpose === 'register') {
        const response = await fetch('/api/auth/verify-register-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            gender: formData.gender,
            dob: formData.dob,
            email: formData.email.trim(),
            mobile: formData.mobile,
            address: formData.address,
            password: formData.password,
            code: otpCode
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Verification failed. Please check your code and try again.");
        }

        setSuccessMessage("Account registered successfully! Automatically logging you in...");
        setNotification(null);
        setStep(1);
        setIsLogin(true);

        // Auto login via Firebase auth first, fallback to custom session storage on failure
        try {
          await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        } catch (autoLoginErr) {
          console.warn("Standard client Firebase auto-login failed. Bypassing safely to dashboard:", autoLoginErr);
          localStorage.setItem('authBypassUser', JSON.stringify({
            uid: data.user.uid,
            role: 'user',
            name: data.user.name
          }));
        }
        window.location.href = '/dashboard';

      } else if (otpPurpose === 'forgot') {
        const response = await fetch('/api/auth/verify-forgot-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: resetPasswordEmail.trim(),
            code: otpCode,
            newPassword: resetNewPassword
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Password reset failed. Please check the code.");
        }

        setSuccessMessage("Password reset successfully! Automatically logging you in...");
        setNotification(null);
        setStep(1);
        setIsForgotPassword(false);
        setIsLogin(true);
        setFormData(prev => ({
          ...prev,
          email: resetPasswordEmail,
          password: resetNewPassword
        }));

        // Sign in client-side using standard credentials, fallback to custom Session Storage
        try {
          await signInWithEmailAndPassword(auth, resetPasswordEmail.trim(), resetNewPassword);
        } catch (autoLoginErr) {
          console.warn("Standard client Firebase forgot password auto-login failed. Bypassing safely:", autoLoginErr);
          localStorage.setItem('authBypassUser', JSON.stringify({
            uid: data.user.uid,
            role: data.user.role || 'user',
            name: data.user.name || 'User'
          }));
        }
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error("OTP Validation Action error:", err);
      setError(err.message || "Failed to verify. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      // Force select account to prevent automatic login with wrong account
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      
      // Sync to Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      const email = (result.user.email || '').toLowerCase();
      const isAdminEmail = email === 'cc9152655@gmail.com' || email === 'admin@health.ai';
      const role = isAdminEmail ? 'admin' : 'user';

      if (!userDoc.exists()) {
        if (isLogin) {
          await auth.signOut();
          throw new Error("No registered account found matching this Google profile. Please select 'Need an account? Sign Up' first to register.");
        }
        await setDoc(doc(db, 'users', result.user.uid), {
          id: result.user.uid,
          name: result.user.displayName,
          email: result.user.email,
          mobile: result.user.phoneNumber || '',
          role: role,
          photo: result.user.photoURL,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (isAdminEmail && userDoc.data().role !== 'admin') {
        // Automatically upgrade existing creator's account to admin
        await setDoc(doc(db, 'users', result.user.uid), {
          role: 'admin',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      await logUserActivity(result.user.uid, result.user.displayName || 'Google User', 'login', 'Logged in using Google Sign-In authentication');
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error("Google Auth failed:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login popup was closed before completion. Please try again and keep the window open.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Login request cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("The login popup was blocked by your browser. Please allow popups for this site.");
      } else {
        setError("Google Login failed. Ensure this domain is added to 'Authorized Domains' in the Firebase Console.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 flex justify-center items-center min-h-[80vh]">
      <AnimatePresence>
        {notification && notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-4 shadow-2xl flex items-start gap-4 text-white">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center flex-shrink-0 text-black">
                {notification.type === 'sms' ? <Smartphone className="w-5 h-5 text-black" /> : <Mail className="w-5 h-5 text-black" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider">
                    {notification.type === 'sms' ? '💬 Incoming SMS' : '📧 Incoming Gmail'}
                  </span>
                  <span className="text-[10px] text-white/40">just now</span>
                </div>
                <p className="text-sm font-bold text-white mb-0.5">{notification.sender}</p>
                <p className="text-[10px] text-white/40 mb-2">{notification.senderInfo}</p>
                <p className="text-xs text-white/70 bg-white/5 rounded-lg p-2 border border-white/5 font-mono">
                  {notification.message}{' '}
                  <span className="text-brand-primary font-black text-base tracking-widest bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
                    {notification.code}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="text-white/20 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="recaptcha-container"></div>
      <div className="w-full max-w-lg relative">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-brand-primary/5 blur-[100px] pointer-events-none -z-10 rounded-full" />

        <div className="glass-card p-8 md:p-12 relative overflow-hidden shadow-2xl">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-500 text-sm"
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-brand-primary" />
              {successMessage}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex flex-col items-center mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center mb-6 shadow-lg shadow-brand-primary/20">
                    <ShieldCheck className="w-8 h-8 text-black" />
                  </div>
                  <h1 className="text-3xl font-black mb-2 uppercase tracking-tightest">
                    {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
                  </h1>
                  <p className="text-white/40 text-sm text-center">
                    {isForgotPassword ? "Enter your email and new password to reset it" : isLogin ? "Enter your credentials to access your dashboard" : "Join the future of healthcare prediction"}
                  </p>
                </div>

                {isForgotPassword ? (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        key="forgot-email"
                        type="email"
                        placeholder="Registered Email Account"
                        required
                        value={resetPasswordEmail}
                        onChange={(e) => setResetPasswordEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        key="forgot-new-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="New Password (min 6 characters)"
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        key="forgot-confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                      />
                    </div>

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full btn-primary py-4 flex items-center justify-center gap-2 group mt-4 disabled:opacity-50"
                    >
                      {loading ? "Resetting Password..." : "Submit New Password"}
                      {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="text-center mt-8">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setError(null);
                        }}
                        className="text-white/40 hover:text-brand-primary text-sm font-medium transition-all"
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                              key="auth-name"
                              type="text"
                              name="name"
                              placeholder="Full Name"
                              required
                              value={formData.name || ''}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <select
                              key="auth-gender"
                              name="gender"
                              value={formData.gender || 'Male'}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all appearance-none text-white"
                              onChange={handleInputChange}
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black uppercase tracking-wider">DOB</span>
                            <input
                              key="auth-dob"
                              type="date"
                              name="dob"
                              required
                              value={formData.dob || ''}
                              max={new Date().toISOString().split('T')[0]}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-14 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all text-white text-sm"
                              onChange={(e) => {
                                const dobVal = e.target.value;
                                const calculated = calculateAge(dobVal);
                                setFormData(prev => ({
                                  ...prev,
                                  dob: dobVal,
                                  age: calculated.toString()
                                }));
                              }}
                            />
                          </div>
                          {formData.age && (
                            <div className="text-[10px] font-black text-brand-primary/80 uppercase tracking-widest ml-1">
                              Calculated Age: {formData.age} Years
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        key={isLogin ? "auth-email-login" : "auth-email-register"}
                        type="text"
                        name="email"
                        placeholder="Email Address"
                        required
                        value={formData.email || ''}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                        onChange={handleInputChange}
                      />
                    </div>

                    {!isLogin && (
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          key="auth-mobile"
                          type="tel"
                          name="mobile"
                          placeholder="Mobile Number"
                          required
                          value={formData.mobile || ''}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    {!isLogin && (
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          key="auth-address"
                          type="text"
                          name="address"
                          placeholder="Residential Address"
                          required
                          value={formData.address || ''}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        key={isLogin ? "auth-password-login" : "auth-password-register"}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder={isLogin ? "Password" : "Create Password"}
                        required
                        value={formData.password || ''}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {isLogin && (
                      <div className="text-right mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setError(null);
                            setSuccessMessage(null);
                          }}
                          className="text-xs text-brand-primary/80 hover:text-brand-primary transition-all font-bold"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}

                    {!isLogin && (
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                          key="auth-confirm-password"
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          required
                          value={formData.confirmPassword || ''}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 focus:ring-2 focus:ring-brand-primary outline-none transition-all placeholder:text-white/20 text-white"
                          onChange={handleInputChange}
                        />
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full btn-primary py-4 flex items-center justify-center gap-2 group mt-4 disabled:opacity-50"
                    >
                      {loading ? "Please wait..." : isLogin ? "Sign In" : "Register Now"}
                      {!loading && <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    <div className="flex items-center gap-4 my-8">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-white/20 text-xs uppercase font-bold tracking-widest">Or Continue With</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div className="flex justify-center">
                      <button 
                        onClick={handleGoogleLogin} 
                        type="button" 
                        className="w-full flex items-center justify-center gap-3 h-12 rounded-xl bg-white/5 border border-white/10 transition-all text-white/60 hover:bg-white/10 hover:text-white font-bold"
                      >
                         <Chrome className="w-5 h-5 text-red-500" />
                         Continue with Google
                      </button>
                    </div>

                    <div className="text-center mt-8">
                      <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white/40 hover:text-brand-primary text-sm font-medium transition-all"
                      >
                        {isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In"}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-8">
                  <Mail className="w-8 h-8 text-brand-primary" />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">Verify Identity</h2>
                <p className="text-white/40 text-sm text-center mb-10 max-w-xs animate-pulse">
                  We've sent a 6-digit verification code to <span className="text-white font-medium">{otpPurpose === 'register' ? formData.email : resetPasswordEmail}</span>
                </p>

                <div className="flex gap-3 mb-10">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all text-white"
                    />
                  ))}
                </div>

                <button 
                  onClick={verifyOtp}
                  disabled={loading}
                  className="w-full btn-primary py-4 mb-4 disabled:slate-600 disabled:opacity-50 text-sm font-semibold tracking-wide"
                >
                  {loading ? "Verifying OTP..." : "Verify OTP"}
                </button>
                <button 
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    setSuccessMessage(null);
                    try {
                      setOtp(['', '', '', '', '', '']);
                      
                      if (otpPurpose === 'register') {
                        const response = await fetch('/api/auth/send-register-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: formData.email.trim() })
                        });
                        const data = await response.json();
                        if (!response.ok) {
                          throw new Error(data.error || "Failed to resend code.");
                        }
                        if (data.simulation) {
                          setSuccessMessage("New verification code simulated content logged successfully. To send real emails, please configure your secrets.");
                        } else {
                          setSuccessMessage("New verification code sent successfully.");
                        }
                      } else {
                        const response = await fetch('/api/auth/send-forgot-otp', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: resetPasswordEmail.trim() })
                        });
                        const data = await response.json();
                        if (!response.ok) {
                          throw new Error(data.error || "Failed to resend code.");
                        }
                        if (data.simulation) {
                          setSuccessMessage("New verification code simulated content logged successfully. To send real emails, please configure your secrets.");
                        } else {
                          setSuccessMessage("New verification code sent successfully.");
                        }
                      }
                    } catch (err: any) {
                      console.error("Resend OTP Error:", err);
                      setError(err.message || "Failed to resend verification code.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full text-center text-white/40 hover:text-white transition-colors text-xs font-semibold py-2 tracking-wide disabled:opacity-30"
                >
                  Resend OTP
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
