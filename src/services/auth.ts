
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

// Create a mock firebase auth object for now
const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: async () => { throw new Error('Firebase not configured'); },
  createUserWithEmailAndPassword: async () => { throw new Error('Firebase not configured'); },
  signOut: async () => { throw new Error('Firebase not configured'); },
  onAuthStateChanged: () => () => {}
};

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export class AuthService {
  static getCurrentUser(): Promise<User | null> {
    return new Promise((resolve) => {
      resolve(null); // Mock implementation
    });
  }

  static async signIn(email: string, password: string): Promise<AuthUser> {
    // Mock implementation - replace with actual Firebase auth when configured
    throw new Error('Firebase authentication not configured');
  }

  static async signUp(email: string, password: string): Promise<AuthUser> {
    // Mock implementation - replace with actual Firebase auth when configured
    throw new Error('Firebase authentication not configured');
  }

  static async signOut(): Promise<void> {
    localStorage.removeItem('savora-user');
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    // Mock implementation - replace with actual Firebase auth when configured
    const stored = this.getStoredUser();
    callback(stored);
    return () => {};
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
