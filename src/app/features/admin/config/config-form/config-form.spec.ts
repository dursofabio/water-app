import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigFormComponent } from './config-form';
import { ConfigService } from '../../../../core/services/config.service';
import { DEFAULT_PRICES } from '../../../../core/models/config.model';

/**
 * Unit tests for ConfigFormComponent — US-013
 *
 * Strategy: mock ConfigService.
 * Tests verify:
 * - Form pre-populates fields from configService.pricesResource
 * - isFormValid is false for negative values or NaN
 * - isFormValid is true for values >= 0 (including 0)
 * - submit() does not execute when form is invalid
 * - isSaving is set during save, saveSuccess on success
 * - saveError is shown on error
 * - navigateToAdmin() navigates to /admin after success
 */

class MockConfigService {
  readonly pricesResource = {
    value: signal(DEFAULT_PRICES),
    status: signal('resolved'),
    isLoading: signal(false),
    error: signal<unknown>(undefined),
    reload: () => true,
  };

  updatePrices = vi.fn().mockResolvedValue(undefined);
}

describe('ConfigFormComponent (US-013)', () => {
  let component: ConfigFormComponent;
  let fixture: ComponentFixture<ConfigFormComponent>;
  let configService: MockConfigService;
  let router: Router;

  beforeEach(async () => {
    configService = new MockConfigService();

    await TestBed.configureTestingModule({
      imports: [ConfigFormComponent],
      providers: [
        provideRouter([]),
        { provide: ConfigService, useValue: configService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // ─── Pre-populate ───────────────────────────────────────────────────────────

  it('pre-populates waterPrice from configService.pricesResource', () => {
    expect(component.waterPrice()).toBe(DEFAULT_PRICES.waterPrice);
  });

  it('pre-populates energyPrice from configService.pricesResource', () => {
    expect(component.energyPrice()).toBe(DEFAULT_PRICES.energyPrice);
  });

  it('re-populates fields when pricesResource value changes', () => {
    configService.pricesResource.value.set({ waterPrice: 50, energyPrice: 20 });
    fixture.detectChanges();

    expect(component.waterPrice()).toBe(50);
    expect(component.energyPrice()).toBe(20);
  });

  // ─── isFormValid ────────────────────────────────────────────────────────────

  it('isFormValid is true for default prices (>= 0)', () => {
    expect(component.isFormValid()).toBe(true);
  });

  it('isFormValid is true when both prices are 0', () => {
    component.updateWaterPrice(0);
    component.updateEnergyPrice(0);

    expect(component.isFormValid()).toBe(true);
  });

  it('isFormValid is false when waterPrice is negative', () => {
    component.updateWaterPrice(-1);

    expect(component.isFormValid()).toBe(false);
  });

  it('isFormValid is false when energyPrice is negative', () => {
    component.updateEnergyPrice(-5);

    expect(component.isFormValid()).toBe(false);
  });

  it('isFormValid is false when waterPrice is NaN', () => {
    component.updateWaterPrice(NaN);

    expect(component.isFormValid()).toBe(false);
  });

  it('isFormValid is false when energyPrice is NaN', () => {
    component.updateEnergyPrice(NaN);

    expect(component.isFormValid()).toBe(false);
  });

  // ─── submit() blocked when invalid ──────────────────────────────────────────

  it('submit() does not call updatePrices when form is invalid', async () => {
    component.updateWaterPrice(-1);
    await component.submit();

    expect(configService.updatePrices).not.toHaveBeenCalled();
  });

  // ─── submit() happy path ─────────────────────────────────────────────────────

  it('submit() calls updatePrices with current waterPrice and energyPrice', async () => {
    component.updateWaterPrice(28);
    component.updateEnergyPrice(12);

    await component.submit();

    expect(configService.updatePrices).toHaveBeenCalledWith({ waterPrice: 28, energyPrice: 12 });
  });

  it('sets saveSuccess to true after a successful submit', async () => {
    await component.submit();

    expect(component.saveSuccess()).toBe(true);
  });

  it('sets isSaving to false after submit completes', async () => {
    await component.submit();

    expect(component.isSaving()).toBe(false);
  });

  // ─── submit() error path ─────────────────────────────────────────────────────

  it('sets saveError when updatePrices rejects', async () => {
    configService.updatePrices.mockRejectedValue(new Error('permission-denied'));

    await component.submit();

    expect(component.saveError()).toContain('permission-denied');
    expect(component.saveSuccess()).toBe(false);
  });

  it('sets isSaving to false after submit fails', async () => {
    configService.updatePrices.mockRejectedValue(new Error('network error'));

    await component.submit();

    expect(component.isSaving()).toBe(false);
  });

  it('clears saveError before each new submit attempt', async () => {
    // First: fail
    configService.updatePrices.mockRejectedValueOnce(new Error('first error'));
    await component.submit();
    expect(component.saveError()).toBeTruthy();

    // Second: succeed
    configService.updatePrices.mockResolvedValue(undefined);
    await component.submit();
    expect(component.saveError()).toBeNull();
  });

  // ─── Navigation ─────────────────────────────────────────────────────────────

  it('navigateBack() navigates to /admin', async () => {
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.navigateBack();

    expect(spy).toHaveBeenCalledWith(['/admin']);
  });

  it('navigateToAdmin() sets saveSuccess to false and navigates to /admin', async () => {
    component['saveSuccess'].set(true);
    const spy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.navigateToAdmin();

    expect(component.saveSuccess()).toBe(false);
    expect(spy).toHaveBeenCalledWith(['/admin']);
  });

  // ─── Template ───────────────────────────────────────────────────────────────

  it('renders the water price input in the DOM', () => {
    const input = fixture.nativeElement.querySelector('#price-water');
    expect(input).toBeTruthy();
  });

  it('renders the energy price input in the DOM', () => {
    const input = fixture.nativeElement.querySelector('#price-energy');
    expect(input).toBeTruthy();
  });

  it('disables the submit button when form is invalid', () => {
    component.updateWaterPrice(-1);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBe(true);
  });

  it('shows validation error message when form is invalid', () => {
    component.updateWaterPrice(-1);
    fixture.detectChanges();

    const msg = fixture.nativeElement.querySelector('.validation-msg--error');
    expect(msg).toBeTruthy();
  });

  it('does not show validation error message when form is valid', () => {
    fixture.detectChanges();
    const msg = fixture.nativeElement.querySelector('.validation-msg--error');
    expect(msg).toBeNull();
  });

  it('shows success overlay when saveSuccess is true', () => {
    component['saveSuccess'].set(true);
    fixture.detectChanges();

    const overlay = fixture.nativeElement.querySelector('[aria-label="Prezzi salvati"]');
    expect(overlay).toBeTruthy();
  });

  it('shows save error when saveError has a message', () => {
    component['saveError'].set('Errore di rete');
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('.save-error');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Errore di rete');
  });
});
