import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, deleteDoc, getDoc, addDoc, setDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { initializeApp as initAdminApp, getApps as getAdminApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function sendEmailWithOtp(target: string, code: string, purpose: 'register' | 'forgot') {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  const senderEmail = emailUser || 'healthaiprediction@gmail.com';
  const mailSubject = 'Health.ai Email Verification Code';
  const plainTextTemplate = `Welcome to Health.ai\n\nYour One-Time Password (OTP) for account verification is:\n\n${code}\n\nThis OTP is valid for 5 minutes.\n\nFor security reasons, do not share this code with anyone.\n\nIf you did not request this verification, please ignore this email.\n\nRegards,\nHealth.ai Security Team`;
  
  const htmlTemplate = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; background-color: #0a0a0a; color: #ffffff; max-width: 550px; margin: auto; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 20px;">
        <h2 style="color: #10B981; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.03em; text-transform: uppercase;">HEALTH.AI</h2>
        <p style="color: rgba(255,255,255,0.4); font-size: 13px; margin: 6px 0 0 0; letter-spacing: 0.15em; text-transform: uppercase;">Predict. Prevent. Protect.</p>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: rgba(255, 255, 255, 0.8);">Welcome to Health.ai</p>
      <p style="font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.7);">Your One-Time Password (OTP) for account verification is:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; font-size: 38px; font-weight: 800; letter-spacing: 6px; background-color: rgba(16, 185, 129, 0.1); color: #10B981; padding: 14px 28px; border-radius: 12px; border: 2px solid rgba(16, 185, 129, 0.2); font-family: monospace;">
          ${code}
        </div>
        <p style="font-size: 13px; color: rgba(255,255,255,0.3); margin: 12px 0 0 0;">This OTP is valid for <strong>5 minutes</strong>.</p>
      </div>
      
      <div style="background-color: rgba(255,255,255,0.02); border-radius: 10px; padding: 18px; border-left: 4px solid #10B981; margin-bottom: 26px;">
        <p style="font-size: 13px; color: rgba(255,255,255,0.6); margin: 0; line-height: 1.5;">
          For security reasons, do not share this code with anyone. If you did not request this verification, please ignore this email.
        </p>
      </div>
      
      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; font-size: 11px; color: rgba(255,255,255,0.3); text-align: center;">
        <p style="margin: 0 0 4px 0;">Regards,</p>
        <p style="margin: 0; font-weight: 600; color: rgba(255,255,255,0.5);">Health.ai Security Team</p>
      </div>
    </div>
  `;

  if (!emailUser || !emailPass) {
    console.warn("[nodemailer] EMAIL_USER and EMAIL_PASS environment variables are not set. Logging email content instead.");
    console.log(`\n========================================\n[SMTP SIMULATION] Gmail to: ${target}\nFrom: ${senderEmail}\nSubject: ${mailSubject}\n----------------------------------------\n${plainTextTemplate}\n========================================\n`);
    return { success: true, simulation: true };
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465');
  const smtpSecure = process.env.SMTP_SECURE !== 'false';

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"HEALTH.AI" <${senderEmail}>`,
    to: target,
    subject: mailSubject,
    text: plainTextTemplate,
    html: htmlTemplate
  };

  await transporter.verify();
  await transporter.sendMail(mailOptions);
  return { success: true, simulation: false };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase App on the server for Admin operations
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const fbApp = initializeApp(firebaseConfig);
    db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId || firebaseConfig.projectId);
    console.log("Firebase client initialized on the server successfully");

    // Initialize Firebase Admin SDK for user authentication profile management (Auth deletions)
    if (getAdminApps().length === 0) {
      initAdminApp({
        projectId: firebaseConfig.projectId
      });
      console.log("Firebase Admin SDK successfully initialized on the server!");
    }
  } catch (err) {
    console.error("Failed to initialize Firebase on the server:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'AI Health Prediction System' });
  });

  // API Route: Send Registration OTP (via Gmail SMTP or Simulation)
  app.post('/api/auth/send-register-otp', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    if (!db) {
      return res.status(500).json({ error: "Database not initialized on server" });
    }

    const emailLower = email.toLowerCase().trim();

    try {
      // 1. Prevent duplicate account creation
      const userCheck = query(collection(db, 'users'), where('email', '==', emailLower));
      const userSnap = await getDocs(userCheck);
      if (!userSnap.empty) {
        return res.status(400).json({ error: "An account with this email address already exists. Please login instead." });
      }

      // 2. Fetch any pending OTP for resend limits
      const otpCheck = query(
        collection(db, 'otps'),
        where('email', '==', emailLower),
        where('verification_status', '==', 'pending')
      );
      const otpSnap = await getDocs(otpCheck);
      
      let resendCount = 0;
      if (!otpSnap.empty) {
        const mostRecent = otpSnap.docs[0];
        const data = mostRecent.data();
        
        // Allow resend only after 30 seconds
        const ageSeconds = (Date.now() - new Date(data.otp_created_time).getTime()) / 1000;
        if (ageSeconds < 30) {
          return res.status(400).json({ error: "Please wait 30 seconds before requesting a new OTP." });
        }
        
        resendCount = (data.resend_count || 0) + 1;
        if (resendCount > 5) {
          return res.status(400).json({ error: "Maximum resend attempts (5) exceeded. Please wait or contact support." });
        }

        // Invalidate previous OTP
        await updateDoc(doc(db, 'otps', mostRecent.id), {
          verification_status: 'superseded'
        });
      }

      // 3. Generate random 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const createdTime = new Date();
      const expiryTime = new Date(createdTime.getTime() + 5 * 60 * 1000); // 5 minutes

      // 4. Save OTP reference securely in Firestore
      await addDoc(collection(db, 'otps'), {
        user_id: 'pending-register',
        email: emailLower,
        otp_code: code,
        otp_created_time: createdTime.toISOString(),
        otp_expiry_time: expiryTime.toISOString(),
        verification_status: 'pending',
        resend_count: resendCount,
        verification_attempts: 0
      });

      // 5. Dispatch email via transporter
      const mailRes = await sendEmailWithOtp(emailLower, code, 'register');

      return res.json({ 
        success: true, 
        simulation: mailRes.simulation,
        message: mailRes.simulation 
          ? "Verification code simulated content logged successfully." 
          : "Verification code has been sent to your email address." 
      });
    } catch (err: any) {
      console.error("Error sending register OTP:", err);
      return res.status(500).json({ error: err.message || "Failed to send verification code." });
    }
  });

  // API Route: Send Forgot Password OTP
  app.post('/api/auth/send-forgot-otp', async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email address is required" });
    }

    if (!db) {
      return res.status(500).json({ error: "Database not initialized on server" });
    }

    const emailLower = email.toLowerCase().trim();

    try {
      // 1. Ensure user account exists
      const userCheck = query(collection(db, 'users'), where('email', '==', emailLower));
      const userSnap = await getDocs(userCheck);
      if (userSnap.empty) {
        return res.status(404).json({ error: "No user found with this email" });
      }

      const userId = userSnap.docs[0].id;

      // 2. Fetch pending OTP for resend limits
      const otpCheck = query(
        collection(db, 'otps'),
        where('email', '==', emailLower),
        where('verification_status', '==', 'pending')
      );
      const otpSnap = await getDocs(otpCheck);
      
      let resendCount = 0;
      if (!otpSnap.empty) {
        const mostRecent = otpSnap.docs[0];
        const data = mostRecent.data();
        
        // Allow resend only after 30 seconds
        const ageSeconds = (Date.now() - new Date(data.otp_created_time).getTime()) / 1000;
        if (ageSeconds < 30) {
          return res.status(400).json({ error: "Please wait 30 seconds before requesting a new OTP." });
        }
        
        resendCount = (data.resend_count || 0) + 1;
        if (resendCount > 5) {
          return res.status(400).json({ error: "Maximum resend attempts (5) reached." });
        }

        // Invalidate previous OTP
        await updateDoc(doc(db, 'otps', mostRecent.id), {
          verification_status: 'superseded'
        });
      }

      // 3. Generate internal 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const createdTime = new Date();
      const expiryTime = new Date(createdTime.getTime() + 5 * 60 * 1000); // 5 minutes

      // 4. Save to Firestore
      await addDoc(collection(db, 'otps'), {
        user_id: userId,
        email: emailLower,
        otp_code: code,
        otp_created_time: createdTime.toISOString(),
        otp_expiry_time: expiryTime.toISOString(),
        verification_status: 'pending',
        resend_count: resendCount,
        verification_attempts: 0
      });

      // 5. Send verification email
      const mailRes = await sendEmailWithOtp(emailLower, code, 'forgot');

      return res.json({ 
        success: true, 
        simulation: mailRes.simulation,
        message: mailRes.simulation 
          ? "Verification code simulated content logged successfully." 
          : "Verification code has been sent to your email address." 
      });
    } catch (err: any) {
      console.error("Error sending forgot OTP:", err);
      return res.status(500).json({ error: err.message || "Failed to send reset code." });
    }
  });

  // API Route: Verify Register OTP & Securely Create Account
  app.post('/api/auth/verify-register-otp', async (req, res) => {
    const { name, gender, dob, email, mobile, address, password, code } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({ error: "Email, verification code and password are required." });
    }

    if (!db) {
      return res.status(500).json({ error: "Database not initialized on server" });
    }

    const emailLower = email.toLowerCase().trim();

    try {
      // 1. Fetch pending OTP
      const q = query(
        collection(db, 'otps'),
        where('email', '==', emailLower),
        where('verification_status', '==', 'pending')
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return res.status(400).json({ error: "No pending verification found. Please request a new OTP." });
      }

      const otpDoc = snap.docs[0];
      const otpData = otpDoc.data();

      // 2. Expiration check
      if (Date.now() > new Date(otpData.otp_expiry_time).getTime()) {
        await updateDoc(doc(db, 'otps', otpDoc.id), {
          verification_status: 'expired'
        });
        return res.status(400).json({ error: "OTP has expired. Request a new code." });
      }

      // 3. Brute-force protection tracking
      const attempts = (otpData.verification_attempts || 0) + 1;
      await updateDoc(doc(db, 'otps', otpDoc.id), {
        verification_attempts: attempts
      });

      if (attempts > 5) {
        await updateDoc(doc(db, 'otps', otpDoc.id), {
          verification_status: 'failed'
        });
        return res.status(400).json({ error: "Maximum verification attempts (5) exceeded. Please request a new OTP." });
      }

      // 4. Validate Code match
      if (code !== otpData.otp_code) {
        return res.status(400).json({ error: "Invalid OTP. Please try again." });
      }

      // 5. Mark OTP as verified
      await updateDoc(doc(db, 'otps', otpDoc.id), {
        verification_status: 'verified'
      });

      // 6. Calculate real age based on Date of Birth
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // 7. Securely Hash Password
      const hashedPassword = hashPassword(password);

      // 8. Create user auth record in Firebase Admin Auth
      let uid = "uid_" + Math.random().toString(36).substring(2, 11);
      try {
        const userRecord = await getAdminAuth().createUser({
          email: emailLower,
          password: password,
          displayName: name,
        });
        uid = userRecord.uid;
        console.log(`[firebase-admin] Created authenticated auth record: ${uid}`);
      } catch (adminErr: any) {
        console.warn("[firebase-admin] Optional admin side authenticated creation warning:", adminErr.message || adminErr);
        // Fallback to state-managed custom UID if auth user already exists or firebase-admin has offline mode
      }

      // 9. Persist verified profile inside Firestore
      await setDoc(doc(db, 'users', uid), {
        id: uid,
        name,
        email: emailLower,
        mobile,
        gender,
        age: age.toString(),
        dob,
        address,
        password: hashedPassword, // Store securely hashed password
        role: 'user',
        verified: true,
        photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Log activity
      await addDoc(collection(db, 'activities'), {
        userId: uid,
        userName: name,
        type: 'login',
        details: `Successfully completed email OTP verification and registered account!`,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      });

      return res.json({
        success: true,
        user: {
          uid,
          role: 'user',
          name
        },
        message: "Email verified successfully. Account created."
      });
    } catch (err: any) {
      console.error("Error verifying register OTP:", err);
      return res.status(500).json({ error: err.message || "Failed to verify registration code." });
    }
  });

  // API Route: Verify Forgot OTP & Complete Password Reset
  app.post('/api/auth/verify-forgot-otp', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code and new password are required." });
    }

    if (!db) {
      return res.status(500).json({ error: "Database not initialized on server" });
    }

    const emailLower = email.toLowerCase().trim();

    try {
      // 1. Find pending OTP
      const q = query(
        collection(db, 'otps'),
        where('email', '==', emailLower),
        where('verification_status', '==', 'pending')
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        return res.status(400).json({ error: "No pending verification found. Please request a new OTP." });
      }

      const otpDoc = snap.docs[0];
      const otpData = otpDoc.data();

      // 2. Expiration check
      if (Date.now() > new Date(otpData.otp_expiry_time).getTime()) {
        await updateDoc(doc(db, 'otps', otpDoc.id), {
          verification_status: 'expired'
        });
        return res.status(400).json({ error: "OTP has expired. Request a new code." });
      }

      // 3. Brute force tracker
      const attempts = (otpData.verification_attempts || 0) + 1;
      await updateDoc(doc(db, 'otps', otpDoc.id), {
        verification_attempts: attempts
      });

      if (attempts > 5) {
        await updateDoc(doc(db, 'otps', otpDoc.id), {
          verification_status: 'failed'
        });
        return res.status(400).json({ error: "Maximum verification attempts (5) exceeded. Please request a new OTP." });
      }

      // 4. Validate OTP match
      if (code !== otpData.otp_code) {
        return res.status(400).json({ error: "Invalid OTP. Please try again." });
      }

      // 5. Mark OTP as verified
      await updateDoc(doc(db, 'otps', otpDoc.id), {
        verification_status: 'verified'
      });

      // 6. Fetch user profile
      const userCheck = query(collection(db, 'users'), where('email', '==', emailLower));
      const userSnap = await getDocs(userCheck);
      if (userSnap.empty) {
        return res.status(404).json({ error: "Associated user profile could not be located." });
      }

      const userDoc = userSnap.docs[0];
      const targetUid = userDoc.id;

      // 7. Secure Hashing & Update
      const hashedPassword = hashPassword(newPassword);

      try {
        await getAdminAuth().updateUser(targetUid, {
          password: newPassword
        });
      } catch (adminErr) {
        console.warn("[firebase-admin] Optional admin user update warning:", adminErr);
      }

      await updateDoc(doc(db, 'users', targetUid), {
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      });

      // Log success
      await addDoc(collection(db, 'activities'), {
        userId: targetUid,
        userName: userDoc.data().name || 'User',
        type: 'profile_update',
        details: `Successfully completed password reset using secure OTP verification`,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      });

      return res.json({
        success: true,
        user: {
          uid: targetUid,
          role: userDoc.data().role || 'user',
          name: userDoc.data().name || 'User'
        },
        message: "Email verified successfully. Password reset completed."
      });
    } catch (err: any) {
      console.error("Error resetting password via OTP:", err);
      return res.status(500).json({ error: err.message || "Failed to reset password." });
    }
  });

  // API Route: Reset Password
  app.post('/api/auth/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required" });
    }

    if (!db) {
      return res.status(500).json({ error: "Database not initialized on server" });
    }

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return res.status(404).json({ error: "No user found with this email" });
      }

      const userDoc = snapshot.docs[0];
      const hashedPassword = hashPassword(newPassword);
      await updateDoc(doc(db, 'users', userDoc.id), {
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      });

      return res.json({ success: true, message: "Password updated successfully!" });
    } catch (err: any) {
      console.error("Server Reset Password Error:", err);
      return res.status(500).json({ error: err.message || "Failed to reset password" });
    }
  });

  // API Route: Login Bypasser / Custom Authenticator
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!db) {
      return res.status(500).json({ error: "Database not initialized on server" });
    }

    try {
      const q = query(collection(db, 'users'), where('email', '==', email));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return res.status(401).json({ error: "User not found" });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      const inputHash = hashPassword(password);
      if (userData.password === password || userData.password === inputHash) {
        return res.json({
          success: true,
          user: {
            uid: userDoc.id,
            role: userData.role || 'user',
            name: userData.name || 'User'
          }
        });
      } else {
        return res.status(401).json({ error: "Incorrect password" });
      }
    } catch (err: any) {
      console.error("Server Login Error:", err);
      return res.status(500).json({ error: err.message || "Authentication error" });
    }
  });

  // API Route: Delete User (Admin only)
  app.post('/api/admin/delete-user', async (req, res) => {
    const { userId, requesterId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!db) {
      return res.status(500).json({ error: "Database not initialized on server" });
    }

    // Prevention of deletion of default system users
    const isProtected = userId === 'admin-bypass-id' || userId === 'user-bypass-id';
    if (isProtected) {
      return res.status(403).json({ error: "System Integrity Violation: The System Administrator account (admin@health.ai) and Default Tester account (user@health.ai) are designated high-level assets and cannot be deleted." });
    }

    try {
      // Validate that the requester is an admin or is the admin bypass ID
      let isRequesterAdmin = false;
      let requesterName = 'Admin Controller';
      if (requesterId === 'admin-bypass-id') {
        isRequesterAdmin = true;
      } else if (requesterId) {
        const reqDoc = await getDocs(query(collection(db, 'users'), where('id', '==', requesterId)));
        if (!reqDoc.empty) {
          const reqData = reqDoc.docs[0].data();
          requesterName = reqData.name || 'System Administrator';
          if (reqData.role === 'admin') {
            isRequesterAdmin = true;
          }
        }
      }

      if (!isRequesterAdmin) {
        return res.status(403).json({ error: "Unauthorized. Admin privileges required." });
      }

      // Check if target user doc exists and check email block
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      let targetUserName = 'Deleted User';
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        targetUserName = userData.name || 'Deleted User';
        const targetEmail = (userData.email || '').toLowerCase();
        if (targetEmail === 'admin@health.ai' || targetEmail === 'user@health.ai') {
          return res.status(403).json({ error: "System Integrity Violation: The System Administrator account (admin@health.ai) and Default Tester account (user@health.ai) contain critical routing metadata and cannot be deleted." });
        }
      }

      // Delete the user document in firestore
      await deleteDoc(userDocRef);

      // Also delete the user from Firebase Authentication completely so they can register again
      try {
        console.log(`[firebase-admin] Triggering deletion of user auth record for UID: ${userId}`);
        await getAdminAuth().deleteUser(userId);
        console.log(`[firebase-admin] Successfully deleted Firebase Auth user ${userId}`);
      } catch (authErr: any) {
        console.warn(`[firebase-admin] Non-fatal auth deletion warning for ${userId}:`, authErr.message || authErr);
      }

      // Also clean up any prediction documents belonging to this user
      const predictionsSnap = await getDocs(query(collection(db, 'predictions'), where('userId', '==', userId)));
      for (const predDoc of predictionsSnap.docs) {
        await deleteDoc(doc(db, 'predictions', predDoc.id));
      }

      // Log the deletion activity
      await addDoc(collection(db, 'activities'), {
        userId: requesterId || 'admin-bypass-id',
        userName: requesterName,
        type: 'profile_update',
        details: `Deleted user: ${targetUserName} (UID: ${userId}) and securely purged all associated diagnostic records`,
        timestamp: new Date().toISOString(),
        createdAt: new Date()
      });

      return res.json({ success: true, message: "User and their records deleted successfully!" });
    } catch (err: any) {
      console.error("Server Delete User Error:", err);
      return res.status(500).json({ error: err.message || "Failed to delete user" });
    }
  });

  // Example API for symptom prediction simulation (though we'll do GenAI on frontend usually)
  app.post('/api/predict-disease-sim', (req, res) => {
    const { symptoms } = req.body;
    // This is just a placeholder for server-side logic if needed
    res.json({ 
      prediction: "Potential Cold", 
      probability: 0.85, 
      risk: "Low",
      healthScore: 75
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
