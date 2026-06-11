import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BalanceCard } from './balance-card';
import { PersonBalance } from '../models/balance.model';

/**
 * Unit tests for BalanceCardComponent — US-003
 *
 * Strategy: create the component with a controlled input via
 * fixture.componentRef.setInput() (required for signal inputs),
 * then assert on rendered DOM nodes and computed signal properties.
 */

function makePerson(overrides: Partial<PersonBalance> = {}): PersonBalance {
  return {
    id: 'fernando',
    name: 'Fernando',
    initials: 'Fe',
    loadsTotal: 70,
    paymentsTotal: 30,
    balance: 40,
    status: 'debt-high',
    ...overrides,
  };
}

describe('BalanceCard (US-003)', () => {
  let component: BalanceCard;
  let fixture: ComponentFixture<BalanceCard>;
  let el: HTMLElement;

  async function createWithPerson(person: PersonBalance) {
    await TestBed.configureTestingModule({
      imports: [BalanceCard],
    }).compileComponents();
    fixture = TestBed.createComponent(BalanceCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('person', person);
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement as HTMLElement;
  }

  it('renders the article with the correct data-state attribute for debt-high', async () => {
    await createWithPerson(makePerson({ status: 'debt-high' }));
    const article = el.querySelector('article.balance-card');
    expect(article).toBeTruthy();
    expect(article?.getAttribute('data-state')).toBe('debt-high');
  });

  it("renders the person's name", async () => {
    await createWithPerson(makePerson({ name: 'Fernando' }));
    const nameEl = el.querySelector('.balance-card__name');
    expect(nameEl?.textContent?.trim()).toBe('Fernando');
  });

  it("renders the person's initial in the avatar", async () => {
    await createWithPerson(makePerson({ initials: 'Fe' }));
    const avatar = el.querySelector('.avatar');
    expect(avatar?.textContent?.trim()).toBe('F');
  });

  it('statusLabel signal returns "Debito alto" for debt-high state', async () => {
    await createWithPerson(makePerson({ status: 'debt-high' }));
    expect(component.statusLabel()).toBe('Debito alto');
    const label = el.querySelector('.state-pill');
    expect(label?.textContent?.trim()).toBe('Debito alto');
  });

  it('statusLabel signal returns "Debito medio" for debt-mid state', async () => {
    await createWithPerson(makePerson({ status: 'debt-mid' }));
    expect(component.statusLabel()).toBe('Debito medio');
    const label = el.querySelector('.state-pill');
    expect(label?.textContent?.trim()).toBe('Debito medio');
  });

  it('statusLabel signal returns "Credito" for credit state', async () => {
    await createWithPerson(makePerson({ status: 'credit', balance: -25 }));
    expect(component.statusLabel()).toBe('Credito');
    const label = el.querySelector('.state-pill');
    expect(label?.textContent?.trim()).toBe('Credito');
  });

  it('statusLabel signal returns "In pari" for zero state', async () => {
    await createWithPerson(makePerson({ status: 'zero', balance: 0 }));
    expect(component.statusLabel()).toBe('In pari');
  });

  it('amountPrefix signal returns "+" for positive balance', async () => {
    await createWithPerson(makePerson({ balance: 40 }));
    expect(component.amountPrefix()).toBe('+');
  });

  it('amountPrefix signal returns "−" for negative balance', async () => {
    await createWithPerson(makePerson({ balance: -10 }));
    expect(component.amountPrefix()).toBe('−');
  });

  it('amountPrefix signal returns empty string for zero balance', async () => {
    await createWithPerson(makePerson({ balance: 0 }));
    expect(component.amountPrefix()).toBe('');
  });

  it('formattedAmount signal uses comma as decimal separator', async () => {
    await createWithPerson(makePerson({ balance: 40.5 }));
    expect(component.formattedAmount()).toBe('40,50');
  });

  it('renders breakdown rows with loads and payments totals', async () => {
    await createWithPerson(makePerson({ loadsTotal: 70, paymentsTotal: 30 }));
    const rows = el.querySelectorAll('.balance-card__back dl div');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('Carichi');
    expect(rows[0].textContent).toContain('70,00');
    expect(rows[1].textContent).toContain('Pagamenti');
    expect(rows[1].textContent).toContain('30,00');
    expect(rows[2].textContent).toContain('Saldo');
  });

  it('renders data-state="zero" when balance is 0', async () => {
    await createWithPerson(makePerson({ status: 'zero', balance: 0, loadsTotal: 0, paymentsTotal: 0 }));
    const article = el.querySelector('article.balance-card');
    expect(article?.getAttribute('data-state')).toBe('zero');
  });

  it('has accessible aria-label on the article', async () => {
    await createWithPerson(makePerson({ name: 'Fernando' }));
    const article = el.querySelector('article.balance-card');
    expect(article?.getAttribute('aria-label')).toBe('Saldo di Fernando');
  });

  it('renders a front button focused on the immediate balance', async () => {
    await createWithPerson(makePerson({ name: 'Nino', balance: 30, status: 'debt-mid' }));
    const front = el.querySelector<HTMLButtonElement>('.balance-card__front');
    expect(front).toBeTruthy();
    expect(front?.getAttribute('aria-expanded')).toBe('false');
    expect(front?.textContent).toContain('Nino');
    expect(front?.textContent).toContain('+€30,00');
    expect(front?.textContent).toContain('Tocca per vedere il calcolo');
  });

  it('opens and closes the calculation detail with accessible state', async () => {
    await createWithPerson(makePerson({ name: 'Nino', balance: 30, status: 'debt-mid' }));
    const article = el.querySelector('article.balance-card');
    const front = el.querySelector<HTMLButtonElement>('.balance-card__front');
    const back = el.querySelector<HTMLElement>('.balance-card__back');
    const close = el.querySelector<HTMLButtonElement>('.balance-card__close');

    expect(article?.classList.contains('is-flipped')).toBe(false);
    expect(back?.getAttribute('aria-hidden')).toBe('true');

    front?.click();
    fixture.detectChanges();

    expect(component.isDetailOpen()).toBe(true);
    expect(article?.classList.contains('is-flipped')).toBe(true);
    expect(front?.getAttribute('aria-expanded')).toBe('true');
    expect(back?.getAttribute('aria-hidden')).toBe('false');

    close?.click();
    fixture.detectChanges();

    expect(component.isDetailOpen()).toBe(false);
    expect(front?.getAttribute('aria-expanded')).toBe('false');
    expect(back?.getAttribute('aria-hidden')).toBe('true');
  });
});
