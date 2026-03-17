# Restaurant Table Manager

## Current State
WaiterPage mostra i tavoli per sala. Cliccando un tavolo si apre uno Sheet laterale (OrderPanel). Se non c'è ordine aperto, mostra un bottone "Nuova ordinazione"; poi un secondo bottone "Aggiungi articoli" apre il dialog del menu.

## Requested Changes (Diff)

### Add
- Quando si clicca un tavolo senza ordine aperto, il pannello crea automaticamente l'ordine e apre subito il dialog per aggiungere articoli dal menu (un solo click, nessun passaggio intermedio).

### Modify
- OrderPanel: se non c'è ordine, invece di mostrare il bottone "Nuova ordinazione", crea l'ordine in automatico appena il pannello si apre e poi mostra direttamente l'AddItemsDialog.
- Mantenere il flusso esistente per tavoli che hanno già un ordine aperto.

### Remove
- Lo stato intermedio "Nessun ordine aperto" con il solo bottone "Nuova ordinazione" (sostituito dall'auto-creazione + apertura immediata del menu).

## Implementation Plan
1. In OrderPanel, aggiungere un `useEffect` che, quando il componente si monta e non c'è ordine (dopo il caricamento), esegue auto-createOrder e poi apre showAddItems=true.
2. Mostrare uno stato di loading mentre si crea l'ordine automaticamente.
3. Se la creazione fallisce, mostrare il bottone manuale come fallback.
4. Nessuna modifica al backend.
