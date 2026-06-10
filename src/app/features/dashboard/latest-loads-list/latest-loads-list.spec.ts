import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LatestLoadsList } from './latest-loads-list';
import { DashboardLoad } from '../models/load.model';

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
      { personId: 'nino', personName: 'Nino', weight: 3, cost: 30 },
    ],
  },
  {
    id: 'load-2',
    paidAt: new Date('2026-06-02T10:00:00'),
    paidByName: 'Fernando',
    totalAmount: 75,
    waterAmount: 60,
    energyAmount: 15,
    totalWeight: 10,
    breakdown: [
      { personId: 'fabio', personName: 'Fabio', weight: 3, cost: 22.5 },
    ],
  },
];

function makeResource(overrides: Partial<{
  value: () => DashboardLoad[];
  status: () => string;
  isLoading: () => boolean;
  error: () => unknown;
  reload: () => unknown;
}> = {}) {
  return {
    value: signal(MOCK_LOADS),
    status: signal('resolved'),
    isLoading: signal(false),
    error: signal(undefined),
    reload: vi.fn(),
    ...overrides,
  };
}

describe('LatestLoadsList (US-004)', () => {
  let component: LatestLoadsList;
  let fixture: ComponentFixture<LatestLoadsList>;
  let el: HTMLElement;

  async function createComponent(resource = makeResource()) {
    await TestBed.configureTestingModule({
      imports: [LatestLoadsList],
    }).compileComponents();

    fixture = TestBed.createComponent(LatestLoadsList);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('loadsResource', resource);
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;

    return resource;
  }

  it('renders the latest loads summary rows', async () => {
    await createComponent();
    const rows = el.querySelectorAll('.load-row');
    expect(rows.length).toBe(2);
    expect(el.textContent).toContain('Pagato da Fabio');
    expect(el.textContent).toContain('120,00');
  });

  it('limits the rendered list to 10 loads', async () => {
    const loads = Array.from({ length: 12 }, (_item, index) => ({
      ...MOCK_LOADS[0],
      id: `load-${index}`,
    }));
    await createComponent(makeResource({ value: signal(loads) }));
    expect(el.querySelectorAll('.load-row').length).toBe(10);
    expect(component.loadCountLabel()).toBe('10 carichi');
  });

  it('expands and collapses a row with aria-expanded', async () => {
    await createComponent();
    const button = el.querySelector<HTMLButtonElement>('.load-summary');
    expect(button?.getAttribute('aria-expanded')).toBe('false');

    button?.click();
    fixture.detectChanges();

    expect(button?.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('.load-detail')?.hasAttribute('hidden')).toBe(false);
    expect(el.textContent).toContain('Acqua');
    expect(el.textContent).toContain('Peso 2');

    button?.click();
    fixture.detectChanges();
    expect(button?.getAttribute('aria-expanded')).toBe('false');
  });

  it('renders loading state', async () => {
    await createComponent(makeResource({
      value: signal([]),
      status: signal('loading'),
      isLoading: signal(true),
    }));
    const state = el.querySelector('.loads-state');
    expect(state?.getAttribute('aria-busy')).toBe('true');
    expect(state?.textContent).toContain('Caricamento ultimi carichi');
  });

  it('renders empty state', async () => {
    await createComponent(makeResource({ value: signal([]) }));
    expect(el.textContent).toContain('Nessun carico registrato');
  });

  it('renders error state and retries', async () => {
    const resource = await createComponent(makeResource({
      value: signal([]),
      status: signal('error'),
      error: signal(new Error('Firestore collection "loads" failed')),
    }));

    expect(el.textContent).toContain('Non riesco a caricare');
    expect(el.textContent).toContain('Firestore collection "loads" failed');

    el.querySelector<HTMLButtonElement>('.state-action')?.click();
    expect(resource.reload).toHaveBeenCalledOnce();
  });
});
