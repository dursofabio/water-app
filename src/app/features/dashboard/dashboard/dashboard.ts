import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BalanceService } from '../services/balance.service';
import { BalanceCard } from '../balance-card/balance-card';

/**
 * DashboardComponent — US-003
 *
 * Dashboard pubblica accessibile senza login.
 * Visualizza i saldi in tempo reale per le 4 persone,
 * con aggiornamento automatico via Firestore onSnapshot.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, BalanceCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly balanceService = inject(BalanceService);

  readonly balancesResource = this.balanceService.balancesResource;
  readonly now = new Date();

  retryBalances(): void {
    this.balancesResource.reload();
  }
}
