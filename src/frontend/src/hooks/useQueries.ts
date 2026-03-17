import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Reservation,
  ReservationId,
  Room,
  RoomId,
  Table,
  TableId,
} from "../backend.d";
import { useActor } from "./useActor";

export function useRooms() {
  const { actor, isFetching } = useActor();
  return useQuery<Room[]>({
    queryKey: ["rooms"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRooms();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTablesByRoom(roomId: RoomId | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Table[]>({
    queryKey: ["tables", roomId?.toString()],
    queryFn: async () => {
      if (!actor || roomId === null) return [];
      return actor.getTablesByRoom(roomId);
    },
    enabled: !!actor && !isFetching && roomId !== null,
  });
}

export function useAllReservations() {
  const { actor, isFetching } = useActor();
  return useQuery<Reservation[]>({
    queryKey: ["reservations"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReservations();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRoom() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => actor!.createRoom(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useUpdateRoom() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, name }: { roomId: RoomId; name: string }) =>
      actor!.updateRoom(roomId, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useDeleteRoom() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: RoomId) => actor!.deleteRoom(roomId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rooms"] }),
  });
}

export function useCreateTable() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: {
      roomId: RoomId;
      tableLabel: string;
      shape: string;
      capacity: bigint;
      posX: number;
      posY: number;
    }) =>
      actor!.createTable(
        t.roomId,
        t.tableLabel,
        t.shape,
        t.capacity,
        t.posX,
        t.posY,
      ),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["tables", vars.roomId.toString()] }),
  });
}

export function useUpdateTable() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (t: {
      tableId: TableId;
      roomId: RoomId;
      tableLabel: string;
      shape: string;
      capacity: bigint;
      posX: number;
      posY: number;
    }) =>
      actor!.updateTable(
        t.tableId,
        t.roomId,
        t.tableLabel,
        t.shape,
        t.capacity,
        t.posX,
        t.posY,
      ),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["tables", vars.roomId.toString()] }),
  });
}

export function useDeleteTable() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId }: { tableId: TableId; roomId: RoomId }) =>
      actor!.deleteTable(tableId),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["tables", vars.roomId.toString()] }),
  });
}

export function useCreateReservation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: {
      tableId: TableId;
      customerName: string;
      date: string;
      time: string;
      partySize: bigint;
      notes: string;
    }) =>
      actor!.createReservation(
        r.tableId,
        r.customerName,
        r.date,
        r.time,
        r.partySize,
        r.notes,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useUpdateReservation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (r: {
      reservationId: ReservationId;
      tableId: TableId;
      customerName: string;
      date: string;
      time: string;
      partySize: bigint;
      notes: string;
      status: string;
    }) =>
      actor!.updateReservation(
        r.reservationId,
        r.tableId,
        r.customerName,
        r.date,
        r.time,
        r.partySize,
        r.notes,
        r.status,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useDeleteReservation() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reservationId: ReservationId) =>
      actor!.deleteReservation(reservationId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
