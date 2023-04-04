class Player {
  constructor(ID) {
    this.ID = ID;
    this.username = null;
  }

  SetUsername(username) { this.username = username; }
}

class PlayerList {
  constructor() {
    this.players = [];
  }

  AddPlayer(ID) {
    this.players.push(new Player(ID));
  }

  RemovePlayer(ID) {
    const player_index = this.GetPlayerIndex(ID);
    if (player_index < 0) return;
    this.players.splice(player_index, 1);
  }

  GetPlayerByID(ID) {
    return this.players.find(player => player.ID == ID);
  }

  GetPlayerIndex(ID) {
    return this.players.findIndex(player => player.ID == ID);
  }
}

module.exports = { PlayerList, Player };