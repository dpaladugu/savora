
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class AuthService {
  static getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  static async signIn(email: string, password: string): Promise<AuthUser> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName
    };
  }

  static async signUp(email: string, password: string): Promise<AuthUser> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName
    };
  }

  static async signOut(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem('savora-user');
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        const authUser: AuthUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
        localStorage.setItem('savora-user', JSON.stringify(authUser));
        callback(authUser);
      } else {
        localStorage.removeItem('savora-user');
        callback(null);
      }
    });
  }

  static getStoredUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem('savora-user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
