import {
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { PaymentsService } from '../../../../core/services/payments.service';
import { BalanceService } from '../../../dashboard/services/balance.service';

/**
 * PaymentFormComponent — US-011
 *
 * Form di registrazione di un pagamento ricevuto.
 * - Legge le persone da /people tramite BalanceService (già disponibile)
 * - Selezione persona tramite person-card grid (pattern mockup US-011)
 * - Campi: data, importo, nota opzionale
 * - Validazione: importo > 0, data e persona obbligatorie
 * - Preview reattivo tramite computed()
 * - Al submit chiama PaymentsService.addPayment()
 */
@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.scss',
})
export class PaymentFormComponent {
  private readonly paymentsService = inject(PaymentsService);
  private readonly balanceService = inject(BalanceService);
  private readonly router = inject(Router);

  // --- Form fields ---
  readonly today = new Date().toISOString().slice(0, 10);
  readonly paidByPersonId = signal<string>('');
  readonly amount = signal<number>(0);
  readonly date = signal<string>(this.today);
  readonly note = signal<string>('');

  // --- Persone dal service ---
  readonly balancesResource = this.balanceService.balancesResource;

  readonly people = computed(() => {
    const balances = this.balancesResource.value() ?? [];
    return balances.map((b) => ({ id: b.id, name: b.name, initials: b.initials }));
  });

  // --- Preview reattivo ---
  readonly selectedPerson = computed(() => {
    const id = this.paidByPersonId();
    if (!id) return null;
    return this.people().find((p) => p.id === id) ?? null;
  });

  // --- Validazione ---
  readonly isFormValid = computed(
    () =>
      !!this.paidByPersonId() &&
      !!this.date() &&
      this.amount() > 0,
  );

  // --- Stato submit ---
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  /** Seleziona / deseleziona una persona. */
  selectPerson(personId: string): void {
    this.paidByPersonId.set(personId);
  }

  /** Aggiorna l'importo. */
  updateAmount(value: number): void {
    this.amount.set(value);
  }

  async submit(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      await this.paymentsService.addPayment({
        personId: this.paidByPersonId(),
        amount: this.amount(),
        date: new Date(this.date()),
        note: this.note() || undefined,
      });

      this.saveSuccess.set(true);
    } catch (err) {
      this.saveError.set(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      this.isSaving.set(false);
    }
  }

  navigateBack(): void {
    void this.router.navigate(['/admin']);
  }

  navigateToAdmin(): void {
    this.saveSuccess.set(false);
    void this.router.navigate(['/admin']);
  }
}
