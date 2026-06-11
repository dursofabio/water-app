import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';

import { PaymentsService, PaymentRecord } from '../../../../core/services/payments.service';
import { BalanceService } from '../../../dashboard/services/balance.service';

/**
 * PaymentFormComponent — US-011 / US-012
 *
 * Form di registrazione e modifica di un pagamento ricevuto.
 * - Legge le persone da /people tramite BalanceService (già disponibile)
 * - Selezione persona tramite person-card grid (pattern mockup US-011)
 * - Campi: data, importo, nota opzionale
 * - Validazione: importo > 0, data e persona obbligatorie
 * - Preview reattivo tramite computed()
 * - Al submit chiama PaymentsService.addPayment() (create) o updatePayment() (edit)
 */
@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './payment-form.html',
  styleUrl: './payment-form.scss',
})
export class PaymentFormComponent implements OnInit {
  private readonly paymentsService = inject(PaymentsService);
  private readonly balanceService = inject(BalanceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // --- Route param ---
  readonly paymentId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.paymentId());

  // --- Edit: load existing record ---
  readonly editPaymentResource = rxResource({
    params: () => this.paymentId(),
    stream: ({ params: id }) => (id ? this.paymentsService.getPaymentById(id) : of(null)),
  });

  private prefilled = false;

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

  constructor() {
    // Edit mode: prefill form when both people and payment record are ready
    effect(() => {
      if (!this.isEditMode()) return;
      const paymentRecord = this.editPaymentResource.value();
      const people = this.people();
      if (paymentRecord === null || paymentRecord === undefined || people.length === 0 || this.prefilled) return;

      this.prefillFromRecord(paymentRecord);
      this.prefilled = true;
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('paymentId');
    if (id) {
      this.paymentId.set(id);
    }
  }

  private prefillFromRecord(record: PaymentRecord): void {
    this.date.set(record.date.toISOString().slice(0, 10));
    this.paidByPersonId.set(record.personId);
    this.amount.set(record.amount);
    this.note.set(record.note ?? '');
  }

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

    const input = {
      personId: this.paidByPersonId(),
      amount: this.amount(),
      date: new Date(this.date()),
      note: this.note() || undefined,
    };

    try {
      const id = this.paymentId();
      if (id) {
        await this.paymentsService.updatePayment(id, input);
      } else {
        await this.paymentsService.addPayment(input);
      }

      this.saveSuccess.set(true);
    } catch (err) {
      this.saveError.set(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
    } finally {
      this.isSaving.set(false);
    }
  }

  navigateBack(): void {
    void this.router.navigate(['/admin/pagamenti']);
  }

  navigateToAdmin(): void {
    this.saveSuccess.set(false);
    void this.router.navigate(['/admin/pagamenti']);
  }
}
