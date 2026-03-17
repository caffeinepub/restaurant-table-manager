import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, ChefHat, Clock, Users } from "lucide-react";
import type { Reservation, Room, Table } from "../backend.d";
import {
  useAllReservations,
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

function RoomSection({
  room,
  reservations,
}: { room: Room; reservations: Reservation[] }) {
  const { data: tables = [], isLoading } = useTablesByRoom(room.id);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {["s1", "s2", "s3", "s4", "s5"].map((k) => (
          <Skeleton key={k} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div
        data-ocid="today.empty_state"
        className="py-8 text-center text-muted-foreground text-sm"
      >
        Nessun tavolo in questa sala
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {tables.map((table, idx) => {
        const status = getTableStatus(table, reservations);
        const nextRes = getNextReservation(table, reservations);
        const cfg = statusConfig[status];
        return (
          <Card
            key={table.id.toString()}
            data-ocid={`today.table.item.${idx + 1}`}
            className="overflow-hidden border-border hover:shadow-warm transition-shadow"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 flex items-center justify-center text-sm font-bold text-foreground/80 ${table.shape === "round" ? "rounded-full" : "rounded-md"} bg-secondary`}
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function TodayPage() {
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: reservations = [], isLoading: resLoading } =
    useAllReservations();

  const todayFormatted = new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const todayReservations = reservations.filter(
    (r) => r.date === today && r.status !== "cancelled",
  );
  const seatedCount = todayReservations.filter(
    (r) => r.status === "seated",
  ).length;
  const pendingCount = todayReservations.filter(
    (r) => r.status === "pending" || r.status === "confirmed",
  ).length;

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground capitalize">
          {todayFormatted}
        </p>
        <h1 className="font-display text-4xl font-bold">Panoramica di Oggi</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Prenotazioni oggi",
            value: todayReservations.length,
            icon: CalendarDays,
            color: "text-primary",
          },
          {
            label: "Tavoli occupati",
            value: seatedCount,
            icon: Users,
            color: "text-red-600",
          },
          {
            label: "In attesa",
            value: pendingCount,
            icon: Clock,
            color: "text-blue-600",
          },
          {
            label: "Sale attive",
            value: rooms.length,
            icon: ChefHat,
            color: "text-accent",
          },
        ].map((s, i) => (
          <Card
            key={s.label}
            data-ocid={`today.stat.card.${i + 1}`}
            className="border-border"
          >
            <CardContent className="p-5 flex items-center gap-4">
              <s.icon className={`w-8 h-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold font-display">
                  {resLoading || roomsLoading ? "—" : s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {roomsLoading ? (
        <div data-ocid="today.loading_state" className="space-y-8">
          {["r1", "r2"].map((k) => (
            <div key={k}>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-4 gap-4">
                {["c1", "c2", "c3", "c4"].map((k) => (
                  <Skeleton key={k} className="h-36" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div data-ocid="today.empty_state" className="text-center py-16">
          <ChefHat className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-display text-xl text-muted-foreground">
            Nessuna sala configurata
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Vai in Piantina per aggiungere sale e tavoli
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {rooms.map((room) => (
            <section key={room.id.toString()}>
              <h2 className="font-display text-2xl font-semibold mb-5">
                {room.name}
              </h2>
              <RoomSection room={room} reservations={reservations} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
