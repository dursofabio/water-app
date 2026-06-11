import { Injectable, Signal, inject, signal } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

/**
 * AuthService — US-006 / US-007
 *
 * Gestisce l'autenticazione Google e la verifica della whitelist admin.
 *
 * - currentUser: Signal<User | null> — utente Firebase corrente
 * - isAdmin: Signal<boolean> — true solo se UID presente in /admins
 * - isInitialized: Signal<boolean> — true dopo che Firebase Auth ha emesso
 *   il primo stato (anche null), garantendo che il guard non prenda decisioni
 *   prima che la sessione persistita sia stata ripristinata.
 * - loginWithGoogle(): apre il popup OAuth2, verifica whitelist e aggiorna i signal
 * - logout(): effettua il sign-out Firebase
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAdmin = signal<boolean>(false);
  private readonly _isInitialized = signal<boolean>(false);

  readonly currentUser: Signal<User | null> = this._currentUser.asReadonly();
  readonly isAdmin: Signal<boolean> = this._isAdmin.asReadonly();
  readonly isInitialized: Signal<boolean> = this._isInitialized.asReadonly();

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this._currentUser.set(user);
        const adminDoc = await getDoc(doc(this.firestore, 'admins', user.uid));
        this._isAdmin.set(adminDoc.exists());
      } else {
        this._currentUser.set(null);
        this._isAdmin.set(false);
      }
      this._isInitialized.set(true);
    });
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(this.auth, provider);
    const user = credential.user;
    this._currentUser.set(user);

    const adminDoc = await getDoc(doc(this.firestore, 'admins', user.uid));
    const isAdmin = adminDoc.exists();
    this._isAdmin.set(isAdmin);

    if (!isAdmin) {
      // Sign out immediately — user is authenticated but not authorized as admin
      await signOut(this.auth);
      this._currentUser.set(null);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this._currentUser.set(null);
    this._isAdmin.set(false);
  }
}
