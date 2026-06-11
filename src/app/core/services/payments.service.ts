import { Injectable, inject } from '@angular/core';
import { Firestore, Timestamp, addDoc, collection } from '@angular/fire/firestore';

/**
 * Input per la registrazione di un nuovo pagamento.
 */
export interface NewPaymentInput {
  personId: string;
  amount: number;
  date: Date;
  note?: string;
}

/**
 * Documento Firestore scritto in /payments.
 */
export interface NewPaymentDocument {
  personId: string;
  amount: number;
  date: Timestamp;
  note?: string;
}

/**
 * PaymentsService — US-011
 *
 * Espone addPayment() che valida l'importo e scrive il documento
 * in /payments su Firestore con:
 * - personId: riferimento alla persona
 * - amount: importo del pagamento (> 0)
 * - date: data del pagamento come Firestore Timestamp
 * - note: nota opzionale
 */
@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly firestore = inject(Firestore);

  /**
   * Valida l'importo e scrive il documento in /payments.
   *
   * @throws Error se amount è ≤ 0
   */
  async addPayment(input: NewPaymentInput): Promise<void> {
    if (input.amount <= 0) {
      throw new Error("L'importo deve essere maggiore di zero.");
    }

    const document: NewPaymentDocument = {
      personId: input.personId,
      amount: input.amount,
      date: Timestamp.fromDate(input.date),
      ...(input.note ? { note: input.note } : {}),
    };

    await addDoc(collection(this.firestore, 'payments'), document);
  }
}
