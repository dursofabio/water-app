import { Injectable, inject } from '@angular/core';
import { Firestore, doc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';

import { ConfigPrices, DEFAULT_PRICES } from '../models/config.model';

/**
 * ConfigService — US-008 / US-013
 *
 * Legge i prezzi correnti (acqua + energia) da /config/prices su Firestore
 * usando onSnapshot per aggiornamenti in tempo reale.
 *
 * - Se il documento /config/prices non esiste, emette DEFAULT_PRICES.
 * - Espone un rxResource per l'integrazione con i componenti Angular.
 * - US-013: updatePrices() scrive i nuovi prezzi su Firestore (merge: true).
 */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly firestore = inject(Firestore);

  readonly pricesResource = rxResource({
    defaultValue: DEFAULT_PRICES,
    stream: () => this.getPrices(),
  });

  getPrices(): Observable<ConfigPrices> {
    return new Observable<ConfigPrices>((subscriber) => {
      const docRef = doc(this.firestore, 'config', 'prices');

      const unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            subscriber.next({
              waterPrice: typeof data['waterPrice'] === 'number' ? data['waterPrice'] : DEFAULT_PRICES.waterPrice,
              energyPrice: typeof data['energyPrice'] === 'number' ? data['energyPrice'] : DEFAULT_PRICES.energyPrice,
            });
          } else {
            subscriber.next({ ...DEFAULT_PRICES });
          }
        },
        (error) => {
          subscriber.error(new Error(`Firestore /config/prices failed: ${this.formatError(error)}`));
        },
      );

      return () => unsubscribe();
    });
  }

  /**
   * Aggiorna i prezzi di acqua ed energia su /config/prices in Firestore.
   * Usa merge: true per preservare eventuali altri campi del documento.
   * Rilancia l'errore in caso di fallimento affinché il chiamante possa gestirlo.
   */
  async updatePrices(prices: ConfigPrices): Promise<void> {
    const docRef = doc(this.firestore, 'config', 'prices');
    await setDoc(docRef, prices, { merge: true });
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
  }
}
