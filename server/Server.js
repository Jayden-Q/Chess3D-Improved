const express = require('express');
const http = require('http');
const socketio = require('socket.io');

class Server {
    static instance;

    constructor() {
        if (Server.instance) return Server.instance;
        Server.instance = this;

        this.port = process.env.port || 3000;

        this._express_app = express();
        this._http_server = http.createServer(this._express_app);
        this._io = new socketio.Server(this._http_server);
    
        this._express_app.use(express.static(`public`));
    }

    Core(callback) {
        this._http_server.listen(this.port, callback);
    }
}
  
module.exports = Server;