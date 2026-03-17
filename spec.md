# Restaurant Table Manager

## Current State
L'app ha: piantina interattiva, gestione prenotazioni, dashboard "Oggi", e sezione Menu per cibi e bibite. Il backend ha rooms, tables, reservations, menuItems con CRUD completo.

## Requested Changes (Diff)

### Add
- Nuova sezione "Cameriere" con navigazione dedicata
- Backend: tipo `Order` con tableId, lista di OrderItem (menuItemId + quantity + note), status ("aperta"/"chiusa"), timestamp
- Backend: CRUD per ordini (createOrder, addOrderItem, removeOrderItem, closeOrder, getOrdersByTable, getOpenOrders, getAllOrders)
- Backend: `getAllTables` query per recuperare tutti i tavoli senza filtro per sala
- Frontend: `WaiterPage` che mostra tutti i tavoli raggruppati per sala con indicatore se il tavolo ha un ordine aperto
- Frontend: panel laterale/dialog per gestire l'ordine di un tavolo: lista voci menu sfogliabili, aggiunta/rimozione items, quantità, totale, chiusura ordine

### Modify
- `App.tsx`: aggiungere pagina "cameriere"
- `Layout.tsx`: aggiungere voce di navigazione "Cameriere" con icona appropriata

### Remove
- Niente

## Implementation Plan
1. Aggiungere tipo Order/OrderItem e funzioni CRUD nel backend Motoko
2. Aggiungere getAllTables nel backend
3. Rigenerare il backend
4. Creare WaiterPage nel frontend con visualizzazione tavoli e gestione ordini
5. Aggiornare App.tsx e Layout.tsx
