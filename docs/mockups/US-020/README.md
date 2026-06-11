# US-020 - Dashboard pubblica orientata al saldo

## Design Read

Reading this as: implementazione Angular della direzione visuale gia validata da US-019, non come nuova esplorazione stilistica.

## Relazione con US-019

Questo mockup e intenzionalmente allineato a `docs/mockups/US-019/`.

- Stessi token: base oceano scuro, accento ciano, stati debito/credito/pari.
- Stessa composizione: headline operativa, griglia card saldo, movimenti sotto come spiegazione secondaria.
- Stessa interazione: card fronte/retro con fallback `prefers-reduced-motion`.
- Stessa scala forme: card 18px, avatar 12px, chip pill.

La spec US-020 deve portare questa direzione dentro i componenti Angular reali, non introdurre una variante visuale autonoma.

## Implementazione attesa

Usare US-019 e questo mirror US-020 come riferimento per:

- `src/app/features/dashboard/dashboard/*`
- `src/app/features/dashboard/balance-card/*`
- `src/app/features/dashboard/latest-loads-list/*`
- `src/app/features/dashboard/latest-payments-list/*`

## Taste Skill v2 checklist

- Dark mode protocol: PASS.
- Color consistency lock: PASS.
- Shape consistency lock: PASS.
- Page theme lock: PASS.
- No landing layout: PASS.
- No decorative non-functional elements: PASS.
- Mobile-first hierarchy: PASS.
- Motion fallback: PASS.
