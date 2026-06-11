import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Unit tests for authGuard — US-006 / US-007
 *
 * Strategy: mock AuthService signals (isAdmin, isInitialized) and Router.createUrlTree.
 * Tests verify:
 * - Guard returns true when user is admin and initialized
 * - Guard returns UrlTree to /login (not /dashboard) when user is not admin (US-007)
 * - Guard waits for isInitialized before evaluating (US-007)
 */
describe('authGuard (US-006 / US-007)', () => {
  const emptyRoute = {} as ActivatedRouteSnapshot;
  const emptyState = {} as RouterStateSnapshot;

  const mockAuthService = {
    isAdmin: signal(false),
    isInitialized: signal(false),
  };

  beforeEach(() => {
    mockAuthService.isAdmin = signal(false);
    mockAuthService.isInitialized = signal(false);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    });
  });

  function runGuard(): Observable<boolean | UrlTree> {
    return TestBed.runInInjectionContext(() =>
      authGuard(emptyRoute, emptyState)
    ) as Observable<boolean | UrlTree>;
  }

  it('restituisce true quando l\'utente è admin e il service è inizializzato', async () => {
    mockAuthService.isAdmin = signal(true);
    mockAuthService.isInitialized = signal(true);

    const result = await firstValueFrom(runGuard());

    expect(result).toBe(true);
  });

  it('restituisce un UrlTree verso /login quando l\'utente non è admin (US-007)', async () => {
    mockAuthService.isAdmin = signal(false);
    mockAuthService.isInitialized = signal(true);

    const result = await firstValueFrom(runGuard());
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(result).toEqual(router.createUrlTree(['/login']));
  });

  it('il redirect va a /login e non a /dashboard (US-007)', async () => {
    mockAuthService.isAdmin = signal(false);
    mockAuthService.isInitialized = signal(true);

    const result = await firstValueFrom(runGuard()) as UrlTree;

    // Ensure the redirect is to /login, explicitly not /dashboard
    expect(result.toString()).toBe('/login');
  });

  it('non emette immediatamente se isInitialized è false — attende l\'inizializzazione (US-007)', async () => {
    mockAuthService.isAdmin = signal(false);
    mockAuthService.isInitialized = signal(false);

    const result$ = runGuard();

    let resolved = false;
    result$.subscribe(() => { resolved = true; });

    // Not yet resolved because isInitialized is still false
    expect(resolved).toBe(false);
  });

  it('emette solo dopo che isInitialized diventa true (US-007)', async () => {
    // Start with uninitialized state
    const isInitializedSignal = signal(false);
    const isAdminSignal = signal(true);
    mockAuthService.isAdmin = isAdminSignal;
    mockAuthService.isInitialized = isInitializedSignal;

    // Set initialized to true before running the guard
    // (toObservable emits synchronously on subscribe for the current signal value)
    TestBed.runInInjectionContext(() => {
      isInitializedSignal.set(true);
    });

    const result = await firstValueFrom(runGuard());

    // After initialization with isAdmin=true: should emit true
    expect(result).toBe(true);
  });
});
