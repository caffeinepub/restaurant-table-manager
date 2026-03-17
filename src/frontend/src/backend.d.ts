import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Table {
    id: TableId;
    posX: number;
    posY: number;
    shape: string;
    capacity: bigint;
    roomId: RoomId;
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
    createReservation(tableId: TableId, customerName: string, date: string, time: string, partySize: bigint, notes: string): Promise<ReservationId>;
    createRoom(name: string): Promise<RoomId>;
    createTable(roomId: RoomId, tableLabel: string, shape: string, capacity: bigint, posX: number, posY: number): Promise<TableId>;
    deleteReservation(reservationId: ReservationId): Promise<void>;
    deleteRoom(roomId: RoomId): Promise<void>;
    deleteTable(tableId: TableId): Promise<void>;
    getAllReservations(): Promise<Array<Reservation>>;
    getAllRooms(): Promise<Array<Room>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getReservation(reservationId: ReservationId): Promise<Reservation | null>;
    getReservationsByDate(date: string): Promise<Array<Reservation>>;
    getReservationsByTable(tableId: TableId): Promise<Array<Reservation>>;
    getRoom(roomId: RoomId): Promise<Room | null>;
    getTable(tableId: TableId): Promise<Table | null>;
    getTablesByRoom(roomId: RoomId): Promise<Array<Table>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateReservation(reservationId: ReservationId, tableId: TableId, customerName: string, date: string, time: string, partySize: bigint, notes: string, status: string): Promise<void>;
    updateRoom(roomId: RoomId, name: string): Promise<void>;
    updateTable(tableId: TableId, roomId: RoomId, tableLabel: string, shape: string, capacity: bigint, posX: number, posY: number): Promise<void>;
}
