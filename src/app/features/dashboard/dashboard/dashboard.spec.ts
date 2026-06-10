import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Dashboard } from './dashboard';
import { BalanceService } from '../services/balance.service';
import { PersonBalance } from '../models/balance.model';

/**
 * Unit tests for DashboardComponent — US-003
 *
 * Strategy: provide a mock BalanceService that returns a controlled
 * Observable so no Firestore connection is needed.
 */

const MOCK_BALANCES: PersonBalance[] = [
  { id: 'fernando', name: 'Fernando', initials: 'Fe', loadsTotal: 75, paymentsTotal: 100, balance: -25, status: 'credit' },
  { id: 'nino',     name: 'Nino',     initials: 'Ni', loadsTotal: 60, paymentsTotal: 30, balance: 30, status: 'debt-mid' },
  { id: 'daniele',  name: 'Daniele',  initials: 'Da', loadsTotal: 25, paymentsTotal: 0, balance: 25, status: 'debt-mid' },
  { id: 'fabio',    name: 'Fabio',    initials: 'Fa', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
];

class MockBalanceService {
  readonly balancesResource = {
    value: signal(MOCK_BALANCES),
    status: signal('resolved'),
    isLoading: signal(false),
    error: signal(undefined),
    reload: () => true,
  };
}

describe('Dashboard (US-003)', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: BalanceService, useClass: MockBalanceService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders 4 balance cards for the 4 people', () => {
    const cards = el.querySelectorAll('app-balance-card');
    expect(cards.length).toBe(4);
  });

  it('renders balance card amounts from the resource value', () => {
    expect(el.textContent).toContain('Fernando');
    expect(el.textContent).toContain('−25,00');
    expect(el.textContent).toContain('75,00');
    expect(el.textContent).toContain('100,00');
  });

  it('renders the live badge in the header', () => {
    const badge = el.querySelector('.live-badge');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Aggiornato in tempo reale');
  });

  it('renders the "Saldi" section title', () => {
    const title = el.querySelector('h1.section-title');
    expect(title?.textContent?.trim()).toBe('Saldi');
  });

  it('renders a "Ultimi carichi" section with coming-soon badge', () => {
    const h2 = el.querySelector('h2.section-title--sm');
    expect(h2?.textContent?.trim()).toBe('Ultimi carichi');
    const badge = el.querySelector('.coming-soon-badge');
    expect(badge?.textContent?.trim()).toBe('Prossimamente');
  });

  it('balance grid has role="list" for accessibility', () => {
    const grid = el.querySelector('.balance-grid');
    expect(grid?.getAttribute('role')).toBe('list');
  });

  it('exposes balancesResource from the service', () => {
    expect(component.balancesResource.value()).toHaveLength(4);
    expect(component.balancesResource.status()).toBe('resolved');
  });
});
