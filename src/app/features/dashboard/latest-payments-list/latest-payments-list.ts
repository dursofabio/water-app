import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { DashboardPayment } from '../models/payment.model';

type PaymentsResource = {
  value: () => DashboardPayment[];
  status: () => string;
  isLoading: () => boolean;
  error: () => unknown;
  reload: () => unknown;
};

@Component({
  selector: 'app-latest-payments-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './latest-payments-list.html',
  styleUrl: './latest-payments-list.scss',
})
export class LatestPaymentsList {
  readonly paymentsResource = input.required<PaymentsResource>();

  readonly latestPayments = computed(() => this.paymentsResource().value().slice(0, 10));

  readonly paymentCountLabel = computed(() => {
    const count = this.latestPayments().length;
    return count === 1 ? '1 pagamento' : `${count} pagamenti`;
  });

  readonly errorMessage = computed(() => {
    const error = this.paymentsResource().error();
    if (!error) return 'Errore sconosciuto';
    if (error instanceof Error) return error.message;
    return String(error);
  });

  retryPayments(): void {
    this.paymentsResource().reload();
  }

  formattedDate(payment: DashboardPayment): string {
    if (!payment.paidAt) return 's.d.';

    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
    }).format(payment.paidAt);
  }

  isoDate(payment: DashboardPayment): string {
    if (!payment.paidAt) return '';
    return Number.isNaN(payment.paidAt.getTime()) ? '' : payment.paidAt.toISOString().slice(0, 10);
  }

  formattedCurrency(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  trackPayment(_index: number, payment: DashboardPayment): string {
    return payment.id;
  }
}
