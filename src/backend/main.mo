import Array "mo:core/Array";
import Map "mo:core/Map";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Type definitions
  public type RoomId = Nat;
  public type TableId = Nat;
  public type ReservationId = Nat;
  public type MenuItemId = Nat;
  public type OrderId = Nat;

  public type Room = {
    id : RoomId;
    name : Text;
  };

  public type Table = {
    id : TableId;
    roomId : RoomId;
    tableLabel : Text;
    shape : Text;
    capacity : Nat;
    posX : Float;
    posY : Float;
    width : Float;
    height : Float;
  };

  public type Reservation = {
    id : ReservationId;
    tableId : TableId;
    customerName : Text;
    date : Text;
    time : Text;
    partySize : Nat;
    notes : Text;
    status : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  public type MenuItem = {
    id : MenuItemId;
    name : Text;
    description : Text;
    price : Float;
    category : Text;
    available : Bool;
  };

  public type OrderItem = {
    menuItemId : MenuItemId;
    quantity : Nat;
    notes : Text;
  };

  public type Order = {
    id : OrderId;
    tableId : TableId;
    items : [OrderItem];
    status : Text; // "aperta" or "chiusa"
    createdAt : Int;
  };

  // Persistent stable storage
  stable var stableRooms : [(RoomId, Room)] = [];
  stable var stableTables : [(TableId, Table)] = [];
  stable var stableReservations : [(ReservationId, Reservation)] = [];
  stable var stableUserProfiles : [(Principal, UserProfile)] = [];
  stable var stableMenuItems : [(MenuItemId, MenuItem)] = [];
  stable var stableOrders : [(OrderId, Order)] = [];
  stable var nextRoomId = 1;
  stable var nextTableId = 1;
  stable var nextReservationId = 1;
  stable var nextMenuItemId = 1;
  stable var nextOrderId = 1;

  // Working state
  var rooms = Map.empty<RoomId, Room>();
  var tables = Map.empty<TableId, Table>();
  var reservations = Map.empty<ReservationId, Reservation>();
  var userProfiles = Map.empty<Principal, UserProfile>();
  var menuItems = Map.empty<MenuItemId, MenuItem>();
  var orders = Map.empty<OrderId, Order>();

  system func postupgrade() {
    for ((k, v) in stableRooms.vals()) { rooms.add(k, v) };
    stableRooms := [];
    for ((k, v) in stableTables.vals()) { tables.add(k, v) };
    stableTables := [];
    for ((k, v) in stableReservations.vals()) { reservations.add(k, v) };
    stableReservations := [];
    for ((k, v) in stableUserProfiles.vals()) { userProfiles.add(k, v) };
    stableUserProfiles := [];
    for ((k, v) in stableMenuItems.vals()) { menuItems.add(k, v) };
    stableMenuItems := [];
    for ((k, v) in stableOrders.vals()) { orders.add(k, v) };
    stableOrders := [];
  };

  system func preupgrade() {
    stableRooms := rooms.entries().toArray();
    stableTables := tables.entries().toArray();
    stableReservations := reservations.entries().toArray();
    stableUserProfiles := userProfiles.entries().toArray();
    stableMenuItems := menuItems.entries().toArray();
    stableOrders := orders.entries().toArray();
  };

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  // Room Functions
  public shared ({ caller }) func createRoom(name : Text) : async RoomId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let roomId = nextRoomId;
    rooms.add(roomId, { id = roomId; name });
    nextRoomId += 1;
    roomId;
  };

  public shared ({ caller }) func updateRoom(roomId : RoomId, name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not rooms.containsKey(roomId)) { Runtime.trap("Room does not exist") };
    rooms.add(roomId, { id = roomId; name });
  };

  public shared ({ caller }) func deleteRoom(roomId : RoomId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not rooms.containsKey(roomId)) { Runtime.trap("Room does not exist") };
    rooms.remove(roomId);
  };

  public query func getRoom(roomId : RoomId) : async ?Room {
    rooms.get(roomId);
  };

  public query func getAllRooms() : async [Room] {
    rooms.values().toArray();
  };

  // Table Functions
  public shared ({ caller }) func createTable(
    roomId : RoomId,
    tableLabel : Text,
    shape : Text,
    capacity : Nat,
    posX : Float,
    posY : Float,
    width : Float,
    height : Float,
  ) : async TableId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not rooms.containsKey(roomId)) { Runtime.trap("Room does not exist") };
    let tableId = nextTableId;
    tables.add(tableId, { id = tableId; roomId; tableLabel; shape; capacity; posX; posY; width; height });
    nextTableId += 1;
    tableId;
  };

  public shared ({ caller }) func updateTable(
    tableId : TableId,
    roomId : RoomId,
    tableLabel : Text,
    shape : Text,
    capacity : Nat,
    posX : Float,
    posY : Float,
    width : Float,
    height : Float,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not tables.containsKey(tableId)) { Runtime.trap("Table does not exist") };
    if (not rooms.containsKey(roomId)) { Runtime.trap("Room does not exist") };
    tables.add(tableId, { id = tableId; roomId; tableLabel; shape; capacity; posX; posY; width; height });
  };

  public shared ({ caller }) func deleteTable(tableId : TableId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not tables.containsKey(tableId)) { Runtime.trap("Table does not exist") };
    tables.remove(tableId);
  };

  public query func getTable(tableId : TableId) : async ?Table {
    tables.get(tableId);
  };

  public query func getAllTables() : async [Table] {
    tables.values().toArray();
  };

  public query func getTablesByRoom(roomId : RoomId) : async [Table] {
    tables.values().toArray().filter(func(t) { t.roomId == roomId });
  };

  // Reservation Functions
  public shared ({ caller }) func createReservation(
    tableId : TableId,
    customerName : Text,
    date : Text,
    time : Text,
    partySize : Nat,
    notes : Text,
  ) : async ReservationId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not tables.containsKey(tableId)) { Runtime.trap("Table does not exist") };
    let reservationId = nextReservationId;
    reservations.add(reservationId, { id = reservationId; tableId; customerName; date; time; partySize; notes; status = "pending" });
    nextReservationId += 1;
    reservationId;
  };

  public shared ({ caller }) func updateReservation(
    reservationId : ReservationId,
    tableId : TableId,
    customerName : Text,
    date : Text,
    time : Text,
    partySize : Nat,
    notes : Text,
    status : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not reservations.containsKey(reservationId)) { Runtime.trap("Reservation does not exist") };
    if (not tables.containsKey(tableId)) { Runtime.trap("Table does not exist") };
    reservations.add(reservationId, { id = reservationId; tableId; customerName; date; time; partySize; notes; status });
  };

  public shared ({ caller }) func deleteReservation(reservationId : ReservationId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not reservations.containsKey(reservationId)) { Runtime.trap("Reservation does not exist") };
    reservations.remove(reservationId);
  };

  public query func getReservation(reservationId : ReservationId) : async ?Reservation {
    reservations.get(reservationId);
  };

  public query func getAllReservations() : async [Reservation] {
    reservations.values().toArray();
  };

  public query func getReservationsByDate(date : Text) : async [Reservation] {
    reservations.values().toArray().filter(func(r) { r.date == date });
  };

  public query func getReservationsByTable(tableId : TableId) : async [Reservation] {
    reservations.values().toArray().filter(func(r) { r.tableId == tableId });
  };

  // Menu Functions
  public shared ({ caller }) func createMenuItem(
    name : Text,
    description : Text,
    price : Float,
    category : Text,
    available : Bool,
  ) : async MenuItemId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    let menuItemId = nextMenuItemId;
    menuItems.add(menuItemId, { id = menuItemId; name; description; price; category; available });
    nextMenuItemId += 1;
    menuItemId;
  };

  public shared ({ caller }) func updateMenuItem(
    id : MenuItemId,
    name : Text,
    description : Text,
    price : Float,
    category : Text,
    available : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not menuItems.containsKey(id)) { Runtime.trap("Menu item does not exist") };
    menuItems.add(id, { id; name; description; price; category; available });
  };

  public shared ({ caller }) func deleteMenuItem(menuItemId : MenuItemId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not menuItems.containsKey(menuItemId)) { Runtime.trap("Menu item does not exist") };
    menuItems.remove(menuItemId);
  };

  public query func getMenuItem(menuItemId : MenuItemId) : async ?MenuItem {
    menuItems.get(menuItemId);
  };

  public query func getAllMenuItems() : async [MenuItem] {
    menuItems.values().toArray();
  };

  public query func getMenuItemsByCategory(category : Text) : async [MenuItem] {
    menuItems.values().toArray().filter(func(m) { Text.equal(m.category, category) });
  };

  // Order Functions
  public shared ({ caller }) func createOrder(tableId : TableId) : async OrderId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not tables.containsKey(tableId)) { Runtime.trap("Table does not exist") };
    let orderId = nextOrderId;
    orders.add(orderId, { id = orderId; tableId; items = []; status = "aperta"; createdAt = 0 });
    nextOrderId += 1;
    orderId;
  };

  public shared ({ caller }) func addItemToOrder(
    orderId : OrderId,
    menuItemId : MenuItemId,
    quantity : Nat,
    notes : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (orders.get(orderId)) {
      case null { Runtime.trap("Order does not exist") };
      case (?order) {
        if (Text.equal(order.status, "chiusa")) { Runtime.trap("Order is closed") };
        let existingItems = order.items.filter(func(i : OrderItem) : Bool { i.menuItemId != menuItemId });
        let newItems : [OrderItem] = if (quantity == 0) {
          existingItems
        } else {
          let n = existingItems.size();
          Array.tabulate(n + 1, func(i : Nat) : OrderItem {
            if (i < n) { existingItems[i] }
            else { { menuItemId; quantity; notes } }
          })
        };
        orders.add(orderId, { id = order.id; tableId = order.tableId; items = newItems; status = order.status; createdAt = order.createdAt });
      };
    };
  };

  public shared ({ caller }) func removeItemFromOrder(orderId : OrderId, menuItemId : MenuItemId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (orders.get(orderId)) {
      case null { Runtime.trap("Order does not exist") };
      case (?order) {
        let newItems = order.items.filter(func(i : OrderItem) : Bool { i.menuItemId != menuItemId });
        orders.add(orderId, { id = order.id; tableId = order.tableId; items = newItems; status = order.status; createdAt = order.createdAt });
      };
    };
  };

  public shared ({ caller }) func closeOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (orders.get(orderId)) {
      case null { Runtime.trap("Order does not exist") };
      case (?order) {
        orders.add(orderId, { id = order.id; tableId = order.tableId; items = order.items; status = "chiusa"; createdAt = order.createdAt });
      };
    };
  };

  public shared ({ caller }) func reopenOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (orders.get(orderId)) {
      case null { Runtime.trap("Order does not exist") };
      case (?order) {
        orders.add(orderId, { id = order.id; tableId = order.tableId; items = order.items; status = "aperta"; createdAt = order.createdAt });
      };
    };
  };

  public shared ({ caller }) func deleteOrder(orderId : OrderId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (not orders.containsKey(orderId)) { Runtime.trap("Order does not exist") };
    orders.remove(orderId);
  };

  public query func getOrder(orderId : OrderId) : async ?Order {
    orders.get(orderId);
  };

  public query func getAllOrders() : async [Order] {
    orders.values().toArray();
  };

  public query func getOpenOrders() : async [Order] {
    orders.values().toArray().filter(func(o : Order) : Bool { Text.equal(o.status, "aperta") });
  };

  public query func getOrdersByTable(tableId : TableId) : async [Order] {
    orders.values().toArray().filter(func(o : Order) : Bool { o.tableId == tableId });
  };

  public query func getOpenOrderByTable(tableId : TableId) : async ?Order {
    let openOrders = orders.values().toArray().filter(func(o : Order) : Bool {
      o.tableId == tableId and Text.equal(o.status, "aperta")
    });
    if (openOrders.size() > 0) { ?openOrders[0] } else { null };
  };
};
