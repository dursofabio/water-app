/**
 * Modello dati per i saldi per persona (US-003)
 */

/** Documento Firestore nella collezione 'carichi' */
export interface Carico {
  personaId: string;
  importo: number;
}

/** Documento Firestore nella collezione 'pagamenti' */
export interface Pagamento {
  personaId: string;
  importo: number;
}

/** Stato semantico del saldo */
export type StatoSaldo = 'debt-high' | 'debt-mid' | 'credit' | 'zero';

/** Saldo calcolato per una persona */
export interface PersonaBalance {
  id: string;
  nome: string;
  iniziali: string;
  carichiTotale: number;
  pagamentiTotale: number;
  saldo: number;
  stato: StatoSaldo;
}

/** Persone fisse dell'applicazione */
export const PERSONE: Pick<PersonaBalance, 'id' | 'nome' | 'iniziali'>[] = [
  { id: 'fernando', nome: 'Fernando', iniziali: 'Fe' },
  { id: 'nino',     nome: 'Nino',     iniziali: 'Ni' },
  { id: 'daniele',  nome: 'Daniele',  iniziali: 'Da' },
  { id: 'fabio',    nome: 'Fabio',    iniziali: 'Fa' },
];

/**
 * Calcola lo stato semantico del saldo.
 * Saldo positivo = debito (deve pagare), negativo = credito (gli devono).
 */
export function calcolaStato(saldo: number): StatoSaldo {
  if (saldo > 30)  return 'debt-high';
  if (saldo > 0)   return 'debt-mid';
  if (saldo < 0)   return 'credit';
  return 'zero';
}
