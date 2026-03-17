import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MenuItem {
    id: MenuItemId;
    name: string;
    description: string;
    available: boolean;
    category: string;
    price: number;
}
export type MenuItemId = bigint;
export interface Table {
    id: TableId;
    height: number;
    posX: number;
    posY: number;
    shape: string;
    capacity: bigint;
    roomId: RoomId;
    width: number;
    tableLabel: string;
}
export type RoomId = bigint;
export interface Room {
    id: RoomId;
    name: string;
}
export type TableId = bigint;
export type ReservationId = bigint;
export interface Reservation {
    id: ReservationId;
    customerName: string;
    status: string;
    date: string;
    time: string;
    tableId: TableId;
    notes: string;
    partySize: bigint;
}
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
export type OrderId = bigint;
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMenuItem(name: string, description: string, price: number, category: string, available: boolean): Promise<MenuItemId>;
    createReservation(tableId: TableId, customerName: string, date: string, time: string, partySize: bigint, notes: string): Promise<ReservationId>;
    createRoom(name: string): Promise<RoomId>;
    createTable(roomId: RoomId, tableLabel: string, shape: string, capacity: bigint, posX: number, posY: number, width: number, height: number): Promise<TableId>;
    deleteMenuItem(menuItemId: MenuItemId): Promise<void>;
    deleteReservation(reservationId: ReservationId): Promise<void>;
    deleteRoom(roomId: RoomId): Promise<void>;
    deleteTable(tableId: TableId): Promise<void>;
    getAllMenuItems(): Promise<Array<MenuItem>>;
    getAllReservations(): Promise<Array<Reservation>>;
    getAllRooms(): Promise<Array<Room>>;
    getAllTables(): Promise<Array<Table>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMenuItem(menuItemId: MenuItemId): Promise<MenuItem | null>;
    getMenuItemsByCategory(category: string): Promise<Array<MenuItem>>;
    getReservation(reservationId: ReservationId): Promise<Reservation | null>;
    getReservationsByDate(date: string): Promise<Array<Reservation>>;
    getReservationsByTable(tableId: TableId): Promise<Array<Reservation>>;
    getRoom(roomId: RoomId): Promise<Room | null>;
    getTable(tableId: TableId): Promise<Table | null>;
    getTablesByRoom(roomId: RoomId): Promise<Array<Table>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMenuItem(id: MenuItemId, name: string, description: string, price: number, category: string, available: boolean): Promise<void>;
    updateReservation(reservationId: ReservationId, tableId: TableId, customerName: string, date: string, time: string, partySize: bigint, notes: string, status: string): Promise<void>;
    updateRoom(roomId: RoomId, name: string): Promise<void>;
    updateTable(tableId: TableId, roomId: RoomId, tableLabel: string, shape: string, capacity: bigint, posX: number, posY: number, width: number, height: number): Promise<void>;
    createOrder(tableId: bigint): Promise<bigint>;
    addItemToOrder(orderId: bigint, menuItemId: bigint, quantity: bigint, notes: string): Promise<void>;
    removeItemFromOrder(orderId: bigint, menuItemId: bigint): Promise<void>;
    closeOrder(orderId: bigint): Promise<void>;
    reopenOrder(orderId: bigint): Promise<void>;
    deleteOrder(orderId: bigint): Promise<void>;
    getOrder(orderId: bigint): Promise<Order | null>;
    getAllOrders(): Promise<Array<Order>>;
    getOpenOrders(): Promise<Array<Order>>;
    getOrdersByTable(tableId: bigint): Promise<Array<Order>>;
    getOpenOrderByTable(tableId: bigint): Promise<Order | null>;
}
