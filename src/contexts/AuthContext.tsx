import { createContext, useContext, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

type User = FirebaseUser | null;

interface AuthContextType {
  currentUser: User | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to ensure user document exists in Firestore
  const ensureUserDocument = async (user: FirebaseUser) => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      // Only create if document doesn't exist
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Anonymous',
          createdAt: serverTimestamp(),
        });
        console.log('Created missing user document for:', user.email);
      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
      // Don't throw - we don't want to block login if this fails
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      
      // Create user document in Firestore for email lookup
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: email,
        displayName: displayName,
        createdAt: serverTimestamp(),
      });
      
      return userCredential;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Ensure user document exists (for legacy users who signed up before we added this)
    await ensureUserDocument(userCredential.user);
    
    return userCredential;
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const resetPassword = (email: string) => {
    return firebaseSendPasswordResetEmail(auth, email);
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      // Ensure user document exists
      await ensureUserDocument(userCredential.user);
      
      return userCredential;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      // Ensure user document exists for already logged-in users
      if (user) {
        await ensureUserDocument(user);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signIn,
    signUp,
    signOut,
    resetPassword,
    signInWithGoogle,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
