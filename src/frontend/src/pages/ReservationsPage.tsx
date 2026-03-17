import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Table as UITable,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Reservation, Room, Table } from "../backend.d";
import {
  useAllReservations,
  useCreateReservation,
  useDeleteReservation,
  useRooms,
  useTablesByRoom,
  useUpdateReservation,
} from "../hooks/useQueries";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: {
    label: "In attesa",
    className: "bg-gray-100 text-gray-700 border border-gray-200",
  },
  confirmed: {
    label: "Confermato",
    className: "bg-blue-100 text-blue-700 border border-blue-200",
  },
  seated: {
    label: "A tavola",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  cancelled: {
    label: "Annullato",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function useAllTables(rooms: Room[]): Table[] {
  const q0 = useTablesByRoom(rooms[0]?.id ?? null);
  const q1 = useTablesByRoom(rooms[1]?.id ?? null);
  const q2 = useTablesByRoom(rooms[2]?.id ?? null);
  const q3 = useTablesByRoom(rooms[3]?.id ?? null);
  const q4 = useTablesByRoom(rooms[4]?.id ?? null);
  return [
    ...(q0.data ?? []),
    ...(q1.data ?? []),
    ...(q2.data ?? []),
    ...(q3.data ?? []),
    ...(q4.data ?? []),
  ];
}

interface FormState {
  tableId: string;
  customerName: string;
  date: string;
  time: string;
  partySize: string;
  notes: string;
  status: string;
}

const EMPTY_FORM: FormState = {
  tableId: "",
  customerName: "",
  date: new Date().toISOString().split("T")[0],
  time: "20:00",
  partySize: "2",
  notes: "",
  status: "pending",
};

function FormFields({
  form,
  onChange,
  rooms,
  allTables,
  showStatus,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  rooms: Room[];
  allTables: Table[];
  showStatus?: boolean;
}) {
  const set = (field: keyof FormState) => (v: string) =>
    onChange({ ...form, [field]: v });
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Cliente</Label>
        <Input
          data-ocid="reservations.form.customer.input"
          placeholder="Nome cliente"
          value={form.customerName}
          onChange={(e) => set("customerName")(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Data</Label>
          <Input
            data-ocid="reservations.form.date.input"
            type="date"
            value={form.date}
            onChange={(e) => set("date")(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Ora</Label>
          <Input
            data-ocid="reservations.form.time.input"
            type="time"
            value={form.time}
            onChange={(e) => set("time")(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Tavolo</Label>
          <Select value={form.tableId} onValueChange={set("tableId")}>
            <SelectTrigger data-ocid="reservations.form.table.select">
              <SelectValue placeholder="Seleziona tavolo" />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((room) => {
                const roomTables = allTables.filter(
                  (t) => t.roomId === room.id,
                );
                if (roomTables.length === 0) return null;
                return (
                  <SelectGroup key={room.id.toString()}>
                    <SelectLabel>{room.name}</SelectLabel>
                    {roomTables.map((t) => (
                      <SelectItem key={t.id.toString()} value={t.id.toString()}>
                        {t.tableLabel} ({t.capacity.toString()} posti)
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Coperti</Label>
          <Input
            data-ocid="reservations.form.party.input"
            type="number"
            min="1"
            max="30"
            value={form.partySize}
            onChange={(e) => set("partySize")(e.target.value)}
          />
        </div>
      </div>
      {showStatus && (
        <div className="space-y-2">
          <Label>Stato</Label>
          <Select value={form.status} onValueChange={set("status")}>
            <SelectTrigger data-ocid="reservations.form.status.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">In attesa</SelectItem>
              <SelectItem value="confirmed">Confermato</SelectItem>
              <SelectItem value="seated">A tavola</SelectItem>
              <SelectItem value="cancelled">Annullato</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label>Note</Label>
        <Textarea
          data-ocid="reservations.form.notes.textarea"
          placeholder="Note aggiuntive..."
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  );
}

export default function ReservationsPage() {
  const todayStr = new Date().toISOString().split("T")[0];
  const [filterDate, setFilterDate] = useState(todayStr);
  const [filterStatus, setFilterStatus] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editRes, setEditRes] = useState<Reservation | null>(null);
  const [deleteRes, setDeleteRes] = useState<Reservation | null>(null);
  const [addForm, setAddForm] = useState<FormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);

  const { data: reservations = [], isLoading: resLoading } =
    useAllReservations();
  const { data: rooms = [] } = useRooms();
  const allTables = useAllTables(rooms);

  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();
  const deleteReservation = useDeleteReservation();

  const getTableLabel = (tableId: bigint) =>
    allTables.find((t) => t.id === tableId)?.tableLabel ?? "—";
  const getRoomName = (tableId: bigint) => {
    const table = allTables.find((t) => t.id === tableId);
    if (!table) return "—";
    return rooms.find((r) => r.id === table.roomId)?.name ?? "—";
  };

  const filtered = useMemo(() => {
    return reservations
      .filter((r) => {
        if (filterDate && r.date !== filterDate) return false;
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [reservations, filterDate, filterStatus]);

  const handleAdd = () => {
    if (!addForm.customerName.trim() || !addForm.tableId) return;
    createReservation.mutate(
      {
        tableId: BigInt(addForm.tableId),
        customerName: addForm.customerName.trim(),
        date: addForm.date,
        time: addForm.time,
        partySize: BigInt(Number.parseInt(addForm.partySize) || 2),
        notes: addForm.notes,
      },
      {
        onSuccess: () => {
          toast.success("Prenotazione creata");
          setAddOpen(false);
          setAddForm({ ...EMPTY_FORM, date: filterDate });
        },
        onError: () => toast.error("Errore nella creazione"),
      },
    );
  };

  const handleEditOpen = (r: Reservation) => {
    setEditRes(r);
    setEditForm({
      tableId: r.tableId.toString(),
      customerName: r.customerName,
      date: r.date,
      time: r.time,
      partySize: r.partySize.toString(),
      notes: r.notes,
      status: r.status,
    });
  };

  const handleEditSave = () => {
    if (!editRes || !editForm.customerName.trim() || !editForm.tableId) return;
    updateReservation.mutate(
      {
        reservationId: editRes.id,
        tableId: BigInt(editForm.tableId),
        customerName: editForm.customerName.trim(),
        date: editForm.date,
        time: editForm.time,
        partySize: BigInt(Number.parseInt(editForm.partySize) || 2),
        notes: editForm.notes,
        status: editForm.status,
      },
      {
        onSuccess: () => {
          toast.success("Prenotazione aggiornata");
          setEditRes(null);
        },
        onError: () => toast.error("Errore nell'aggiornamento"),
      },
    );
  };

  const handleDelete = () => {
    if (!deleteRes) return;
    deleteReservation.mutate(deleteRes.id, {
      onSuccess: () => {
        toast.success("Prenotazione eliminata");
        setDeleteRes(null);
      },
      onError: () => toast.error("Errore nell'eliminazione"),
    });
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold">Prenotazioni</h1>
          <p className="text-muted-foreground mt-1">
            {filtered.length} prenotazion{filtered.length === 1 ? "e" : "i"}{" "}
            trovate
          </p>
        </div>
        <Button
          data-ocid="reservations.add.open_modal_button"
          onClick={() => {
            setAddForm({ ...EMPTY_FORM, date: filterDate });
            setAddOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Nuova prenotazione
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="reservations.date.pagination_prev"
            onClick={() => setFilterDate(addDays(filterDate, -1))}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <Input
            data-ocid="reservations.date.input"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-40 text-sm"
          />
          <button
            type="button"
            data-ocid="reservations.date.pagination_next"
            onClick={() => setFilterDate(addDays(filterDate, 1))}
            className="p-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Button
            variant="ghost"
            size="sm"
            data-ocid="reservations.today.button"
            onClick={() => setFilterDate(todayStr)}
            className="text-xs"
          >
            Oggi
          </Button>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger
            data-ocid="reservations.status.select"
            className="w-40 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            <SelectItem value="pending">In attesa</SelectItem>
            <SelectItem value="confirmed">Confermato</SelectItem>
            <SelectItem value="seated">A tavola</SelectItem>
            <SelectItem value="cancelled">Annullato</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {resLoading ? (
          <div data-ocid="reservations.loading_state" className="p-6 space-y-3">
            {["s1", "s2", "s3", "s4", "s5"].map((k) => (
              <Skeleton key={k} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            data-ocid="reservations.empty_state"
            className="py-16 text-center"
          >
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-display text-xl text-muted-foreground">
              Nessuna prenotazione
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              per{" "}
              {new Date(filterDate).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
        ) : (
          <UITable data-ocid="reservations.table">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Cliente</TableHead>
                <TableHead className="font-semibold">Sala / Tavolo</TableHead>
                <TableHead className="font-semibold">Ora</TableHead>
                <TableHead className="font-semibold">Coperti</TableHead>
                <TableHead className="font-semibold">Stato</TableHead>
                <TableHead className="font-semibold">Note</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r, idx) => {
                const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                return (
                  <TableRow
                    key={r.id.toString()}
                    data-ocid={`reservations.item.${idx + 1}`}
                    className="hover:bg-muted/20"
                  >
                    <TableCell className="font-medium">
                      {r.customerName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {getRoomName(r.tableId)} · {getTableLabel(r.tableId)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.time}
                    </TableCell>
                    <TableCell>{r.partySize.toString()}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sc.className}`}
                      >
                        {sc.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {r.notes || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          data-ocid={`reservations.edit_button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditOpen(r)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          data-ocid={`reservations.delete_button.${idx + 1}`}
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteRes(r)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </UITable>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent data-ocid="reservations.add.dialog" className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">
              Nuova Prenotazione
            </DialogTitle>
          </DialogHeader>
          <FormFields
            form={addForm}
            onChange={setAddForm}
            rooms={rooms}
            allTables={allTables}
          />
          <DialogFooter>
            <Button
              data-ocid="reservations.add.cancel_button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Annulla
            </Button>
            <Button
              data-ocid="reservations.add.submit_button"
              onClick={handleAdd}
              disabled={
                createReservation.isPending ||
                !addForm.customerName.trim() ||
                !addForm.tableId
              }
            >
              {createReservation.isPending
                ? "Salvataggio..."
                : "Crea prenotazione"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRes} onOpenChange={(o) => !o && setEditRes(null)}>
        <DialogContent
          data-ocid="reservations.edit.dialog"
          className="max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="font-display">
              Modifica Prenotazione
            </DialogTitle>
          </DialogHeader>
          <FormFields
            form={editForm}
            onChange={setEditForm}
            rooms={rooms}
            allTables={allTables}
            showStatus
          />
          <DialogFooter>
            <Button
              data-ocid="reservations.edit.cancel_button"
              variant="outline"
              onClick={() => setEditRes(null)}
            >
              Annulla
            </Button>
            <Button
              data-ocid="reservations.edit.save_button"
              onClick={handleEditSave}
              disabled={
                updateReservation.isPending ||
                !editForm.customerName.trim() ||
                !editForm.tableId
              }
            >
              {updateReservation.isPending
                ? "Salvataggio..."
                : "Salva modifiche"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteRes}
        onOpenChange={(o) => !o && setDeleteRes(null)}
      >
        <AlertDialogContent data-ocid="reservations.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Prenotazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la prenotazione di{" "}
              <strong>{deleteRes?.customerName}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="reservations.delete.cancel_button">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="reservations.delete.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
