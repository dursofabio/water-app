import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentFormComponent } from './payment-form';
import { PaymentsService } from '../../../../core/services/payments.service';
import { BalanceService } from '../../../dashboard/services/balance.service';
import { PersonBalance } from '../../../dashboard/models/balance.model';

/**
 * Unit tests for PaymentFormComponent — US-011
 *
 * Strategy: mock PaymentsService and BalanceService.
 * Tests verify:
 * - Form initial state: submit disabled
 * - Persona selection updates paidByPersonId signal
 * - Amount 0 keeps submit disabled
 * - Form valid when persona, date, and amount > 0 are set
 * - Submit calls PaymentsService.addPayment() with correct data
 * - Submit includes note when provided
 * - Submit omits note when empty
 * - Error from service is shown in template
 * - Success shows overlay with person name
 */

const MOCK_BALANCES: PersonBalance[] = [
  { id: 'fabio', name: 'Fabio', initials: 'Fa', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
  { id: 'fernando', name: 'Fernando', initials: 'Fe', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
  { id: 'nino', name: 'Nino', initials: 'Ni', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
  { id: 'daniele', name: 'Daniele', initials: 'Da', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
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

class MockPaymentsService {
  addPayment = vi.fn().mockResolvedValue(undefined);
}

describe('PaymentFormComponent (US-011)', () => {
  let component: PaymentFormComponent;
  let fixture: ComponentFixture<PaymentFormComponent>;
  let paymentsService: MockPaymentsService;

  beforeEach(async () => {
    paymentsService = new MockPaymentsService();

    await TestBed.configureTestingModule({
      imports: [PaymentFormComponent],
      providers: [
        provideRouter([]),
        { provide: BalanceService, useClass: MockBalanceService },
        { provide: PaymentsService, useValue: paymentsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form rendering', () => {
    it('renders the date input', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#payment-date')).toBeTruthy();
    });

    it('renders the amount input', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#payment-amount')).toBeTruthy();
    });

    it('renders the note textarea', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#payment-note')).toBeTruthy();
    });

    it('renders person cards for each person', () => {
      const el = fixture.nativeElement as HTMLElement;
      const cards = el.querySelectorAll('.person-card');
      expect(cards.length).toBe(4);
    });

    it('renders the save button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const btn = el.querySelector('button[type="submit"]');
      expect(btn).toBeTruthy();
    });
  });

  describe('Initial state', () => {
    it('has no person selected initially', () => {
      expect(component.paidByPersonId()).toBe('');
    });

    it('has amount 0 initially', () => {
      expect(component.amount()).toBe(0);
    });

    it('has today as default date', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(component.date()).toBe(today);
    });

    it('has empty note initially', () => {
      expect(component.note()).toBe('');
    });

    it('form is invalid initially', () => {
      expect(component.isFormValid()).toBe(false);
    });

    it('submit button is disabled initially', () => {
      const el = fixture.nativeElement as HTMLElement;
      const btn = el.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe('Person selection', () => {
    it('selectPerson updates paidByPersonId signal', () => {
      component.selectPerson('fernando');
      expect(component.paidByPersonId()).toBe('fernando');
    });

    it('person card gets selected class when clicked', () => {
      component.selectPerson('fabio');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cards = el.querySelectorAll('.person-card');
      const fabioCard = Array.from(cards).find(
        (c) => c.textContent?.includes('Fabio'),
      );
      expect(fabioCard?.classList.contains('selected')).toBe(true);
    });

    it('person card has aria-pressed true when selected', () => {
      component.selectPerson('nino');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const cards = el.querySelectorAll('.person-card');
      const ninoCard = Array.from(cards).find(
        (c) => c.textContent?.includes('Nino'),
      ) as HTMLButtonElement | undefined;
      expect(ninoCard?.getAttribute('aria-pressed')).toBe('true');
    });

    it('selectedPerson computed returns the selected person', () => {
      component.selectPerson('daniele');
      const selected = component.selectedPerson();
      expect(selected?.name).toBe('Daniele');
    });

    it('selectedPerson returns null when no person selected', () => {
      expect(component.selectedPerson()).toBeNull();
    });
  });

  describe('Amount validation', () => {
    it('amount 0 keeps the form invalid', () => {
      component.selectPerson('fabio');
      component.updateAmount(0);
      expect(component.isFormValid()).toBe(false);
    });

    it('amount > 0 with person and date makes the form valid', () => {
      component.selectPerson('fabio');
      component.updateAmount(50);
      expect(component.isFormValid()).toBe(true);
    });

    it('negative amount keeps the form invalid', () => {
      component.selectPerson('fabio');
      component.updateAmount(-1);
      expect(component.isFormValid()).toBe(false);
    });
  });

  describe('Validation state', () => {
    it('form is invalid when person is missing', () => {
      component.updateAmount(50);
      expect(component.isFormValid()).toBe(false);
    });

    it('form is invalid when date is cleared', () => {
      component.selectPerson('fabio');
      component.updateAmount(50);
      component.date.set('');
      expect(component.isFormValid()).toBe(false);
    });

    it('form is valid with all required fields', () => {
      component.selectPerson('fernando');
      component.updateAmount(75);
      component.date.set('2026-06-11');
      expect(component.isFormValid()).toBe(true);
    });
  });

  describe('Submit', () => {
    it('calls addPayment with correct data', async () => {
      component.selectPerson('fernando');
      component.updateAmount(50);
      component.date.set('2026-06-11');

      await component.submit();

      expect(paymentsService.addPayment).toHaveBeenCalledWith({
        personId: 'fernando',
        amount: 50,
        date: new Date('2026-06-11'),
        note: undefined,
      });
    });

    it('includes note when provided', async () => {
      component.selectPerson('fabio');
      component.updateAmount(100);
      component.date.set('2026-06-11');
      component.note.set('Pagamento acconto');

      await component.submit();

      expect(paymentsService.addPayment).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'Pagamento acconto' }),
      );
    });

    it('sets saveSuccess to true after successful submit', async () => {
      component.selectPerson('nino');
      component.updateAmount(30);
      component.date.set('2026-06-11');

      await component.submit();

      expect(component.saveSuccess()).toBe(true);
    });

    it('does not call addPayment when form is invalid', async () => {
      // No person selected, amount 0
      await component.submit();

      expect(paymentsService.addPayment).not.toHaveBeenCalled();
    });

    it('shows save error when addPayment throws', async () => {
      paymentsService.addPayment.mockRejectedValueOnce(new Error("L'importo deve essere maggiore di zero."));

      component.selectPerson('fabio');
      component.updateAmount(10);
      component.date.set('2026-06-11');

      await component.submit();

      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const errorEl = el.querySelector('.save-error');
      expect(errorEl).toBeTruthy();
      expect(errorEl?.textContent).toContain("importo");
    });

    it('sets isSaving to false after successful submit', async () => {
      component.selectPerson('daniele');
      component.updateAmount(20);

      await component.submit();

      expect(component.isSaving()).toBe(false);
    });
  });

  describe('Success overlay', () => {
    it('shows success overlay after successful submit', async () => {
      component.selectPerson('fernando');
      component.updateAmount(50);

      await component.submit();

      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const overlay = el.querySelector('.success-overlay');
      expect(overlay).toBeTruthy();
    });

    it('success overlay contains person name', async () => {
      component.selectPerson('nino');
      component.updateAmount(60);

      await component.submit();

      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const overlay = el.querySelector('.success-overlay');
      expect(overlay?.textContent).toContain('Nino');
    });
  });
});
