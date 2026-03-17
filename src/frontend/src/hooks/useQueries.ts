import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MenuItem,
  MenuItemId,
  Reservation,
  ReservationId,
  Room,
  RoomId,
  Table,
  TableId,
} from "../backend.d";
import { useActor } from "./useActor";

export interface OrderItem {
  menuItemId: bigint;
  quantity: bigint;
  notes: string;
}

export interface Order {
  id: bigint;
  tableId: bigint;
  items: OrderItem[];
  status: string;
  createdAt: bigint;
}

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

export function useAllTables() {
  const { actor, isFetching } = useActor();
  return useQuery<Table[]>({
    queryKey: ["allTables"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllTables();
    },
    enabled: !!actor && !isFetching,
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

export function useAllMenuItems() {
  const { actor, isFetching } = useActor();
  return useQuery<MenuItem[]>({
    queryKey: ["menuItems"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMenuItems();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOpenOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["openOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getOpenOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOpenOrderByTable(tableId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Order | null>({
    queryKey: ["openOrder", tableId?.toString()],
    queryFn: async () => {
      if (!actor || tableId === null) return null;
      return (actor as any).getOpenOrderByTable(tableId);
    },
    enabled: !!actor && !isFetching && tableId !== null,
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
      width: number;
      height: number;
    }) =>
      actor!.createTable(
        t.roomId,
        t.tableLabel,
        t.shape,
        t.capacity,
        t.posX,
        t.posY,
        t.width,
        t.height,
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
      width: number;
      height: number;
    }) =>
      actor!.updateTable(
        t.tableId,
        t.roomId,
        t.tableLabel,
        t.shape,
        t.capacity,
        t.posX,
        t.posY,
        t.width,
        t.height,
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

export function useCreateMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: {
      name: string;
      description: string;
      price: number;
      category: string;
      available: boolean;
    }) =>
      actor!.createMenuItem(
        m.name,
        m.description,
        m.price,
        m.category,
        m.available,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });
}

export function useUpdateMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: {
      id: MenuItemId;
      name: string;
      description: string;
      price: number;
      category: string;
      available: boolean;
    }) =>
      actor!.updateMenuItem(
        m.id,
        m.name,
        m.description,
        m.price,
        m.category,
        m.available,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });
}

export function useDeleteMenuItem() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: MenuItemId) => actor!.deleteMenuItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tableId: bigint) => (actor as any).createOrder(tableId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openOrders"] });
      qc.invalidateQueries({ queryKey: ["openOrder"] });
    },
  });
}

export function useAddItemToOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      menuItemId,
      quantity,
      notes,
    }: {
      orderId: bigint;
      menuItemId: bigint;
      quantity: bigint;
      notes: string;
    }) => (actor as any).addItemToOrder(orderId, menuItemId, quantity, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openOrders"] });
      qc.invalidateQueries({ queryKey: ["openOrder"] });
    },
  });
}

export function useRemoveItemFromOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      menuItemId,
    }: {
      orderId: bigint;
      menuItemId: bigint;
    }) => (actor as any).removeItemFromOrder(orderId, menuItemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openOrders"] });
      qc.invalidateQueries({ queryKey: ["openOrder"] });
    },
  });
}

export function useCloseOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: bigint) => (actor as any).closeOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openOrders"] });
      qc.invalidateQueries({ queryKey: ["openOrder"] });
    },
  });
}

export function useReopenOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: bigint) => (actor as any).reopenOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openOrders"] });
      qc.invalidateQueries({ queryKey: ["openOrder"] });
    },
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: bigint) => (actor as any).deleteOrder(orderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["openOrders"] });
      qc.invalidateQueries({ queryKey: ["openOrder"] });
    },
  });
}
