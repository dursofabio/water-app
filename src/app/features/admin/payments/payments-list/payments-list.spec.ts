import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, Subject } from 'rxjs';

import { PaymentsListComponent } from './payments-list';
import { PaymentsService, PaymentRecord } from '../../../../core/services/payments.service';
import { BalanceService } from '../../../dashboard/services/balance.service';
import { PersonBalance } from '../../../dashboard/models/balance.model';

const MOCK_BALANCES: PersonBalance[] = [
  { id: 'fabio', name: 'Fabio', initials: 'Fa', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
  { id: 'fernando', name: 'Fernando', initials: 'Fe', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
];

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'payment-1',
    personId: 'fabio',
    amount: 50,
    date: new Date('2026-06-11'),
    note: 'Quota giugno',
  },
  {
    id: 'payment-2',
    personId: 'fernando',
    amount: 30,
    date: new Date('2026-06-02'),
    // note intentionally absent
  },
];

class MockBalanceService {
  readonly balancesResource = {
    value: signal(MOCK_BALANCES),
    isLoading: signal(false),
    error: signal(undefined),
    status: signal('resolved'),
    reload: () => true,
  };
}

class MockPaymentsService {
  getPayments = vi.fn().mockReturnValue(of(MOCK_PAYMENTS));
  deletePayment = vi.fn().mockResolvedValue(undefined);
}

async function setup(paymentsServiceOverride?: Partial<MockPaymentsService>) {
  const paymentsService = Object.assign(new MockPaymentsService(), paymentsServiceOverride ?? {});

  await TestBed.configureTestingModule({
    imports: [PaymentsListComponent],
    providers: [
      provideRouter([]),
      { provide: BalanceService, useClass: MockBalanceService },
      { provide: PaymentsService, useValue: paymentsService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PaymentsListComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, component, paymentsService };
}

describe('PaymentsListComponent', () => {
  describe('Data rendering', () => {
    let fixture: ComponentFixture<PaymentsListComponent>;
    let component: PaymentsListComponent;

    beforeEach(async () => {
      ({ fixture, component } = await setup());
    });

    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders a payment row for each payment', () => {
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('.payment-row');
      expect(rows.length).toBe(2);
    });

    it('shows formatted date day and month for first payment', () => {
      const el = fixture.nativeElement as HTMLElement;
      const dateBlocks = el.querySelectorAll('.date-block');
      expect(dateBlocks[0].textContent).toContain('11');
      expect(dateBlocks[0].textContent).toContain('giu');
    });

    it('shows formatted amount for first payment', () => {
      const el = fixture.nativeElement as HTMLElement;
      const firstRow = el.querySelectorAll('.payment-row')[0];
      expect(firstRow.textContent).toContain('50,00');
    });

    it('resolves personId to person name', () => {
      const el = fixture.nativeElement as HTMLElement;
      const firstRow = el.querySelectorAll('.payment-row')[0];
      expect(firstRow.textContent).toContain('Fabio');
    });

    it('shows payment note when present', () => {
      const el = fixture.nativeElement as HTMLElement;
      const firstRow = el.querySelectorAll('.payment-row')[0];
      expect(firstRow.textContent).toContain('Quota giugno');
    });

    it('shows em-dash when note is absent', () => {
      const el = fixture.nativeElement as HTMLElement;
      const secondRow = el.querySelectorAll('.payment-row')[1];
      expect(secondRow.textContent).toContain('—');
    });

    it('edit link points to /admin/pagamenti/:id', () => {
      const el = fixture.nativeElement as HTMLElement;
      const editLink = el.querySelector('a.icon-btn') as HTMLAnchorElement;
      expect(editLink.getAttribute('href')).toBe('/admin/pagamenti/payment-1');
    });
  });

  describe('Empty state', () => {
    it('shows empty state container when no payments', async () => {
      const { fixture: f } = await setup({ getPayments: vi.fn().mockReturnValue(of([])) });
      const el = f.nativeElement as HTMLElement;
      expect(el.querySelector('.state-container.empty')).toBeTruthy();
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner while stream is pending', async () => {
      const neverSubject = new Subject<PaymentRecord[]>();
      await TestBed.configureTestingModule({
        imports: [PaymentsListComponent],
        providers: [
          provideRouter([]),
          { provide: BalanceService, useClass: MockBalanceService },
          { provide: PaymentsService, useValue: { getPayments: vi.fn().mockReturnValue(neverSubject) } },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PaymentsListComponent);
      f.detectChanges();
      const el = f.nativeElement as HTMLElement;
      expect(el.querySelector('.state-container mat-spinner')).toBeTruthy();
    });
  });

  describe('Error state', () => {
    it('paymentsResource enters error state when stream errors', async () => {
      const errorSubject = new Subject<PaymentRecord[]>();
      await TestBed.configureTestingModule({
        imports: [PaymentsListComponent],
        providers: [
          provideRouter([]),
          { provide: BalanceService, useClass: MockBalanceService },
          {
            provide: PaymentsService,
            useValue: { getPayments: vi.fn().mockReturnValue(errorSubject) },
          },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(PaymentsListComponent);
      const comp = f.componentInstance;
      f.detectChanges();

      // Emit an error through the stream.
      errorSubject.error(new Error('Firestore unavailable'));

      // rxResource processes the error asynchronously. Flush microtasks without
      // calling detectChanges: paymentsResource.value() re-throws in error state
      // (line 79 of the template), so we assert on the resource signal directly.
      await Promise.resolve();
      await Promise.resolve();

      expect(comp.paymentsResource.error()).toBeTruthy();
      expect((comp.paymentsResource.error() as Error).message).toContain('Firestore unavailable');
    });
  });

  describe('Helper methods', () => {
    let component: PaymentsListComponent;

    beforeEach(async () => {
      ({ component } = await setup());
    });

    it('getPersonName resolves known personId', () => {
      expect(component.getPersonName('fabio')).toBe('Fabio');
    });

    it('getPersonName falls back to personId for unknown id', () => {
      expect(component.getPersonName('unknown-id')).toBe('unknown-id');
    });

    it('getPersonInitials resolves known personId', () => {
      expect(component.getPersonInitials('fabio')).toBe('Fa');
    });

    it('formatDate returns padded day and short month', () => {
      const result = component.formatDate(new Date('2026-06-02'));
      expect(result.day).toBe('02');
      expect(result.month).toBe('giu');
    });

    it('formatAmount formats with Italian locale and 2 decimals', () => {
      expect(component.formatAmount(50)).toBe('50,00');
    });
  });

  describe('Delete dialog', () => {
    let fixture: ComponentFixture<PaymentsListComponent>;
    let component: PaymentsListComponent;
    let paymentsService: MockPaymentsService;

    beforeEach(async () => {
      ({ fixture, component, paymentsService } = await setup());
    });

    it('dialog is hidden before any interaction', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.dialog-backdrop')).toBeFalsy();
    });

    it('openDeleteDialog sets pendingDeleteId and clears deleteError', () => {
      component.deleteError.set('previous error');
      component.openDeleteDialog('payment-1');

      expect(component.pendingDeleteId()).toBe('payment-1');
      expect(component.deleteError()).toBeNull();
    });

    it('opens delete dialog in the DOM when openDeleteDialog is called', () => {
      component.openDeleteDialog('payment-1');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.dialog-backdrop')).toBeTruthy();
    });

    it('cancel closes dialog and does not call deletePayment', () => {
      component.openDeleteDialog('payment-1');
      fixture.detectChanges();

      component.cancelDelete();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.dialog-backdrop')).toBeFalsy();
      expect(paymentsService.deletePayment).not.toHaveBeenCalled();
    });

    it('confirmDelete calls deletePayment with the correct id', async () => {
      component.openDeleteDialog('payment-1');
      await component.confirmDelete();
      expect(paymentsService.deletePayment).toHaveBeenCalledWith('payment-1');
    });

    it('confirmDelete resets pendingDeleteId on success', async () => {
      component.openDeleteDialog('payment-1');
      await component.confirmDelete();
      expect(component.pendingDeleteId()).toBeNull();
    });

    it('shows deleteError in template when delete fails', async () => {
      paymentsService.deletePayment.mockRejectedValueOnce(new Error('Permission denied'));

      component.openDeleteDialog('payment-1');
      fixture.detectChanges();

      await component.confirmDelete().catch(() => {});
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.delete-error')).toBeTruthy();
      expect(el.querySelector('.delete-error')!.textContent).toContain('Permission denied');
    });

    it('keeps dialog open when delete fails', async () => {
      paymentsService.deletePayment.mockRejectedValueOnce(new Error('Permission denied'));

      component.openDeleteDialog('payment-1');
      await component.confirmDelete().catch(() => {});

      expect(component.deleteError()).toContain('Permission denied');
      expect(component.pendingDeleteId()).toBe('payment-1');
    });

    it('cancelDelete also clears any previous delete error', () => {
      component.openDeleteDialog('payment-1');
      component.deleteError.set('some error');
      component.cancelDelete();

      expect(component.deleteError()).toBeNull();
    });
  });
});
