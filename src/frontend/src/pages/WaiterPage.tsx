import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChefHat,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MenuItem, Room, Table } from "../backend.d";
import type { Order } from "../hooks/useQueries";
import {
  useAddItemToOrder,
  useAllMenuItems,
  useAllTables,
  useCloseOrder,
  useCreateOrder,
  useDeleteOrder,
  useOpenOrderByTable,
  useOpenOrders,
  useRemoveItemFromOrder,
  useRooms,
} from "../hooks/useQueries";

function TableCard({
  table,
  index,
  hasOpenOrder,
  onClick,
}: {
  table: Table;
  index: number;
  hasOpenOrder: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-ocid={`waiter.table.item.${index}`}
      onClick={onClick}
      className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-all group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">
            {table.tableLabel}
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {Number(table.capacity)} posti
          </p>
        </div>
        <Badge
          className={
            hasOpenOrder
              ? "bg-amber-500/15 text-amber-700 border-amber-300 shrink-0"
              : "bg-emerald-500/15 text-emerald-700 border-emerald-300 shrink-0"
          }
          variant="outline"
        >
          {hasOpenOrder ? "Ordine aperto" : "Libero"}
        </Badge>
      </div>
      <div
        data-ocid={`waiter.table.open_modal_button.${index}`}
        className="mt-3 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity"
      >
        Gestisci ordinazione →
      </div>
    </button>
  );
}

function AddItemsDialog({
  open,
  onOpenChange,
  orderId,
  menuItems,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  orderId: bigint;
  menuItems: MenuItem[];
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const addItem = useAddItemToOrder();

  const availableItems = menuItems.filter((m) => m.available);
  const byCategory = availableItems.reduce(
    (acc, item) => {
      const cat = item.category === "bibita" ? "Bibite" : "Cibo";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, MenuItem[]>,
  );

  const handleAdd = async () => {
    const entries = Object.entries(quantities).filter(([, qty]) => qty > 0);
    if (entries.length === 0) {
      toast.error("Seleziona almeno un articolo");
      return;
    }
    try {
      await Promise.all(
        entries.map(([menuItemId, qty]) =>
          addItem.mutateAsync({
            orderId,
            menuItemId: BigInt(menuItemId),
            quantity: BigInt(qty),
            notes: notes[menuItemId] ?? "",
          }),
        ),
      );
      toast.success("Articoli aggiunti all'ordine");
      setQuantities({});
      setNotes({});
      onOpenChange(false);
    } catch {
      toast.error("Errore durante l'aggiunta degli articoli");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="waiter.menu.dialog"
        className="max-w-lg max-h-[80vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Aggiungi al menu
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-2">
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat} className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {cat}
              </p>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const qty = quantities[item.id.toString()] ?? 0;
                  return (
                    <div
                      key={item.id.toString()}
                      data-ocid={`waiter.menu.item.${idx + 1}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          €{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          data-ocid={`waiter.menu.item.add_button.${idx + 1}`}
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id.toString()]: Math.max(
                                0,
                                (prev[item.id.toString()] ?? 0) - 1,
                              ),
                            }))
                          }
                          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantities((prev) => ({
                              ...prev,
                              [item.id.toString()]:
                                (prev[item.id.toString()] ?? 0) + 1,
                            }))
                          }
                          className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {items
                .filter((item) => (quantities[item.id.toString()] ?? 0) > 0)
                .map((item) => (
                  <div key={`note-${item.id}`} className="mt-1 ml-1">
                    <Input
                      placeholder={`Note per ${item.name}...`}
                      value={notes[item.id.toString()] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [item.id.toString()]: e.target.value,
                        }))
                      }
                      className="text-xs h-8"
                    />
                  </div>
                ))}
            </div>
          ))}
          {availableItems.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nessun articolo disponibile nel menu
            </div>
          )}
        </ScrollArea>
        <div className="pt-3 border-t border-border flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Annulla
          </Button>
          <Button
            className="flex-1"
            onClick={handleAdd}
            disabled={addItem.isPending}
          >
            {addItem.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Aggiungi all'ordine
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderPanel({
  table,
  menuItems,
  onClose,
}: {
  table: Table;
  menuItems: MenuItem[];
  onClose: () => void;
}) {
  const { data: order, isLoading } = useOpenOrderByTable(table.id);
  const createOrder = useCreateOrder();
  const removeItem = useRemoveItemFromOrder();
  const closeOrder = useCloseOrder();
  const deleteOrder = useDeleteOrder();
  const [showAddItems, setShowAddItems] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCreateOrder = async () => {
    try {
      await createOrder.mutateAsync(table.id);
      toast.success("Ordinazione creata");
    } catch {
      toast.error("Errore durante la creazione dell'ordine");
    }
  };

  const handleCloseOrder = async () => {
    if (!order) return;
    try {
      await closeOrder.mutateAsync(order.id);
      toast.success("Conto chiuso");
      setShowCloseConfirm(false);
      onClose();
    } catch {
      toast.error("Errore durante la chiusura del conto");
    }
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    try {
      await deleteOrder.mutateAsync(order.id);
      toast.success("Ordine eliminato");
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      toast.error("Errore durante l'eliminazione dell'ordine");
    }
  };

  const getMenuItem = (menuItemId: bigint) =>
    menuItems.find((m) => m.id === menuItemId);

  const total =
    order?.items.reduce((sum, item) => {
      const menuItem = getMenuItem(item.menuItemId);
      return sum + (menuItem?.price ?? 0) * Number(item.quantity);
    }, 0) ?? 0;

  if (isLoading) {
    return (
      <div
        data-ocid="waiter.order.loading_state"
        className="flex-1 flex items-center justify-center"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {!order ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">
              Nessun ordine aperto
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Crea una nuova ordinazione per questo tavolo
            </p>
          </div>
          <Button
            data-ocid="waiter.order.new.primary_button"
            onClick={handleCreateOrder}
            disabled={createOrder.isPending}
            className="w-full max-w-xs"
          >
            {createOrder.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Nuova ordinazione
          </Button>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="px-4 py-3">
              {order.items.length === 0 ? (
                <div
                  data-ocid="waiter.empty_state"
                  className="py-8 text-center text-muted-foreground text-sm"
                >
                  <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nessun articolo nell'ordine
                </div>
              ) : (
                <div className="space-y-2">
                  {order.items.map((item, idx) => {
                    const menuItem = getMenuItem(item.menuItemId);
                    return (
                      <div
                        key={`${item.menuItemId}-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {menuItem?.name ?? "Articolo sconosciuto"}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              {item.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {Number(item.quantity)} × €
                            {(menuItem?.price ?? 0).toFixed(2)} ={" "}
                            <span className="font-semibold text-foreground">
                              €
                              {(
                                (menuItem?.price ?? 0) * Number(item.quantity)
                              ).toFixed(2)}
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem.mutate({
                              orderId: order.id,
                              menuItemId: item.menuItemId,
                            })
                          }
                          className="w-7 h-7 rounded-md hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition-colors text-muted-foreground"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="px-4 py-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Totale</span>
              <span className="text-xl font-bold text-foreground">
                €{total.toFixed(2)}
              </span>
            </div>

            <Button
              data-ocid="waiter.order.add_items.button"
              variant="outline"
              className="w-full"
              onClick={() => setShowAddItems(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi articoli
            </Button>

            {!showCloseConfirm && !showDeleteConfirm && (
              <div className="flex gap-2">
                <Button
                  data-ocid="waiter.order.delete.button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  data-ocid="waiter.order.close.button"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setShowCloseConfirm(true)}
                >
                  Chiudi conto
                </Button>
              </div>
            )}

            {showCloseConfirm && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-3 space-y-2">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Confermi la chiusura del conto?
                </p>
                <div className="flex gap-2">
                  <Button
                    data-ocid="waiter.order.cancel_button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowCloseConfirm(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    data-ocid="waiter.order.confirm_button"
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleCloseOrder}
                    disabled={closeOrder.isPending}
                  >
                    {closeOrder.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    Conferma
                  </Button>
                </div>
              </div>
            )}

            {showDeleteConfirm && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
                <p className="text-sm font-medium text-destructive">
                  Eliminare l'ordine?
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={handleDeleteOrder}
                    disabled={deleteOrder.isPending}
                  >
                    {deleteOrder.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    Elimina
                  </Button>
                </div>
              </div>
            )}
          </div>

          <AddItemsDialog
            open={showAddItems}
            onOpenChange={setShowAddItems}
            orderId={order.id}
            menuItems={menuItems}
          />
        </>
      )}
    </div>
  );
}

export default function WaiterPage() {
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: allTables = [], isLoading: tablesLoading } = useAllTables();
  const { data: openOrders = [] } = useOpenOrders();
  const { data: menuItems = [] } = useAllMenuItems();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const openOrderTableIds = new Set(
    (openOrders as Order[]).map((o) => o.tableId.toString()),
  );

  const tablesByRoom = rooms.reduce(
    (acc, room) => {
      acc[room.id.toString()] = (allTables as Table[]).filter(
        (t) => t.roomId.toString() === room.id.toString(),
      );
      return acc;
    },
    {} as Record<string, Table[]>,
  );

  const isLoading = roomsLoading || tablesLoading;

  return (
    <div data-ocid="waiter.page" className="min-h-screen bg-background">
      <div className="px-6 py-8 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Cameriere
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestisci le ordinazioni dei tavoli
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {isLoading ? (
          <div data-ocid="waiter.loading_state" className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-24 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (allTables as Table[]).length === 0 ? (
          <div
            data-ocid="waiter.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-foreground">
              Nessun tavolo trovato
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Aggiungi tavoli dalla sezione Piantina
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {rooms.map((room: Room) => {
              const roomTables = tablesByRoom[room.id.toString()] ?? [];
              if (roomTables.length === 0) return null;
              return (
                <section key={room.id.toString()}>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-display text-lg font-semibold text-foreground">
                      {room.name}
                    </h2>
                    <Separator className="flex-1" />
                    <span className="text-sm text-muted-foreground">
                      {roomTables.length} tavoli
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {roomTables.map((table, idx) => (
                      <TableCard
                        key={table.id.toString()}
                        table={table}
                        index={idx + 1}
                        hasOpenOrder={openOrderTableIds.has(
                          table.id.toString(),
                        )}
                        onClick={() => setSelectedTable(table)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Sheet
        open={selectedTable !== null}
        onOpenChange={(open) => !open && setSelectedTable(null)}
      >
        <SheetContent
          data-ocid="waiter.order.sheet"
          side="right"
          className="w-full sm:w-[420px] flex flex-col p-0"
        >
          <SheetHeader className="px-4 py-4 border-b border-border">
            <SheetTitle className="font-display text-lg">
              {selectedTable ? (
                <>
                  <span className="text-foreground">
                    {selectedTable.tableLabel}
                  </span>
                  <span className="text-muted-foreground font-normal text-base ml-2">
                    · {Number(selectedTable.capacity)} posti
                  </span>
                </>
              ) : null}
            </SheetTitle>
          </SheetHeader>
          {selectedTable && (
            <OrderPanel
              table={selectedTable}
              menuItems={menuItems as MenuItem[]}
              onClose={() => setSelectedTable(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
