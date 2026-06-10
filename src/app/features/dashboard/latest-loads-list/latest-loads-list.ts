import { CommonModule } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

import { DashboardLoad } from '../models/load.model';

type LoadsResource = {
  value: () => DashboardLoad[];
  status: () => string;
  isLoading: () => boolean;
  error: () => unknown;
  reload: () => unknown;
};

@Component({
  selector: 'app-latest-loads-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './latest-loads-list.html',
  styleUrl: './latest-loads-list.scss',
})
export class LatestLoadsList {
  readonly loadsResource = input.required<LoadsResource>();

  readonly expandedLoadId = signal<string | null>(null);

  readonly latestLoads = computed(() => this.loadsResource().value().slice(0, 10));

  readonly loadCountLabel = computed(() => {
    const count = this.latestLoads().length;
    return count === 1 ? '1 carico' : `${count} carichi`;
  });

  readonly errorMessage = computed(() => {
    const error = this.loadsResource().error();
    if (!error) return 'Errore sconosciuto';
    if (error instanceof Error) return error.message;
    return String(error);
  });

  toggleLoad(loadId: string): void {
    this.expandedLoadId.update((current) => current === loadId ? null : loadId);
  }

  retryLoads(): void {
    this.loadsResource().reload();
  }

  isExpanded(loadId: string): boolean {
    return this.expandedLoadId() === loadId;
  }

  detailId(load: DashboardLoad): string {
    return `load-detail-${load.id}`;
  }

  formattedDate(load: DashboardLoad): string {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit',
      month: 'short',
    }).format(new Date(load.paidAt));
  }

  isoDate(load: DashboardLoad): string {
    const date = new Date(load.paidAt);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  formattedCurrency(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  formattedNumber(value: number): string {
    return new Intl.NumberFormat('it-IT', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  trackLoad(_index: number, load: DashboardLoad): string {
    return load.id;
  }

  trackBreakdown(_index: number, item: { personId: string }): string {
    return item.personId;
  }
}
