import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonaBalance } from '../models/balance.model';

/**
 * BalanceCardComponent — US-003
 *
 * Visualizza il saldo netto di una persona in una card.
 * Segue fedelmente il mockup US-003: avatar, stato, nome, importo, breakdown.
 */
@Component({
  selector: 'app-balance-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './balance-card.html',
  styleUrl: './balance-card.scss',
})
export class BalanceCard {
  readonly persona = input.required<PersonaBalance>();

  readonly statoLabel = computed(() => {
    switch (this.persona().stato) {
      case 'debt-high': return 'Debito';
      case 'debt-mid':  return 'Debito';
      case 'credit':    return 'Credito';
      case 'zero':      return 'In pari';
    }
  });

  readonly amountPrefix = computed(() => {
    const saldo = this.persona().saldo;
    if (saldo > 0) return '+';
    if (saldo < 0) return '−';
    return '';
  });

  readonly formattedAmount = computed(() =>
    Math.abs(this.persona().saldo).toFixed(2).replace('.', ','),
  );

  readonly formattedCarichi = computed(() =>
    this.persona().carichiTotale.toFixed(2).replace('.', ','),
  );

  readonly formattedPagamenti = computed(() =>
    this.persona().pagamentiTotale.toFixed(2).replace('.', ','),
  );
}
