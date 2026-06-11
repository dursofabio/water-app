import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BalanceService } from '../services/balance.service';
import { DashboardLoadsService } from '../services/dashboard-loads.service';
import { BalanceCard } from '../balance-card/balance-card';
import { LatestLoadsList } from '../latest-loads-list/latest-loads-list';

/**
 * DashboardComponent — US-003 / US-006
 *
 * Dashboard pubblica accessibile senza login.
 * Visualizza i saldi in tempo reale per le 4 persone,
 * con aggiornamento automatico via Firestore onSnapshot.
 *
 * US-006: mostra un banner "Accesso negato" quando il query param denied=true
 * è presente (redirect da LoginComponent per UID non in whitelist).
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
  private readonly route = inject(ActivatedRoute);

  readonly balancesResource = this.balanceService.balancesResource;
  readonly latestLoadsResource = this.dashboardLoadsService.latestLoadsResource;
  readonly now = new Date();

  readonly showDeniedBanner = computed(() => {
    const params = this.route.snapshot.queryParamMap;
    return params.get('denied') === 'true';
  });

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
