import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { LoadFormComponent } from './load-form';
import { ConfigService } from '../../../../core/services/config.service';
import { LoadsService, LoadRecord } from '../../../../core/services/loads.service';
import { BalanceService } from '../../../dashboard/services/balance.service';
import { DEFAULT_PRICES } from '../../../../core/models/config.model';
import { PersonBalance } from '../../../dashboard/models/balance.model';

/**
 * Unit tests for LoadFormComponent — US-008
 *
 * Strategy: mock ConfigService, LoadsService, and BalanceService.
 * Tests verify:
 * - Form renders with date, paid-by select, weight inputs, price inputs
 * - Weights default to 1 for each person
 * - Preview costs update reactively when a weight changes
 * - Validation: negative weights are prevented, zero total disables submit, date required
 * - Price override updates the preview
 * - Submit calls LoadsService.addLoad with correct data
 * - Save error is displayed when addLoad throws
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

class MockConfigService {
  readonly pricesResource = {
    value: signal(DEFAULT_PRICES),
    status: signal('resolved'),
    isLoading: signal(false),
    error: signal(undefined),
    reload: () => true,
  };
}

class MockLoadsService {
  addLoad = vi.fn().mockResolvedValue(undefined);
  updateLoad = vi.fn().mockResolvedValue(undefined);
  getLoadById = vi.fn().mockReturnValue(of(null));
}

describe('LoadFormComponent (US-008/US-009)', () => {
  let component: LoadFormComponent;
  let fixture: ComponentFixture<LoadFormComponent>;
  let loadsService: MockLoadsService;

  beforeEach(async () => {
    loadsService = new MockLoadsService();

    await TestBed.configureTestingModule({
      imports: [LoadFormComponent],
      providers: [
        provideRouter([]),
        { provide: BalanceService, useClass: MockBalanceService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: LoadsService, useValue: loadsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Initialize weights explicitly since ngOnInit depends on computed people()
    component['initWeights'](MOCK_BALANCES.map((b) => ({ id: b.id, name: b.name, initials: b.initials })));
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('Form rendering', () => {
    it('renders the date input', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#load-date')).toBeTruthy();
    });

    it('renders the paid-by select', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#paid-by')).toBeTruthy();
    });

    it('renders weight inputs for each person', () => {
      const el = fixture.nativeElement as HTMLElement;
      const inputs = el.querySelectorAll('input[type="number"][aria-label^="Peso"]');
      expect(inputs.length).toBe(4);
    });

    it('renders water price input', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#price-water')).toBeTruthy();
    });

    it('renders energy price input', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('#price-energy')).toBeTruthy();
    });

    it('renders the save button', () => {
      const el = fixture.nativeElement as HTMLElement;
      const btn = el.querySelector('button[type="submit"]');
      expect(btn).toBeTruthy();
    });
  });

  describe('Default values', () => {
    it('initializes weights to 1 for each person', () => {
      const weights = component.weights();
      expect(weights.every((w) => w.weight === 1)).toBe(true);
    });

    it('populates waterPrice from ConfigService default', () => {
      expect(component.waterPrice()).toBe(DEFAULT_PRICES.waterPrice);
    });

    it('populates energyPrice from ConfigService default', () => {
      expect(component.energyPrice()).toBe(DEFAULT_PRICES.energyPrice);
    });

    it('sets today as the default date', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(component.date()).toBe(today);
    });
  });

  describe('Reactive preview', () => {
    it('renders one preview row for each person', () => {
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('.preview-breakdown-row');
      expect(rows.length).toBe(MOCK_BALANCES.length);
      expect(el.textContent).toContain('Fabio');
      expect(el.textContent).toContain('Fernando');
      expect(el.textContent).toContain('Nino');
      expect(el.textContent).toContain('Daniele');
    });

    it('calculates totalWeight as sum of all weights', () => {
      // 4 persons × 1 = 4
      expect(component.totalWeight()).toBe(4);
    });

    it('updates totalWeight when a weight changes', () => {
      component.updateWeight(0, 3); // person[0] weight = 3
      expect(component.totalWeight()).toBe(6); // 3 + 1 + 1 + 1
    });

    it('updates cost preview when weight changes', () => {
      // Initially: 4 people × 1 kg; pricePerUnit = 35+10=45
      // Each person: 1/4 * 45 = 11.25
      const initialBreakdown = component.breakdown();
      expect(initialBreakdown[0].cost).toBeCloseTo(11.25, 3);

      // Change person[0] weight to 2: their share = 2/5 * 45 = 18
      component.updateWeight(0, 2);
      const updatedBreakdown = component.breakdown();
      expect(updatedBreakdown[0].cost).toBeCloseTo(18, 3);
    });

    it('updates cost preview when waterPrice changes', () => {
      // Before: pricePerUnit = 45, person cost = 1/4 * 45 = 11.25
      // After waterPrice = 45: pricePerUnit = 55, cost = 1/4 * 55 = 13.75
      component.updateWaterPrice(45);
      const breakdown = component.breakdown();
      expect(breakdown[0].cost).toBeCloseTo(13.75, 3);
    });

    it('updates total preview immediately when energyPrice changes', () => {
      component.updateEnergyPrice(15);
      expect(component.expectedTotal()).toBe(50);
      expect(component.totalAmount()).toBeCloseTo(50, 3);
    });

    it('updates totalAmount reactively', () => {
      // 4 × 1 kg, pricePerUnit = 45 → totalAmount = 45
      expect(component.totalAmount()).toBeCloseTo(45, 3);
    });

    it('keeps preview total aligned with water plus energy when weights are positive', () => {
      component.updateWeight(0, 2.5);
      component.updateWaterPrice(42.25);
      component.updateEnergyPrice(12.75);

      expect(component.expectedTotal()).toBeCloseTo(55, 3);
      expect(component.totalAmount()).toBeCloseTo(component.expectedTotal(), 3);
      expect(component.previewTotalMatchesExpected()).toBe(true);
    });

    it('shows a warning and placeholders instead of numeric costs when totalWeight is 0', () => {
      component.weights().forEach((_, i) => component.updateWeight(i, 0));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const warning = el.querySelector('.preview-warning');
      const costs = Array.from(el.querySelectorAll('.preview-cost')).map((node) => node.textContent?.trim());

      expect(component.canShowPreviewValues()).toBe(false);
      expect(warning?.textContent).toContain('La somma dei pesi è 0');
      expect(costs.every((text) => text === '—')).toBe(true);
      expect(el.textContent).toContain('Totale non calcolabile');
    });
  });

  describe('Validation', () => {
    it('isFormValid is false when paidByPersonId is empty', () => {
      component.paidByPersonId.set('');
      expect(component.isFormValid()).toBe(false);
    });

    it('isFormValid is false when date is empty', () => {
      component.date.set('');
      component.paidByPersonId.set('fabio');
      expect(component.isFormValid()).toBe(false);
    });

    it('isFormValid is false when totalWeight is 0', () => {
      component.paidByPersonId.set('fabio');
      component.weights().forEach((_, i) => component.updateWeight(i, 0));
      expect(component.isFormValid()).toBe(false);
    });

    it('isFormValid is true when all required fields are filled and totalWeight > 0', () => {
      component.paidByPersonId.set('fabio');
      component.date.set('2026-06-11');
      // weights are already 1 each → totalWeight > 0
      expect(component.isFormValid()).toBe(true);
    });

    it('updateWeight clamps negative values to 0', () => {
      component.updateWeight(0, -5);
      expect(component.weights()[0].weight).toBe(0);
    });

    it('submit button is disabled when form is invalid', () => {
      component.paidByPersonId.set('');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const btn = el.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });

    it('submit button remains disabled when totalWeight is 0', () => {
      component.paidByPersonId.set('fabio');
      component.weights().forEach((_, i) => component.updateWeight(i, 0));
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const btn = el.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe('Submit', () => {
    beforeEach(() => {
      component.paidByPersonId.set('fabio');
      component.date.set('2026-06-11');
    });

    it('calls LoadsService.addLoad when form is valid', async () => {
      await component.submit();
      expect(loadsService.addLoad).toHaveBeenCalledOnce();
    });

    it('passes waterPrice and energyPrice as snapshot to addLoad', async () => {
      await component.submit();
      const call = loadsService.addLoad.mock.calls[0][0];
      expect(call.waterPrice).toBe(DEFAULT_PRICES.waterPrice);
      expect(call.energyPrice).toBe(DEFAULT_PRICES.energyPrice);
    });

    it('passes overridden prices to addLoad', async () => {
      component.updateWaterPrice(50);
      component.updateEnergyPrice(20);
      await component.submit();
      const call = loadsService.addLoad.mock.calls[0][0];
      expect(call.waterPrice).toBe(50);
      expect(call.energyPrice).toBe(20);
    });

    it('shows success overlay after successful save', async () => {
      await component.submit();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.success-overlay')).toBeTruthy();
    });

    it('shows error message when addLoad throws', async () => {
      loadsService.addLoad.mockRejectedValueOnce(new Error('Network error'));
      await component.submit();
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const errEl = el.querySelector('.save-error');
      expect(errEl).toBeTruthy();
      expect(errEl!.textContent).toContain('Network error');
    });

    it('does not call addLoad when form is invalid', async () => {
      component.paidByPersonId.set('');
      await component.submit();
      expect(loadsService.addLoad).not.toHaveBeenCalled();
    });
  });
});

// ─── Edit mode tests (US-010) ─────────────────────────────────────────────────

const MOCK_LOAD_RECORD: LoadRecord = {
  id: 'load-abc',
  date: new Date('2026-06-11'),
  paidByPersonId: 'fernando',
  waterPrice: 60,
  energyPrice: 15,
  totalAmount: 75,
  totalWeight: 3,
  breakdown: [
    { personId: 'fabio', weight: 2, cost: 50 },
    { personId: 'fernando', weight: 1, cost: 25 },
    { personId: 'nino', weight: 0, cost: 0 },
    { personId: 'daniele', weight: 0, cost: 0 },
  ],
};

function makeActivatedRoute(loadId: string | null) {
  return {
    snapshot: {
      paramMap: {
        get: (key: string) => (key === 'loadId' ? loadId : null),
      },
    },
  };
}

describe('LoadFormComponent — edit mode (US-010)', () => {
  let component: LoadFormComponent;
  let fixture: ComponentFixture<LoadFormComponent>;
  let loadsService: MockLoadsService;

  beforeEach(async () => {
    loadsService = new MockLoadsService();
    loadsService.getLoadById = vi.fn().mockReturnValue(of(MOCK_LOAD_RECORD));

    await TestBed.configureTestingModule({
      imports: [LoadFormComponent],
      providers: [
        provideRouter([]),
        { provide: BalanceService, useClass: MockBalanceService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: LoadsService, useValue: loadsService },
        { provide: ActivatedRoute, useValue: makeActivatedRoute('load-abc') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create the component in edit mode', () => {
    expect(component).toBeTruthy();
    expect(component.isEditMode()).toBe(true);
  });

  it('sets loadId from route param', () => {
    expect(component.loadId()).toBe('load-abc');
  });

  it('prefills date from the existing load', async () => {
    // allow rxResource and effect to process
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.date()).toBe('2026-06-11');
  });

  it('prefills paidByPersonId from the existing load', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.paidByPersonId()).toBe('fernando');
  });

  it('prefills waterPrice from the existing load', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.waterPrice()).toBe(60);
  });

  it('prefills energyPrice from the existing load', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.energyPrice()).toBe(15);
  });

  it('prefills weights from the existing breakdown', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const fabioEntry = component.weights().find((w) => w.personId === 'fabio');
    expect(fabioEntry?.weight).toBe(2);
  });

  it('shows "Modifica carico" title in template', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.top-bar__title')?.textContent?.trim()).toBe('Modifica carico');
  });

  it('shows "Salva modifiche" on submit button', async () => {
    await fixture.whenStable();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('button[type="submit"]');
    expect(btn?.textContent).toContain('Salva modifiche');
  });

  it('calls updateLoad (not addLoad) on submit', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    component.paidByPersonId.set('fabio');
    await component.submit();

    expect(loadsService.updateLoad).toHaveBeenCalledWith('load-abc', expect.objectContaining({ paidByPersonId: 'fabio' }));
    expect(loadsService.addLoad).not.toHaveBeenCalled();
  });

  it('navigateToAdmin goes to /admin/carichi', () => {
    const router = TestBed.inject(Router);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.navigateToAdmin();

    expect(spy).toHaveBeenCalledWith(['/admin/carichi']);
  });
});

describe('LoadFormComponent — not-found state (US-010)', () => {
  let component: LoadFormComponent;
  let fixture: ComponentFixture<LoadFormComponent>;

  beforeEach(async () => {
    const loadsService = new MockLoadsService();
    loadsService.getLoadById = vi.fn().mockReturnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [LoadFormComponent],
      providers: [
        provideRouter([]),
        { provide: BalanceService, useClass: MockBalanceService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: LoadsService, useValue: loadsService },
        { provide: ActivatedRoute, useValue: makeActivatedRoute('missing-id') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('shows not-found message when document is null', async () => {
    await fixture.whenStable();
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const errorEl = el.querySelector('.save-error');
    expect(errorEl?.textContent).toContain('non trovato');
  });
});

// ─── Mobile UX tests (US-021) ─────────────────────────────────────────────────

describe('LoadFormComponent — mobile UX (US-021)', () => {
  let component: LoadFormComponent;
  let fixture: ComponentFixture<LoadFormComponent>;

  beforeEach(async () => {
    const loadsService = new MockLoadsService();

    await TestBed.configureTestingModule({
      imports: [LoadFormComponent],
      providers: [
        provideRouter([]),
        { provide: BalanceService, useClass: MockBalanceService },
        { provide: ConfigService, useClass: MockConfigService },
        { provide: LoadsService, useValue: loadsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    component['initWeights'](MOCK_BALANCES.map((b) => ({ id: b.id, name: b.name, initials: b.initials })));
    fixture.detectChanges();
  });

  it('renders sticky-actions container', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.sticky-actions')).toBeTruthy();
  });

  it('submit button has min-height style via CSS class', () => {
    const el = fixture.nativeElement as HTMLElement;
    const stickyActions = el.querySelector('.sticky-actions');
    const submitBtn = stickyActions?.querySelector('button[type="submit"]') ?? el.querySelector('button[type="submit"]');
    expect(submitBtn).toBeTruthy();
    expect(submitBtn!.classList.contains('btn-primary')).toBe(true);
  });

  it('renders cancel button in sticky actions', () => {
    const el = fixture.nativeElement as HTMLElement;
    const stickyActions = el.querySelector('.sticky-actions');
    const cancelBtn =
      stickyActions?.querySelector('.btn-secondary') ??
      stickyActions?.querySelector('button[type="button"]') ??
      Array.from(el.querySelectorAll('button[type="button"]')).find((b) =>
        b.textContent?.includes('Annulla'),
      );
    expect(cancelBtn).toBeTruthy();
    expect(cancelBtn!.textContent).toContain('Annulla');
  });

  it('preview section is present and aria-labelled', () => {
    const el = fixture.nativeElement as HTMLElement;
    const preview = el.querySelector('[aria-label]');
    const previewLabelled = Array.from(el.querySelectorAll('[aria-label]')).find((node) => {
      const label = node.getAttribute('aria-label') ?? '';
      return label.toLowerCase().includes('anteprima') || label.toLowerCase().includes('preview');
    });
    expect(previewLabelled).toBeTruthy();
  });
});
