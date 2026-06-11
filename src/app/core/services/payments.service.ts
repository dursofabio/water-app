import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  Timestamp,
  addDoc,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface NewPaymentInput {
  personId: string;
  amount: number;
  date: Date;
  note?: string;
}

export interface NewPaymentDocument {
  personId: string;
  amount: number;
  date: Timestamp;
  note?: string;
}

export interface PaymentRecord {
  id: string;
  personId: string;
  amount: number;
  date: Date;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly firestore = inject(Firestore);

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

  getPayments(): Observable<PaymentRecord[]> {
    const paymentsQuery = query(
      collection(this.firestore, 'payments'),
      orderBy('date', 'desc'),
    );

    return new Observable<PaymentRecord[]>((observer) => {
      const unsubscribe = onSnapshot(
        paymentsQuery,
        (snapshot) => {
          const records = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as NewPaymentDocument;
            return {
              id: docSnap.id,
              personId: data.personId,
              amount: data.amount,
              date: data.date.toDate(),
              ...(data.note ? { note: data.note } : {}),
            } satisfies PaymentRecord;
          });
          observer.next(records);
        },
        (error) => observer.error(error),
      );
      return unsubscribe;
    });
  }

  getPaymentById(id: string): Observable<PaymentRecord | null> {
    const docRef = doc(this.firestore, 'payments', id);

    return new Observable<PaymentRecord | null>((observer) => {
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            observer.next(null);
            return;
          }
          const data = docSnap.data() as NewPaymentDocument;
          observer.next({
            id: docSnap.id,
            personId: data.personId,
            amount: data.amount,
            date: data.date.toDate(),
            ...(data.note ? { note: data.note } : {}),
          });
        },
        (error) => observer.error(error),
      );
      return unsubscribe;
    });
  }

  async updatePayment(id: string, input: NewPaymentInput): Promise<void> {
    if (input.amount <= 0) {
      throw new Error("L'importo deve essere maggiore di zero.");
    }

    const document: NewPaymentDocument = {
      personId: input.personId,
      amount: input.amount,
      date: Timestamp.fromDate(input.date),
      ...(input.note ? { note: input.note } : {}),
    };

    await setDoc(doc(this.firestore, 'payments', id), document);
  }

  async deletePayment(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'payments', id));
  }
}
