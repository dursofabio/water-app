import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';
import { AuthService } from '../../core/services/auth.service';
import { signal } from '@angular/core';

/**
 * Unit tests for LoginComponent — US-006
 *
 * Strategy: mock AuthService. Verify button presence, loginWithGoogle invocation,
 * denied banner display, and error message display.
 */
describe('LoginComponent (US-006)', () => {
  let fixture: ComponentFixture<Login>;
  let component: Login;
  let mockAuthService: { loginWithGoogle: ReturnType<typeof vi.fn>; isAdmin: ReturnType<typeof signal<boolean>> };

  beforeEach(async () => {
    mockAuthService = {
      loginWithGoogle: vi.fn(),
      isAdmin: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('mostra il pulsante "Accedi con Google"', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-google');
    expect(button).toBeTruthy();
    expect(button.textContent?.trim()).toContain('Accedi con Google');
  });

  it('chiama loginWithGoogle() al click del pulsante', async () => {
    mockAuthService.loginWithGoogle.mockResolvedValue(undefined);
    mockAuthService.isAdmin = signal(true);

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-google');
    button.click();

    expect(mockAuthService.loginWithGoogle).toHaveBeenCalledOnce();
  });

  it('mostra il banner di accesso negato quando showDenied è true', async () => {
    // Simulate unauthorized login
    mockAuthService.loginWithGoogle.mockResolvedValue(undefined);
    mockAuthService.isAdmin = signal(false);

    await component.loginWithGoogle();
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.access-denied');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Accesso negato');
  });

  it('mostra un messaggio di errore quando loginWithGoogle() rigetta', async () => {
    mockAuthService.loginWithGoogle.mockRejectedValue(new Error('auth/popup-closed-by-user'));

    await component.loginWithGoogle();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.login-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('auth/popup-closed-by-user');
  });

  it('disabilita il pulsante durante il loading', async () => {
    // Simula una promise che non si risolve immediatamente
    let resolve!: () => void;
    mockAuthService.loginWithGoogle.mockReturnValue(
      new Promise<void>((r) => { resolve = r; })
    );
    mockAuthService.isAdmin = signal(false);

    const clickPromise = component.loginWithGoogle();
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-google');
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toContain('Accesso in corso');

    resolve();
    await clickPromise;
  });
});
