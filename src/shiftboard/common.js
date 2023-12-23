const {
    shiftboardSessionToCookies
} = require('./session');

function getShiftboardHeaders(session, key) {
    return {
        'Cookie': shiftboardSessionToCookies(session),
        'Authorization': `Bearer ${key}`
    };
}

/**
 * Proxies, and authorizes a request to shiftboard
 * @param {*} session A session object from src/shiftboard/login
 * @param {*} key A access token also accessed via logging in
 * @param {*} url The url to perform the authorized get request to
 * @returns An axios request result
 */
async function shiftboard_proxy_get_request(session, key, url) {
    return await fetch(url, {
        headers: getShiftboardHeaders(session, key)
    });
}

async function shiftboard_proxy_varying_request(session, key, url, method, body) {
    return await fetch(url, {
        headers: getShiftboardHeaders(session, key),
        method: method,
        body: body
    })
}

async function shiftboard_proxy_post_request(session, key, url, body) {
    return await shiftboard_proxy_varying_request(session, key, url, "POST", body);
}

module.exports = {
    shiftboard_proxy_get_request,
    shiftboard_proxy_varying_request,
    shiftboard_proxy_post_request,
}