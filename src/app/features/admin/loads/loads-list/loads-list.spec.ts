import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, Subject } from 'rxjs';

import { AdminLoadsListComponent } from './loads-list';
import { LoadsService, LoadRecord } from '../../../../core/services/loads.service';
import { BalanceService } from '../../../dashboard/services/balance.service';
import { PersonBalance } from '../../../dashboard/models/balance.model';

const MOCK_BALANCES: PersonBalance[] = [
  { id: 'fabio', name: 'Fabio', initials: 'Fa', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
  { id: 'fernando', name: 'Fernando', initials: 'Fe', loadsTotal: 0, paymentsTotal: 0, balance: 0, status: 'zero' },
];

const MOCK_LOADS: LoadRecord[] = [
  {
    id: 'load-1',
    date: new Date('2026-06-11'),
    paidByPersonId: 'fabio',
    waterPrice: 35,
    energyPrice: 10,
    totalAmount: 45,
    totalWeight: 2,
    breakdown: [
      { personId: 'fabio', weight: 1, cost: 22.5 },
      { personId: 'fernando', weight: 1, cost: 22.5 },
    ],
  },
  {
    id: 'load-2',
    date: new Date('2026-06-02'),
    paidByPersonId: 'fernando',
    waterPrice: 60,
    energyPrice: 15,
    totalAmount: 75,
    totalWeight: 4,
    breakdown: [
      { personId: 'fabio', weight: 3, cost: 56.25 },
      { personId: 'fernando', weight: 1, cost: 18.75 },
    ],
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

class MockLoadsService {
  getLoads = vi.fn().mockReturnValue(of(MOCK_LOADS));
  deleteLoad = vi.fn().mockResolvedValue(undefined);
}

async function setup(loadsServiceOverride?: Partial<MockLoadsService>) {
  const loadsService = Object.assign(new MockLoadsService(), loadsServiceOverride ?? {});

  await TestBed.configureTestingModule({
    imports: [AdminLoadsListComponent],
    providers: [
      provideRouter([]),
      { provide: BalanceService, useClass: MockBalanceService },
      { provide: LoadsService, useValue: loadsService },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminLoadsListComponent);
  const component = fixture.componentInstance;
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, component, loadsService };
}

describe('AdminLoadsListComponent', () => {
  describe('Data rendering', () => {
    let fixture: ComponentFixture<AdminLoadsListComponent>;
    let component: AdminLoadsListComponent;

    beforeEach(async () => {
      ({ fixture, component } = await setup());
    });

    it('creates the component', () => {
      expect(component).toBeTruthy();
    });

    it('renders a load row for each load', () => {
      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('.load-row');
      expect(rows.length).toBe(2);
    });

    it('shows formatted date day and month for first load', () => {
      const el = fixture.nativeElement as HTMLElement;
      const dateStacks = el.querySelectorAll('.date-stack');
      expect(dateStacks[0].textContent).toContain('11');
      expect(dateStacks[0].textContent).toContain('giu');
    });

    it('shows total amount for first load', () => {
      const el = fixture.nativeElement as HTMLElement;
      const firstRow = el.querySelectorAll('.load-row')[0];
      expect(firstRow.textContent).toContain('45.00');
    });

    it('resolves paidByPersonId to person name', () => {
      const el = fixture.nativeElement as HTMLElement;
      const firstRow = el.querySelectorAll('.load-row')[0];
      expect(firstRow.textContent).toContain('Fabio');
    });

    it('renders mini-breakdown chips', () => {
      const el = fixture.nativeElement as HTMLElement;
      const breakdown = el.querySelectorAll('.mini-breakdown')[0];
      expect(breakdown.textContent).toContain('Fa');
      expect(breakdown.textContent).toContain('1 kg');
    });

    it('edit link points to /admin/carichi/:id', () => {
      const el = fixture.nativeElement as HTMLElement;
      const editLink = el.querySelector('a.icon-btn') as HTMLAnchorElement;
      expect(editLink.getAttribute('href')).toBe('/admin/carichi/load-1');
    });
  });

  describe('Empty state', () => {
    it('shows empty state container when no loads', async () => {
      const { fixture: f } = await setup({ getLoads: vi.fn().mockReturnValue(of([])) });
      const el = f.nativeElement as HTMLElement;
      expect(el.querySelector('.state-container.empty')).toBeTruthy();
    });
  });

  describe('Loading state', () => {
    it('shows loading spinner while stream is pending', async () => {
      const neverSubject = new Subject<LoadRecord[]>();
      await TestBed.configureTestingModule({
        imports: [AdminLoadsListComponent],
        providers: [
          provideRouter([]),
          { provide: BalanceService, useClass: MockBalanceService },
          { provide: LoadsService, useValue: { getLoads: vi.fn().mockReturnValue(neverSubject) } },
        ],
      }).compileComponents();

      const f = TestBed.createComponent(AdminLoadsListComponent);
      f.detectChanges();
      const el = f.nativeElement as HTMLElement;
      expect(el.querySelector('.state-container mat-spinner')).toBeTruthy();
    });
  });

  describe('Helper methods', () => {
    let component: AdminLoadsListComponent;

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

    it('formatDate returns padded day and month', () => {
      const result = component.formatDate(new Date('2026-06-02'));
      expect(result.day).toBe('02');
      expect(result.month).toBe('giu');
    });
  });

  describe('Delete dialog', () => {
    let fixture: ComponentFixture<AdminLoadsListComponent>;
    let component: AdminLoadsListComponent;
    let loadsService: MockLoadsService;

    beforeEach(async () => {
      ({ fixture, component, loadsService } = await setup());
    });

    it('dialog is hidden before any interaction', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.dialog-backdrop')).toBeFalsy();
    });

    it('opens dialog when openDeleteDialog is called', () => {
      component.openDeleteDialog('load-1');
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.dialog-backdrop')).toBeTruthy();
    });

    it('cancel closes dialog and does not call deleteLoad', () => {
      component.openDeleteDialog('load-1');
      fixture.detectChanges();

      component.cancelDelete();
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.dialog-backdrop')).toBeFalsy();
      expect(loadsService.deleteLoad).not.toHaveBeenCalled();
    });

    it('confirmDelete calls deleteLoad with the correct id', async () => {
      component.openDeleteDialog('load-1');
      await component.confirmDelete();
      expect(loadsService.deleteLoad).toHaveBeenCalledWith('load-1');
    });

    it('confirmDelete closes dialog after successful delete', async () => {
      component.openDeleteDialog('load-1');
      await component.confirmDelete();
      expect(component.pendingDeleteId()).toBeNull();
    });

    it('shows error and keeps dialog open when delete fails', async () => {
      loadsService.deleteLoad.mockRejectedValueOnce(new Error('Permission denied'));

      component.openDeleteDialog('load-1');
      await component.confirmDelete().catch(() => {});

      expect(component.deleteError()).toContain('Permission denied');
      expect(component.pendingDeleteId()).toBe('load-1');
    });

    it('cancelDelete also clears any previous delete error', () => {
      component.openDeleteDialog('load-1');
      component.deleteError.set('some error');
      component.cancelDelete();

      expect(component.deleteError()).toBeNull();
    });
  });
});
