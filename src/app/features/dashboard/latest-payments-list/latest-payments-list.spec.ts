import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LatestPaymentsList } from './latest-payments-list';
import { DashboardPayment } from '../models/payment.model';

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
  {
    id: 'payment-2',
    paidAt: new Date('2026-06-06T10:00:00'),
    personId: 'nino',
    personName: 'Nino',
    personInitials: 'Ni',
    amount: 30,
  },
];

function makeResource(overrides: Partial<{
  value: () => DashboardPayment[];
  status: () => string;
  isLoading: () => boolean;
  error: () => unknown;
  reload: () => unknown;
}> = {}) {
  return {
    value: signal(MOCK_PAYMENTS),
    status: signal('resolved'),
    isLoading: signal(false),
    error: signal(undefined),
    reload: vi.fn(),
    ...overrides,
  };
}

describe('LatestPaymentsList (US-005)', () => {
  let component: LatestPaymentsList;
  let fixture: ComponentFixture<LatestPaymentsList>;
  let el: HTMLElement;

  async function createComponent(resource = makeResource()) {
    await TestBed.configureTestingModule({
      imports: [LatestPaymentsList],
    }).compileComponents();

    fixture = TestBed.createComponent(LatestPaymentsList);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('paymentsResource', resource);
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;

    return resource;
  }

  it('renders latest payment rows with date, person, amount and note', async () => {
    await createComponent();

    const rows = el.querySelectorAll('.payment-row');
    expect(rows.length).toBe(2);
    expect(el.textContent).toContain('Fernando');
    expect(el.textContent).toContain('100,00');
    expect(el.textContent).toContain('Bonifico istantaneo');
    expect(el.textContent).toContain('10 giu');
  });

  it('limits the rendered list to 10 payments', async () => {
    const payments = Array.from({ length: 12 }, (_item, index) => ({
      ...MOCK_PAYMENTS[0],
      id: `payment-${index}`,
    }));
    await createComponent(makeResource({ value: signal(payments) }));

    expect(el.querySelectorAll('.payment-row').length).toBe(10);
    expect(component.paymentCountLabel()).toBe('10 pagamenti');
  });

  it('renders loading state', async () => {
    await createComponent(makeResource({
      value: signal([]),
      status: signal('loading'),
      isLoading: signal(true),
    }));

    const state = el.querySelector('.payments-state');
    expect(state?.getAttribute('aria-busy')).toBe('true');
    expect(state?.textContent).toContain('Caricamento ultimi pagamenti');
  });

  it('renders empty state', async () => {
    await createComponent(makeResource({ value: signal([]) }));

    expect(el.textContent).toContain('Nessun pagamento registrato');
  });

  it('renders error state and retries', async () => {
    const resource = await createComponent(makeResource({
      value: signal([]),
      status: signal('error'),
      error: signal(new Error('Firestore collection "payments" failed')),
    }));

    expect(el.textContent).toContain('Non riesco a caricare');
    expect(el.textContent).toContain('Firestore collection "payments" failed');

    el.querySelector<HTMLButtonElement>('.state-action')?.click();
    expect(resource.reload).toHaveBeenCalledOnce();
  });
});
