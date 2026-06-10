import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { BalanceService } from '../services/balance.service';
import { DashboardLoadsService } from '../services/dashboard-loads.service';
import { BalanceCard } from '../balance-card/balance-card';
import { LatestLoadsList } from '../latest-loads-list/latest-loads-list';

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
  imports: [DatePipe, BalanceCard, LatestLoadsList],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly balanceService = inject(BalanceService);
  private readonly dashboardLoadsService = inject(DashboardLoadsService);

  readonly balancesResource = this.balanceService.balancesResource;
  readonly latestLoadsResource = this.dashboardLoadsService.latestLoadsResource;
  readonly now = new Date();
  readonly balanceErrorMessage = computed(() => {
    const error = this.balancesResource.error();
    if (!error) return 'Errore sconosciuto';
    if (error instanceof Error) return error.message;
    return String(error);
  });

  retryBalances(): void {
    this.balancesResource.reload();
  }
}
