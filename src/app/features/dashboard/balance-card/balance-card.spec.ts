import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BalanceCard } from './balance-card';
import { PersonaBalance } from '../models/balance.model';

/**
 * Unit tests for BalanceCardComponent — US-003
 *
 * Strategy: create the component with a controlled input via
 * fixture.componentRef.setInput() (required for signal inputs),
 * then assert on rendered DOM nodes and computed signal properties.
 */

function makePersona(overrides: Partial<PersonaBalance> = {}): PersonaBalance {
  return {
    id: 'fernando',
    nome: 'Fernando',
    iniziali: 'Fe',
    carichiTotale: 70,
    pagamentiTotale: 30,
    saldo: 40,
    stato: 'debt-high',
    ...overrides,
  };
}

describe('BalanceCard (US-003)', () => {
  let component: BalanceCard;
  let fixture: ComponentFixture<BalanceCard>;
  let el: HTMLElement;

  async function createWithPersona(persona: PersonaBalance) {
    await TestBed.configureTestingModule({
      imports: [BalanceCard],
    }).compileComponents();
    fixture = TestBed.createComponent(BalanceCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('persona', persona);
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  }

  it('renders the article with the correct data-state attribute for debt-high', async () => {
    await createWithPersona(makePersona({ stato: 'debt-high' }));
    const article = el.querySelector('article.balance-card');
    expect(article).toBeTruthy();
    expect(article?.getAttribute('data-state')).toBe('debt-high');
  });

  it('renders the person\'s name', async () => {
    await createWithPersona(makePersona({ nome: 'Fernando' }));
    const nameEl = el.querySelector('.card-name');
    expect(nameEl?.textContent?.trim()).toBe('Fernando');
  });

  it('renders the person\'s initials in the avatar', async () => {
    await createWithPersona(makePersona({ iniziali: 'Fe' }));
    const avatar = el.querySelector('.card-avatar');
    expect(avatar?.textContent?.trim()).toBe('Fe');
  });

  it('statoLabel signal returns "Debito" for debt-high state', async () => {
    await createWithPersona(makePersona({ stato: 'debt-high' }));
    expect(component.statoLabel()).toBe('Debito');
    const label = el.querySelector('.card-status-label');
    expect(label?.textContent?.trim()).toBe('Debito');
  });

  it('statoLabel signal returns "Credito" for credit state', async () => {
    await createWithPersona(makePersona({ stato: 'credit', saldo: -25 }));
    expect(component.statoLabel()).toBe('Credito');
    const label = el.querySelector('.card-status-label');
    expect(label?.textContent?.trim()).toBe('Credito');
  });

  it('statoLabel signal returns "In pari" for zero state', async () => {
    await createWithPersona(makePersona({ stato: 'zero', saldo: 0 }));
    expect(component.statoLabel()).toBe('In pari');
  });

  it('amountPrefix signal returns "+" for positive saldo', async () => {
    await createWithPersona(makePersona({ saldo: 40 }));
    expect(component.amountPrefix()).toBe('+');
  });

  it('amountPrefix signal returns "−" for negative saldo', async () => {
    await createWithPersona(makePersona({ saldo: -10 }));
    expect(component.amountPrefix()).toBe('−');
  });

  it('amountPrefix signal returns empty string for zero saldo', async () => {
    await createWithPersona(makePersona({ saldo: 0 }));
    expect(component.amountPrefix()).toBe('');
  });

  it('formattedAmount signal uses comma as decimal separator', async () => {
    await createWithPersona(makePersona({ saldo: 40.5 }));
    expect(component.formattedAmount()).toBe('40,50');
  });

  it('renders breakdown rows with carichi and pagamenti', async () => {
    await createWithPersona(makePersona({ carichiTotale: 70, pagamentiTotale: 30 }));
    const rows = el.querySelectorAll('.card-breakdown__row');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Carichi');
    expect(rows[0].textContent).toContain('70,00');
    expect(rows[1].textContent).toContain('Pagamenti');
    expect(rows[1].textContent).toContain('30,00');
  });

  it('renders data-state="zero" when saldo is 0', async () => {
    await createWithPersona(makePersona({ stato: 'zero', saldo: 0, carichiTotale: 0, pagamentiTotale: 0 }));
    const article = el.querySelector('article.balance-card');
    expect(article?.getAttribute('data-state')).toBe('zero');
  });

  it('has accessible aria-label on the article', async () => {
    await createWithPersona(makePersona({ nome: 'Fernando' }));
    const article = el.querySelector('article.balance-card');
    expect(article?.getAttribute('aria-label')).toBe('Saldo di Fernando');
  });
});
