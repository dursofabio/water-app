import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Admin } from './admin';
import { AuthService } from '../../core/services/auth.service';

const mockAuthService = {
  logout: vi.fn().mockResolvedValue(undefined),
};

async function setup() {
  await TestBed.configureTestingModule({
    imports: [Admin],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: mockAuthService },
    ],
  }).compileComponents();

  // Suppress NG04002 "no match for /login" thrown after logout navigation
  const router = TestBed.inject(Router);
  vi.spyOn(router, 'navigate').mockResolvedValue(true);

  const fixture = TestBed.createComponent(Admin);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, component };
}

describe('Admin (US-021)', () => {
  let fixture: ComponentFixture<Admin>;
  let component: Admin;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ fixture, component } = await setup());
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation', () => {
    it('renders quick action link for Carichi pointing to /admin/carichi', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = Array.from(el.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const link = links.find(a => a.getAttribute('href') === '/admin/carichi');
      expect(link).toBeTruthy();
      expect(link!.textContent).toContain('Carichi');
    });

    it('renders quick action link for Pagamenti pointing to /admin/pagamenti', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = Array.from(el.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const link = links.find(a => a.getAttribute('href') === '/admin/pagamenti');
      expect(link).toBeTruthy();
      expect(link!.textContent).toContain('Pagamenti');
    });

    it('renders quick action link for Configurazione pointing to /admin/configurazione', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = Array.from(el.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const link = links.find(a => a.getAttribute('href') === '/admin/configurazione');
      expect(link).toBeTruthy();
      expect(link!.textContent).toContain('Prezzi');
    });

    it('renders link to dashboard pubblica pointing to /dashboard', () => {
      const el = fixture.nativeElement as HTMLElement;
      const links = Array.from(el.querySelectorAll('a[href]')) as HTMLAnchorElement[];
      const link = links.find(a => a.getAttribute('href') === '/dashboard');
      expect(link).toBeTruthy();
      expect(link!.textContent).toContain('Dashboard');
    });
  });

  describe('Logout', () => {
    it('calls AuthService.logout() when logout button clicked', async () => {
      const el = fixture.nativeElement as HTMLElement;
      const button = el.querySelector('button') as HTMLButtonElement;
      expect(button).toBeTruthy();
      button.click();
      await fixture.whenStable();
      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
    });
  });
});
