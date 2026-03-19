import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Loader2,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MenuItem, Reservation, Room, Table } from "../backend.d";
import type { Order } from "../hooks/useQueries";
import {
  useAddItemToOrder,
  useAllMenuItems,
  useAllReservations,
  useCloseOrder,
  useCreateOrder,
  useDeleteOrder,
  useOpenOrderByTable,
  useOpenOrders,
  useRemoveItemFromOrder,
  useRooms,
  useTablesByRoom,
} from "../hooks/useQueries";

const today = new Date().toISOString().split("T")[0];

function getTableStatus(
  table: Table,
  reservations: Reservation[],
): "libero" | "prenotato" | "occupato" {
  const todayRes = reservations.filter(
    (r) =>
      r.tableId === table.id && r.date === today && r.status !== "cancelled",
  );
  if (todayRes.some((r) => r.status === "seated")) return "occupato";
  if (todayRes.length > 0) return "prenotato";
  return "libero";
}

function getNextReservation(
  table: Table,
  reservations: Reservation[],
): Reservation | null {
  const now = new Date();
  const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const upcoming = reservations
    .filter(
      (r) =>
        r.tableId === table.id &&
        r.date === today &&
        r.status !== "cancelled" &&
        r.time >= nowTime,
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  return upcoming[0] ?? null;
}

const statusConfig = {
  libero: {
    label: "Libero",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  prenotato: {
    label: "Prenotato",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  occupato: {
    label: "Occupato",
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-500",
  },
};

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
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("tutte");
  const addItem = useAddItemToOrder();

  // Load sections from localStorage (same key used in MenuPage)
  const savedSections: string[] = (() => {
    try {
      const raw = localStorage.getItem("menu_sections");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const availableItems = menuItems.filter((m) => m.available);

  // Derive categories: use saved sections if available, else unique categories from items
  const categories: string[] =
    savedSections.length > 0
      ? savedSections
      : Array.from(
          new Set(availableItems.map((m) => m.category).filter(Boolean)),
        );

  // Filter items by tab and search
  const filteredItems = availableItems.filter((item) => {
    const matchesTab = activeTab === "tutte" || item.category === activeTab;
    const matchesSearch =
      search === "" || item.name.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

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
      setSearch("");
      setActiveTab("tutte");
      onOpenChange(false);
    } catch {
      toast.error("Errore durante l'aggiunta degli articoli");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="waiter.menu.dialog"
        className="max-w-lg max-h-[85vh] flex flex-col gap-0 p-0"
      >
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="font-display text-xl">
            Aggiungi al menu
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="waiter.menu.search_input"
              placeholder="Cerca articolo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Category tabs */}
        {categories.length > 0 && (
          <div className="px-5 pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                <TabsTrigger
                  value="tutte"
                  data-ocid="waiter.menu.tab"
                  className="text-xs px-3 py-1"
                >
                  Tutte
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    data-ocid="waiter.menu.tab"
                    className="text-xs px-3 py-1"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        <Separator />

        {/* Items list */}
        <ScrollArea className="flex-1 px-5 py-3">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              <UtensilsCrossed className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nessun articolo trovato
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map((item, idx) => {
                const qty = quantities[item.id.toString()] ?? 0;
                return (
                  <div key={item.id.toString()} className="space-y-1">
                    <div
                      data-ocid={`waiter.menu.item.${idx + 1}`}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          €{item.price.toFixed(2)}
                          {item.category && (
                            <span className="ml-2 opacity-60">
                              · {item.category}
                            </span>
                          )}
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
                    {qty > 0 && (
                      <Input
                        placeholder={`Note per ${item.name}...`}
                        value={notes[item.id.toString()] ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [item.id.toString()]: e.target.value,
                          }))
                        }
                        className="text-xs h-8 ml-1"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />

        {/* Actions */}
        <div className="px-5 py-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            data-ocid="waiter.menu.cancel_button"
          >
            Annulla
          </Button>
          <Button
            className="flex-1"
            onClick={handleAdd}
            disabled={addItem.isPending}
            data-ocid="waiter.menu.submit_button"
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
  const [autoCreateFailed, setAutoCreateFailed] = useState(false);

  // Auto-create order and open AddItemsDialog when no open order exists
  useEffect(() => {
    if (isLoading || order === undefined || order !== null) return;
    if (autoCreateFailed) return;
    if (createOrder.isPending) return;

    const run = async () => {
      try {
        await createOrder.mutateAsync(table.id);
        setShowAddItems(true);
      } catch {
        setAutoCreateFailed(true);
        toast.error("Errore durante la creazione dell'ordine");
      }
    };
    run();
  }, [isLoading, order, table.id, autoCreateFailed, createOrder]);

  const handleCreateOrder = async () => {
    try {
      await createOrder.mutateAsync(table.id);
      setAutoCreateFailed(false);
      setShowAddItems(true);
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

  // Show spinner while loading or auto-creating
  if (isLoading || order === undefined || (!order && createOrder.isPending)) {
    return (
      <div
        data-ocid="waiter.order.loading_state"
        className="flex-1 flex flex-col items-center justify-center gap-3"
      >
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {createOrder.isPending
            ? "Creazione ordinazione..."
            : "Caricamento..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {!order ? (
        // Fallback: auto-create failed — show manual button
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

function RoomTablesSection({
  room,
  reservations,
  openOrderTableIds,
  onSelectTable,
}: {
  room: Room;
  reservations: Reservation[];
  openOrderTableIds: Set<string>;
  onSelectTable: (table: Table) => void;
}) {
  const { data: tables = [], isLoading } = useTablesByRoom(room.id);

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="font-display text-2xl font-semibold">{room.name}</h2>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {["c1", "c2", "c3"].map((c) => (
            <Skeleton key={c} className="h-36" />
          ))}
        </div>
      </section>
    );
  }

  if (tables.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-display text-2xl font-semibold">{room.name}</h2>
        <Separator className="flex-1" />
        <span className="text-sm text-muted-foreground">
          {tables.length} tavoli
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {tables.map((table, idx) => {
          const status = getTableStatus(table, reservations);
          const nextRes = getNextReservation(table, reservations);
          const cfg = statusConfig[status];
          const hasOpenOrder = openOrderTableIds.has(table.id.toString());
          return (
            <Card
              key={table.id.toString()}
              data-ocid={`waiter.table.item.${idx + 1}`}
              onClick={() => onSelectTable(table)}
              className="overflow-hidden border-border hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 flex items-center justify-center text-sm font-bold text-foreground/80 ${
                      table.shape === "round" ? "rounded-full" : "rounded-md"
                    } bg-secondary`}
                  >
                    {table.tableLabel}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {table.capacity.toString()} coperti
                  </p>
                  {nextRes && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {nextRes.time} — {nextRes.customerName}
                    </p>
                  )}
                  {hasOpenOrder && (
                    <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                      <ShoppingCart className="w-3 h-3" />
                      Ordine aperto
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

export default function WaiterPage() {
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: openOrders = [] } = useOpenOrders();
  const { data: menuItems = [] } = useAllMenuItems();
  const { data: reservations = [] } = useAllReservations();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const todayFormatted = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const openOrderTableIds = new Set(
    (openOrders as Order[]).map((o) => o.tableId.toString()),
  );

  return (
    <div data-ocid="waiter.page" className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground capitalize">
          {todayFormatted}
        </p>
        <h1 className="font-display text-4xl font-bold">Cameriere</h1>
      </div>

      {/* Tables by room */}
      {roomsLoading ? (
        <div data-ocid="waiter.loading_state" className="space-y-8">
          {["r1", "r2"].map((k) => (
            <div key={k}>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {["c1", "c2", "c3", "c4"].map((c) => (
                  <Skeleton key={c} className="h-36" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div data-ocid="waiter.empty_state" className="text-center py-16">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-display text-xl text-muted-foreground">
            Nessun tavolo configurato
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Aggiungi tavoli dalla sezione Piantina
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {rooms.map((room: Room) => (
            <RoomTablesSection
              key={room.id.toString()}
              room={room}
              reservations={reservations}
              openOrderTableIds={openOrderTableIds}
              onSelectTable={setSelectedTable}
            />
          ))}
        </div>
      )}

      {/* Order Sheet */}
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
