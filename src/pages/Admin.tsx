import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Trash2, ShieldCheck, Database, Search, 
  ChevronRight, ArrowUpRight, CheckCircle2, AlertTriangle, MessageSquarePlus, Loader2, LogOut,
  X, Activity, Calendar, Clock, User, MapPin, Mail, Phone, Shield
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { auth, db } from '@/src/lib/firebase';
import { collection, query, getDocs, deleteDoc, doc, orderBy, limit, where, updateDoc } from 'firebase/firestore';
import PredictionResult from '@/src/components/PredictionResult';
import { logUserActivity } from '@/src/lib/activity';

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTip, setNewTip] = useState("");
  const [counts, setCounts] = useState({ users: 0, predictions: 0 });

  const [selectedUserActivities, setSelectedUserActivities] = useState<any[]>([]);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<any>(null);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
  const [filterText, setFilterText] = useState("");

  const [globalActivities, setGlobalActivities] = useState<any[]>([]);
  const [selectedUserSessionLogs, setSelectedUserSessionLogs] = useState<any[]>([]);
  const [drawerTab, setDrawerTab] = useState<'profile' | 'predictions' | 'logs'>('profile');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const predictionsSnap = await getDocs(collection(db, 'predictions'));
        
        setUsers(usersData);
        setCounts({
          users: usersSnap.size,
          predictions: predictionsSnap.size
        });

        // Fetch Live Platform logs / audit trail
        const actSnap = await getDocs(collection(db, 'activities'));
        const actData = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actData.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.timestamp || 0).getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.timestamp || 0).getTime();
          return tB - tA;
        });
        setGlobalActivities(actData);
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const deleteUser = async (userObj: any) => {
    const id = userObj.id;
    const name = userObj.name || 'User';
    const email = (userObj.email || '').toLowerCase();

    // Protective check for admin and default tester
    const isProtected = 
      id === 'admin-bypass-id' || 
      id === 'user-bypass-id' || 
      email === 'admin@health.ai' || 
      email === 'user@health.ai';

    if (isProtected) {
      alert("System Action Blocked: High-level System Administrator (admin@health.ai) and Default Tester (user@health.ai) accounts are core configuration elements and cannot be deleted.");
      return;
    }

    if (confirm(`Are you sure you want to delete user: ${name} and all associated records? Once deleted, they must register again to log back in.`)) {
      try {
        const bypassUserStr = localStorage.getItem('authBypassUser');
        const bypassUser = bypassUserStr ? JSON.parse(bypassUserStr) : null;
        const activeUser = auth.currentUser || bypassUser;
        const requesterId = activeUser ? (activeUser.uid || activeUser.id) : null;

        const response = await fetch('/api/admin/delete-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: id, requesterId })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to delete user via backend");
        }

        setUsers(prev => prev.filter(u => u.id !== id));
        setSelectedUserForActivity(null); // Close the detail drawer upon successful deletion
        setCounts(prev => ({ 
          users: Math.max(0, prev.users - 1), 
          predictions: Math.max(0, prev.predictions - (data.deletedRecordsCount || 0)) 
        }));

        // Refresh global activity logs to show the deletion action
        const actSnap = await getDocs(collection(db, 'activities'));
        const actData = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actData.sort((a: any, b: any) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.timestamp || 0).getTime();
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.timestamp || 0).getTime();
          return tB - tA;
        });
        setGlobalActivities(actData);

        alert(`${name} and all their diagnostic logs have been securely deleted.`);
      } catch (err: any) {
        console.error("Delete user failed:", err);
        alert(`Failed to delete user: ${err.message || err}`);
      }
    }
  };

  const toggleVerification = async (userObj: any) => {
    const id = userObj.id;
    const currentVerification = !!userObj.verified;
    const targetStatus = !currentVerification;
    const name = userObj.name || 'User';

    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, {
        verified: targetStatus,
        updatedAt: new Date()
      });

      // Update local states instantly
      setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: targetStatus } : u));
      setSelectedUserForActivity(prev => prev && prev.id === id ? { ...prev, verified: targetStatus } : prev);

      // Log system audit activity
      const bypassUserStr = localStorage.getItem('authBypassUser');
      const bypassUser = bypassUserStr ? JSON.parse(bypassUserStr) : null;
      const activeUser = auth.currentUser || bypassUser;
      const adminId = activeUser ? (activeUser.uid || activeUser.id) : 'system-admin';

      await logUserActivity(
        adminId, 
        'System Administrator', 
        targetStatus ? 'verify' : 'unverify', 
        `System Administrator verified status updated to ${targetStatus ? 'VERIFIED' : 'UNVERIFIED'} for user ${name} (${userObj.email || 'No Email'})`
      );

      // Refresh global activities list
      const actSnap = await getDocs(collection(db, 'activities'));
      const actData = actSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      actData.sort((a: any, b: any) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return tB - tA;
      });
      setGlobalActivities(actData);

      alert(`Account status updated for ${name}: Now ${targetStatus ? 'Verified ✔' : 'Unverified ✘'}.`);
    } catch (err: any) {
      console.error("Failed to update user verification:", err);
      alert(`Error updating verification status: ${err.message || err}`);
    }
  };

  const fetchUserActivities = async (userObj: any) => {
    setSelectedUserForActivity(userObj);
    setLoadingActivities(true);
    setSelectedUserActivities([]);
    setSelectedUserSessionLogs([]);
    setDrawerTab('profile'); // Default to profile tab on load
    try {
      const predQuery = query(
        collection(db, 'predictions'),
        where('userId', '==', userObj.id)
      );
      
      const actQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userObj.id)
      );

      const [predSnapshot, actSnapshot] = await Promise.all([
        getDocs(predQuery),
        getDocs(actQuery)
      ]);

      const predictions = predSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const logs = actSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort predictionsdesc
      predictions.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.date || 0).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.date || 0).getTime();
        return dateB - dateA;
      });

      // Sort logs desc
      logs.sort((a: any, b: any) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return dateB - dateA;
      });

      setSelectedUserActivities(predictions);
      setSelectedUserSessionLogs(logs);
    } catch (err) {
      console.error("Failed to load user activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleAddTip = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`New health tip published: "${newTip}"`);
    setNewTip("");
  };

  const handleLogout = async () => {
    try {
      const bypassUserStr = localStorage.getItem('authBypassUser');
      const bypassUser = bypassUserStr ? JSON.parse(bypassUserStr) : null;
      const activeUser = auth.currentUser || bypassUser;
      if (activeUser) {
        const uid = activeUser.uid || activeUser.id;
        const name = activeUser.name || 'System Administrator';
        await logUserActivity(uid, name, 'logout', 'Admin safely terminated active administrative session');
      }
      await auth.signOut();
      localStorage.removeItem('authBypassUser');
      window.location.href = '/';
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
       <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-brand-accent" />
             </div>
             <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Administrative Cloud Controller</span>
           </div>
           <div className="flex items-center gap-6">
              <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tightest text-brand-accent">Admin <span className="text-white">Panel.</span></h1>
           </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {[
             { label: 'Total Users', value: counts.users.toString(), icon: Users, color: 'text-brand-primary' },
             { label: 'Total Analyses', value: counts.predictions.toString(), icon: Database, color: 'text-brand-accent' },
             { label: 'System Health', value: '100%', icon: CheckCircle2, color: 'text-emerald-400' }
           ].map((stat, i) => (
             <div key={i} className="glass-card px-6 py-3 min-w-[140px] flex flex-col items-center">
                <stat.icon className={cn("w-4 h-4 mb-1", stat.color)} />
                <span className="text-xl font-bold">{stat.value}</span>
                <span className="text-[9px] uppercase tracking-widest text-white/20 font-black">{stat.label}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* User Management Section */}
         <div className="lg:col-span-2 space-y-6">
            <div className="glass-card overflow-hidden">
               <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-brand-primary" /> Active Users</h2>
                  <div className="relative w-full sm:w-auto">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                     <input 
                       type="text" 
                       placeholder="Filter users..." 
                       value={filterText}
                       onChange={(e) => setFilterText(e.target.value)}
                       className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-brand-primary outline-none" 
                     />
                  </div>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-white/[0.02] border-b border-white/5">
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">User</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40">Role</th>
                           <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {users
                          .filter(u => {
                            const term = filterText.toLowerCase();
                            return (
                              (u.name || '').toLowerCase().includes(term) ||
                              (u.email || '').toLowerCase().includes(term) ||
                              (u.mobile || '').toLowerCase().includes(term) ||
                              (u.role || '').toLowerCase().includes(term)
                            );
                          })
                          .map((u) => (
                           <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                              <td className="p-4">
                                 <div 
                                   onClick={() => fetchUserActivities(u)}
                                   className="flex items-center gap-3 cursor-pointer group/user select-none"
                                 >
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs overflow-hidden border border-white/5 group-hover/user:border-brand-primary/50 group-hover/user:scale-105 transition-all">
                                       {u.photo ? (
                                         <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                                       ) : (
                                         u.name?.[0] || 'U'
                                       )}
                                    </div>
                                    <div>
                                       <div className="font-bold text-sm tracking-tight text-white group-hover/user:text-brand-primary transition-colors flex items-center gap-1">
                                         {u.name || 'Anonymous'}
                                         <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/user:opacity-100 transition-all text-brand-primary" />
                                       </div>
                                       <div className="text-[10px] text-white/20">{u.email || u.mobile || 'No contact info'}</div>
                                    </div>
                                 </div>
                              </td>
                              <td className="p-4">
                                 <div className="flex items-center gap-2">
                                    <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest", 
                                      u.role === 'admin' ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/20" : "bg-white/5 text-white/40 border border-white/5"
                                    )}>
                                      {u.role || 'user'}
                                    </div>
                                 </div>
                              </td>
                              <td className="p-4 text-right">
                                 {u.verified || u.id === 'admin-bypass-id' || u.email?.toLowerCase() === 'admin@health.ai' ? (
                                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                     <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified
                                   </span>
                                 ) : (
                                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/40 border border-white/5">
                                     Unverified
                                   </span>
                                 )}
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                  {users.length === 0 && (
                    <div className="p-12 text-center text-white/20 text-sm italic">
                      No registered users found.
                    </div>
                  )}
               </div>
            </div>
         </div>

          {/* Admin Tools Section */}
          <div className="space-y-6">
             <div className="glass-card p-8">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-brand-accent" /> Publish Tip</h2>
                <form onSubmit={handleAddTip} className="space-y-4">
                   <textarea 
                     placeholder="Enter actionable health tip..."
                     required
                     value={newTip}
                     onChange={(e) => setNewTip(e.target.value)}
                     className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-brand-accent outline-none text-sm resize-none"
                   />
                   <button type="submit" className="w-full py-3 rounded-xl bg-brand-accent text-black font-bold text-sm tracking-tightest shadow-lg shadow-brand-accent/20">
                      Broadcast Tip to All
                   </button>
                </form>
             </div>

             <div className="glass-card p-6 flex flex-col h-[350px]">
                <h3 className="text-sm font-black uppercase tracking-widest text-brand-primary mb-4 font-display flex items-center justify-between">
                  <span>Live System Audit Trail</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="System Live Feedback Active" />
                </h3>
                <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                  {globalActivities.length > 0 ? (
                    globalActivities.map((act) => {
                      const dateStr = new Date(act.createdAt?.seconds ? act.createdAt.seconds * 1000 : act.timestamp || Date.now()).toLocaleTimeString();
                      return (
                        <div key={act.id} className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                          <div className="mt-1 shrink-0">
                            {act.type === 'login' ? (
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                <ShieldCheck className="w-3" />
                              </div>
                            ) : act.type === 'logout' ? (
                              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                                <LogOut className="w-3" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                <Activity className="w-3 animate-pulse" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                             <div className="text-[11px] font-extrabold text-white truncate flex items-center justify-between gap-1">
                               <span>{act.userName || 'Anonymous'}</span>
                               <span className="text-[9px] font-mono font-normal text-white/30 shrink-0">{dateStr}</span>
                             </div>
                             <div className="text-[10px] text-white/45 break-words line-clamp-2 mt-0.5" title={act.details}>
                               {act.details}
                             </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-white/20 text-xs italic">
                      No system logging activity present.
                    </div>
                  )}
                </div>
             </div>
          </div>
       </div>

       {/* User Activities Drawer / Modal */}
       <AnimatePresence>
         {selectedUserForActivity && (
           <div onClick={() => setSelectedUserForActivity(null)} className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm cursor-pointer">
             <motion.div
               onClick={(e) => e.stopPropagation()}
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="w-full max-w-xl h-full bg-neutral-950 border-l border-white/5 p-5 sm:p-8 flex flex-col overflow-y-auto"
             >
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <div className="flex items-center gap-3 mb-2">
                     <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden font-bold border border-white/5">
                       {selectedUserForActivity.photo ? (
                         <img src={selectedUserForActivity.photo} alt={selectedUserForActivity.name} className="w-full h-full object-cover" />
                       ) : (
                         selectedUserForActivity.name?.[0] || 'U'
                       )}
                     </div>
                     <div>
                       <h2 className="text-xl font-bold">{selectedUserForActivity.name}</h2>
                       <p className="text-xs text-white/40">{selectedUserForActivity.email || 'No email declared'}</p>
                     </div>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Cloud Diagnostics Console</span>
                 </div>
                 <button
                   onClick={() => setSelectedUserForActivity(null)}
                   className="p-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                 >
                   <X className="w-5 h-5 text-white/60" />
                 </button>
               </div>

              {/* Drawer Tabs Selection */}
              <div className="flex border-b border-white/5 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
                {[
                  { key: 'profile', label: 'Full Profile', icon: User },
                  { key: 'predictions', label: 'Diagnostics Log', icon: Activity },
                  { key: 'logs', label: 'Audit Trail', icon: Clock }
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setDrawerTab(t.key as any)}
                      className={cn(
                        "flex items-center gap-1.5 py-3 px-4 border-b-2 text-[10px] font-black uppercase tracking-wider transition-all",
                        drawerTab === t.key 
                          ? "border-brand-primary text-brand-primary bg-brand-primary/5" 
                          : "border-transparent text-white/40 hover:text-white"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>

               {loadingActivities ? (
                 <div className="flex-1 flex flex-col items-center justify-center">
                   <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-2" />
                   <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Retrieving logs...</span>
                 </div>
               ) : (
                 <div className="flex-1">
                   {drawerTab === 'profile' && (
                     <div className="space-y-6">
                       {/* Full profile section details */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {[
                           { label: 'Register Email', value: selectedUserForActivity.email, icon: Mail },
                           { label: 'Mobile Number', value: selectedUserForActivity.mobile || 'Not declared', icon: Phone },
                           { label: 'Gender Identity', value: selectedUserForActivity.gender || 'Not specified', icon: User },
                           { label: 'Calculated Age', value: selectedUserForActivity.age ? `${selectedUserForActivity.age} years` : 'Not specified', icon: Calendar },
                           { label: 'Home Address', value: selectedUserForActivity.address || 'No location address on file', icon: MapPin },
                           { label: 'Blood Group', value: selectedUserForActivity.bloodGroup || 'Not declared', icon: Activity },
                           { label: 'Known Allergies', value: selectedUserForActivity.allergies || 'No allergies declared', icon: AlertTriangle }
                         ].map((item, index) => {
                           const ItemIcon = item.icon;
                           return (
                             <div key={index} className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl flex items-start gap-3">
                               <ItemIcon className="w-4 h-4 text-brand-primary mt-1 shrink-0" />
                               <div className="min-w-0">
                                 <span className="text-[9px] uppercase font-black tracking-wider text-white/20 block">{item.label}</span>
                                 <span className="text-xs text-white/80 font-medium break-words mt-0.5 block">{item.value}</span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}

                   {drawerTab === 'predictions' && (
                     <div className="space-y-4">
                       {selectedUserActivities.length > 0 ? (
                         selectedUserActivities.map((act) => (
                           <div 
                             key={act.id} 
                             onClick={() => setSelectedPrediction(act)}
                             className="p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-brand-primary/20 transition-all cursor-pointer flex justify-between items-center"
                           >
                             <div className="space-y-1.5">
                               <div className="flex items-center gap-2">
                                 <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                   act.result?.risk === 'High' ? 'bg-red-500/20 text-red-400' :
                                   act.result?.risk === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                 )}>
                                   {act.result?.risk || 'Low'} Risk
                                 </span>
                                 <span className="text-[10px] text-white/30 flex items-center gap-1 font-bold">
                                   <Calendar className="w-3 h-3" />
                                   {new Date(act.createdAt?.seconds ? act.createdAt.seconds * 1000 : act.date || Date.now()).toLocaleDateString()}
                                 </span>
                               </div>
                               <h4 className="font-bold text-base text-white">{act.result?.disease || 'Health Prediction'}</h4>
                               <div className="flex flex-wrap gap-1 text-[10px] text-white/45">
                                 {act.symptoms?.slice(0, 3).map((s: string) => (
                                   <span key={s} className="bg-white/[0.03] px-1.5 py-0.5 rounded">{s}</span>
                                 ))}
                                 {(act.symptoms?.length || 0) > 3 && <span>+{act.symptoms.length - 3} more</span>}
                               </div>
                             </div>

                             <div className="text-right">
                               <span className="text-[9px] uppercase font-black text-white/25 block mb-0.5">Score</span>
                               <span className={cn("text-xl font-bold font-display",
                                 (act.result?.score || 0) > 70 ? "text-emerald-400" : (act.result?.score || 0) > 40 ? "text-amber-400" : "text-red-400"
                               )}>
                                 {act.result?.score || 0}
                               </span>
                             </div>
                           </div>
                         ))
                       ) : (
                         <div className="h-64 flex flex-col items-center justify-center text-center text-white/20 border border-dashed border-white/10 rounded-2xl p-6">
                           <Activity className="w-10 h-10 mb-2 opacity-50" />
                           <p className="text-sm font-bold">No predictions logged yet</p>
                           <p className="text-xs">This user has not performed any health analyses.</p>
                         </div>
                       )}
                     </div>
                   )}

                   {drawerTab === 'logs' && (
                     <div className="space-y-4">
                       {selectedUserSessionLogs.length > 0 ? (
                         <div className="space-y-3 relative border-l border-white/5 pl-4 ml-2">
                           {selectedUserSessionLogs.map((log) => {
                             const logDate = new Date(log.createdAt?.seconds ? log.createdAt.seconds * 1000 : log.timestamp || Date.now());
                             return (
                               <div key={log.id} className="relative group">
                                 <div className={cn(
                                   "absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full border border-neutral-950 transition-colors",
                                   log.type === 'login' ? "bg-emerald-400" : log.type === 'logout' ? "bg-amber-400" : "bg-brand-primary"
                                 )} />
                                 
                                 <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-all">
                                   <div className="flex items-center justify-between gap-2 mb-1">
                                     <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                                       log.type === 'login' ? "bg-emerald-500/10 text-emerald-400" :
                                       log.type === 'logout' ? "bg-amber-500/10 text-amber-400" : "bg-brand-primary/10 text-brand-primary"
                                     )}>
                                       {log.type}
                                     </span>
                                     <span className="text-[10px] text-white/30 font-mono">
                                       {logDate.toLocaleDateString()} {logDate.toLocaleTimeString()}
                                     </span>
                                   </div>
                                   <p className="text-xs text-white/70 font-medium">{log.details}</p>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="h-64 flex flex-col items-center justify-center text-center text-white/20 border border-dashed border-white/10 rounded-2xl p-6">
                           <Clock className="w-10 h-10 mb-2 opacity-50" />
                           <p className="text-sm font-bold">No session records</p>
                           <p className="text-xs">No logins, logouts, or profile changes logged for this user.</p>
                         </div>
                       )}
                     </div>
                   )}
                 </div>
               )}
             {/* Administrative Override Actions */}
             <div className="mt-8 pt-6 border-t border-white/5 space-y-4 shrink-0 text-left">
               <h3 className="text-xs font-black uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                 <ShieldCheck className="w-3.5 h-3.5 text-brand-primary animate-pulse" />
                 Administrative Actions
               </h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {/* Verify Status Action */}
                 {selectedUserForActivity.verified || selectedUserForActivity.id === 'admin-bypass-id' || selectedUserForActivity.email?.toLowerCase() === 'admin@health.ai' ? (
                   <button
                     onClick={() => toggleVerification(selectedUserForActivity)}
                     className="py-3 px-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                     title="Click to toggle/revoke verification"
                   >
                     <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                     Account Verified
                   </button>
                 ) : (
                   <button
                     onClick={() => toggleVerification(selectedUserForActivity)}
                     className="py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white hover:text-brand-accent hover:border-brand-accent/20 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                   >
                     <CheckCircle2 className="w-4 h-4 text-white/40 shrink-0" />
                     Verify Account
                   </button>
                 )}

                 {/* Permanent Delete Action */}
                 {((selectedUserForActivity.id === 'admin-bypass-id' || selectedUserForActivity.id === 'user-bypass-id' || selectedUserForActivity.email?.toLowerCase() === 'admin@health.ai' || selectedUserForActivity.email?.toLowerCase() === 'user@health.ai')) ? (
                   <div className="py-3 px-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 opacity-50" title="Core System Protected Account">
                     <Shield className="w-4 h-4 shrink-0" />
                     Protected
                   </div>
                 ) : (
                   <button
                     onClick={() => deleteUser(selectedUserForActivity)}
                     className="py-3 px-4 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 hover:border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
                   >
                     <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                     Delete Permanently
                   </button>
                 )}
               </div>
             </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>

       <AnimatePresence>
         {selectedPrediction && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="max-w-5xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar relative bg-neutral-950 rounded-3xl"
             >
               <button 
                 onClick={() => setSelectedPrediction(null)}
                 className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10 hover:bg-white/20 transition-all text-white"
               >
                 <X className="w-5 h-5" />
               </button>
               <PredictionResult data={selectedPrediction.result} onDownload={() => {}} />
             </motion.div>
           </div>
         )}
       </AnimatePresence>
    </div>
  );
}
