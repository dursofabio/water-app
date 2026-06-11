import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

/**
 * Unit tests for AuthService — US-006 / US-007
 *
 * Strategy: mock @angular/fire/auth and @angular/fire/firestore entirely.
 * Tests verify:
 * - isAdmin is true only when /admins/{uid} document exists
 * - currentUser is set after successful login
 * - unauthorized user is signed out automatically
 * - logout resets both signals
 * - isInitialized starts false and becomes true after onAuthStateChanged fires (US-007)
 * - onAuthStateChanged sets isAdmin correctly for admin and non-admin users (US-007)
 * - onAuthStateChanged with null user clears signals (US-007)
 */

type OnAuthStateChangedCallback = (user: { uid: string } | null) => Promise<void>;

let capturedAuthStateCallback: OnAuthStateChangedCallback | null = null;

vi.mock('@angular/fire/auth', () => ({
  Auth: class {},
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((_, callback: OnAuthStateChangedCallback) => {
    capturedAuthStateCallback = callback;
    // Return a no-op unsubscribe function
    return () => undefined;
  }),
}));

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  doc: vi.fn((_firestore: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  getDoc: vi.fn(),
}));

const getSignInWithPopupMock = async () => {
  const { signInWithPopup } = await import('@angular/fire/auth');
  return signInWithPopup as ReturnType<typeof vi.fn>;
};

const getSignOutMock = async () => {
  const { signOut } = await import('@angular/fire/auth');
  return signOut as ReturnType<typeof vi.fn>;
};

const getGetDocMock = async () => {
  const { getDoc } = await import('@angular/fire/firestore');
  return getDoc as ReturnType<typeof vi.fn>;
};

const getOnAuthStateChangedMock = async () => {
  const { onAuthStateChanged } = await import('@angular/fire/auth');
  return onAuthStateChanged as ReturnType<typeof vi.fn>;
};

describe('AuthService (US-006)', () => {
  let service: AuthService;
  let signInWithPopupMock: ReturnType<typeof vi.fn>;
  let signOutMock: ReturnType<typeof vi.fn>;
  let getDocMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    capturedAuthStateCallback = null;

    signInWithPopupMock = await getSignInWithPopupMock();
    signOutMock = await getSignOutMock();
    getDocMock = await getGetDocMock();

    signInWithPopupMock.mockReset();
    signOutMock.mockReset();
    getDocMock.mockReset();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('inizializza con currentUser null e isAdmin false', () => {
    expect(service.currentUser()).toBeNull();
    expect(service.isAdmin()).toBe(false);
  });

  it('imposta isAdmin a true quando il documento /admins/{uid} esiste', async () => {
    const fakeUser = { uid: 'admin-uid-123' };
    signInWithPopupMock.mockResolvedValue({ user: fakeUser });
    getDocMock.mockResolvedValue({ exists: () => true });

    await service.loginWithGoogle();

    expect(service.isAdmin()).toBe(true);
    expect(service.currentUser()).toEqual(fakeUser);
  });

  it('imposta isAdmin a false e chiama signOut quando il documento /admins/{uid} non esiste', async () => {
    const fakeUser = { uid: 'unauthorized-uid' };
    signInWithPopupMock.mockResolvedValue({ user: fakeUser });
    getDocMock.mockResolvedValue({ exists: () => false });
    signOutMock.mockResolvedValue(undefined);

    await service.loginWithGoogle();

    expect(service.isAdmin()).toBe(false);
    expect(service.currentUser()).toBeNull();
    expect(signOutMock).toHaveBeenCalled();
  });

  it('rilancia l\'errore se signInWithPopup fallisce', async () => {
    signInWithPopupMock.mockRejectedValue(new Error('popup-closed-by-user'));

    await expect(service.loginWithGoogle()).rejects.toThrow('popup-closed-by-user');
  });

  it('logout() chiama signOut e resetta entrambi i signal', async () => {
    // Prima fai un login autorizzato
    const fakeUser = { uid: 'admin-uid' };
    signInWithPopupMock.mockResolvedValue({ user: fakeUser });
    getDocMock.mockResolvedValue({ exists: () => true });
    await service.loginWithGoogle();

    expect(service.isAdmin()).toBe(true);

    signOutMock.mockResolvedValue(undefined);
    await service.logout();

    expect(service.currentUser()).toBeNull();
    expect(service.isAdmin()).toBe(false);
    expect(signOutMock).toHaveBeenCalled();
  });

  it('verifica il documento nella collection admins con l\'uid corretto', async () => {
    const { doc } = await import('@angular/fire/firestore');
    const docMock = doc as ReturnType<typeof vi.fn>;
    docMock.mockClear();

    const fakeUser = { uid: 'uid-xyz' };
    signInWithPopupMock.mockResolvedValue({ user: fakeUser });
    getDocMock.mockResolvedValue({ exists: () => true });

    await service.loginWithGoogle();

    expect(docMock).toHaveBeenCalledWith(expect.anything(), 'admins', 'uid-xyz');
  });
});

describe('AuthService — isInitialized e onAuthStateChanged (US-007)', () => {
  let service: AuthService;
  let getDocMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    capturedAuthStateCallback = null;

    const signInWithPopupMock = await getSignInWithPopupMock();
    const signOutMock = await getSignOutMock();
    getDocMock = await getGetDocMock();

    signInWithPopupMock.mockReset();
    signOutMock.mockReset();
    getDocMock.mockReset();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth, useValue: {} },
        { provide: Firestore, useValue: {} },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('isInitialized è false prima che onAuthStateChanged venga invocato', () => {
    // Service is created, callback is captured but not yet called
    expect(service.isInitialized()).toBe(false);
  });

  it('onAuthStateChanged registra una callback al momento della costruzione del service', async () => {
    const onAuthStateChangedMock = await getOnAuthStateChangedMock();
    expect(onAuthStateChangedMock).toHaveBeenCalled();
    expect(capturedAuthStateCallback).not.toBeNull();
  });

  it('isInitialized diventa true dopo che la callback onAuthStateChanged è chiamata con null (nessuna sessione)', async () => {
    expect(service.isInitialized()).toBe(false);

    await capturedAuthStateCallback!(null);

    expect(service.isInitialized()).toBe(true);
    expect(service.currentUser()).toBeNull();
    expect(service.isAdmin()).toBe(false);
  });

  it('isInitialized diventa true e isAdmin è true se l\'utente è in whitelist /admins', async () => {
    const fakeUser = { uid: 'admin-uid-persistent' };
    getDocMock.mockResolvedValue({ exists: () => true });

    expect(service.isInitialized()).toBe(false);

    await capturedAuthStateCallback!(fakeUser);

    expect(service.isInitialized()).toBe(true);
    expect(service.isAdmin()).toBe(true);
    expect(service.currentUser()).toEqual(fakeUser);
  });

  it('isInitialized diventa true e isAdmin è false se l\'utente non è in whitelist /admins', async () => {
    const fakeUser = { uid: 'non-admin-uid' };
    getDocMock.mockResolvedValue({ exists: () => false });

    await capturedAuthStateCallback!(fakeUser);

    expect(service.isInitialized()).toBe(true);
    expect(service.isAdmin()).toBe(false);
  });

  it('onAuthStateChanged con utente null pulisce currentUser e isAdmin', async () => {
    // Prima imposta uno stato admin tramite callback
    const fakeUser = { uid: 'admin-uid' };
    getDocMock.mockResolvedValue({ exists: () => true });
    await capturedAuthStateCallback!(fakeUser);
    expect(service.isAdmin()).toBe(true);

    // Poi simula il logout Firebase (null user)
    await capturedAuthStateCallback!(null);

    expect(service.currentUser()).toBeNull();
    expect(service.isAdmin()).toBe(false);
    expect(service.isInitialized()).toBe(true);
  });
});
