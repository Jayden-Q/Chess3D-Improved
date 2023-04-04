const generateID = length => {
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1).toUpperCase();
}
  
class Room {
    constructor(type) {
        this.players = [];
        this.count = 0;

        this.ID = generateID(6);
        this.host = null;
        
        this.white_side_player = null;
        this.black_side_player = null;
        this.current_player_turn = null;

        this.type = type;
        this.has_started = false;
    }

    SetHost(player) {
        this.host = player; 
    }

    AddPlayer(player) {
        this.players.push(player);
        this.count++;
    }

    RemovePlayer(ID) {
        const player_index = this.GetPlayerIndex(ID);
        if (player_index < 0) return;
        this.players.splice(player_index, 1);
        this.count--;
    }

    GetPlayerByID(ID) {
        return this.players.find(player => player.ID == ID);
    }

    GetOtherPlayer(ID) {
        return this.players.find(player => player.ID != ID);
    }

    GetPlayerIndex(ID) {
        return this.players.findIndex(player => player.ID == ID);
    }

    GetPlayerSide(ID) {
        return this.white_side_player.ID == ID ? 'white': this.black_side_player.ID == ID ? 'black' : null;
    }

    SetRandomSides() {
        const r = Math.floor(Math.random() * 2);

        this.white_side_player = r == 0 ? this.players[0] : this.players[1];
        this.black_side_player = r == 0 ? this.players[1] : this.players[0];

        this.current_player_turn = this.white_side_player;
    }

    SwitchTurn() {
        if (this.current_player_turn == this.white_side_player) this.current_player_turn = this.black_side_player;
        else if (this.current_player_turn == this.black_side_player) this.current_player_turn = this.white_side_player;
    }
}

class RoomList {
    constructor(type) {
        this.rooms = [];
        this.type = type;
    }

    AddRoom(...players) {
        const room = new Room(this.type);
        for (const player of players) room.AddPlayer(player);
        this.rooms.push(room);
        return room;
    }

    RemoveRoom(ID) {
        const room_index = this.GetRoomIndex(ID);
        if (room_index < 0) return;
        this.rooms.splice(room_index, 1);
    }

    GetRoomByID(ID) {
        return this.rooms.find(room => room.ID == ID);
    }

    GetRoomIndex(ID) {
        return this.rooms.findIndex(room => room.ID == ID);
    }

    GetPlayerRoom(ID) {
        return this.rooms.find(room => room.GetPlayerByID(ID) != null);
    }

    FindAvailableRooms() {
        return this.rooms.filter(room => room.count < 2);
    }
}

module.exports = { RoomList, Room };