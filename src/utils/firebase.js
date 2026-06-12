// ============================================
// CaterNow — Firebase Configuration
// Used ONLY for Phone OTP Authentication.
// Supabase is used separately for database.
// ============================================

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Full Firebase config — all fields are needed for Phone Auth to work
const firebaseConfig = {
  apiKey: "AIzaSyDgh7tyIIGTs3wqVFPwcAFJYh2N7BE3P_A",
  authDomain: "caternow-3dbd9.firebaseapp.com",
  projectId: "caternow-3dbd9",
  storageBucket: "caternow-3dbd9.firebasestorage.app",
  messagingSenderId: "254523636492",
  appId: "1:254523636492:web:cf79f40434d198f7132729",
  measurementId: "G-BPGV3XRWB0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Set language for SMS messages
auth.useDeviceLanguage();
