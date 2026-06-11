import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConfigService } from '../../../../core/services/config.service';
import { DEFAULT_PRICES } from '../../../../core/models/config.model';

/**
 * ConfigFormComponent — US-013
 *
 * Form admin per modificare i prezzi dell'acqua e dell'energia.
 * - Pre-popola i campi con i prezzi correnti da /config/prices (via ConfigService.pricesResource)
 * - Permette override utente tramite linkedSignal
 * - Valida che entrambi i prezzi siano >= 0 e numerici
 * - Al submit chiama ConfigService.updatePrices() e mostra overlay di successo
 */
@Component({
  selector: 'app-config-form',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './config-form.html',
  styleUrl: './config-form.scss',
})
export class ConfigFormComponent {
  private readonly configService = inject(ConfigService);
  private readonly router = inject(Router);

  // Prezzi correnti da Firestore (live)
  private readonly configPrices = computed(
    () => this.configService.pricesResource.value() ?? DEFAULT_PRICES,
  );

  readonly configLoading = computed(() => this.configService.pricesResource.isLoading());

  // Campi form: inizializzati dai prezzi correnti, sovrascrivibili dall'utente
  readonly waterPrice = linkedSignal<number>(() => this.configPrices().waterPrice);
  readonly energyPrice = linkedSignal<number>(() => this.configPrices().energyPrice);

  // Validazione: entrambi i valori devono essere numeri >= 0
  readonly isFormValid = computed(() => {
    const w = this.waterPrice();
    const e = this.energyPrice();
    return !isNaN(w) && w >= 0 && !isNaN(e) && e >= 0;
  });

  // Stato submit
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  updateWaterPrice(value: number): void {
    this.waterPrice.set(value);
  }

  updateEnergyPrice(value: number): void {
    this.energyPrice.set(value);
  }

  async submit(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      await this.configService.updatePrices({
        waterPrice: this.waterPrice(),
        energyPrice: this.energyPrice(),
      });
      this.saveSuccess.set(true);
    } catch (err) {
      this.saveError.set(
        err instanceof Error ? err.message : 'Errore durante il salvataggio.',
      );
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
