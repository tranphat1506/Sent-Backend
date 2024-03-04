class OnlineState {
    version = '0.0.1';
    maxDevice = 4;
    constructor({ parseHistory }) {
        if (parseHistory) this.replace(parseHistory);
    }

    // Create a new connect state
    create({ IPAddress, latitude, longitude, userAgent, language, userId, socketId }) {
        return {
            userId,
            socketId,
            IPAddress,
            Geolocation: {
                latitude,
                longitude,
            },
            userAgent,
            language,
            timeConnected: Date.now(),
        };
    }

    // Create and push connect state to history
    push({
        connectState = null,
        autoCreate = false,
        required = {
            IPAddress: '',
            latitude: '',
            longitude: '',
            userAgent: '',
            language: '',
            userId: '',
            socketId: '',
        },
    }) {
        if (autoCreate) {
            const state = this.create({ IPAddress, latitude, longitude, userAgent, language, userId, socketId });
            // Push state
            this.history.push(state);
            // replace last connect
            this.lastConnectState = state;
            return this;
        }
        // If connect state is invalid.
        if (connectState === null) return false;
        // Push state
        this.history.push(connectState);
        // replace last connect
        this.lastConnectState = connectState;
        return this;
    }

    // Replace all with exist online state
    replace(history) {
        this.history = Array.isArray(history) ? history : [];
        this.totalDevice = this.history.length;
        this.lastConnectState = !this.totalDevice ? this.history[-1] : null;
    }

    // Get last connect
    get getLastConnectState() {
        return this.lastConnectState;
    }

    // OnlineState to object
    toObject() {
        return {
            ver: this.version,
            history: this.history,
            totalDevice: this.totalDevice,
            lastConnectState: this.lastConnectState,
        };
    }
}

module.exports = OnlineState;
