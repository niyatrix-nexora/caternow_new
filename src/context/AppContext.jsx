import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  seedVendors, getUser, setUser as saveUser, logout as doLogout, 
  getVendors, 
  getCustomerRequests, getBidsForRequests, getVendorBids, getRequestsForVendor 
} from '../utils/data';
import { createSessionTimer } from '../utils/security';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [requests, setRequests] = useState([]);
  const [bids, setBids] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    async function init() {
      try {
        await seedVendors();

        const u = getUser();
        if (u && (u.role === 'customer' || u.role === 'vendor')) {
          setUserState(u);
        } else if (u) {
          // Prevent redirect loops from malformed user objects in storage.
          doLogout();
          setUserState(null);
        }

        const vnds = await getVendors();
        let reqs = [];
        let bds = [];

        if (u?.role === 'customer') {
          reqs = await getCustomerRequests(u.phone);
          bds = await getBidsForRequests(reqs.map((request) => request.id));
        } else if (u?.role === 'vendor') {
          reqs = await getRequestsForVendor(u.id);
          bds = await getVendorBids(u.id);
        }

        setRequests(reqs);
        setBids(bds);
        setVendors(vnds || []);
      } catch (error) {
        console.error('App init failed:', error);
        setRequests([]);
        setBids([]);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // Firebase user signed out — clear local session too
        const currentUser = getUser();
        if (currentUser) {
          doLogout();
          setUserState(null);
        }
      }
      // SIGNED_IN is handled by the login flow in Login.jsx
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback((userData) => {
    saveUser(userData);
    setUserState(userData);
  }, []);

  const logout = useCallback(async () => {
    // Sign out from Firebase first
    await signOut(auth);
    doLogout();
    setUserState(null);
  }, []);

  // Session timeout: auto-logout after 30 minutes of inactivity
  useEffect(() => {
    if (!user) return;
    const cleanup = createSessionTimer(async () => {
      await signOut(auth);
      doLogout();
      setUserState(null);
    });
    return cleanup;
  }, [user]);

  const refresh = useCallback(async () => {
    if (!user) {
      // Basic fallback for unauthenticated state or initial load
      const [vnds] = await Promise.all([getVendors()]);
      setVendors(vnds);
      return;
    }

    let reqs = [];
    let bds = [];
    let vnds = vendors;

    if (user.role === 'customer') {
      reqs = await getCustomerRequests(user.phone);
      const requestIds = reqs.map(r => r.id);
      bds = await getBidsForRequests(requestIds);
    } else {
      reqs = await getRequestsForVendor(user.id);
      bds = await getVendorBids(user.id);
    }

    if (vendors.length === 0) {
      vnds = await getVendors();
    }

    setRequests(reqs);
    setBids(bds);
    setVendors(vnds);
  }, [user, vendors]);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    saveUser(updated);
    setUserState(updated);
  }, [user]);

  const value = {
    user,
    login,
    logout,
    refresh,
    updateUser,
    requests,
    bids,
    vendors,
    loading,
  };

  if (loading) {
    return (
      <div className="app-container splash-screen">
        <span className="sr-only">Loading CaterNow</span>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
