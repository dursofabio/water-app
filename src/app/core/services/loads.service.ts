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

export interface LoadRecord {
  id: string;
  date: Date;
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

export function calculateBreakdown(
  weights: PersonWeight[],
  waterPrice: number,
  energyPrice: number,
): {
  breakdown: Array<{ personId: string; weight: number; cost: number }>;
  totalAmount: number;
  totalWeight: number;
} {
  const totalWeight = weights.reduce((sum, pw) => sum + pw.weight, 0);

  if (totalWeight <= 0) {
    throw new Error('La somma dei pesi deve essere maggiore di zero.');
  }

  const pricePerUnit = waterPrice + energyPrice;
  const breakdown = weights.map((pw) => ({
    personId: pw.personId,
    weight: pw.weight,
    cost: (pw.weight / totalWeight) * pricePerUnit,
  }));
  const totalAmount = breakdown.reduce((sum, item) => sum + item.cost, 0);

  return { breakdown, totalAmount, totalWeight };
}

@Injectable({ providedIn: 'root' })
export class LoadsService {
  private readonly firestore = inject(Firestore);

  async addLoad(input: NewLoadInput): Promise<void> {
    const { breakdown, totalAmount, totalWeight } = calculateBreakdown(
      input.weights,
      input.waterPrice,
      input.energyPrice,
    );

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

  getLoads(): Observable<LoadRecord[]> {
    const loadsQuery = query(
      collection(this.firestore, 'loads'),
      orderBy('date', 'desc'),
    );

    return new Observable<LoadRecord[]>((observer) => {
      const unsubscribe = onSnapshot(
        loadsQuery,
        (snapshot) => {
          const records = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as NewLoadDocument;
            return {
              id: docSnap.id,
              date: data.date.toDate(),
              paidByPersonId: data.paidByPersonId,
              waterPrice: data.waterPrice,
              energyPrice: data.energyPrice,
              totalAmount: data.totalAmount,
              totalWeight: data.totalWeight,
              breakdown: data.breakdown ?? [],
            } satisfies LoadRecord;
          });
          observer.next(records);
        },
        (error) => observer.error(error),
      );
      return unsubscribe;
    });
  }

  getLoadById(id: string): Observable<LoadRecord | null> {
    const docRef = doc(this.firestore, 'loads', id);

    return new Observable<LoadRecord | null>((observer) => {
      const unsubscribe = onSnapshot(
        docRef,
        (docSnap) => {
          if (!docSnap.exists()) {
            observer.next(null);
            return;
          }
          const data = docSnap.data() as NewLoadDocument;
          observer.next({
            id: docSnap.id,
            date: data.date.toDate(),
            paidByPersonId: data.paidByPersonId,
            waterPrice: data.waterPrice,
            energyPrice: data.energyPrice,
            totalAmount: data.totalAmount,
            totalWeight: data.totalWeight,
            breakdown: data.breakdown ?? [],
          });
        },
        (error) => observer.error(error),
      );
      return unsubscribe;
    });
  }

  async updateLoad(id: string, input: NewLoadInput): Promise<void> {
    const { breakdown, totalAmount, totalWeight } = calculateBreakdown(
      input.weights,
      input.waterPrice,
      input.energyPrice,
    );

    const document: NewLoadDocument = {
      date: Timestamp.fromDate(input.date),
      paidByPersonId: input.paidByPersonId,
      waterPrice: input.waterPrice,
      energyPrice: input.energyPrice,
      totalAmount,
      totalWeight,
      breakdown,
    };

    await setDoc(doc(this.firestore, 'loads', id), document);
  }

  async deleteLoad(id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'loads', id));
  }
}
