const AX_DASH_SESSION_LSKEY = 'ax-dash-session';
class DashPresets {
    constructor(parent) {
        this.parent = parent;
        this.routes = null;
    }

    async load() {
        await this.loadRoutes();
    }

    async loadRoutes(reload = false) {
        if (this.routes && !reload) {
            return;
        }
        this.routes = (await axios.get(this.parent.endpoint + '/configurations/routes')).data;
    }

    route(route) {
        if (!this.routes) {
            throw new Error('Route configuration presets are not loaded!');
        }
        if (!this.routes['_default']) {
            console.error('Bad route configuration preset! No "_default" configuration set!');
            this.routes['_default'] = {
                "color": "#000",
                "text": "#fff",
                "timing": 1,
            };    
        }
        return this.routes[route] || this.routes['_default'];
    }
}

class AntexDash {
    constructor(endp) {
        this.username = null;
        this.password = null;
        this.endpoint = endp || "http://127.0.0.1:8787";
        this.authenticated = false;

        this.credentials = null;

        this._presets = null;
    }

    save() {
        if (!window.localStorage) {
            console.warn("Local storage is not supported on this browser, sessions will not persist between page loads!");
            return false;
        }
        if (!this.isLoggedIn()) {
            console.log("No current shiftboard session to save!");
            return false;
        }
        window.localStorage.setItem(AX_DASH_SESSION_LSKEY, JSON.stringify(this.credentials));
        return true;
    }

    static load() {
        if (!window.localStorage) {
            console.warn("Local storage is not supported on this browser, loading sessions is not supported!");
            return false;
        }
        var lsdata = window.localStorage.getItem(AX_DASH_SESSION_LSKEY);
        if (!lsdata) {
            console.log("No session found in local storage!");
            return false;
        }
        var instance = new AntexDash();
        instance.credentials = JSON.parse(lsdata);
        return instance;
    }

    static logout() {
        this.authenticated = false;
        this.credentials = null;
        window.localStorage.removeItem(AX_DASH_SESSION_LSKEY);
        console.log("AXDash LS Cleared.");
    }

    isLoggedIn() {
        return this.credentials !== null && this.credentials.session !== null && this.credentials.access_token !== null;
    }

    async logIn() {
        var req = await axios.post(this.endpoint + '/login', {
            username: this.username, 
            password: this.password,
        });
        this.credentials = req.data;
        return req;
    }

    async check_internal() {
        try {
            var req = (await axios.post(this.endpoint + '/check', this.credentials));
            return req.data.success;
        } catch(ex) {
            console.log("Failed a credential check.");
            console.log(ex);
            return false;
        }
    }

    async check() {
        this.authenticated = await this.check_internal();
        return this.authenticated;
    }

    async shifts() {
        var req = (await axios.post(this.endpoint + '/shifts', this.credentials));
        return req.data;
    }

    async trades() {
        var req = (await axios.post(this.endpoint + '/trades', this.credentials));
        return req.data;
    }

    async news() {
        var req = (await axios.post(this.endpoint + '/news', this.credentials));
        return req.data;
    }

    async presets() {
        if (!this._presets) {
            this._presets = new DashPresets(this);
            await this._presets.load();
        }
        return this._presets;
    }
}
window.axdash = AntexDash;