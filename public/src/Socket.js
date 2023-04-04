class Socket {
    static instance;

    constructor() {
        if (Socket.instance) return Socket.instance;

        Socket.instance = this;

        this.instance = io();

        if (!this.instance) {
            console.warn('Failed to initialize socket!');
            return;
        }
    }

    EmitEvent(event, data = undefined) {
        this.instance.emit(event, data);
    }

    AddListener(event, callback) {
        this.instance.on(event, callback);
    }
}

export default Socket;