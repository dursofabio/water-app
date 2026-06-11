import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

import { PaymentsService, PaymentRecord } from '../../../../core/services/payments.service';
import { BalanceService } from '../../../dashboard/services/balance.service';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [RouterLink, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './payments-list.html',
  styleUrl: './payments-list.scss',
})
export class PaymentsListComponent {
  private readonly paymentsService = inject(PaymentsService);
  private readonly balanceService = inject(BalanceService);

  readonly paymentsResource = rxResource({
    stream: () => this.paymentsService.getPayments(),
  });

  private readonly peopleMap = computed(() => {
    const balances = this.balanceService.balancesResource.value() ?? [];
    return new Map(balances.map((b) => [b.id, { name: b.name, initials: b.initials }]));
  });

  readonly pendingDeleteId = signal<string | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteError = signal<string | null>(null);

  getPersonName(personId: string): string {
    return this.peopleMap().get(personId)?.name ?? personId;
  }

  getPersonInitials(personId: string): string {
    return this.peopleMap().get(personId)?.initials ?? personId.slice(0, 2).toUpperCase();
  }

  formatDate(date: Date): { day: string; month: string } {
    return {
      day: date.getDate().toString().padStart(2, '0'),
      month: date.toLocaleString('it-IT', { month: 'short' }),
    };
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  openDeleteDialog(id: string): void {
    this.deleteError.set(null);
    this.pendingDeleteId.set(id);
  }

  cancelDelete(): void {
    this.pendingDeleteId.set(null);
    this.deleteError.set(null);
  }

  async confirmDelete(): Promise<void> {
    const id = this.pendingDeleteId();
    if (!id) return;

    this.isDeleting.set(true);
    this.deleteError.set(null);

    try {
      await this.paymentsService.deletePayment(id);
      this.pendingDeleteId.set(null);
    } catch (err) {
      this.deleteError.set(err instanceof Error ? err.message : 'Errore durante la cancellazione.');
    } finally {
      this.isDeleting.set(false);
    }
  }

  getPendingPayment(): PaymentRecord | null {
    const id = this.pendingDeleteId();
    if (!id) return null;
    return this.paymentsResource.value()?.find((p) => p.id === id) ?? null;
  }
}
