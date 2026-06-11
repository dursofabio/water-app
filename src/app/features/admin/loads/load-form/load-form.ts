import {
  Component,
  OnInit,
  computed,
  effect,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConfigService } from '../../../../core/services/config.service';
import { DEFAULT_PRICES } from '../../../../core/models/config.model';
import { LoadsService } from '../../../../core/services/loads.service';
import { BalanceService } from '../../../dashboard/services/balance.service';

/** Una riga peso per una persona nel form. */
export interface PersonWeightEntry {
  personId: string;
  name: string;
  initials: string;
  weight: number;
}

/**
 * LoadFormComponent — US-008
 *
 * Form di registrazione di un carico cisterna.
 * - Legge le persone da /people tramite BalanceService (già disponibile)
 * - Legge i prezzi correnti da ConfigService (rxResource)
 * - I prezzi sono modificabili dall'utente (override)
 * - Il costo per persona si aggiorna reattivamente via computed()
 * - Al submit chiama LoadsService.addLoad() con snapshot dei prezzi
 */
@Component({
  selector: 'app-load-form',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './load-form.html',
  styleUrl: './load-form.scss',
})
export class LoadFormComponent implements OnInit {
  private readonly configService = inject(ConfigService);
  private readonly loadsService = inject(LoadsService);
  private readonly balanceService = inject(BalanceService);
  private readonly router = inject(Router);

  // --- Form fields ---
  readonly today = new Date().toISOString().slice(0, 10);
  date = signal<string>(this.today);
  paidByPersonId = signal<string>('');

  // --- Persone dal service ---
  readonly balancesResource = this.balanceService.balancesResource;

  readonly people = computed(() => {
    const balances = this.balancesResource.value() ?? [];
    return balances.map((b) => ({ id: b.id, name: b.name, initials: b.initials }));
  });

  // --- Pesi per persona (inizializzati quando people cambia) ---
  readonly weights = signal<PersonWeightEntry[]>([]);

  // --- Prezzi auto-popolati da ConfigService, sovrascrivibili ---
  private readonly configPrices = computed(() => this.configService.pricesResource.value() ?? DEFAULT_PRICES);

  readonly waterPrice = linkedSignal<number>(() => this.configPrices().waterPrice);
  readonly energyPrice = linkedSignal<number>(() => this.configPrices().energyPrice);

  readonly configLoading = computed(() => this.configService.pricesResource.isLoading());

  // --- Preview reattivo ---
  readonly totalWeight = computed(() =>
    this.weights().reduce((sum, pw) => sum + (pw.weight ?? 0), 0),
  );

  readonly pricePerUnit = computed(() => this.waterPrice() + this.energyPrice());
  readonly expectedTotal = computed(() => this.pricePerUnit());
  readonly canShowPreviewValues = computed(() => this.totalWeight() > 0);
  readonly previewWarning = computed(() =>
    this.canShowPreviewValues()
      ? null
      : 'La somma dei pesi è 0: inserisci almeno un peso per calcolare la ripartizione.',
  );

  readonly breakdown = computed(() => {
    const total = this.totalWeight();
    const price = this.expectedTotal();
    return this.weights().map((pw) => ({
      ...pw,
      cost: total > 0 ? (pw.weight / total) * price : 0,
    }));
  });

  readonly totalAmount = computed(() =>
    this.breakdown().reduce((sum, item) => sum + item.cost, 0),
  );

  readonly previewTotalMatchesExpected = computed(() =>
    this.canShowPreviewValues()
      ? Math.abs(this.totalAmount() - this.expectedTotal()) < 0.005
      : false,
  );

  // --- Stato submit ---
  readonly isSaving = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  // --- Validazione ---
  readonly isFormValid = computed(
    () =>
      !!this.date() &&
      !!this.paidByPersonId() &&
      this.totalWeight() > 0 &&
      this.weights().every((pw) => pw.weight >= 0),
  );

  constructor() {
    effect(() => {
      const people = this.people();
      if (people.length > 0 && this.weights().length === 0) {
        this.initWeights(people);
      }
    });
  }

  ngOnInit(): void {
    // Inizializza i pesi con default 1 per ogni persona già disponibile
    const currentPeople = this.people();
    if (currentPeople.length > 0) {
      this.initWeights(currentPeople);
    }
  }

  /** Aggiorna i pesi quando le persone cambiano (e non sono ancora inizializzati). */
  private initWeights(people: { id: string; name: string; initials: string }[]): void {
    this.weights.set(
      people.map((p) => ({
        personId: p.id,
        name: p.name,
        initials: p.initials,
        weight: 1,
      })),
    );
  }

  /** Aggiorna il peso per la persona all'indice dato. */
  updateWeight(index: number, value: number): void {
    const updated = [...this.weights()];
    updated[index] = { ...updated[index], weight: Math.max(0, value) };
    this.weights.set(updated);
  }

  /** Aggiorna il prezzo acqua (override utente). */
  updateWaterPrice(value: number): void {
    this.waterPrice.set(value);
  }

  /** Aggiorna il prezzo energia (override utente). */
  updateEnergyPrice(value: number): void {
    this.energyPrice.set(value);
  }

  async submit(): Promise<void> {
    if (!this.isFormValid()) return;

    this.isSaving.set(true);
    this.saveError.set(null);

    try {
      await this.loadsService.addLoad({
        date: new Date(this.date()),
        paidByPersonId: this.paidByPersonId(),
        waterPrice: this.waterPrice(),
        energyPrice: this.energyPrice(),
        weights: this.weights().map((pw) => ({ personId: pw.personId, weight: pw.weight })),
      });

      this.saveSuccess.set(true);
    } catch (err) {
      this.saveError.set(err instanceof Error ? err.message : 'Errore durante il salvataggio.');
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
