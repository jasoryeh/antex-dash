const AX_DASH_SESSION_LSKEY = 'ax-dash-session';

class DashUtils {
    static timeOpts = { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };

    static isToday(time) {
        let parsed = new Date(time);
        let today = new Date(Date.now());
        return (today.getMonth() == parsed.getMonth()) 
                    && (today.getDate() == parsed.getDate())
                    && (today.getFullYear() == parsed.getFullYear());
    }

    static isPast(time) {
        let parsed = new Date(time);
        let today = new Date(Date.now());
        return parsed < today;
    }

    static calculateRounds(routePresetObj, start, end) {
      var begin = new Date(start);
      var end = new Date(end);
      var timing = routePresetObj.timing;
      return (end - begin) / (1000 * 60 * timing);
    }

    static displayDateTime(date) {
      var parsed = (new Date(date.replace('Z', '')));
      return parsed.toLocaleDateString('en-US', DashUtils.timeOpts)
                    .replace(' at ', '<br/>')
    }

    static dateToFormFormat(dateObj) {
        return dateObj.toISOString().split('T')[0];
        //return `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
    }

    static padNumber(number, padTo = 2) {
        return String(number).padStart(padTo, '0');
    }

    static getAPIEndpoint() {
        var here = new URL(location.href);
        if (here.searchParams.has('endpoint')) {
            return here.searchParams.get('endpoint');
        }
        return "https://antex-dash-api.jasonho.workers.dev";
    }
}

class AntexDash {
    constructor(endp) {
        this.username = null;
        this.password = null;
        this.endpoint = endp ?? DashUtils.getAPIEndpoint();
        this.authenticated = false;

        this.credentials = null;
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

    logout() {
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

    async shifts(start = null, end = null) {
        var copy = JSON.parse(JSON.stringify(this.credentials));
        copy.start = start;
        copy.end = end;
        var req = (await axios.post(this.endpoint + '/shifts', copy));
        return req.data;
    }

    async trades() {
        var req = (await axios.post(this.endpoint + '/trades', this.credentials));
        return req.data;
    }

    async me() {
        var req = (await axios.post(this.endpoint + '/me', this.credentials));
        return req.data;
    }

    async news() {
        var req = (await axios.post(this.endpoint + '/news', this.credentials));
        return req.data;
    }

    async masterschedule(date) {
        var clone = JSON.parse(JSON.stringify(this.credentials));
        clone.date = date; // embed credentials with request
        var req = (await axios.post(this.endpoint + '/masterschedule', clone));
        return req.data;
    }

    async presets() {
        return this.routes = (await axios.get(this.endpoint + '/configurations/routes')).data;
    }

    async trade_get(shift_id) {
        // fields returned: can_trade(boolean), other tradeboard data
        return (await axios.post(this.endpoint + '/trade/get', {
            shift: shift_id,
            ...this.credentials
        })).data;
    }

    async trade_post(shift_id, note) {
        // fields returned: trade_id
        return (await axios.post(this.endpoint + '/trade/post', {
            shift: shift_id,
            note: note,
            ...this.credentials
        })).data;
    }

    async trade_cancel_blind(shift_id) {
        let info = await this.trade_get(shift_id);
        if (!info.trade) {
            return null;
        }
        var trade_id = info.trade.tradeboard.id;
        console.log(`Resolved trade id #${trade_id} for shift id ${shift_id}`);
        return await this.trade_cancel(shift_id, trade_id);
    }

    async trade_cancel(shift_id, trade_id) {
        // fields returned: trade_id
        return (await axios.post(this.endpoint + '/trade/cancel', {
            shift: shift_id,
            trade: trade_id,
            ...this.credentials
        })).data;
    }
}

class DashPresets {
    constructor(parent) {
        this.parent = parent;
        this.routes = null;
    }

    static async get(axdash_instance) {
        if (!DashPresets.instance) {
            DashPresets.instance = new DashPresets(axdash_instance);
            await DashPresets.instance.load();
        }
        return DashPresets.instance;
    }

    async load() {
        await this.loadRoutes();
    }

    async loadRoutes(reload = false) {
        if (this.routes && !reload) {
            return;
        }
        this.routes = await this.parent.presets();
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

window.axdash = AntexDash;
window.axdash_presets = DashPresets;
window.axdash_utils = DashUtils;