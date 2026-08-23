/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/src/components/Layout';
import Home from '@/src/pages/Home';
import About from '@/src/pages/About';
import Contact from '@/src/pages/Contact';
import Auth from '@/src/pages/Auth';
import Dashboard from '@/src/pages/Dashboard';
import History from '@/src/pages/History';
import Profile from '@/src/pages/Profile';
import Admin from '@/src/pages/Admin';
import MentalHealth from '@/src/pages/MentalHealth';
import { auth, db } from '@/src/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { logUserActivity } from '@/src/lib/activity';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial fast hydration from local storage if present
    const bypassStr = localStorage.getItem('authBypassUser');
    if (bypassStr) {
      try {
        const bypassUser = JSON.parse(bypassStr);
        if (bypassUser && (bypassUser.uid || bypassUser.id)) {
          setUser(bypassUser);
          setLoading(false);
          // Sync background user doc if possible
          getDoc(doc(db, 'users', bypassUser.uid || bypassUser.id))
            .then(userDoc => {
              if (userDoc.exists()) {
                setUser((prev: any) => ({ ...prev, ...userDoc.data() }));
              }
            })
            .catch(err => {
              console.warn("Background user doc sync notice:", err);
            });
        }
      } catch (e) {
        localStorage.removeItem('authBypassUser');
      }
    }

    // 2. Always maintain live Firebase auth subscription
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({ ...fbUser, ...data });
          } else {
            const email = (fbUser.email || '').toLowerCase();
            const isAdmin = email === 'cc9152655@gmail.com' || email === 'admin@health.ai';
            setUser({
              uid: fbUser.uid,
              id: fbUser.uid,
              email: fbUser.email,
              name: fbUser.displayName || 'User',
              photo: fbUser.photoURL,
              role: isAdmin ? 'admin' : 'user'
            });
          }
        } catch (e) {
          setUser(fbUser);
        }
      } else {
        // If not authenticated in Firebase, only keep bypass user if explicitly in local storage
        const currentBypass = localStorage.getItem('authBypassUser');
        if (currentBypass) {
          try {
            setUser(JSON.parse(currentBypass));
          } catch (err) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // 1. Immediately wipe all local credentials
    localStorage.removeItem('authBypassUser');
    localStorage.removeItem('health_ai_admin_auth');
    sessionStorage.clear();
    setUser(null);

    // 2. Log activity and call Firebase signOut
    try {
      if (user) {
        const uid = user.uid || user.id;
        const name = user.name || user.displayName || 'User';
        await logUserActivity(uid, name, 'logout', 'User explicitly signed out of the active session').catch(() => {});
      }
      await signOut(auth).catch(() => {});
    } catch (err) {
      console.error("Logout process notice:", err);
    } finally {
      // 3. Guarantee immediate redirect to public home
      window.location.replace('/');
    }
  };

  if (loading) return null; // Or a loading spinner

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/team" element={<Navigate to="/contact" replace />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected User Routes - Redirect Admin to Admin Panel */}
          <Route path="/dashboard" element={
            !user ? <Navigate to="/auth" /> : 
            user.role === 'admin' ? <Navigate to="/admin" /> : 
            <Dashboard />
          } />
          <Route path="/history" element={
            !user ? <Navigate to="/auth" /> : 
            user.role === 'admin' ? <Navigate to="/admin" /> : 
            <History />
          } />
          <Route path="/mental-health" element={
            !user ? <Navigate to="/auth" /> : 
            user.role === 'admin' ? <Navigate to="/admin" /> : 
            <MentalHealth />
          } />
          
          {/* Profile is shared but usually specialized for the auth-ed user */}
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
          
          {/* Admin Route - Allow Admin or Super Admin access */}
          <Route path="/admin" element={
            user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'superadmin' || localStorage.getItem('health_ai_admin_auth') === 'true' 
              ? <Admin user={user} onLogout={handleLogout} /> 
              : <Navigate to="/auth" />
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

