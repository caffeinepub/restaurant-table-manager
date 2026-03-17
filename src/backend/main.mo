import Map "mo:core/Map";
import Array "mo:core/Array";
import Float "mo:core/Float";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Type definitions
  public type RoomId = Nat;
  public type TableId = Nat;
  public type ReservationId = Nat;

  public type Room = {
    id : RoomId;
    name : Text;
  };

  public type Table = {
    id : TableId;
    roomId : RoomId;
    tableLabel : Text;
    shape : Text; // "round" or "square"
    capacity : Nat;
    posX : Float;
    posY : Float;
  };

  public type Reservation = {
    id : ReservationId;
    tableId : TableId;
    customerName : Text;
    date : Text; // "YYYY-MM-DD"
    time : Text; // "HH:MM"
    partySize : Nat;
    notes : Text;
    status : Text; // "pending", "confirmed", "cancelled", "seated"
  };

  public type UserProfile = {
    name : Text;
  };

  // State
  let rooms = Map.empty<RoomId, Room>();
  let tables = Map.empty<TableId, Table>();
  let reservations = Map.empty<ReservationId, Reservation>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  var nextRoomId = 1;
  var nextTableId = 1;
  var nextReservationId = 1;

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized") };
    userProfiles.add(caller, profile);
  };

  // Room Functions
  public shared ({ caller }) func createRoom(name : Text) : async RoomId {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    let roomId = nextRoomId;
    let room : Room = {
      id = roomId;
      name;
    };
    rooms.add(roomId, room);
    nextRoomId += 1;
    roomId;
  };

  public shared ({ caller }) func updateRoom(roomId : RoomId, name : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not rooms.containsKey(roomId)) {
      Runtime.trap("Room does not exist");
    };
    let room : Room = {
      id = roomId;
      name;
    };
    rooms.add(roomId, room);
  };

  public shared ({ caller }) func deleteRoom(roomId : RoomId) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not rooms.containsKey(roomId)) {
      Runtime.trap("Room does not exist");
    };
    rooms.remove(roomId);
  };

  public query ({ caller }) func getRoom(roomId : RoomId) : async ?Room {
    rooms.get(roomId);
  };

  public query ({ caller }) func getAllRooms() : async [Room] {
    rooms.values().toArray();
  };

  // Table Functions
  public shared ({ caller }) func createTable(roomId : RoomId, tableLabel : Text, shape : Text, capacity : Nat, posX : Float, posY : Float) : async TableId {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not rooms.containsKey(roomId)) { Runtime.trap("Room does not exist") };

    let tableId = nextTableId;
    let table : Table = {
      id = tableId;
      roomId;
      tableLabel;
      shape;
      capacity;
      posX;
      posY;
    };
    tables.add(tableId, table);
    nextTableId += 1;
    tableId;
  };

  public shared ({ caller }) func updateTable(tableId : TableId, roomId : RoomId, tableLabel : Text, shape : Text, capacity : Nat, posX : Float, posY : Float) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not tables.containsKey(tableId)) {
      Runtime.trap("Table does not exist");
    };
    if (not rooms.containsKey(roomId)) {
      Runtime.trap("Room does not exist");
    };
    let table : Table = {
      id = tableId;
      roomId;
      tableLabel;
      shape;
      capacity;
      posX;
      posY;
    };
    tables.add(tableId, table);
  };

  public shared ({ caller }) func deleteTable(tableId : TableId) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not tables.containsKey(tableId)) {
      Runtime.trap("Table does not exist");
    };
    tables.remove(tableId);
  };

  public query ({ caller }) func getTable(tableId : TableId) : async ?Table {
    tables.get(tableId);
  };

  public query ({ caller }) func getTablesByRoom(roomId : RoomId) : async [Table] {
    tables.values().toArray().filter(func(table) { table.roomId == roomId });
  };

  // Reservation Functions
  public shared ({ caller }) func createReservation(tableId : TableId, customerName : Text, date : Text, time : Text, partySize : Nat, notes : Text) : async ReservationId {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not tables.containsKey(tableId)) { Runtime.trap("Table does not exist") };

    let reservationId = nextReservationId;
    let reservation : Reservation = {
      id = reservationId;
      tableId;
      customerName;
      date;
      time;
      partySize;
      notes;
      status = "pending";
    };
    reservations.add(reservationId, reservation);
    nextReservationId += 1;
    reservationId;
  };

  public shared ({ caller }) func updateReservation(reservationId : ReservationId, tableId : TableId, customerName : Text, date : Text, time : Text, partySize : Nat, notes : Text, status : Text) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not reservations.containsKey(reservationId)) {
      Runtime.trap("Reservation does not exist");
    };
    if (not tables.containsKey(tableId)) {
      Runtime.trap("Table does not exist");
    };
    let reservation : Reservation = {
      id = reservationId;
      tableId;
      customerName;
      date;
      time;
      partySize;
      notes;
      status;
    };
    reservations.add(reservationId, reservation);
  };

  public shared ({ caller }) func deleteReservation(reservationId : ReservationId) : async () {
    if (caller.isAnonymous()) { Runtime.trap("Unauthorized: Login required") };
    if (not reservations.containsKey(reservationId)) {
      Runtime.trap("Reservation does not exist");
    };
    reservations.remove(reservationId);
  };

  public query ({ caller }) func getReservation(reservationId : ReservationId) : async ?Reservation {
    reservations.get(reservationId);
  };

  public query ({ caller }) func getAllReservations() : async [Reservation] {
    reservations.values().toArray();
  };

  public query ({ caller }) func getReservationsByDate(date : Text) : async [Reservation] {
    reservations.values().toArray().filter(
      func(reservation) { reservation.date == date }
    );
  };

  public query ({ caller }) func getReservationsByTable(tableId : TableId) : async [Reservation] {
    reservations.values().toArray().filter(
      func(reservation) { reservation.tableId == tableId }
    );
  };
};
