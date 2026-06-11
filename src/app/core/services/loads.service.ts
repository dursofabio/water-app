import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, addDoc, collection } from '@angular/fire/firestore';

/**
 * Input per la creazione di un nuovo carico cisterna.
 * Contiene i pesi per persona, i prezzi al momento del salvataggio,
 * e le informazioni di base del carico.
 */
export interface PersonWeight {
  personId: string;
  weight: number;
}

export interface NewLoadInput {
  date: Date;
  paidByPersonId: string;
  waterPrice: number;
  energyPrice: number;
  weights: PersonWeight[];
}

/**
 * Documento Firestore scritto in /loads.
 * Include lo snapshot dei prezzi e il breakdown per persona.
 */
export interface NewLoadDocument {
  date: Timestamp;
  paidByPersonId: string;
  waterPrice: number;
  energyPrice: number;
  totalAmount: number;
  totalWeight: number;
  breakdown: Array<{
    personId: string;
    weight: number;
    cost: number;
  }>;
}

/**
 * LoadsService — US-008
 *
 * Espone addLoad() che calcola i costi per persona e scrive il documento
 * in /loads su Firestore con:
 * - waterPrice / energyPrice come snapshot dei prezzi al momento del salvataggio
 * - breakdown[]: costo per persona = (peso / somma_pesi) * (waterPrice + energyPrice)
 * - totalAmount: somma di tutti i costi
 * - totalWeight: somma di tutti i pesi
 */
@Injectable({ providedIn: 'root' })
export class LoadsService {
  private readonly firestore = inject(Firestore);

  /**
   * Calcola i costi per persona e scrive il documento in /loads.
   *
   * @throws Error se totalWeight è 0 (validazione da fare nel chiamante)
   */
  async addLoad(input: NewLoadInput): Promise<void> {
    const totalWeight = input.weights.reduce((sum, pw) => sum + pw.weight, 0);

    if (totalWeight <= 0) {
      throw new Error('La somma dei pesi deve essere maggiore di zero.');
    }

    const pricePerUnit = input.waterPrice + input.energyPrice;

    const breakdown = input.weights.map((pw) => ({
      personId: pw.personId,
      weight: pw.weight,
      cost: (pw.weight / totalWeight) * pricePerUnit,
    }));

    const totalAmount = breakdown.reduce((sum, item) => sum + item.cost, 0);

    const document: NewLoadDocument = {
      date: Timestamp.fromDate(input.date),
      paidByPersonId: input.paidByPersonId,
      waterPrice: input.waterPrice,
      energyPrice: input.energyPrice,
      totalAmount,
      totalWeight,
      breakdown,
    };

    await addDoc(collection(this.firestore, 'loads'), document);
  }
}
