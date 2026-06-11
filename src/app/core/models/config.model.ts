/**
 * ConfigPrices — US-008
 *
 * Prezzi correnti per acqua ed energia, letti da /config/prices su Firestore.
 * Usati come snapshot al momento della registrazione di un carico.
 */
export interface ConfigPrices {
  waterPrice: number;
  energyPrice: number;
}

/** Valori di default usati quando /config/prices non esiste in Firestore. */
export const DEFAULT_PRICES: ConfigPrices = {
  waterPrice: 35,
  energyPrice: 10,
};
