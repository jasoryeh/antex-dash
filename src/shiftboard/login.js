const {
    getCookies
} = require('./util');
const {
    shiftboard_proxy_get_request
} = require('./common');
const {
    shiftboardSessionToCookies,
    getShiftboardSession
} = require('./session');

// login apis

/**
 * Sends a request to get all "sites" the user is a part of on Shiftboard.
 * (sites = organizations)
 * 
 * @returns The request will contain 'set-cookie' headers that is used in logging in to the organization's "site"
 */
async function login_getSites_request(usn, pwd) {
    let url = 'https://m.shiftboard.com/api/v1/sites';
    return await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: usn,
            password: pwd,
            useUuid: true
        }),
    });
}
async function login_getSites(usn, pwd) {
    var req = await login_getSites_request(usn, pwd);
    if (!req.ok) {
        return null;
    }
    var cookies = getCookies(req);
    var session = getShiftboardSession(cookies);
    var json = await req.json();
    return {
        req,
        sites: json.data.sites,
        session: session
    };
}

/**
 * Uses the session in login_getSites (processed by getShiftboardSession(getCookies(request object)))
 * @returns The request will contain more 'set-cookie' headers, and a 'access-token' in it's response body necessary for further API requests.
 */
async function login_toOrg_request(shiftboardSession, organization = null) {
    let userPrivacy = true;
    let orgID = organization ?? 5210290; // antex site
    let url = `https://m.shiftboard.com/api/v1/login?orgID=${orgID}&user_privacy=${userPrivacy}`;
    return await fetch(url, {
        method: "GET",
        headers: {
            'Cookie': shiftboardSessionToCookies(shiftboardSession)
        }
    });
}
async function login_toOrg(session, orgID = null) {
    let req = await login_toOrg_request(session, orgID);
    if (!req.ok) {
        return null;
    }
    var cookies = getCookies(req);
    var session = getShiftboardSession(cookies);
    var data = await req.json();
    if (!data.success || !data.data || !data.data.access_token) {
        throw new Error("Unable to acquire login bearer token!");
    }
    return {
        req,
        session: session,
        access_token: data.data.access_token,
        id: data.data.id
    }
}

/**
 * After logging in with the two steps above, this check endpoint validates the validity of the credentials (cookie, bearer token)
 * @returns The response's data contains a field (data.currentUser) that indicates 'true' if the credentials are still valid and the user is still part of the org in question
 */
async function login_check(session, key) {
    let req = await shiftboard_proxy_get_request(session, key, `https://m.shiftboard.com/api/v1/check`);
    if (!req.ok) {
        return null;
    }
    // indicates whether the key we were supplied with from the
    //  login to the site is valid
    var json = await req.json();
    var keyIsUserOfOrg = json.data.currentUser;
    return {
        req,
        success: keyIsUserOfOrg
    };
}

/**
 * Performs the full login flow, and returns the final shiftboard session cookies, and the bearer tokens
 *   necessary for future requests
 * @returns An session object in 'session', a bearer token in 'access_token', login statuses in 'logged_in' and results from each step of the login flow in 'steps'
 */
async function login(usn, pwd) {
    var initialLogin = await login_getSites(usn, pwd);
    if (!initialLogin) return null;
    var specificLogin = await login_toOrg(initialLogin.session, null);
    if (!specificLogin) return null;
    var check = await login_check(specificLogin.session, specificLogin.access_token);
    if (!check) return null;
    return {
        steps: [initialLogin, specificLogin, check],
        session: specificLogin.session,
        access_token: specificLogin.access_token,
        logged_in: check.success
    };
}

module.exports = {
    login,
    login_check,
    login_toOrg, login_toOrg_request,
    login_getSites, login_getSites_request
};