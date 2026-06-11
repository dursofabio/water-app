import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Dashboard } from './dashboard';
import { BalanceService } from '../services/balance.service';
import { DashboardLoadsService } from '../services/dashboard-loads.service';
import { DashboardPaymentsService } from '../services/dashboard-payments.service';
import { PersonBalance } from '../models/balance.model';
import { DashboardLoad } from '../models/load.model';
import { DashboardPayment } from '../models/payment.model';

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

const MOCK_PAYMENTS: DashboardPayment[] = [
  {
    id: 'payment-1',
    paidAt: new Date('2026-06-10T10:00:00'),
    personId: 'fernando',
    personName: 'Fernando',
    personInitials: 'Fe',
    amount: 100,
    note: 'Bonifico istantaneo',
  },
];

let balancesValue = signal(MOCK_BALANCES);
let balancesStatus = signal('resolved');
let balancesLoading = signal(false);
let balancesError = signal<unknown>(undefined);
let balancesReloadCount = 0;

class MockBalanceService {
  readonly balancesResource = {
    value: balancesValue,
    status: balancesStatus,
    isLoading: balancesLoading,
    error: balancesError,
    reload: () => {
      balancesReloadCount += 1;
      return true;
    },
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

class MockDashboardPaymentsService {
  readonly latestPaymentsResource = {
    value: signal(MOCK_PAYMENTS),
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
    balancesValue = signal(MOCK_BALANCES);
    balancesStatus = signal('resolved');
    balancesLoading = signal(false);
    balancesError = signal<unknown>(undefined);
    balancesReloadCount = 0;

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: BalanceService, useClass: MockBalanceService },
        { provide: DashboardLoadsService, useClass: MockDashboardLoadsService },
        { provide: DashboardPaymentsService, useClass: MockDashboardPaymentsService },
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
    expect(el.textContent).toContain('−€25,00');
    expect(el.textContent).toContain('75,00');
    expect(el.textContent).toContain('100,00');
  });

  it('renders the live sync chip in the header', () => {
    const badge = el.querySelector('.sync-chip');
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toContain('Aggiornato');
  });

  it('renders the US-020 dashboard headline', () => {
    const title = el.querySelector('h1');
    expect(title?.textContent?.trim()).toBe('Chi deve cosa, senza chiedere a Fabio.');
  });

  it('renders the latest loads list component', () => {
    const list = el.querySelector('app-latest-loads-list');
    expect(list).toBeTruthy();
  });

  it('renders the latest payments list component', () => {
    const list = el.querySelector('app-latest-payments-list');
    expect(list).toBeTruthy();
  });

  it('renders a "Ultimi carichi" section with real load data', () => {
    const h2 = el.querySelector('app-latest-loads-list h2.section-title--sm');
    expect(h2?.textContent?.trim()).toBe('Ultimi carichi');
    expect(el.textContent).toContain('Pagato da Fabio');
    expect(el.textContent).toContain('120,00');
  });

  it('renders a "Ultimi pagamenti" section with real payment data', () => {
    const h2 = el.querySelector('app-latest-payments-list h2.section-title--sm');
    expect(h2?.textContent?.trim()).toBe('Ultimi pagamenti');
    expect(el.textContent).toContain('Fernando');
    expect(el.textContent).toContain('100,00');
    expect(el.textContent).toContain('Bonifico istantaneo');
  });

  it('balance grid has role="list" for accessibility', () => {
    const grid = el.querySelector('.summary-cards');
    expect(grid?.getAttribute('role')).toBe('list');
  });

  it('renders balances before recent movements in the document order', () => {
    const summary = el.querySelector('.summary');
    const ledger = el.querySelector('.ledger-grid');
    expect(summary).toBeTruthy();
    expect(ledger).toBeTruthy();
    expect((summary as Element).compareDocumentPosition(ledger as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders an empty balances state with a retry action', () => {
    balancesValue.set([]);
    fixture.detectChanges();

    const empty = el.querySelector('.resource-message--empty');
    const retry = empty?.querySelector('button');
    expect(empty?.textContent).toContain('Nessun saldo disponibile');

    retry?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(balancesReloadCount).toBe(1);
  });

  it('renders diagnostic balance errors and retries', () => {
    balancesStatus.set('error');
    balancesError.set(new Error('Firestore collection "people" failed: missing permissions'));
    fixture.detectChanges();

    const error = el.querySelector('.resource-message--error');
    const retry = error?.querySelector('button');
    expect(error?.textContent).toContain('Non riesco ad aggiornare i saldi');
    expect(error?.textContent).toContain('Firestore collection "people" failed');

    retry?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(balancesReloadCount).toBe(1);
  });

  it('exposes balancesResource from the service', () => {
    expect(component.balancesResource.value()).toHaveLength(4);
    expect(component.balancesResource.status()).toBe('resolved');
  });

  it('exposes latestLoadsResource from the service', () => {
    expect(component.latestLoadsResource.value()).toHaveLength(1);
    expect(component.latestLoadsResource.status()).toBe('resolved');
  });

  it('exposes latestPaymentsResource from the service', () => {
    expect(component.latestPaymentsResource.value()).toHaveLength(1);
    expect(component.latestPaymentsResource.status()).toBe('resolved');
  });
});
