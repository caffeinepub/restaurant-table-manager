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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { Room, RoomId, Table } from "../backend.d";
import {
  useAllReservations,
  useCreateReservation,
  useCreateRoom,
  useCreateTable,
  useDeleteRoom,
  useDeleteTable,
  useRooms,
  useTablesByRoom,
  useUpdateRoom,
  useUpdateTable,
} from "../hooks/useQueries";

const CANVAS_W = 800;
const CANVAS_H = 560;
const today = new Date().toISOString().split("T")[0];

const MIN_SIZE = 56;
const MAX_SIZE = 200;

type TableStatus = "libero" | "prenotato" | "occupato";

function getTableStatus(
  tableId: bigint,
  reservations: { tableId: bigint; date: string; status: string }[],
): TableStatus {
  const todayRes = reservations.filter(
    (r) =>
      r.tableId === tableId && r.date === today && r.status !== "cancelled",
  );
  if (todayRes.some((r) => r.status === "seated")) return "occupato";
  if (todayRes.length > 0) return "prenotato";
  return "libero";
}

const statusBg: Record<TableStatus, string> = {
  libero: "bg-emerald-500",
  prenotato: "bg-blue-500",
  occupato: "bg-red-500",
};
const statusBorder: Record<TableStatus, string> = {
  libero: "border-emerald-400",
  prenotato: "border-blue-400",
  occupato: "border-red-400",
};

interface TableShapeProps {
  table: Table;
  status: TableStatus;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragEnd: (posX: number, posY: number) => void;
  onResizeEnd: (w: number, h: number) => void;
}

function TableShape({
  table,
  status,
  onSelect,
  onEdit,
  onDelete,
  onDragEnd,
  onResizeEnd,
}: TableShapeProps) {
  const isDragging = useRef(false);
  const startPointer = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: table.posX, y: table.posY });
  const elemRef = useRef<HTMLDivElement>(null);
  const [draggingState, setDraggingState] = useState(false);
  const [hovered, setHovered] = useState(false);

  // Resize state - use backend values if available, else defaults
  const initialSize = {
    w: table.width > 0 ? table.width : table.shape === "round" ? 72 : 80,
    h: table.height > 0 ? table.height : table.shape === "round" ? 72 : 72,
  };
  const [tableSize, setTableSize] = useState(initialSize);
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const applyDrag = useCallback(
    (clientX: number, clientY: number) => {
      const dx = clientX - startPointer.current.x;
      const dy = clientY - startPointer.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        if (!isDragging.current) {
          isDragging.current = true;
          setDraggingState(true);
        }
      }
      if (!isDragging.current) return;
      const currentW = elemRef.current?.offsetWidth ?? tableSize.w;
      const currentH = elemRef.current?.offsetHeight ?? tableSize.h;
      const newX = Math.max(
        0,
        Math.min(CANVAS_W - currentW, startPos.current.x + dx),
      );
      const newY = Math.max(
        0,
        Math.min(CANVAS_H - currentH, startPos.current.y + dy),
      );
      currentPos.current = { x: newX, y: newY };
      if (elemRef.current) {
        elemRef.current.style.left = `${newX}px`;
        elemRef.current.style.top = `${newY}px`;
      }
    },
    [tableSize.w, tableSize.h],
  );

  const endDrag = useCallback(() => {
    setDraggingState(false);
    if (isDragging.current) {
      onDragEnd(currentPos.current.x, currentPos.current.y);
    } else {
      onSelect();
    }
    isDragging.current = false;
  }, [onDragEnd, onSelect]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = false;
      startPointer.current = { x: e.clientX, y: e.clientY };
      startPos.current = { x: table.posX, y: table.posY };
      currentPos.current = { x: table.posX, y: table.posY };

      const onMouseMove = (ev: MouseEvent) => applyDrag(ev.clientX, ev.clientY);
      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        endDrag();
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [table.posX, table.posY, applyDrag, endDrag],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      isDragging.current = false;
      startPointer.current = { x: touch.clientX, y: touch.clientY };
      startPos.current = { x: table.posX, y: table.posY };
      currentPos.current = { x: table.posX, y: table.posY };

      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        const t = ev.touches[0];
        applyDrag(t.clientX, t.clientY);
      };
      const onTouchEnd = () => {
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
        endDrag();
      };

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [table.posX, table.posY, applyDrag, endDrag],
  );

  // Resize handlers
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing.current = true;
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: tableSize.w,
        h: tableSize.h,
      };

      const onMouseMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const dx = ev.clientX - resizeStart.current.x;
        const dy = ev.clientY - resizeStart.current.y;
        if (table.shape === "round") {
          const delta = Math.max(dx, dy);
          const s = Math.max(
            MIN_SIZE,
            Math.min(MAX_SIZE, resizeStart.current.w + delta),
          );
          setTableSize({ w: s, h: s });
        } else {
          const newW = Math.max(
            MIN_SIZE,
            Math.min(MAX_SIZE, resizeStart.current.w + dx),
          );
          const newH = Math.max(
            MIN_SIZE,
            Math.min(MAX_SIZE, resizeStart.current.h + dy),
          );
          setTableSize({ w: newW, h: newH });
        }
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        isResizing.current = false;
        setTableSize((prev) => {
          onResizeEnd(prev.w, prev.h);
          return prev;
        });
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [table.shape, tableSize.w, tableSize.h, onResizeEnd],
  );

  const handleResizeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      isResizing.current = true;
      resizeStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        w: tableSize.w,
        h: tableSize.h,
      };

      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        if (!isResizing.current) return;
        const t = ev.touches[0];
        const dx = t.clientX - resizeStart.current.x;
        const dy = t.clientY - resizeStart.current.y;
        if (table.shape === "round") {
          const delta = Math.max(dx, dy);
          const s = Math.max(
            MIN_SIZE,
            Math.min(MAX_SIZE, resizeStart.current.w + delta),
          );
          setTableSize({ w: s, h: s });
        } else {
          const newW = Math.max(
            MIN_SIZE,
            Math.min(MAX_SIZE, resizeStart.current.w + dx),
          );
          const newH = Math.max(
            MIN_SIZE,
            Math.min(MAX_SIZE, resizeStart.current.h + dy),
          );
          setTableSize({ w: newW, h: newH });
        }
      };

      const onTouchEnd = () => {
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
        isResizing.current = false;
        setTableSize((prev) => {
          onResizeEnd(prev.w, prev.h);
          return prev;
        });
      };

      document.addEventListener("touchmove", onTouchMove, { passive: false });
      document.addEventListener("touchend", onTouchEnd);
    },
    [table.shape, tableSize.w, tableSize.h, onResizeEnd],
  );

  return (
    <div
      ref={elemRef}
      data-ocid="floorplan.canvas_target"
      className={cn(
        "table-shape absolute flex flex-col items-center justify-center gap-0.5 border-2 select-none transition-shadow group",
        table.shape === "round" ? "rounded-full" : "rounded-xl",
        statusBorder[status],
      )}
      style={{
        left: table.posX,
        top: table.posY,
        width: tableSize.w,
        height: tableSize.h,
        background: "oklch(0.97 0.01 65)",
        zIndex: draggingState ? 20 : hovered ? 10 : 1,
        cursor: draggingState ? "grabbing" : "grab",
        transform: draggingState ? "scale(1.05)" : "scale(1)",
        boxShadow: draggingState
          ? "0 12px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)"
          : undefined,
        transition: draggingState
          ? "box-shadow 0.15s ease, transform 0.1s ease"
          : "box-shadow 0.2s ease, transform 0.15s ease",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Options button - shown on hover */}
      <div
        className={cn(
          "absolute -top-2 -right-2 z-30 transition-opacity duration-150",
          hovered && !draggingState ? "opacity-100" : "opacity-0",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              data-ocid="floorplan.table.dropdown_menu"
              className="w-5 h-5 rounded-full bg-card border border-border shadow-md flex items-center justify-center hover:bg-muted"
              onMouseDown={(e) => {
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <MoreHorizontal className="w-3 h-3 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem
              data-ocid="floorplan.table.edit_button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Pencil className="w-3.5 h-3.5 mr-2" /> Modifica
            </DropdownMenuItem>
            <DropdownMenuItem
              data-ocid="floorplan.table.delete_button"
              className="text-destructive focus:text-destructive"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Resize handle - shown on hover at bottom-right */}
      <div
        data-ocid="floorplan.table.drag_handle"
        className={cn(
          "absolute bottom-0.5 right-0.5 z-30 transition-opacity duration-150",
          hovered && !draggingState ? "opacity-100" : "opacity-0",
        )}
        style={{ cursor: "nwse-resize" }}
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
        title="Ridimensiona tavolo"
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            background: "oklch(0.5 0.05 65 / 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            aria-label="Ridimensiona"
            role="img"
          >
            <circle cx="2" cy="6" r="1" fill="currentColor" opacity="0.7" />
            <circle cx="6" cy="6" r="1" fill="currentColor" opacity="0.7" />
            <circle cx="6" cy="2" r="1" fill="currentColor" opacity="0.7" />
          </svg>
        </div>
      </div>

      <span className={cn("w-2.5 h-2.5 rounded-full", statusBg[status])} />
      <span className="text-xs font-bold text-foreground leading-none">
        {table.tableLabel}
      </span>
      <span className="text-[10px] text-muted-foreground leading-none">
        {table.capacity.toString()}p
      </span>
    </div>
  );
}

type AddResForm = {
  customerName: string;
  date: string;
  time: string;
  partySize: string;
  notes: string;
};

function makeDefaultResForm(): AddResForm {
  return {
    customerName: "",
    date: new Date().toISOString().split("T")[0],
    time: "20:00",
    partySize: "2",
    notes: "",
  };
}

function RoomCanvas({
  room,
  reservations,
}: {
  room: Room;
  reservations: {
    tableId: bigint;
    customerName: string;
    date: string;
    time: string;
    partySize: bigint;
    status: string;
    notes: string;
  }[];
}) {
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newShape, setNewShape] = useState("square");
  const [newCapacity, setNewCapacity] = useState("4");
  const [editLabel, setEditLabel] = useState("");
  const [editShape, setEditShape] = useState("square");
  const [editCapacity, setEditCapacity] = useState("4");

  // New reservation state
  const [addResOpen, setAddResOpen] = useState(false);
  const [addResTable, setAddResTable] = useState<Table | null>(null);
  const [addResForm, setAddResForm] = useState<AddResForm>(makeDefaultResForm);

  const { data: tables = [], isLoading } = useTablesByRoom(room.id);
  const updateTable = useUpdateTable();
  const deleteTable = useDeleteTable();
  const createTable = useCreateTable();
  const createReservation = useCreateReservation();

  const handleDragEnd = useCallback(
    (table: Table, posX: number, posY: number) => {
      updateTable.mutate(
        {
          tableId: table.id,
          roomId: table.roomId,
          tableLabel: table.tableLabel,
          shape: table.shape,
          capacity: table.capacity,
          posX,
          posY,
          width: table.width > 0 ? table.width : 80,
          height: table.height > 0 ? table.height : 72,
        },
        { onError: () => toast.error("Errore nel salvare la posizione") },
      );
    },
    [updateTable],
  );

  const handleResizeEnd = useCallback(
    (table: Table, w: number, h: number) => {
      updateTable.mutate(
        {
          tableId: table.id,
          roomId: table.roomId,
          tableLabel: table.tableLabel,
          shape: table.shape,
          capacity: table.capacity,
          posX: table.posX,
          posY: table.posY,
          width: w,
          height: h,
        },
        { onError: () => toast.error("Errore nel salvare le dimensioni") },
      );
    },
    [updateTable],
  );

  const handleAddTable = () => {
    if (!newLabel.trim()) return;
    createTable.mutate(
      {
        roomId: room.id,
        tableLabel: newLabel.trim(),
        shape: newShape,
        capacity: BigInt(Number.parseInt(newCapacity) || 4),
        posX: 50 + Math.random() * 300,
        posY: 50 + Math.random() * 200,
        width: newShape === "round" ? 72 : 80,
        height: 72,
      },
      {
        onSuccess: () => {
          toast.success("Tavolo aggiunto");
          setAddTableOpen(false);
          setNewLabel("");
          setNewShape("square");
          setNewCapacity("4");
        },
        onError: () => toast.error("Errore nell'aggiunta del tavolo"),
      },
    );
  };

  const handleEditOpen = (table: Table) => {
    setTableToEdit(table);
    setEditLabel(table.tableLabel);
    setEditShape(table.shape);
    setEditCapacity(table.capacity.toString());
  };

  const handleEditSave = () => {
    if (!tableToEdit || !editLabel.trim()) return;
    updateTable.mutate(
      {
        tableId: tableToEdit.id,
        roomId: tableToEdit.roomId,
        tableLabel: editLabel.trim(),
        shape: editShape,
        capacity: BigInt(Number.parseInt(editCapacity) || 4),
        posX: tableToEdit.posX,
        posY: tableToEdit.posY,
        width: tableToEdit.width > 0 ? tableToEdit.width : 80,
        height: tableToEdit.height > 0 ? tableToEdit.height : 72,
      },
      {
        onSuccess: () => {
          toast.success("Tavolo aggiornato");
          setTableToEdit(null);
        },
        onError: () => toast.error("Errore nell'aggiornamento"),
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!tableToDelete) return;
    deleteTable.mutate(
      { tableId: tableToDelete.id, roomId: tableToDelete.roomId },
      {
        onSuccess: () => {
          toast.success("Tavolo eliminato");
          setTableToDelete(null);
        },
        onError: () => toast.error("Errore nell'eliminazione"),
      },
    );
  };

  const handleOpenNewReservation = (table: Table) => {
    setAddResTable(table);
    setAddResForm(makeDefaultResForm());
    setAddResOpen(true);
  };

  const handleAddReservation = () => {
    if (!addResTable || !addResForm.customerName.trim()) return;
    createReservation.mutate(
      {
        tableId: addResTable.id,
        customerName: addResForm.customerName.trim(),
        date: addResForm.date,
        time: addResForm.time,
        partySize: BigInt(Number.parseInt(addResForm.partySize) || 2),
        notes: addResForm.notes,
      },
      {
        onSuccess: () => {
          toast.success("Prenotazione creata");
          setAddResOpen(false);
          setAddResTable(null);
        },
        onError: () => toast.error("Errore nella creazione"),
      },
    );
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Libero
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Prenotato
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Occupato
            </span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground/80 italic">
              Clicca un tavolo per prenotare · Trascina l&apos;angolo per
              ridimensionare
            </span>
          </div>
          <Button
            data-ocid="floorplan.add_table.button"
            size="sm"
            onClick={() => setAddTableOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Aggiungi tavolo
          </Button>
        </div>

        {isLoading ? (
          <div
            data-ocid="floorplan.loading_state"
            className="floor-plan-canvas rounded-xl flex items-center justify-center"
            style={{ width: CANVAS_W, height: CANVAS_H }}
          >
            <div className="w-8 h-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : (
          <div
            className="floor-plan-canvas rounded-xl relative"
            style={{ width: CANVAS_W, height: CANVAS_H }}
            role="presentation"
          >
            {tables.length === 0 && (
              <div
                data-ocid="floorplan.canvas.empty_state"
                className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground"
              >
                <p className="font-display text-lg">Sala vuota</p>
                <p className="text-sm mt-1">
                  Aggiungi tavoli usando il pulsante in alto
                </p>
              </div>
            )}
            {tables.map((table) => (
              <TableShape
                key={table.id.toString()}
                table={table}
                status={getTableStatus(table.id, reservations)}
                onSelect={() => handleOpenNewReservation(table)}
                onEdit={() => handleEditOpen(table)}
                onDelete={() => setTableToDelete(table)}
                onDragEnd={(x, y) => handleDragEnd(table, x, y)}
                onResizeEnd={(w, h) => handleResizeEnd(table, w, h)}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Reservation Dialog */}
      <Dialog
        open={addResOpen}
        onOpenChange={(o) => !o && setAddResOpen(false)}
      >
        <DialogContent data-ocid="floorplan.new_reservation.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              Nuova Prenotazione
            </DialogTitle>
            {addResTable && (
              <p className="text-sm text-muted-foreground pt-1">
                Tavolo {addResTable.tableLabel}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Input
                data-ocid="floorplan.new_reservation.customer.input"
                placeholder="Nome del cliente"
                value={addResForm.customerName}
                onChange={(e) =>
                  setAddResForm((prev) => ({
                    ...prev,
                    customerName: e.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  data-ocid="floorplan.new_reservation.date.input"
                  type="date"
                  value={addResForm.date}
                  onChange={(e) =>
                    setAddResForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Ora</Label>
                <Input
                  data-ocid="floorplan.new_reservation.time.input"
                  type="time"
                  value={addResForm.time}
                  onChange={(e) =>
                    setAddResForm((prev) => ({ ...prev, time: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Coperti</Label>
              <Input
                data-ocid="floorplan.new_reservation.party.input"
                type="number"
                min="1"
                max="30"
                value={addResForm.partySize}
                onChange={(e) =>
                  setAddResForm((prev) => ({
                    ...prev,
                    partySize: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                data-ocid="floorplan.new_reservation.notes.textarea"
                placeholder="Note aggiuntive (opzionale)"
                value={addResForm.notes}
                onChange={(e) =>
                  setAddResForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="floorplan.new_reservation.cancel_button"
              variant="outline"
              onClick={() => setAddResOpen(false)}
            >
              Annulla
            </Button>
            <Button
              data-ocid="floorplan.new_reservation.submit_button"
              onClick={handleAddReservation}
              disabled={
                createReservation.isPending || !addResForm.customerName.trim()
              }
            >
              {createReservation.isPending ? "Salvataggio..." : "Prenota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addTableOpen} onOpenChange={setAddTableOpen}>
        <DialogContent data-ocid="floorplan.add_table.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Aggiungi Tavolo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Etichetta</Label>
              <Input
                data-ocid="floorplan.add_table.input"
                placeholder="es. A1, T5..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma</Label>
              <Select value={newShape} onValueChange={setNewShape}>
                <SelectTrigger data-ocid="floorplan.add_table.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Rettangolare</SelectItem>
                  <SelectItem value="round">Rotondo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coperti</Label>
              <Input
                data-ocid="floorplan.add_table.capacity.input"
                type="number"
                min="1"
                max="20"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="floorplan.add_table.cancel_button"
              variant="outline"
              onClick={() => setAddTableOpen(false)}
            >
              Annulla
            </Button>
            <Button
              data-ocid="floorplan.add_table.submit_button"
              onClick={handleAddTable}
              disabled={createTable.isPending || !newLabel.trim()}
            >
              {createTable.isPending ? "Aggiunta..." : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!tableToEdit}
        onOpenChange={(o) => !o && setTableToEdit(null)}
      >
        <DialogContent data-ocid="floorplan.edit_table.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Modifica Tavolo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Etichetta</Label>
              <Input
                data-ocid="floorplan.edit_table.input"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Forma</Label>
              <Select value={editShape} onValueChange={setEditShape}>
                <SelectTrigger data-ocid="floorplan.edit_table.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Rettangolare</SelectItem>
                  <SelectItem value="round">Rotondo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Coperti</Label>
              <Input
                data-ocid="floorplan.edit_table.capacity.input"
                type="number"
                min="1"
                max="20"
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              data-ocid="floorplan.edit_table.cancel_button"
              variant="outline"
              onClick={() => setTableToEdit(null)}
            >
              Annulla
            </Button>
            <Button
              data-ocid="floorplan.edit_table.save_button"
              onClick={handleEditSave}
              disabled={updateTable.isPending || !editLabel.trim()}
            >
              {updateTable.isPending ? "Salvataggio..." : "Salva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!tableToDelete}
        onOpenChange={(o) => !o && setTableToDelete(null)}
      >
        <AlertDialogContent data-ocid="floorplan.delete_table.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Tavolo</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare il tavolo{" "}
              <strong>{tableToDelete?.tableLabel}</strong>? Questa azione non
              può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="floorplan.delete_table.cancel_button">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="floorplan.delete_table.confirm_button"
              onClick={handleDeleteConfirm}
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

export default function FloorPlanPage() {
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: reservations = [] } = useAllReservations();
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId | null>(null);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [editRoomOpen, setEditRoomOpen] = useState(false);
  const [deleteRoomOpen, setDeleteRoomOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [editRoomName, setEditRoomName] = useState("");

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();

  const currentRoomId = selectedRoomId ?? rooms[0]?.id ?? null;
  const currentRoom = rooms.find((r) => r.id === currentRoomId) ?? null;

  const handleAddRoom = () => {
    if (!newRoomName.trim()) return;
    createRoom.mutate(newRoomName.trim(), {
      onSuccess: (id) => {
        toast.success("Sala creata");
        setSelectedRoomId(id);
        setAddRoomOpen(false);
        setNewRoomName("");
      },
      onError: () => toast.error("Errore nella creazione della sala"),
    });
  };

  const handleEditRoom = () => {
    if (!currentRoom || !editRoomName.trim()) return;
    updateRoom.mutate(
      { roomId: currentRoom.id, name: editRoomName.trim() },
      {
        onSuccess: () => {
          toast.success("Sala rinominata");
          setEditRoomOpen(false);
        },
        onError: () => toast.error("Errore nella modifica della sala"),
      },
    );
  };

  const handleDeleteRoom = () => {
    if (!currentRoom) return;
    deleteRoom.mutate(currentRoom.id, {
      onSuccess: () => {
        toast.success("Sala eliminata");
        setSelectedRoomId(null);
        setDeleteRoomOpen(false);
      },
      onError: () => toast.error("Errore nell'eliminazione della sala"),
    });
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card shrink-0">
        <h1 className="font-display text-2xl font-bold mr-4">Piantina</h1>
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {roomsLoading ? (
            <div className="flex gap-2">
              {["sk1", "sk2", "sk3"].map((k) => (
                <Skeleton key={k} className="h-8 w-24" />
              ))}
            </div>
          ) : (
            rooms.map((room) => (
              <button
                type="button"
                key={room.id.toString()}
                data-ocid="floorplan.room.tab"
                onClick={() => setSelectedRoomId(room.id)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  currentRoomId === room.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {room.name}
              </button>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {currentRoom && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  data-ocid="floorplan.room.dropdown_menu"
                  variant="outline"
                  size="sm"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  data-ocid="floorplan.room.edit_button"
                  onClick={() => {
                    setEditRoomName(currentRoom.name);
                    setEditRoomOpen(true);
                  }}
                >
                  <Pencil className="w-4 h-4 mr-2" /> Rinomina sala
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-ocid="floorplan.room.delete_button"
                  className="text-destructive"
                  onClick={() => setDeleteRoomOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Elimina sala
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            data-ocid="floorplan.add_room.button"
            size="sm"
            variant="outline"
            onClick={() => setAddRoomOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Sala
          </Button>
        </div>
      </div>

      {!currentRoom ? (
        <div
          data-ocid="floorplan.empty_state"
          className="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Nessuna sala</h2>
          <p className="text-muted-foreground mb-6">
            Crea la prima sala per iniziare a disegnare la piantina
          </p>
          <Button
            data-ocid="floorplan.create_first_room.button"
            onClick={() => setAddRoomOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Aggiungi prima sala
          </Button>
        </div>
      ) : (
        <RoomCanvas room={currentRoom} reservations={reservations} />
      )}

      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent data-ocid="floorplan.add_room.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Aggiungi Sala</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-2 block">Nome sala</Label>
            <Input
              data-ocid="floorplan.add_room.input"
              placeholder="es. Sala principale, Terrazza..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddRoom()}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="floorplan.add_room.cancel_button"
              variant="outline"
              onClick={() => setAddRoomOpen(false)}
            >
              Annulla
            </Button>
            <Button
              data-ocid="floorplan.add_room.submit_button"
              onClick={handleAddRoom}
              disabled={createRoom.isPending || !newRoomName.trim()}
            >
              {createRoom.isPending ? "Creazione..." : "Crea sala"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editRoomOpen} onOpenChange={setEditRoomOpen}>
        <DialogContent data-ocid="floorplan.edit_room.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Rinomina Sala</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-2 block">Nuovo nome</Label>
            <Input
              data-ocid="floorplan.edit_room.input"
              value={editRoomName}
              onChange={(e) => setEditRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEditRoom()}
            />
          </div>
          <DialogFooter>
            <Button
              data-ocid="floorplan.edit_room.cancel_button"
              variant="outline"
              onClick={() => setEditRoomOpen(false)}
            >
              Annulla
            </Button>
            <Button
              data-ocid="floorplan.edit_room.save_button"
              onClick={handleEditRoom}
              disabled={updateRoom.isPending || !editRoomName.trim()}
            >
              Rinomina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteRoomOpen} onOpenChange={setDeleteRoomOpen}>
        <AlertDialogContent data-ocid="floorplan.delete_room.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Sala</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la sala{" "}
              <strong>{currentRoom?.name}</strong>? Tutti i tavoli verranno
              eliminati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="floorplan.delete_room.cancel_button">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="floorplan.delete_room.confirm_button"
              onClick={handleDeleteRoom}
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
