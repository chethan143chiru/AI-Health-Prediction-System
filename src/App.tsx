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
    // Check for bypass session first
    const checkBypassUser = async () => {
      const bypassStr = localStorage.getItem('authBypassUser');
      if (bypassStr) {
        try {
          const bypassUser = JSON.parse(bypassStr);
          const userDoc = await getDoc(doc(db, 'users', bypassUser.uid));
          if (userDoc.exists()) {
            setUser({ ...bypassUser, ...userDoc.data() });
            setLoading(false);
            return;
          } else {
            localStorage.removeItem('authBypassUser');
          }
        } catch (e) {
          localStorage.removeItem('authBypassUser');
        }
      }

      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          // Fetch additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            setUser({ ...fbUser, ...userDoc.data() });
          } else {
            // User was deleted! Prevent access and sign out
            await signOut(auth);
            localStorage.removeItem('authBypassUser');
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    let unsub: any;
    checkBypassUser().then(fn => {
      if (typeof fn === 'function') unsub = fn;
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const handleLogout = async () => {
    try {
      if (user) {
        const uid = user.uid || user.id;
        const name = user.name || user.displayName || 'User';
        await logUserActivity(uid, name, 'logout', 'User explicitly signed out of the active session');
      }
      await signOut(auth);
      localStorage.removeItem('authBypassUser');
      setUser(null);
      window.location.href = '/';
    } catch (err) {
      console.error("Logout failed:", err);
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
          
          {/* Admin Route - Redirect Users to Home/Dashboard */}
          <Route path="/admin" element={user?.role === 'admin' ? <Admin /> : <Navigate to="/" />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

