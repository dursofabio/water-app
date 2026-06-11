import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonBalance } from '../models/balance.model';

/**
 * BalanceCardComponent — US-003
 *
 * Displays the net balance for one person in a card.
 * Follows the US-003 mockup: avatar, status, name, amount, breakdown.
 */
@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-card.html',
  styleUrl: './balance-card.scss',
})
export class BalanceCard {
  readonly person = input.required<PersonBalance>();

  readonly statusLabel = computed(() => {
    switch (this.person().status) {
      case 'debt-high': return 'Debito';
      case 'debt-mid':  return 'Debito';
      case 'credit':    return 'Credito';
      case 'zero':      return 'In pari';
    }
  });

  readonly amountPrefix = computed(() => {
    const balance = this.person().balance;
    if (balance < 0) return '−';
    if (balance > 0) return '+';
    return '';
  });

  readonly formattedAmount = computed(() =>
    Math.abs(this.person().balance).toFixed(2).replace('.', ','),
  );

  readonly formattedLoads = computed(() =>
    this.person().loadsTotal.toFixed(2).replace('.', ','),
  );

  readonly formattedPayments = computed(() =>
    this.person().paymentsTotal.toFixed(2).replace('.', ','),
  );
}
