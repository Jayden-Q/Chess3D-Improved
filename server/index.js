const Server = require('./Server.js');
const { PlayerList } = require('./Player.js');
const { RoomList } = require('./Room.js');

const player_list = new PlayerList();
const public_rooms = new RoomList('public');
const custom_rooms = new RoomList('custom');

/* Displays information about players and rooms online */
const DisplayInfo = () => {
  console.log('\n___________________________________________________________\n');
  console.log('\x1b[33m%s\x1b[0m', 'Player List:');
  console.log(player_list);
  console.log('\x1b[33m%s\x1b[0m', '\nPublic Rooms List:');
  console.log(public_rooms);
  console.log('\x1b[33m%s\x1b[0m', '\nCustom Rooms List:');
  console.log(custom_rooms);
}

const FilterClientInput = (string) => {
  return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

/* Get player's room type array */
const GetPlayerRoomType = (ID) => {
  return public_rooms.GetPlayerRoom(ID) ? public_rooms : custom_rooms.GetPlayerRoom(ID) ? custom_rooms : null;
}

/* Receive username from client */
const OnGetUsername = (socket, username) => {
  const player = player_list.GetPlayerByID(socket.id); // Get the player from the list
  if (!player) return; // Exit if player doesn't exist
  player.SetUsername(FilterClientInput(username)); // Set the player's username
}

/* Client requests for available public games */
const OnSearchForGames = (socket) => {
  const available_rooms = public_rooms.FindAvailableRooms(); // Find all available rooms

  const player = player_list.GetPlayerByID(socket.id); // Get the current player
  if (!player) return; // Exit if the player doesn't exist

  if (available_rooms.length == 0) { // If there are no rooms available
    public_rooms.AddRoom(player); // Create a new room with the current player
    return;
  }

  const room = available_rooms[0]; // Get the first room from the list

  const other_player = room.GetOtherPlayer(player.ID); // Get the other player
  if (!other_player) return; // Exit if the other player doesn't exist

  room.AddPlayer(player); // Add the player to the room
  room.SetRandomSides(); // Set random sides
  room.has_started = true;

  // Tell both players to start the game
  socket.emit('game:start', room.GetPlayerSide(player.ID));
  socket.to(other_player.ID).emit('game:start', room.GetPlayerSide(other_player.ID));

  // DEBUGGING
  DisplayInfo();
}

/* Client requests to make a move in game */
const OnGameMove = (socket, coords) => {
  const player_room_type = GetPlayerRoomType(socket.id); // Get the room type (public/custom) the current player is in
  if (!player_room_type) return; // Exit if the current player isn't in any room

  const room = player_room_type.GetPlayerRoom(socket.id); // Get the room the current player is in
  if (!room) return; // Exit if there is no room
  if (room.current_player_turn.ID != socket.id) return; // Exit if it isn't the current player's turn

  const player = room.GetPlayerByID(socket.id); // Get the player data

  const otherPlayer = room.GetOtherPlayer(player.ID); // Get the other player data
  if (!otherPlayer) return; // Exit if there is no other player

  if (Array.isArray(coords)) for (const coord of coords) socket.to(otherPlayer.ID).emit('game:move', coord); // Tell the other player where the current player moved
  else socket.to(otherPlayer.ID).emit('game:move', coords);

  room.SwitchTurn(); // Switch turns
}

/* Client requests to promote a piece */
const OnGamePromotePiece = (socket, data) => {
  const player = player_list.GetPlayerByID(socket.id);
  if (!player) return;

  const player_room_type = GetPlayerRoomType(player.ID);
  if (!player_room_type) return;

  const room = player_room_type.GetPlayerRoom(player.ID);
  
  const other_player = room.GetOtherPlayer(player.ID);
  if (!other_player) return;

  socket.to(other_player.ID).emit('game:promote_piece', data);
}

/* Client says they won */
const OnWinGame = (socket) => {
  const player = player_list.GetPlayerByID(socket.id); // Get the current player
  if (!player) return; // Exit if the current player doesn't exist

  const player_room_type = GetPlayerRoomType(player.ID); // Get the room type the player is in
  if (!player_room_type) return;

  const room = player_room_type.GetPlayerRoom(player.ID); // Get the room the player is in

  const other_player = room.GetOtherPlayer(player.ID); // Get the other player
  if (!other_player) return;

  socket.emit('game:win'); // Tell the client that they won
  socket.to(other_player.ID).emit('game:lose'); // Tell the other player that they lost

  player_room_type.RemoveRoom(room.ID);
}

/* Client requests to create a custom room */
const OnCreateCustomRoom = (socket) => {
  const player = player_list.GetPlayerByID(socket.id); // Get the current player
  if (!player) return; // Exit if the current player doesn't exist

  const room = custom_rooms.AddRoom(player); // Create a new custom room with the current player
  room.SetHost(player); // Set the current player as host

  socket.emit('room:player_join', player); // Send the player data to the client
  socket.emit('room:id', room.ID);

  // DEBUGGING
  DisplayInfo();
}

/* Client requests to join a custom room */
const OnJoinCustomRoom = (socket, roomID) => {
  const filtered_room_ID = FilterClientInput(roomID); // Filter the room ID

  const player = player_list.GetPlayerByID(socket.id); // Get the current player
  if (!player) return; // Exit if the current player doesn't exist

  const room = custom_rooms.GetRoomByID(filtered_room_ID); // Find rooms with the same ID
  if (!room) return; // Exit if there is no room
  if (room.count >= 2) return;

  room.AddPlayer(player); // Add the player to the room

  socket.to(room.host.ID).emit('room:player_join', player); // Tell the host that a player joined
  socket.emit('room:player_join', room.host); // Tell the current player to add the host to the player list
  socket.emit('room:player_join', player); // Tell the current player to add themselved to the player list
  socket.emit('room:id', room.ID); // Tell the current player the room's ID
  socket.emit('room:join'); // Tell the current player that they successfully joined the room

  // DEBUGGING
  DisplayInfo();
}

/* Client requests to leave a custom room */
const OnLeaveCustomRoom = (socket) => {
  const player = player_list.GetPlayerByID(socket.id); // Get the current player
  if (!player) return; // Exit if the current player doesn't exist

  const room = custom_rooms.GetPlayerRoom(player.ID); // Get the room the current player is in
  if (!room) return; // Exit if the room doesn't exist

  socket.emit('room:remove'); // Tell the current player that the room is removed

  if (room.host.ID == player.ID) { // If the current player is the host
    const other_player = room.GetOtherPlayer(player.ID); // Get the other player
    if (other_player) socket.to(other_player.ID).emit('room:remove'); // If there is another player, tell them that the room is removed
    custom_rooms.RemoveRoom(room.ID); // Remove the room from the list
    return;
  }

  room.RemovePlayer(player.ID); // Remove the current player from the room
  socket.to(room.host.ID).emit('room:player_leave', { ID: player.ID }); // Tell the host that the current player left


  // DEBUGGING
  DisplayInfo();
}

/* Client requests to start a custom game */
const OnStartCustomGame = (socket) => {
  const player = player_list.GetPlayerByID(socket.id); // Get the current player
  if (!player) return; // Exit if the current player doesn't exist
  
  const room = custom_rooms.GetPlayerRoom(player.ID); // Get the room the current player is in
  if (!room) return; // Exit if the player isn't in a room

  if (room.count < 2) return; // Exit if there's less than 2 players in the room

  const other_player = room.GetOtherPlayer(player.ID); // Get the other player in the room

  room.SetRandomSides(); // Set random sides
  room.has_started = true;

  socket.emit('game:start', room.GetPlayerSide(player.ID)); // Tell the current player to start the game
  socket.to(other_player.ID).emit('game:start', room.GetPlayerSide(other_player.ID)); // Tell the other player to start the game
}

/* Client closes tab */
const OnClientDisconnect = (socket) => {
  const player = player_list.GetPlayerByID(socket.id); // Get the current player
  const player_room_type = GetPlayerRoomType(player.ID); // Get the room type the current player is in

  if (player_room_type) { // If the current player is in a room
    const room = player_room_type.GetPlayerRoom(player.ID); // Get the room the current player is in
    const other_player = room.GetOtherPlayer(player.ID); // Get the other player in the room
    
    if (other_player) { // If there is another player
      if (room.has_started) {
        socket.to(other_player.ID).emit('game:win'); // If they are ingame, tell them they won
        player_room_type.RemoveRoom(room.ID); // Remove the room
      }
      if (room.type == 'custom') OnLeaveCustomRoom(socket); // If they are in a custom room, exit the custom room
    }

    if (room.type == 'public') player_room_type.RemoveRoom(room.ID); // Remove the room from the list
  }

  player_list.RemovePlayer(player.ID); // Remove the player from the list

  // DEBUGGING
  DisplayInfo();
}

const server = new Server();
server.Core(() => console.log(`Server running on http://localhost:${server.port}`));
server._io.on('connection', OnNewConnection);

function OnNewConnection(socket) {
  player_list.AddPlayer(socket.id);

  socket.on('username', username => OnGetUsername(socket, username));
  socket.on('game:search', () => OnSearchForGames(socket));
  socket.on('game:move', (coords) => OnGameMove(socket, coords));
  socket.on('game:promote_piece', data => OnGamePromotePiece(socket, data));
  socket.on('game:win', () => OnWinGame(socket));
  socket.on('room:create', () => OnCreateCustomRoom(socket));
  socket.on('room:join', (roomID) => OnJoinCustomRoom(socket, roomID));
  socket.on('room:leave', () => OnLeaveCustomRoom(socket));
  socket.on('game:start', () => OnStartCustomGame(socket));

  socket.on('disconnect', () => OnClientDisconnect(socket));

  // DEBUGGING
  DisplayInfo();
}