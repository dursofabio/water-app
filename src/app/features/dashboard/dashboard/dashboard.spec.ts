import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';
import { BalanceService } from '../services/balance.service';
import { DashboardLoadsService } from '../services/dashboard-loads.service';
import { PersonBalance } from '../models/balance.model';
import { DashboardLoad } from '../models/load.model';

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

const MOCK_LOADS: DashboardLoad[] = [
  {
    id: 'load-1',
    paidAt: new Date('2026-06-09T10:00:00'),
    paidByName: 'Fabio',
    totalAmount: 120,
    waterAmount: 100,
    energyAmount: 20,
    totalWeight: 12,
    breakdown: [
      { personId: 'fernando', personName: 'Fernando', weight: 2, cost: 20 },
    ],
  },
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

class MockDashboardLoadsService {
  readonly latestLoadsResource = {
    value: signal(MOCK_LOADS),
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
        provideRouter([]),
        { provide: BalanceService, useClass: MockBalanceService },
        { provide: DashboardLoadsService, useClass: MockDashboardLoadsService },
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

  it('renders the latest loads list component', () => {
    const list = el.querySelector('app-latest-loads-list');
    expect(list).toBeTruthy();
  });

  it('renders a "Ultimi carichi" section with real load data', () => {
    const h2 = el.querySelector('h2.section-title--sm');
    expect(h2?.textContent?.trim()).toBe('Ultimi carichi');
    expect(el.textContent).toContain('Pagato da Fabio');
    expect(el.textContent).toContain('120,00');
  });

  it('balance grid has role="list" for accessibility', () => {
    const grid = el.querySelector('.balance-grid');
    expect(grid?.getAttribute('role')).toBe('list');
  });

  it('exposes balancesResource from the service', () => {
    expect(component.balancesResource.value()).toHaveLength(4);
    expect(component.balancesResource.status()).toBe('resolved');
  });

  it('exposes latestLoadsResource from the service', () => {
    expect(component.latestLoadsResource.value()).toHaveLength(1);
    expect(component.latestLoadsResource.status()).toBe('resolved');
  });
});
