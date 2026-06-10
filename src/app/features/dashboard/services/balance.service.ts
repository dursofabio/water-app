import { Injectable, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable, combineLatest, map } from 'rxjs';

import {
  Carico,
  Pagamento,
  PersonaBalance,
  PERSONE,
  calcolaStato,
} from '../models/balance.model';

export const EMPTY_BALANCES: PersonaBalance[] = PERSONE.map((persona) => ({
  ...persona,
  carichiTotale: 0,
  pagamentiTotale: 0,
  saldo: 0,
  stato: 'zero',
}));

/**
 * BalanceService — US-003
 *
 * Ascolta in real-time le collezioni Firestore 'carichi' e 'pagamenti',
 * calcola il saldo netto per ciascuna delle 4 persone e restituisce
 * un Observable<PersonaBalance[]> aggiornato ad ogni snapshot.
 *
 * Saldo netto = somma importi carichi della persona − somma importi pagamenti
 * Positivo = debito, negativo = credito, zero = pari.
 */
@Injectable({ providedIn: 'root' })
export class BalanceService {
  private readonly firestore = inject(Firestore);

  readonly balancesResource = rxResource({
    defaultValue: EMPTY_BALANCES,
    stream: () => this.getBalances(),
  });

  getBalances(): Observable<PersonaBalance[]> {
    const carichi$ = collectionData(
      collection(this.firestore, 'carichi'),
    ) as Observable<Carico[]>;

    const pagamenti$ = collectionData(
      collection(this.firestore, 'pagamenti'),
    ) as Observable<Pagamento[]>;

    return combineLatest([carichi$, pagamenti$]).pipe(
      map(([carichi, pagamenti]) =>
        PERSONE.map((persona) => {
          const carichiTotale = carichi
            .filter((c) => c.personaId === persona.id)
            .reduce((sum, c) => sum + (c.importo ?? 0), 0);

          const pagamentiTotale = pagamenti
            .filter((p) => p.personaId === persona.id)
            .reduce((sum, p) => sum + (p.importo ?? 0), 0);

          const saldo = carichiTotale - pagamentiTotale;

          return {
            ...persona,
            carichiTotale,
            pagamentiTotale,
            saldo,
            stato: calcolaStato(saldo),
          } satisfies PersonaBalance;
        }),
      ),
    );
  }
}
